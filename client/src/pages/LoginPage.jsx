import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LogIn, Mail, Lock, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('manager@queuepro.com');
  const [password, setPassword] = useState('Password123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    const res = await login(email, password);
    if (res?.success) {
      navigate(from, { replace: true });
    } else {
      setError(res?.message || 'Login failed. Please verify your credentials.');
    }
    setIsLoading(false);
  };

  const fillDemoManager = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#050606] flex items-center justify-center p-4 selection:bg-[#C8FF00] selection:text-[#050606] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C8FF00]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
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

        {/* Login Card - Secondary light surface #F5F3EF for striking visual contrast */}
        <div className="bg-[#F5F3EF] text-[#050606] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#DDD8CE]">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#050606]">Manager Sign In</h2>
            <p className="text-xs text-[#626868] mt-1">
              Enter your credentials to access the manager control panel
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-100 border border-rose-300 rounded-xl text-xs font-medium text-rose-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            />

            <Button
              type="submit"
              variant="accent"
              size="lg"
              icon={LogIn}
              isLoading={isLoading}
              className="w-full mt-2 glow-accent text-base"
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Quick Demo Credentials Fill */}
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
