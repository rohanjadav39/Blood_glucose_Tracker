import React from 'react';
import { HeartPulse, LogOut, PlusCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

export function Navbar({ onOpenAuth, onOpenNewReading, darkMode, onToggleDarkMode }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 animate-pulseSlow">
            <HeartPulse className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Sweety
              </span>
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                Patient Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Daily & Monthly Blood Glucose Tracker
            </p>
          </div>
        </div>

        {/* User Navigation / Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Mode Switcher */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="h-9 w-9 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAuthenticated ? (
            <>
              {/* Add Reading Button */}
              <Button
                onClick={onOpenNewReading}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 text-xs sm:text-sm"
                size="sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Add Reading</span>
                <span className="sm:hidden">Add</span>
              </Button>

              {/* User Profile Pill */}
              <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-900/60 dark:text-emerald-300">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="leading-tight">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{user?.name}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-400">{user?.email}</div>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-1.5 text-slate-600 hover:text-rose-600 hover:border-rose-200 dark:text-slate-300 dark:hover:text-rose-400"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenAuth('login')}
              >
                Log In
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenAuth('register')}
                className="shadow-sm"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
