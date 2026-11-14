import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LogIn, UserPlus, Mail, Lock, User, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';

export const LoginPage = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('manager@queuepro.com');
  const [password, setPassword] = useState('Password123!');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (!email.trim() || !password) {
        setError('Please enter both email and password');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setIsLoading(true);
      const res = await register(name.trim(), email.trim(), password);
      if (res?.success) {
        navigate(from, { replace: true });
      } else {
        setError(res?.message || 'Registration failed. Please try again.');
      }
      setIsLoading(false);
    } else {
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }

      setIsLoading(true);
      const res = await login(email, password);
      if (res?.success) {
        navigate(from, { replace: true });
      } else {
        setError(res?.message || 'Login failed. Please verify your credentials.');
      }
      setIsLoading(false);
    }
  };

  const fillDemoManager = (demoEmail) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    if (newMode === 'register') {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } else {
      setEmail('manager@queuepro.com');
      setPassword('Password123!');
    }
  };

  return (
    <div className="min-h-screen bg-[#050606] flex items-center justify-center p-4 selection:bg-[#C8FF00] selection:text-[#050606] relative overflow-hidden">
      {/* Background Ambient Video - Original Clarity (Watermark Removed) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
        src="/background.mp4"
      />

      {/* Dark overlay for contrast, legibility and focus */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050606]/80 via-[#050606]/65 to-[#050606]/90 backdrop-blur-[2px] pointer-events-none" />

      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C8FF00]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C8FF00] text-[#050606] font-extrabold text-2xl shadow-accent mb-4">
            Q
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F3EF] tracking-tight">
            Queue<span className="text-[#C8FF00]">Pro</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9393] mt-1.5">
            Enterprise Queue Management & Real-time Operations
          </p>
        </div>

        {/* Login / Register Card */}
        <div className="bg-[#F5F3EF] text-[#050606] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#DDD8CE]">
          {/* Mode Switcher Pills */}
          <div className="flex rounded-2xl bg-[#ECE9E2] p-1 mb-6 border border-[#DDD8CE]">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-[#050606] text-[#C8FF00] shadow-sm'
                  : 'text-[#626868] hover:text-[#050606]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-[#050606] text-[#C8FF00] shadow-sm'
                  : 'text-[#626868] hover:text-[#050606]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#050606]">
              {mode === 'login' ? 'Manager Sign In' : 'Create Manager Account'}
            </h2>
            <p className="text-xs text-[#626868] mt-1">
              {mode === 'login'
                ? 'Enter your credentials to access your control panel'
                : 'Register a new manager profile to start managing queues'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-100 border border-rose-300 rounded-xl text-xs font-medium text-rose-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Full Name"
                type="text"
                placeholder="e.g. Alex Morgan"
                icon={User}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                variant="light"
              />
            )}

            <Input
              label="Manager Email"
              type="email"
              placeholder="manager@queuepro.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="light"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="light"
              helperText={mode === 'register' ? 'Minimum 6 characters' : undefined}
            />

            {mode === 'register' && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••••••"
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                variant="light"
              />
            )}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              icon={mode === 'login' ? LogIn : UserPlus}
              isLoading={isLoading}
              className="w-full mt-2 glow-accent text-base font-bold"
            >
              {mode === 'login' ? 'Sign In to Dashboard' : 'Create Account & Sign In'}
            </Button>
          </form>

          {/* Quick Demo Credentials Fill (Visible on login mode) */}
          {mode === 'login' ? (
            <div className="mt-6 pt-5 border-t border-[#E2DDD5]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#626868] mb-2.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#050606]" />
                <span>Instant Demo Accounts</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemoManager('manager@queuepro.com')}
                  className="p-2.5 rounded-xl border border-[#DDD8CE] bg-white text-left hover:border-[#050606] hover:bg-[#ECE9E2] transition-colors"
                >
                  <p className="font-bold text-[#050606]">Demo Manager</p>
                  <p className="text-[10px] text-[#7A8080] truncate">manager@queuepro.com</p>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoManager('sarah@queuepro.com')}
                  className="p-2.5 rounded-xl border border-[#DDD8CE] bg-white text-left hover:border-[#050606] hover:bg-[#ECE9E2] transition-colors"
                >
                  <p className="font-bold text-[#050606]">Sarah (Isolated)</p>
                  <p className="text-[10px] text-[#7A8080] truncate">sarah@queuepro.com</p>
                </button>
              </div>
              <p className="text-[10px] text-center text-[#7A8080] mt-3">
                Default demo password: <code className="font-bold text-[#050606]">Password123!</code>
              </p>
            </div>
          ) : (
            <div className="mt-5 text-center text-xs text-[#626868]">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-bold text-[#050606] hover:underline"
              >
                Sign in to your account
              </button>
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#8E9393]">
          <ShieldCheck className="w-4 h-4 text-[#C8FF00]" />
          <span>Protected with JWT & bcrypt 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
};
