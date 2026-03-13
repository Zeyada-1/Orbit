import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({ where: { userId: req.userId } });
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byPriority = {
      LOW: tasks.filter((t) => t.priority === 'LOW' && t.completed).length,
      MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM' && t.completed).length,
      HIGH: tasks.filter((t) => t.priority === 'HIGH' && t.completed).length,
    };

    const categoryMap = {};
    tasks.filter((t) => t.completed).forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + 1;
    });
    const byCategory = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ total, completed, pending, completionRate, byPriority, byCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/xp-history — XP earned per day for the last 30 days
router.get('/xp-history', async (req, res) => {
  try {
    const daysBack = 30;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const logs = await prisma.activityLog.findMany({
      where: { userId: req.userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const map = {};
    logs.forEach((log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      map[date] = (map[date] || 0) + log.xpGained;
    });

    // Fill in all days
    const result = [];
    for (let i = daysBack; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, xp: map[key] || 0 });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/tasks-history — tasks completed per day for the last 30 days
router.get('/tasks-history', async (req, res) => {
  try {
    const daysBack = 30;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const tasks = await prisma.task.findMany({
      where: { userId: req.userId, completed: true, completedAt: { gte: since } },
    });

    const map = {};
    tasks.forEach((t) => {
      const date = t.completedAt.toISOString().split('T')[0];
      map[date] = (map[date] || 0) + 1;
    });

    const result = [];
    for (let i = daysBack; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, count: map[key] || 0 });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
