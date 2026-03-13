import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, Search } from 'lucide-react';
import api from '../lib/api';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';

const FILTERS = ['All', 'Active', 'Completed'];
const PRIORITIES = ['All', 'LOW', 'MEDIUM', 'HIGH'];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active');
  const [priority, setPriority] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/tasks?sort=createdAt&order=desc')
      .then((r) => setTasks(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleTaskAdded = (task) => setTasks((prev) => [task, ...prev]);
  const handleComplete = (id) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: true } : t));
  const handleDelete = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const filtered = tasks.filter((t) => {
    if (filter === 'Active' && t.completed) return false;
    if (filter === 'Completed' && !t.completed) return false;
    if (priority !== 'All' && t.priority !== priority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Quest Log</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 py-2 px-4">
          <Plus size={16} /> New Quest
        </button>
      </div>

      {/* Filters */}
      <div className="glass p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search quests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Status filter */}
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Priority filter */}
          <div className="flex gap-1">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  priority === p ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p === 'All' ? 'All Priority' : p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="text-slate-400 text-sm">{filtered.length} quest{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Task List */}
      {loading ? (
        <div className="text-center text-violet-400 animate-pulse py-12">Loading quests...</div>
      ) : filtered.length === 0 ? (
        <div className="glass p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-400">No quests found. {filter === 'Active' && 'Add a new quest to begin!'}</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filtered.map((task) => (
              <TaskCard key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {showModal && (
        <AddTaskModal onClose={() => setShowModal(false)} onTaskAdded={handleTaskAdded} />
      )}
    </div>
  );
}
