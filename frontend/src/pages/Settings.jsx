import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Globe, Lock, User, ShieldCheck,
  Users, CalendarDays, CheckSquare, Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const AVATARS = [
  { key: 'warrior', emoji: '⚔️', label: 'Warrior' },
  { key: 'mage',    emoji: '🧙', label: 'Mage'    },
  { key: 'archer',  emoji: '🏹', label: 'Archer'  },
  { key: 'rogue',   emoji: '🗡️', label: 'Rogue'  },
];

function Section({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5"
    >
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <Icon size={13} />
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function Toggle({ enabled, onToggle, saving }) {
  return (
    <button
      onClick={onToggle}
      disabled={saving}
      aria-label="Toggle"
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-300
        ${enabled ? 'bg-violet-600' : 'bg-slate-700'}
        ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Anchor at left-1 top-1, then slide right when enabled */}
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300
          ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const patchSettings = async (data, successMsg) => {
    setSaving(true);
    try {
      await api.patch('/user/settings', data);
      await refreshUser();
      toast.success(successMsg);
    } catch {
      toast.error('Failed to save — please try again');
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyToggle = () =>
    patchSettings(
      { isPublic: !user.isPublic },
      user.isPublic ? 'Account set to private' : 'Account is now public 🌐'
    );

  const handleAvatarChange = (key) => {
    if (key === user.avatar) return;
    patchSettings({ avatar: key }, 'Hero updated!');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed33, #7c3aed66)', border: '1px solid #7c3aed' }}
        >
          <SettingsIcon size={17} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-xs text-slate-500">Manage your account preferences</p>
        </div>
      </div>

      {/* ── Account info ───────────────────────────────────────────────────── */}
      <Section title="Account" icon={User}>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed22, #7c3aed55)', border: '2px solid #7c3aed55' }}
          >
            {AVATARS.find((a) => a.key === user.avatar)?.emoji ?? '⚔️'}
          </div>
          <div>
            <p className="font-semibold text-white text-lg">{user.username}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Level {user.level} · {user.xp} total XP · {user.streak}d streak
            </p>
          </div>
        </div>
      </Section>

      {/* ── Hero / Avatar ──────────────────────────────────────────────────── */}
      <Section title="Choose Your Hero" icon={User}>
        <div className="grid grid-cols-4 gap-3">
          {AVATARS.map((a) => {
            const isSelected = user.avatar === a.key;
            return (
              <button
                key={a.key}
                onClick={() => handleAvatarChange(a.key)}
                disabled={saving}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all border ${
                  isSelected
                    ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                    : 'border-white/5 bg-white/3 text-slate-400 hover:border-violet-500/40 hover:bg-violet-600/10 hover:text-slate-200'
                } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="text-2xl">{a.emoji}</span>
                <span className="text-xs font-semibold">{a.label}</span>
                {isSelected && (
                  <span className="text-[10px] text-violet-400 font-bold">Active</span>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Privacy ────────────────────────────────────────────────────────── */}
      <Section title="Privacy" icon={ShieldCheck}>
        {/* Toggle row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                user.isPublic
                  ? 'bg-emerald-500/15 border border-emerald-500/25'
                  : 'bg-slate-700/40 border border-white/5'
              }`}
            >
              {user.isPublic
                ? <Globe size={16} className="text-emerald-400" />
                : <Lock size={16} className="text-slate-500" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {user.isPublic ? 'Public Account' : 'Private Account'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {user.isPublic
                  ? 'Others can find you in search and view your profile'
                  : 'Only you can see your quests and schedule'}
              </p>
            </div>
          </div>
          <Toggle enabled={user.isPublic} onToggle={handlePrivacyToggle} saving={saving} />
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-white/5" />

        {/* What public means */}
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">
          {user.isPublic ? 'When public, others can see:' : 'When public, others will be able to see:'}
        </p>
        <div className="space-y-2">
          {[
            { icon: Users,       label: 'Your profile, level, XP and streak' },
            { icon: CheckSquare, label: 'Your achievements and badges'        },
            { icon: CalendarDays,label: 'Your upcoming schedule (next 30 days)'},
            { icon: Flame,       label: 'Your recently completed quests'      },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-sm">
              <Icon
                size={13}
                className={user.isPublic ? 'text-emerald-400' : 'text-slate-600'}
              />
              <span className={user.isPublic ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tip when private */}
        {!user.isPublic && (
          <p className="mt-4 text-xs text-slate-600 italic">
            You can still search for and view other public profiles even while your account is private.
          </p>
        )}
      </Section>
    </div>
  );
}
