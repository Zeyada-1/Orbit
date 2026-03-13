import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Zap } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import DateTimePicker from './DateTimePicker';

const CATEGORIES = ['General', 'Work', 'Study', 'Health', 'Personal', 'Finance', 'Creative'];
const PRIORITIES = [
  { value: 'LOW',    label: 'Low',    color: '#10b981' },
  { value: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
  { value: 'HIGH',   label: 'High',   color: '#ef4444' },
];

export default function AddTaskModal({ onClose, onTaskAdded }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', category: 'General', dueDate: '' });
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.dueDate) delete payload.dueDate;
      if (!payload.description) delete payload.description;
      const res = await api.post('/tasks', payload);
      toast.success('Quest added! ⚔️');
      onTaskAdded(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass w-full max-w-md glow flex flex-col"
          style={{ maxHeight: '92vh' }}
        >
          <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-white">New Quest</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Quest title..."
              value={form.title}
              onChange={update('title')}
              required
              maxLength={200}
              className="input-field"
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={update('description')}
              rows={2}
              className="input-field resize-none"
            />

            {/* Priority */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.value })}
                    className="py-2 px-3 rounded-xl text-sm font-semibold border transition-all"
                    style={{
                      borderColor: form.priority === p.value ? p.color : 'rgba(124,58,237,0.25)',
                      background: form.priority === p.value ? `${p.color}22` : 'transparent',
                      color: form.priority === p.value ? p.color : '#94a3b8',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* XP info */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Zap size={13} className="text-violet-400 flex-shrink-0" />
              <span className="text-slate-400">
                <span className="text-white font-semibold">25 base XP</span> • set a due date &amp; finish early to earn up to <span className="text-violet-300 font-semibold">+200 bonus XP</span>
              </span>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Category</label>
              <div className="relative">
                <select value={form.category} onChange={update('category')} className="input-field appearance-none pr-8">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Due Date & Time */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Due Date &amp; Time (optional)</label>
              <DateTimePicker
                value={form.dueDate}
                onChange={(v) => setForm({ ...form, dueDate: v })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Adding...' : 'Add Quest'}
              </button>
            </div>
          </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
