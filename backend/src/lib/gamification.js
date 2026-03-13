// Base XP awarded for completing any task
export const BASE_XP = 25;

/**
 * Early-completion bonus XP.
 *
 * Rule:
 *  ≤ 30 min early  → 0 bonus
 *  > 30 min early  → floor(21.5 × log₂(hoursEarly + 1)), capped at 200
 *
 * Calibration:
 *   1 h early  → ~21 XP bonus
 *  12 h early  → ~79 XP bonus
 *  24 h early  → ~100 XP bonus
 *   7 d early  → ~159 XP bonus
 *  Far future  → 200 XP bonus (hard cap — prevents date-padding exploit)
 *
 * No due date OR completed late → 0 bonus.
 */
export function calculateEarlyBonus(dueDate, completedAt) {
  if (!dueDate) return 0;
  const earlyMs = new Date(dueDate) - new Date(completedAt);
  if (earlyMs <= 30 * 60 * 1000) return 0;
  const earlyHours = earlyMs / (1000 * 60 * 60);
  return Math.min(Math.floor(21.5 * Math.log2(earlyHours + 1)), 200);
}

// XP required to reach each level (level n requires n * 100 XP from level n-1)
export function xpForNextLevel(level) {
  return level * 100;
}

export function calculateLevel(totalXp) {
  let level = 1;
  let xpRequired = 0;
  while (xpRequired + xpForNextLevel(level) <= totalXp) {
    xpRequired += xpForNextLevel(level);
    level++;
  }
  return { level, currentLevelXp: totalXp - xpRequired, xpForNext: xpForNextLevel(level) };
}

// All defined achievements
export const ACHIEVEMENTS = [
  { key: 'first_task',      name: 'First Quest',         description: 'Complete your first task',              icon: '⚔️',  xpReward: 20 },
  { key: 'tasks_5',         name: 'Getting Started',     description: 'Complete 5 tasks',                      icon: '🗡️',  xpReward: 30 },
  { key: 'tasks_25',        name: 'Adventurer',          description: 'Complete 25 tasks',                     icon: '🏹',  xpReward: 75 },
  { key: 'tasks_100',       name: 'Quest Master',        description: 'Complete 100 tasks',                    icon: '👑',  xpReward: 200 },
  { key: 'streak_3',        name: 'On a Roll',           description: 'Maintain a 3-day streak',               icon: '🔥',  xpReward: 50 },
  { key: 'streak_7',        name: 'Week Warrior',        description: 'Maintain a 7-day streak',               icon: '⚡',  xpReward: 100 },
  { key: 'streak_30',       name: 'Legendary Streak',    description: 'Maintain a 30-day streak',              icon: '💎',  xpReward: 500 },
  { key: 'level_5',         name: 'Rising Hero',         description: 'Reach level 5',                         icon: '🌟',  xpReward: 50 },
  { key: 'level_10',        name: 'Elite Fighter',       description: 'Reach level 10',                        icon: '🏆',  xpReward: 150 },
  { key: 'high_priority_5', name: 'Brave Soul',          description: 'Complete 5 high-priority tasks',        icon: '🛡️',  xpReward: 60 },
  { key: 'speed_demon',     name: 'Speed Demon',         description: 'Complete 3 tasks in a single day',      icon: '💨',  xpReward: 40 },
  { key: 'diversified',     name: 'Jack of All Trades',  description: 'Complete tasks in 5 different categories', icon: '🎯', xpReward: 80 },
];

export async function checkAndGrantAchievements(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { achievements: { include: { achievement: true } }, tasks: true },
  });

  const unlockedKeys = user.achievements.map((ua) => ua.achievement.key);
  const completedTasks = user.tasks.filter((t) => t.completed);
  const highPriorityCompleted = completedTasks.filter((t) => t.priority === 'HIGH');
  const newAchievements = [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tasksToday = completedTasks.filter((t) => t.completedAt && t.completedAt >= todayStart);

  const categoriesUsed = new Set(completedTasks.map((t) => t.category));

  const { level } = calculateLevel(user.xp);

  const checks = [
    { key: 'first_task',      met: completedTasks.length >= 1 },
    { key: 'tasks_5',         met: completedTasks.length >= 5 },
    { key: 'tasks_25',        met: completedTasks.length >= 25 },
    { key: 'tasks_100',       met: completedTasks.length >= 100 },
    { key: 'streak_3',        met: user.streak >= 3 },
    { key: 'streak_7',        met: user.streak >= 7 },
    { key: 'streak_30',       met: user.streak >= 30 },
    { key: 'level_5',         met: level >= 5 },
    { key: 'level_10',        met: level >= 10 },
    { key: 'high_priority_5', met: highPriorityCompleted.length >= 5 },
    { key: 'speed_demon',     met: tasksToday.length >= 3 },
    { key: 'diversified',     met: categoriesUsed.size >= 5 },
  ];

  for (const check of checks) {
    if (check.met && !unlockedKeys.includes(check.key)) {
      const achievement = await prisma.achievement.findUnique({ where: { key: check.key } });
      if (achievement) {
        await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });
        await prisma.user.update({ where: { id: userId }, data: { xp: { increment: achievement.xpReward } } });
        await prisma.activityLog.create({
          data: { userId, action: `achievement_unlocked`, xpGained: achievement.xpReward, metadata: { achievementKey: achievement.key, achievementName: achievement.name } },
        });
        newAchievements.push(achievement);
      }
    }
  }

  return newAchievements;
}

export async function updateStreak(prisma, userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!user.lastActiveDate) {
    await prisma.user.update({ where: { id: userId }, data: { streak: 1, longestStreak: 1, lastActiveDate: today } });
    return 1;
  }

  const last = new Date(user.lastActiveDate);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));

  let newStreak = user.streak;
  if (diffDays === 0) return newStreak;           // same day, no change
  if (diffDays === 1) newStreak = user.streak + 1; // consecutive day
  if (diffDays > 1)  newStreak = 1;               // streak broken

  const longestStreak = Math.max(user.longestStreak, newStreak);
  await prisma.user.update({ where: { id: userId }, data: { streak: newStreak, longestStreak, lastActiveDate: today } });
  return newStreak;
}
