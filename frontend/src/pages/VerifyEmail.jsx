import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Sword } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not connect to server.');
      });
  }, [searchParams]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0f0f1a 70%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass p-8 w-full max-w-md text-center glow"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
        >
          <Sword size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-6">Email Verification</h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader size={40} className="text-violet-400 animate-spin" />
            <p className="text-slate-400">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle size={48} className="text-green-400" />
            <p className="text-green-300 font-semibold text-lg">Email verified!</p>
            <p className="text-slate-400 text-sm">{message}</p>
            <Link to="/" className="btn-primary px-6 py-2.5 inline-block mt-2">
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle size={48} className="text-red-400" />
            <p className="text-red-300 font-semibold text-lg">Verification failed</p>
            <p className="text-slate-400 text-sm">{message}</p>
            <Link to="/" className="text-violet-400 hover:text-violet-300 text-sm mt-2">
              Back to app
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
