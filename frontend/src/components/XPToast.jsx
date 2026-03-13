import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

export default function XPToast({ xpGained, achievements, levelUp }) {
  return (
    <div className="flex flex-col gap-2">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2"
      >
        <span className="text-lg">⚔️</span>
        <span className="font-bold text-emerald-400">+{xpGained} XP earned!</span>
      </motion.div>

      {levelUp && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <span className="text-lg">🌟</span>
          <span className="font-bold text-yellow-400">LEVEL UP! You are now level {levelUp}!</span>
        </motion.div>
      )}

      {achievements?.map((ach) => (
        <motion.div
          key={ach.key}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2"
        >
          <span className="text-lg">{ach.icon}</span>
          <div>
            <div className="font-bold text-amber-400">Achievement Unlocked!</div>
            <div className="text-sm text-slate-300">{ach.name}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
