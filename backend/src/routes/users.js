import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { calculateLevel } from '../lib/gamification.js';

const router = Router();
router.use(authMiddleware);

// GET /api/users/search?q=text  — search users by username (must be logged in)
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        username: { contains: q, mode: 'insensitive' },
        NOT: { id: req.userId }, // exclude self
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        streak: true,
        isPublic: true,
      },
      take: 20,
      orderBy: { username: 'asc' },
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:username  — public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      include: {
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
        },
        _count: {
          select: { tasks: { where: { completed: true } } },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const isOwner = user.id === req.userId;
    const levelInfo = calculateLevel(user.xp);

    // Always return basic info; achievements only if public or own profile
    res.json({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      xp: user.xp,
      level: levelInfo.level,
      currentLevelXp: levelInfo.currentLevelXp,
      xpForNext: levelInfo.xpForNext,
      streak: user.streak,
      longestStreak: user.longestStreak,
      isPublic: user.isPublic,
      joinedAt: user.createdAt,
      completedCount: user._count.tasks,
      achievements: (user.isPublic || isOwner)
        ? user.achievements.map((ua) => ({ ...ua.achievement, unlockedAt: ua.unlockedAt }))
        : [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:username/schedule  — upcoming + recent tasks (public or own profile only)
router.get('/:username/schedule', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isOwner = user.id === req.userId;
    if (!user.isPublic && !isOwner) {
      return res.status(403).json({ error: 'This account is private' });
    }

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [upcoming, recent] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          completed: false,
          dueDate: { gte: now, lte: in30Days },
        },
        select: { id: true, title: true, category: true, dueDate: true, priority: true },
        orderBy: { dueDate: 'asc' },
        take: 30,
      }),
      prisma.task.findMany({
        where: { userId: user.id, completed: true },
        select: { id: true, title: true, category: true, completedAt: true, xpReward: true },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({ upcoming, recent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
