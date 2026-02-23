import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await api.login(email, password);
      login(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-lg shadow-slate-200/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white mb-4 shadow-lg shadow-teal-600/25">
              <span className="text-2xl font-bold">W</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              WhiteRock<span className="text-[10px] align-top ml-0.5 font-normal text-slate-400">TM</span>
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm font-medium">Task Management</p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 mt-0.5 text-red-500" />
              <div className="text-sm">
                <p className="font-medium">{error}</p>
                {error === 'Invalid email or password' && (
                  <p className="mt-2 text-red-600/90">
                    No account yet? <a href="#/seed" className="font-medium underline underline-offset-2">Create demo users first</a>, then use <strong>owner@whiterock.co.in</strong> / <strong>password123</strong>.
                  </p>
                )}
              </div>
            </div>
          )}
          <a
            href="#/seed"
            className="block text-sm text-teal-600 hover:text-teal-700 font-medium mb-5"
          >
            First time? Seed demo users (all use password: password123)
          </a>
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <Button type="submit" className="w-full h-11 text-sm font-semibold" isLoading={loading}>
              Sign in
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">WhiteRock™ Task Management</p>
      </div>
    </div>
  );
}
