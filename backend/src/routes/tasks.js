import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { BASE_XP, calculateEarlyBonus, calculateLevel, checkAndGrantAchievements, updateStreak } from '../lib/gamification.js';

const router = Router();
router.use(authMiddleware);

// GET /api/tasks — list all tasks for current user
router.get('/', async (req, res) => {
  try {
    const { completed, priority, category, sort = 'createdAt', order = 'desc' } = req.query;
    const where = { userId: req.userId };
    if (completed !== undefined) where.completed = completed === 'true';
    if (priority) where.priority = priority.toUpperCase();
    if (category) where.category = category;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { [sort]: order },
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks — create a task
router.post(
  '/',
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('category').optional().trim().isLength({ max: 50 }),
    body('dueDate').optional().custom(v => !isNaN(Date.parse(v))).withMessage('Invalid date'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, priority = 'MEDIUM', category = 'General', dueDate } = req.body;
    const xpReward = BASE_XP; // actual XP is calculated at completion time

    try {
      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority,
          category,
          dueDate: dueDate ? new Date(dueDate) : null,
          xpReward,
          userId: req.userId,
        },
      });
      res.status(201).json(task);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PATCH /api/tasks/:id — update a task
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('category').optional().trim().isLength({ max: 50 }),
    body('dueDate').optional().custom(v => !isNaN(Date.parse(v))).withMessage('Invalid date'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const task = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const { title, description, priority, category, dueDate } = req.body;
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority; // XP no longer tied to priority
      if (category !== undefined) updateData.category = category;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

      const updated = await prisma.task.update({ where: { id: req.params.id }, data: updateData });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PATCH /api/tasks/:id/complete — mark task as complete and award XP
router.patch('/:id/complete', async (req, res) => {
  try {
    const task = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.completed) return res.status(400).json({ error: 'Task already completed' });

    const completedAt = new Date();
    const earlyBonus = calculateEarlyBonus(task.dueDate, completedAt);
    const xpGained = BASE_XP + earlyBonus;

    const completedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: { completed: true, completedAt, xpReward: xpGained },
    });

    // Award XP
    await prisma.user.update({ where: { id: req.userId }, data: { xp: { increment: xpGained } } });

    // Log activity
    await prisma.activityLog.create({
      data: { userId: req.userId, action: 'task_completed', xpGained, metadata: { taskId: task.id, taskTitle: task.title, baseXp: BASE_XP, earlyBonus } },
    });

    // Update streak
    const streak = await updateStreak(prisma, req.userId);

    // Check achievements
    const newAchievements = await checkAndGrantAchievements(prisma, req.userId);

    // Get updated user
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const levelInfo = calculateLevel(user.xp);

    // Sync level in DB
    if (levelInfo.level !== user.level) {
      await prisma.user.update({ where: { id: req.userId }, data: { level: levelInfo.level } });
    }

    res.json({
      task: completedTask,
      xpGained,
      earlyBonus,
      newAchievements,
      streak,
      user: { xp: user.xp, level: levelInfo.level, ...levelInfo },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/tasks/:id/uncomplete — undo completion
router.patch('/:id/uncomplete', async (req, res) => {
  try {
    const task = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!task.completed) return res.status(400).json({ error: 'Task is not completed' });

    await prisma.task.update({ where: { id: req.params.id }, data: { completed: false, completedAt: null } });
    await prisma.user.update({ where: { id: req.userId }, data: { xp: { decrement: task.xpReward } } });

    res.json({ message: 'Task uncompleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id — delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
