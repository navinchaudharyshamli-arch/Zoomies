import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, PawPrint, LogIn, Sparkles } from 'lucide-react';
import { TestBanner } from '../components/TestBanner';

export const LoginView: React.FC = () => {
  const { login, isDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'staff' || user.role === 'admin') {
        navigate('/staff');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Wrong email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#e9e4dc] dark:bg-[#1c1918] flex justify-center selection:bg-[#f28a4b] selection:text-white">
      <div className="w-full max-w-[430px] min-h-screen bg-[#fbf6ed] dark:bg-[#1f1b19] text-[#3b2923] dark:text-[#f5ebe3] flex flex-col justify-between p-6 shadow-2xl relative">
        <TestBanner />

        {/* Brand Area */}
        <div className="pt-6">
          <div className="w-[72px] h-[72px] rounded-2xl bg-[#f28a4b] text-white flex items-center justify-center -rotate-6 shadow-[0_12px_24px_rgba(242,138,75,0.28)] mb-8">
            <PawPrint size={40} className="rotate-6" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#3b2923] dark:text-[#f5ebe3] leading-none mb-3">
            Fresh bowls,<br />waggy tails.
          </h1>
          <p className="text-sm text-[#6f5c54] dark:text-[#c1b2a9] leading-relaxed max-w-[280px]">
            Home-style, vet-approved meals cooked with love for your dogs and cats.
          </p>
        </div>

        {/* Form Area */}
        <div className="py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-[#fff0ee] dark:bg-[#412725] text-[#d43f39] text-xs font-semibold flex items-center gap-2 border border-[#d43f39]/20">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#c1b2a9] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-13 px-4 rounded-2xl bg-white dark:bg-[#302a27] border border-[#e9ded2] dark:border-[#443a35] text-sm text-[#3b2923] dark:text-[#f5ebe3] outline-none focus:ring-2 focus:ring-[#f28a4b] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#c1b2a9] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-13 pl-4 pr-12 rounded-2xl bg-white dark:bg-[#302a27] border border-[#e9ded2] dark:border-[#443a35] text-sm text-[#3b2923] dark:text-[#f5ebe3] outline-none focus:ring-2 focus:ring-[#f28a4b] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9b8b84] hover:text-[#3b2923] dark:hover:text-[#f5ebe3] p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_18px_rgba(59,41,35,0.18)] active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Test Switcher for Testers */}
          <div className="mt-8 pt-6 border-t border-[#e9ded2] dark:border-[#443a35]">
            <p className="text-[11px] font-bold text-[#9b8b84] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#f28a4b]" /> Quick Test Logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccount('customer@zoomies.com', 'password123')}
                className="p-2 rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-left hover:border-[#f28a4b] transition-colors"
              >
                <b className="block text-[11px] text-[#3b2923] dark:text-[#f5ebe3]">Customer</b>
                <span className="text-[9px] text-[#9b8b84]">App & Bowls</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('staff@zoomies.com', 'password123')}
                className="p-2 rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-left hover:border-[#f28a4b] transition-colors"
              >
                <b className="block text-[11px] text-[#3b2923] dark:text-[#f5ebe3]">Kitchen Staff</b>
                <span className="text-[9px] text-[#9b8b84]">Live Portal</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('admin@zoomies.com', 'password123')}
                className="p-2 rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-left hover:border-[#f28a4b] transition-colors"
              >
                <b className="block text-[11px] text-[#3b2923] dark:text-[#f5ebe3]">Admin / Owner</b>
                <span className="text-[9px] text-[#9b8b84]">Full Access</span>
              </button>
            </div>
            {isDemo && (
              <p className="text-[10px] text-[#9b8b84] mt-2 italic">
                Password in demo mode can be any string.
              </p>
            )}
          </div>
        </div>

        <div className="text-center text-[11px] text-[#9b8b84] pb-2">
          Zoomies Pet Food Cafe • Fresh Daily
        </div>
      </div>
    </div>
  );
};
