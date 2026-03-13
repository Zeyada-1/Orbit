import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Flame, Star, Zap } from 'lucide-react';

const AVATAR_EMOJIS = { warrior: '⚔️', mage: '🧙', archer: '🏹', rogue: '🗡️' };

export default function HeroCard() {
  const { user } = useAuth();
  if (!user) return null;

  const xpPct = Math.min(100, Math.round((user.currentLevelXp / user.xpForNext) * 100)) || 0;

  return (
    <div className="glass p-5 glow">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed33, #7c3aed66)', border: '2px solid #7c3aed' }}>
            {AVATAR_EMOJIS[user.avatar] || '⚔️'}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-violet-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white border-2 border-[#0f0f1a]">
            {user.level}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-lg truncate">{user.username}</h2>
          <p className="text-slate-400 text-sm">Level {user.level} Adventurer</p>

          {/* XP Bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1"><Zap size={11} className="text-violet-400" /> {user.currentLevelXp} XP</span>
              <span>{user.xpForNext} XP</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className="xp-bar h-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2 text-right flex-shrink-0">
          <div className="flex items-center gap-1 justify-end text-orange-400">
            <Flame size={14} />
            <span className="text-sm font-bold">{user.streak}d</span>
          </div>
          <div className="flex items-center gap-1 justify-end text-yellow-400">
            <Star size={14} />
            <span className="text-sm font-bold">{user.xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
