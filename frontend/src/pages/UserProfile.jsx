import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Lock, Globe, Flame, Star, Zap, Trophy,
  Calendar, CheckCircle, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const AVATAR_EMOJIS = { warrior: '⚔️', mage: '🧙', archer: '🏹', rogue: '🗡️' };
const PRIORITY_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwn = me?.username === username;

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/users/${username}`)
      .then((res) => {
        setProfile(res.data);
        return api.get(`/users/${username}/schedule`);
      })
      .then((res) => setSchedule(res.data))
      .catch((err) => {
        // 403 on schedule means private (but profile still loaded)
        if (err.response?.status === 404) setError('User not found');
        else if (err.response?.status !== 403) setError('Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, [username]);

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-violet-400 animate-pulse">Loading profile…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <Users size={40} className="mx-auto mb-3 text-slate-700" />
        <p className="text-slate-400 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go back</button>
      </div>
    );
  }

  const xpPct = Math.min(100, Math.round((profile.currentLevelXp / profile.xpForNext) * 100)) || 0;
  const canSeeFull = profile.isPublic || isOwn;

  // Group upcoming tasks by calendar day
  const groupedUpcoming = {};
  (schedule?.upcoming || []).forEach((task) => {
    const key = new Date(task.dueDate).toDateString();
    if (!groupedUpcoming[key]) groupedUpcoming[key] = [];
    groupedUpcoming[key].push(task);
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* ── Profile header ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-5 glow"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed33, #7c3aed66)', border: '2px solid #7c3aed' }}
            >
              {AVATAR_EMOJIS[profile.avatar] || '⚔️'}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-violet-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white border-2 border-[#0f0f1a]">
              {profile.level}
            </div>
          </div>

          {/* Text info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-white text-xl">{profile.username}</h1>
              {profile.isPublic
                ? <span className="text-[10px] px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-0.5">
                    <Globe size={9} /> Public
                  </span>
                : <span className="text-[10px] px-2 py-0.5 rounded-full text-slate-400 bg-slate-600/10 border border-slate-600/20 flex items-center gap-0.5">
                    <Lock size={9} /> Private
                  </span>
              }
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Level {profile.level} Adventurer · Joined {fmtDate(profile.joinedAt)}
            </p>

            {/* XP bar */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Zap size={10} className="text-violet-400" /> {profile.currentLevelXp} XP
                </span>
                <span>{profile.xpForNext} to next level</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  className="xp-bar h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Right stats */}
          <div className="flex flex-col gap-2 text-right flex-shrink-0">
            <div className="flex items-center gap-1 justify-end text-orange-400">
              <Flame size={13} />
              <span className="text-sm font-bold">{profile.streak}d</span>
            </div>
            <div className="flex items-center gap-1 justify-end text-yellow-400">
              <Star size={13} />
              <span className="text-sm font-bold">{profile.xp} XP</span>
            </div>
            <div className="flex items-center gap-1 justify-end text-emerald-400">
              <CheckCircle size={13} />
              <span className="text-sm font-bold">{profile.completedCount}</span>
            </div>
          </div>
        </div>

        {/* Settings link for own profile */}
        {isOwn && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <a
              href="/settings"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
            >
              ⚙ Manage privacy &amp; avatar in Settings
            </a>
          </div>
        )}
      </motion.div>

      {/* ── Private account wall ─────────────────────────────────────────── */}
      {!canSeeFull && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-10 text-center"
        >
          <Lock size={36} className="mx-auto mb-3 text-slate-600" />
          <h3 className="text-white font-semibold mb-1">Private Account</h3>
          <p className="text-slate-500 text-sm">This adventurer has chosen to keep their quests private.</p>
        </motion.div>
      )}

      {/* ── Achievements ─────────────────────────────────────────────────── */}
      {canSeeFull && profile.achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass p-5"
        >
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Trophy size={13} /> Achievements ({profile.achievements.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.achievements.map((a) => (
              <div
                key={a.key}
                title={`${a.name}: ${a.description}`}
                className="px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-sm cursor-default"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)' }}
              >
                <span>{a.icon}</span>
                <span className="text-slate-300 text-xs font-medium">{a.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Upcoming schedule ────────────────────────────────────────────── */}
      {canSeeFull && schedule && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-5"
        >
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Calendar size={13} /> Upcoming Schedule (next 30 days)
          </h2>

          {Object.keys(groupedUpcoming).length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-4">No upcoming quests in the next 30 days.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedUpcoming).map(([, tasks]) => (
                <div key={tasks[0].dueDate}>
                  <p className="text-xs font-semibold text-violet-400 mb-1.5">{fmtDate(tasks[0].dueDate)}</p>
                  <div className="space-y-1.5 pl-3 border-l-2 border-violet-900/40">
                    {tasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: PRIORITY_COLORS[t.priority] ?? '#7c3aed' }}
                          />
                          <span className="text-slate-200 truncate">{t.title}</span>
                          <span className="text-xs text-slate-600 flex-shrink-0 hidden sm:block">{t.category}</span>
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{fmtTime(t.dueDate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Recent completions ───────────────────────────────────────────── */}
      {canSeeFull && schedule?.recent?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass p-5"
        >
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle size={13} /> Recently Completed
          </h2>
          <div className="divide-y divide-white/5">
            {schedule.recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-300 truncate">{t.title}</span>
                  <span className="text-xs text-slate-600 flex-shrink-0 hidden sm:block">{t.category}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-violet-400 font-medium">+{t.xpReward} XP</span>
                  <span className="text-xs text-slate-500">{fmtDate(t.completedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
