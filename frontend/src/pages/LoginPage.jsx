import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@poojacoconuts.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-slate-100">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 shadow-2xl shadow-emerald-950/50 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30">
            🥥
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-white tracking-tight">
            Pooja Coconuts
          </h1>
          <p className="text-xs text-emerald-400 font-medium tracking-wide uppercase">
            Wholesale & Retail ERP System
          </p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs rounded-2xl text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@poojacoconuts.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 text-sm rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 text-sm rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/50 hover:shadow-emerald-600/30 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Demo Credentials Note */}
        <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-[11px] text-slate-400 text-center space-y-1">
          <p className="font-semibold text-slate-300">Default Shop Owner Credentials:</p>
          <p>Email: <span className="font-mono text-emerald-400">admin@poojacoconuts.com</span></p>
          <p>Password: <span className="font-mono text-emerald-400">admin123</span></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
