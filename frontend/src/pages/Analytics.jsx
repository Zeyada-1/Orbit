import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, CheckCircle, Target, Flame, Zap } from 'lucide-react';

const PRIO_COLORS = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444' };
const CATEGORY_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass p-3 text-sm">
      <p className="text-slate-300 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [xpHistory, setXpHistory] = useState([]);
  const [tasksHistory, setTasksHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/xp-history'),
      api.get('/analytics/tasks-history'),
    ]).then(([ov, xp, th]) => {
      setOverview(ov.data);
      setXpHistory(xp.data);
      setTasksHistory(th.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-violet-400 animate-pulse py-24">Crunching your stats...</div>;

  const priorityPieData = overview ? [
    { name: 'Low', value: overview.byPriority.LOW, color: PRIO_COLORS.LOW },
    { name: 'Medium', value: overview.byPriority.MEDIUM, color: PRIO_COLORS.MEDIUM },
    { name: 'High', value: overview.byPriority.HIGH, color: PRIO_COLORS.HIGH },
  ].filter((d) => d.value > 0) : [];

  const topStats = [
    { icon: CheckCircle, label: 'Tasks Completed', value: overview?.completed ?? 0, color: '#10b981' },
    { icon: Target, label: 'Completion Rate', value: `${overview?.completionRate ?? 0}%`, color: '#7c3aed' },
    { icon: Flame, label: 'Best Streak', value: `${user?.longestStreak ?? 0} days`, color: '#f97316' },
    { icon: Zap, label: 'Total XP', value: user?.xp ?? 0, color: '#f59e0b' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* XP Over Time */}
      <div className="glass p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-violet-400" /> XP Earned (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={xpHistory}>
            <defs>
              <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="xp" name="XP" stroke="#7c3aed" fill="url(#xpGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tasks Completed Over Time */}
      <div className="glass p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-emerald-400" /> Tasks Completed (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tasksHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row: Pie + Categories */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Priority Pie */}
        <div className="glass p-5">
          <h3 className="font-bold text-white mb-4">Completed by Priority</h3>
          {priorityPieData.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No completed tasks yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                  {priorityPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} contentStyle={{ background: '#16213e', border: '1px solid #7c3aed33', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-4 mt-3">
            {priorityPieData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-sm">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                <span className="text-slate-300">{p.name} ({p.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="glass p-5">
          <h3 className="font-bold text-white mb-4">Top Categories</h3>
          {!overview?.byCategory?.length ? (
            <div className="text-center text-slate-500 py-8">No data yet</div>
          ) : (
            <div className="space-y-3">
              {overview.byCategory.slice(0, 6).map((cat, i) => {
                const max = overview.byCategory[0].count;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{cat.name}</span>
                      <span className="text-slate-400">{cat.count} tasks</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(cat.count / max) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
