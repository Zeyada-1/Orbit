import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Sword, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const location = useLocation();
  const fromRegister = location.state?.fromRegister ?? false;
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back, adventurer!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0f0f1a 70%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass p-8 w-full max-w-md glow"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Sword size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">QuestList</h1>
          <p className="text-slate-400 mt-1">Your productivity adventure awaits</p>
        </div>

        {/* Banner shown when redirected from register with a duplicate email */}
        {fromRegister && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-amber-300 flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="mt-0.5">⚠</span>
            <span>An account with this email already exists. Enter your password to sign in.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field pl-9"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field pl-9 pr-10"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
            {loading ? 'Entering realm...' : 'Enter the Realm'}
          </button>
          <div className="text-center mt-2">
            <Link to="/forgot-password" className="text-slate-400 hover:text-violet-400 text-sm">
              Forgot your password?
            </Link>
          </div>
        </form>

        <p className="text-center text-slate-400 mt-6">
          New adventurer?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
