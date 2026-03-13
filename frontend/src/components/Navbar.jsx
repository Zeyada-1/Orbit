import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sword, LayoutDashboard, CheckSquare, BarChart2, CalendarDays, Search, Settings, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks',     label: 'Quests',    icon: CheckSquare     },
  { to: '/calendar',  label: 'Schedule',  icon: CalendarDays    },
  { to: '/analytics', label: 'Analytics', icon: BarChart2       },
  { to: '/search',    label: 'Search',    icon: Search          },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (resending || resent) return;
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        setResent(true);
        toast.success('Verification email sent!');
      } else {
        const d = await res.json();
        toast.error(d.error || 'Could not resend email');
      }
    } catch {
      toast.error('Could not connect to server');
    } finally {
      setResending(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Until next time, adventurer!');
    navigate('/login');
  };

  return (
    <>
    <nav className="glass border-b border-violet-900/30 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Sword size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">QuestList</span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-violet-600/30 text-violet-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-slate-400">Lvl</span>
              <span className="font-bold text-violet-400">{user.level}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 font-medium">{user.username}</span>
            </div>
          )}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center p-1.5 rounded-lg transition-colors ${
                isActive ? 'text-violet-400' : 'text-slate-400 hover:text-white'
              }`
            }
            title="Settings"
          >
            <Settings size={16} />
          </NavLink>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors text-sm">
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
    {user && !user.emailVerified && (
      <div
        className="px-4 py-2 text-center flex items-center justify-center gap-3 flex-wrap text-sm"
        style={{ background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.25)' }}
      >
        <span className="text-amber-300">📬 Please verify your email address to secure your account.</span>
        <button
          onClick={handleResend}
          disabled={resending || resent}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline disabled:opacity-50"
        >
          {resent ? 'Sent! ✓' : resending ? 'Sending...' : 'Resend verification'}
        </button>
      </div>
    )}
  </>
  );
}
