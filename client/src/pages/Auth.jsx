import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup } from '../api';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle, Sparkles, Search, Zap } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await login(email, password);
      } else {
        data = await signup(email, password);
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.email);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Search,       label: 'Live Search Verification',   desc: 'Claims verified against real-time results' },
    { icon: Zap,          label: 'Instant Fact-Checking',       desc: 'Results in seconds, not minutes'          },
    { icon: Sparkles,     label: 'Multi-Model Comparison',      desc: 'Compare OpenRouter vs Gemini side-by-side' },
  ];

  return (
    <div className="min-h-[calc(100vh-57px)] flex bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.3),transparent_60%)]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">VerifAI</span>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Trust what<br />AI tells you
          </h1>
          <p className="text-indigo-200 text-base leading-relaxed max-w-sm">
            Every AI response is automatically fact-checked against live search results. Catch hallucinations before they mislead you.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          {features.map(({ icon: Icon, label, desc }, i) => (
            <div key={i} className="flex items-start gap-4 animate-fade-up" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0 backdrop-blur-sm">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{label}</p>
                <p className="text-indigo-300 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}

          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['🧑‍💻', '👩‍🔬', '🧑‍🎓'].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <p className="text-indigo-200 text-xs">Trusted by researchers, students & developers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl gradient-text">VerifAI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              {isLogin ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-slate-400 text-sm mt-1.5">
              {isLogin ? 'Sign in to your account to continue' : 'Create your free account today'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-8">
            {['Sign In', 'Sign Up'].map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => { setIsLogin(i === 0); setError(''); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                  (i === 0) === isLogin
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 flex items-center gap-2 animate-slide-down font-medium">
                <span className="text-rose-500">⚠️</span> {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 outline-none transition-all text-sm bg-slate-50 focus:bg-white placeholder:text-slate-400"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 outline-none transition-all text-sm bg-slate-50 focus:bg-white placeholder:text-slate-400"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 py-4 rounded-xl text-white font-bold transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Features hint for landing */}
          {!isLogin && (
            <div className="mt-6 space-y-2.5 animate-fade-up delay-300">
              {['Free to use, no credit card required', 'Real-time fact verification', 'Compare multiple AI models'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-slate-400 mt-8">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
            >
              {isLogin ? 'Sign up for free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
