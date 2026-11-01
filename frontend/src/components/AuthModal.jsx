import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, HeartPulse, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';
import { TabsList, TabTrigger } from './ui/Tabs';

export function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register, quickDemoLogin } = useAuth();

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleTabChange = (newMode) => {
    setMode(newMode);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await quickDemoLogin();
      resetForm();
      onClose();
    } catch (err) {
      setError(
        'Could not log in as demo patient. Ensure backend is running and seeded.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title=""
      description=""
      maxWidth="max-w-md"
    >
      {/* Brand Header */}
      <div className="text-center pt-1 pb-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 mb-3">
          <HeartPulse className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login'
            ? 'Access your daily blood glucose log and medical reports.'
            : 'Start monitoring your blood sugar levels with clinical accuracy.'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="mb-5 flex justify-center">
        <TabsList className="w-full">
          <TabTrigger
            className="flex-1 text-xs font-semibold"
            active={mode === 'login'}
            onClick={() => handleTabChange('login')}
          >
            Sign In
          </TabTrigger>
          <TabTrigger
            className="flex-1 text-xs font-semibold"
            active={mode === 'register'}
            onClick={() => handleTabChange('register')}
          >
            Create Account
          </TabTrigger>
        </TabsList>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="destructive">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === 'register' && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <Input
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-9"
              />
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email Address
          </label>
          <div className="relative">
            <Input
              type="email"
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-9"
            />
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Password
          </label>
          <div className="relative">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pl-9"
            />
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          {mode === 'register' && (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Minimum 6 characters. Passwords are securely hashed with bcrypt.
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-2 h-10 shadow-md shadow-emerald-600/20 text-sm font-semibold"
          isLoading={isLoading}
        >
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      {/* One-Click Demo Login Box */}
      <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 p-3.5 dark:border-emerald-800/60 dark:from-emerald-950/40 dark:to-teal-950/30">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Quick Reviewer Access
              </div>
              <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/80 mt-0.5">
                Instant access to pre-seeded patient account with 40+ readings.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleDemoLogin}
            isLoading={isLoading}
            className="w-full mt-2.5 h-8 gap-2 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-semibold shadow-sm border border-emerald-200 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-slate-800"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            1-Click Demo Patient (demo@sweety.app)
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
