import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles } from 'lucide-react';
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
      setError(err.message || 'Authentication failed. Please check your details.');
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
        'Demo account not found or database not initialized. Please ensure backend is running with "npm run seed".'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Welcome back to Sweety' : 'Create your Sweety account'}
      description={
        mode === 'login'
          ? 'Log in to track and review your blood glucose readings.'
          : 'Sign up to safely monitor your glucose levels daily.'
      }
    >
      {/* Mode Switcher Tabs */}
      <div className="mb-5 flex justify-center">
        <TabsList className="w-full">
          <TabTrigger
            className="flex-1"
            active={mode === 'login'}
            onClick={() => handleTabChange('login')}
          >
            Log In
          </TabTrigger>
          <TabTrigger
            className="flex-1"
            active={mode === 'register'}
            onClick={() => handleTabChange('register')}
          >
            Sign Up
          </TabTrigger>
        </TabsList>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="destructive">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
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
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Email Address
          </label>
          <div className="relative">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-9"
            />
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
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
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
          {mode === 'register' && (
            <p className="mt-1 text-[11px] text-slate-500">
              Password must be at least 6 characters. Never stored in plain text.
            </p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          {mode === 'login' ? 'Log In' : 'Create Account'}
        </Button>
      </form>

      {/* Quick Demo Login Option for evaluators */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleDemoLogin}
          isLoading={isLoading}
          className="w-full gap-2 border border-emerald-200/60 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60 text-xs py-2"
        >
          <Sparkles className="h-4 w-4 text-emerald-600" />
          One-Click Demo Patient Login (demo@sweety.app)
        </Button>
      </div>
    </Dialog>
  );
}
