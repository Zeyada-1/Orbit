import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Lock, Globe, Flame, ChevronRight } from 'lucide-react';
import api from '../lib/api';

const AVATAR_EMOJIS = { warrior: '⚔️', mage: '🧙', archer: '🏹', rogue: '🗡️' };

export default function SearchPage() {
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => { setResults(res.data); setSearched(true); })
        .catch(() => { setResults([]); setSearched(true); })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed33, #7c3aed66)', border: '1px solid #7c3aed' }}>
          <Users size={18} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Find Adventurers</h1>
          <p className="text-xs text-slate-500">Search for other players and view their profiles</p>
        </div>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username…"
          className="input-field pl-9 w-full"
          autoFocus
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs animate-pulse">
            Searching…
          </span>
        )}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {results.map((u, i) => (
              <motion.button
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/users/${u.username}`)}
                className="glass w-full flex items-center gap-3 p-3 rounded-xl hover:border-violet-500/40 transition-all text-left group"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'linear-gradient(135deg, #7c3aed22, #7c3aed55)', border: '1px solid #7c3aed55' }}
                  >
                    {AVATAR_EMOJIS[u.avatar] || '⚔️'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-violet-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white border border-[#0f0f1a]">
                    {u.level}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{u.username}</span>
                    {u.isPublic
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-0.5">
                          <Globe size={9} /> Public
                        </span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded-full text-slate-500 bg-slate-600/10 border border-slate-600/20 flex items-center gap-0.5">
                          <Lock size={9} /> Private
                        </span>
                    }
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>Level {u.level}</span>
                    <span className="flex items-center gap-0.5 text-orange-400">
                      <Flame size={10} /> {u.streak}d streak
                    </span>
                  </div>
                </div>

                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
              </motion.button>
            ))}
          </motion.div>
        )}

        {searched && !loading && results.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Users size={36} className="mx-auto mb-3 text-slate-700" />
            <p className="text-slate-500">
              No adventurers found for "<span className="text-slate-300">{query}</span>"
            </p>
          </motion.div>
        )}

        {!searched && !loading && (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search size={40} className="mx-auto mb-3 text-slate-800" />
            <p className="text-slate-600 text-sm">Type at least 2 characters to search</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
