import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flame, Trophy, Target, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import HeroCard from '../components/HeroCard';
import TaskCard from '../components/TaskCard';
import AchievementsPanel from '../components/AchievementsPanel';
import AddTaskModal from '../components/AddTaskModal';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tasks?completed=false&sort=createdAt&order=desc'),
      api.get('/analytics/overview'),
    ]).then(([tasksRes, overviewRes]) => {
      setTasks(tasksRes.data);
      setOverview(overviewRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleTaskAdded = (task) => setTasks((prev) => [task, ...prev]);
  const handleTaskComplete = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    api.get('/analytics/overview').then((r) => setOverview(r.data));
  };
  const handleTaskDelete = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const stats = [
    { icon: Target, label: 'Total Quests', value: overview?.total ?? 0, color: '#7c3aed' },
    { icon: CheckCircle, label: 'Completed', value: overview?.completed ?? 0, color: '#10b981' },
    { icon: Flame, label: 'Day Streak', value: user?.streak ?? 0, color: '#f97316' },
    { icon: Trophy, label: 'Completion', value: `${overview?.completionRate ?? 0}%`, color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-violet-400 animate-pulse text-lg">Loading your realm...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Hero Card */}
      <HeroCard />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}22` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tasks Column (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Active Quests</h2>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
              <Plus size={16} /> New Quest
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="glass p-12 text-center">
              <div className="text-4xl mb-3">⚔️</div>
              <p className="text-slate-400">No active quests. Add one to start earning XP!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleTaskComplete}
                  onDelete={handleTaskDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Achievements Column (1/3) */}
        <div>
          <AchievementsPanel achievements={user?.achievements} />
        </div>
      </div>

      {showModal && (
        <AddTaskModal onClose={() => setShowModal(false)} onTaskAdded={handleTaskAdded} />
      )}
    </div>
  );
}
