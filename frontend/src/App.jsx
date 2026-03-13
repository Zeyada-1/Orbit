import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import SearchPage from './pages/Search';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-violet-400 animate-pulse text-xl">Loading realm...</div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<PrivateRoute><Navbar /><Dashboard /></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute><Navbar /><Tasks /></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><Navbar /><Calendar /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Navbar /><Analytics /></PrivateRoute>} />
      <Route path="/search" element={<PrivateRoute><Navbar /><SearchPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Navbar /><Settings /></PrivateRoute>} />
      <Route path="/users/:username" element={<PrivateRoute><Navbar /><UserProfile /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#16213e', color: '#e2e8f0', border: '1px solid rgba(124,58,237,0.3)' },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

