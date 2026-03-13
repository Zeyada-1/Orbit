import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Trash2, Calendar, Tag, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import XPToast from './XPToast';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLORS = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444' };
const PRIORITY_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };

export default function TaskCard({ task, onComplete, onDelete }) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { refreshUser } = useAuth();

  const handleComplete = async () => {
    if (task.completed || loading) return;
    setLoading(true);
    try {
      const res = await api.patch(`/tasks/${task.id}/complete`);
      const { xpGained, newAchievements, user } = res.data;
      const prevLevel = user.level - (xpGained >= user.xpForNext ? 1 : 0);
      const levelUp = user.level > prevLevel ? user.level : null;

      toast.custom(() => (
        <div className="glass p-4 glow min-w-64">
          <XPToast xpGained={xpGained} achievements={newAchievements} levelUp={levelUp} />
        </div>
      ), { duration: 4000 });

      await refreshUser();
      onComplete(task.id, res.data);
    } catch (err) {
      toast.error('Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success('Quest removed');
      onDelete(task.id);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
  const prioColor = PRIORITY_COLORS[task.priority];

  const formatDue = (dateStr) => {
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${datePart} · ${timePart}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: task.completed ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="glass p-4 transition-all hover:border-violet-500/40"
      style={{ borderLeft: `3px solid ${prioColor}` }}
    >
      <div className="flex items-start gap-3">
        {/* Complete Button */}
        <button onClick={handleComplete} disabled={task.completed || loading} className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110">
          {task.completed
            ? <CheckCircle2 size={22} className="text-emerald-400" />
            : <Circle size={22} className="text-slate-500 hover:text-violet-400" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold text-white ${task.completed ? 'line-through opacity-50' : ''}`}>
              {task.title}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* XP Badge */}
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                <Zap size={10} />
                {task.completed ? `+${task.xpReward}` : '25+ XP'}
              </span>
              {task.description && (
                <button onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-white">
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
              <button onClick={handleDelete} className="text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {expanded && task.description && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-slate-400 text-sm mt-1"
            >
              {task.description}
            </motion.p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Tag size={10} />
              {task.category}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${prioColor}18`, color: prioColor }}>
              {PRIORITY_LABELS[task.priority]}
            </span>
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                <Calendar size={10} />
                {formatDue(task.dueDate)}
                {isOverdue && ' (Overdue)'}
              </span>
            )}
            {task.completed && task.completedAt && (
              <span className="text-xs text-emerald-500">
                ✓ Completed {new Date(task.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
