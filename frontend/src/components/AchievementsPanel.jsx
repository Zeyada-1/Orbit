import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export default function AchievementsPanel({ achievements, allAchievements }) {
  const unlockedKeys = new Set(achievements?.map((a) => a.key) || []);

  const ALL_DEFS = [
    { key: 'first_task', name: 'First Quest', description: 'Complete your first task', icon: '⚔️' },
    { key: 'tasks_5', name: 'Getting Started', description: 'Complete 5 tasks', icon: '🗡️' },
    { key: 'tasks_25', name: 'Adventurer', description: 'Complete 25 tasks', icon: '🏹' },
    { key: 'tasks_100', name: 'Quest Master', description: 'Complete 100 tasks', icon: '👑' },
    { key: 'streak_3', name: 'On a Roll', description: 'Maintain a 3-day streak', icon: '🔥' },
    { key: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚡' },
    { key: 'streak_30', name: 'Legendary Streak', description: '30-day streak', icon: '💎' },
    { key: 'level_5', name: 'Rising Hero', description: 'Reach level 5', icon: '🌟' },
    { key: 'level_10', name: 'Elite Fighter', description: 'Reach level 10', icon: '🏆' },
    { key: 'high_priority_5', name: 'Brave Soul', description: 'Complete 5 high-priority tasks', icon: '🛡️' },
    { key: 'speed_demon', name: 'Speed Demon', description: 'Complete 3 tasks in one day', icon: '💨' },
    { key: 'diversified', name: 'Jack of All Trades', description: 'Use 5 different categories', icon: '🎯' },
  ];

  return (
    <div className="glass p-5">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        🏆 Achievements
        <span className="text-xs text-slate-400 font-normal">
          {unlockedKeys.size}/{ALL_DEFS.length} unlocked
        </span>
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {ALL_DEFS.map((ach) => {
          const unlocked = unlockedKeys.has(ach.key);
          const userAch = achievements?.find((a) => a.key === ach.key);
          return (
            <motion.div
              key={ach.key}
              whileHover={{ scale: 1.05 }}
              className="relative flex flex-col items-center gap-1 p-3 rounded-xl text-center cursor-default"
              style={{
                background: unlocked ? 'rgba(124,58,237,0.15)' : 'rgba(15,15,26,0.5)',
                border: `1px solid ${unlocked ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.05)'}`,
              }}
              title={`${ach.name}: ${ach.description}`}
            >
              <span className={`text-2xl ${unlocked ? '' : 'grayscale opacity-30'}`}>{ach.icon}</span>
              <span className={`text-xs font-semibold leading-tight ${unlocked ? 'text-violet-300' : 'text-slate-600'}`}>
                {ach.name}
              </span>
              {!unlocked && (
                <Lock size={10} className="absolute top-2 right-2 text-slate-600" />
              )}
              {unlocked && userAch?.unlockedAt && (
                <span className="text-xs text-slate-500">
                  {new Date(userAch.unlockedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
