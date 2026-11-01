import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Sparkles,
  Calendar,
  Activity,
  PlusCircle,
  FileText,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Sunrise,
  Coffee,
  Sun,
  Moon,
  Lock,
  BarChart3,
  Stethoscope,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { getTodayString, formatDisplayDate } from './utils/dateHelpers';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ReadingFormModal } from './components/ReadingFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ReadingsList } from './components/ReadingsList';
import { ReportsSection } from './components/ReportsSection';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';

export function App() {
  const { user, isAuthenticated, isLoading: authLoading, quickDemoLogin } = useAuth();

  // Dark mode state with localStorage persistence (defaults to dark mode)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sweety_theme');
    if (saved !== null) return saved === 'dark';
    return true; // Default to dark mode
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('sweety_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('sweety_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Navigation & state
  const [activeView, setActiveView] = useState('readings'); // 'readings' | 'reports'
  const [readingsViewMode, setReadingsViewMode] = useState('paginated'); // 'paginated' (5 days x 4 slots = 20) | 'singleDay'
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [readings, setReadings] = useState([]);
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);
  const [reportRefreshKey, setReportRefreshKey] = useState(0);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDefaultSlot, setFormDefaultSlot] = useState(null);
  const [editingReading, setEditingReading] = useState(null);
  const [deletingReading, setDeletingReading] = useState(null);

  // Toast / Notification banner
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch readings for current user: paginated 20-items (5 days x 4) or single-day
  const fetchReadings = async (overrideParams = {}) => {
    if (!isAuthenticated) return;
    setIsLoadingReadings(true);
    try {
      const targetMode = overrideParams.mode || readingsViewMode;
      const targetDate = overrideParams.date || selectedDate;
      const targetPage = overrideParams.page !== undefined ? overrideParams.page : currentPage;

      if (targetMode === 'paginated') {
        const res = await api.readings.getAll({ page: targetPage, limit: 20 });
        if (res.success) {
          setReadings(res.readings || []);
          setPaginationMeta({
            page: res.page || targetPage,
            limit: res.limit || 20,
            total: res.total !== undefined ? res.total : (res.readings?.length || 0),
            totalPages: res.totalPages || 1,
          });
        }
      } else {
        const res = await api.readings.getAll({ date: targetDate });
        if (res.success) {
          setReadings(res.readings || []);
        }
      }
    } catch (err) {
      console.error('Error fetching readings:', err);
    } finally {
      setIsLoadingReadings(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReadings();
    } else {
      setReadings([]);
    }
  }, [isAuthenticated, selectedDate, readingsViewMode, currentPage]);

  // Reading CRUD Handlers
  const handleOpenAdd = (date = selectedDate, slot = null) => {
    setEditingReading(null);
    setSelectedDate(date);
    setFormDefaultSlot(slot);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (reading) => {
    setEditingReading(reading);
    setFormDefaultSlot(null);
    setIsFormOpen(true);
  };

  const handleSaveReading = async (readingData) => {
    try {
      let savedReading = null;
      if (readingData.id) {
        const res = await api.readings.update(readingData.id, readingData);
        savedReading = res.reading || { ...readingData, id: readingData.id };
        showToast('Glucose reading updated successfully.');
        setReadings((prev) =>
          prev.map((r) => (String(r.id) === String(readingData.id) ? { ...r, ...savedReading } : r))
        );
      } else {
        const res = await api.readings.create(readingData);
        savedReading = res.reading || { ...readingData, id: Date.now() };
        showToast('Glucose reading logged successfully.');
      }

      const targetDate = savedReading?.date || readingData.date;
      setSelectedDate(targetDate);

      // Re-fetch immediately with targeted parameters so view is guaranteed fresh
      if (!readingData.id && readingsViewMode === 'paginated') {
        setCurrentPage(1);
        await fetchReadings({ page: 1, mode: 'paginated' });
      } else if (readingsViewMode === 'singleDay') {
        await fetchReadings({ date: targetDate, mode: 'singleDay' });
      } else {
        await fetchReadings();
      }

      // Automatically refresh Reports section so analytics and charts update immediately
      setReportRefreshKey((prev) => prev + 1);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteReading = async (id) => {
    try {
      // Optimistically remove from state immediately so UI updates with 0 lag
      setReadings((prev) => prev.filter((r) => String(r.id) !== String(id)));
      setPaginationMeta((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      await api.readings.delete(id);
      showToast('Glucose reading removed.', 'info');
      await fetchReadings();
      setReportRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to delete reading:', err);
      await fetchReadings();
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-emerald-600 dark:text-emerald-400">
          <HeartPulse className="h-10 w-10 animate-bounce" />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Loading Sweety Tracker...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-xl border text-sm font-semibold ${toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700'
                : toast.type === 'destructive'
                  ? 'bg-rose-900 text-rose-100 border-rose-700 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700'
                  : 'bg-slate-900 text-slate-100 border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
              }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onOpenNewReading={() => handleOpenAdd(selectedDate)}
      />

      {/* Main Body */}
      <main className="flex-1 w-full">
        {!isAuthenticated ? (
          /* ================= Dynamic & Lively Landing View ================= */
          <div className="relative overflow-hidden bg-mesh-gradient">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-20 pb-16 sm:pb-24">
              <div className="grid lg:grid-cols-12 gap-12 items-center">

                {/* Left Column: Heading, Badges, CTAs */}
                <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200/80 shadow-sm dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Clinically Structured for Type 1 & Type 2 Diabetes
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                    Track Your Blood Glucose with{' '}
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                      Precision & Clarity.
                    </span>
                  </h1>

                  <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    Designed for patients to record up to <strong>4 daily meal-aligned readings</strong> (fasting, breakfast, lunch, dinner), prevent duplicate conflicts, and generate instant <strong>Daily</strong> and <strong>Monthly</strong> medical reports.
                  </p>

                  {/* Dual Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                    <Button
                      size="lg"
                      onClick={() => {
                        setAuthMode('register');
                        setIsAuthOpen(true);
                      }}
                      className="w-full sm:w-auto gap-2 shadow-lg shadow-emerald-600/30 text-base font-semibold px-7"
                    >
                      Start Tracking Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await quickDemoLogin();
                        } catch (e) {
                          setAuthMode('login');
                          setIsAuthOpen(true);
                        }
                      }}
                      className="w-full sm:w-auto gap-2 text-base font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-slate-800"
                    >
                      <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Explore Demo Patient (1-Click)
                    </Button>
                  </div>

                  {/* Trust Indicators */}
                  <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Encrypted & Private</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span>Strict 4-Slot Adherence</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <BarChart3 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span>1-Decimal Precision</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Interactive Preview Card */}
                <div className="lg:col-span-5 relative">
                  {/* Decorative Glow */}
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-xl dark:opacity-30" />

                  {/* Mock Tracker Card */}
                  <div className="relative rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-2xl backdrop-blur-xl transition-all dark:border-slate-800 dark:bg-slate-900/90">
                    {/* Header inside mock */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Today's Log Preview
                        </div>
                        <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                          {formatDisplayDate(getTodayString())}
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        4 / 4 Slots Complete
                      </span>
                    </div>

                    {/* 4 Slots Visual Showcase */}
                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                            <Sunrise className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Morning (fasting)</div>
                            <div className="text-[10px] text-slate-400">Before first meal</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">92</span>{' '}
                          <span className="text-[10px] text-slate-400">mg/dl</span>
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Normal Fasting</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
                            <Coffee className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">After breakfast</div>
                            <div className="text-[10px] text-slate-400">2 hrs post-meal</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">128</span>{' '}
                          <span className="text-[10px] text-slate-400">mg/dl</span>
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">In Range</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                            <Sun className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">After lunch</div>
                            <div className="text-[10px] text-slate-400">2 hrs post-meal</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">135</span>{' '}
                          <span className="text-[10px] text-slate-400">mg/dl</span>
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">In Range</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                            <Moon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">After dinner</div>
                            <div className="text-[10px] text-slate-400">2 hrs post-meal</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">118</span>{' '}
                          <span className="text-[10px] text-slate-400">mg/dl</span>
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">In Range</div>
                        </div>
                      </div>
                    </div>

                    {/* Calculated Daily Average Pill */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Today's Average:</span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                        118.3 mg/dl (Optimal Control)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Key Pillars Section */}
              <div className="mt-20 pt-10 border-t border-slate-200/80 dark:border-slate-800">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Engineered for Complete Clinical Compliance
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Sweety removes the complexity of diabetes tracking while enforcing strict data validation.
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                  <Card className="p-6 transition-all hover:border-emerald-400 hover:shadow-lg dark:hover:border-emerald-600">
                    <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold mb-4">
                      <Clock className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
                      1. Standard 4-Slot Architecture
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Ensures maximum 4 readings per day strictly mapped to fasting and postprandial meals, preventing duplicate slot inputs.
                    </p>
                  </Card>

                  <Card className="p-6 transition-all hover:border-teal-400 hover:shadow-lg dark:hover:border-teal-600">
                    <div className="h-11 w-11 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400 flex items-center justify-center font-bold mb-4">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
                      2. Authoritative Validation
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Rejects future calendar dates, enforces integer limits between 40 and 600 mg/dl, and provides immediate clinical feedback.
                    </p>
                  </Card>

                  <Card className="p-6 transition-all hover:border-sky-400 hover:shadow-lg dark:hover:border-sky-600">
                    <div className="h-11 w-11 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 flex items-center justify-center font-bold mb-4">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
                      3. Multi-Horizon Reporting
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Generates Daily itemized reports, Month-to-Date trends, and previous month statistical overviews rounded accurately to 1 decimal.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= Authenticated Patient Dashboard ================= */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            {/* Offline Interactive Demo Mode Notice if active */}
            {user?.isDemoOffline && (
              <div className="rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-3.5 shadow-sm dark:border-emerald-800 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/40 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Reviewer Demo Mode Active — Pre-seeded with 40 clinical readings across 10 days.</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Full Stack Docker: docker compose up
                  </span>
                </div>
              </div>
            )}

            {/* Patient Header Welcome Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-lg shadow-emerald-700/15">
              <div>
                <div className="flex items-center gap-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" />
                  Patient Blood Glucose Monitor
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                  Hello, {user?.name || 'Patient'}!
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
                  {readingsViewMode === 'paginated'
                    ? `Displaying 5-day paginated log (Page ${paginationMeta.page} of ${paginationMeta.totalPages} • ${paginationMeta.total} total readings)`
                    : `Viewing log for ${formatDisplayDate(selectedDate)} (${readings.length} of 4 slots logged)`}
                </p>
              </div>
            </div>

            {/* Dashboard Primary Navigation Tabs */}
            <div className="flex border-b border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveView('readings')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${activeView === 'readings'
                    ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                <Activity className="h-4 w-4" />
                Readings Log
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-semibold dark:bg-slate-800 dark:text-slate-300">
                  {readings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('reports')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${activeView === 'reports'
                    ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                <FileText className="h-4 w-4" />
                Reports & Analytics
              </button>
            </div>

            {/* View 1: Readings Log (Paginated or Single Day) */}
            {activeView === 'readings' && (
              <div className="animate-in fade-in duration-200">
                <ReadingsList
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  readings={readings}
                  pagination={paginationMeta}
                  onPageChange={(newPage) => setCurrentPage(newPage)}
                  viewMode={readingsViewMode}
                  onToggleViewMode={(newMode) => {
                    setReadingsViewMode(newMode);
                    setCurrentPage(1);
                  }}
                  onAddNew={(date, slot) => handleOpenAdd(date, slot)}
                  onEdit={handleOpenEdit}
                  onDelete={(reading) => setDeletingReading(reading)}
                />
              </div>
            )}

            {/* View 2: Reports Section */}
            {activeView === 'reports' && (
              <div className="animate-in fade-in duration-200">
                <ReportsSection
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  refreshKey={reportRefreshKey}
                  onEditReading={handleOpenEdit}
                  onDeleteReading={(reading) => setDeletingReading(reading)}
                  onAddNewReading={(date) => handleOpenAdd(date)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Enhanced Professional Healthcare Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/95 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            {/* Col 1: Brand & Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  Sweety Tracker
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Empowering patients to maintain optimal glycemic balance through structured daily logging and clinical reporting.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold">All Systems Operational</span>
              </div>
            </div>

            {/* Col 2: Core Features */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
                Tracking Features
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>• 4 Daily Clinical Slots</li>
                <li>• Duplicate Conflict Guard</li>
                <li>• Instant 1-Decimal Stats</li>
                <li>• Month-to-Date Analytics</li>
                <li>• Historical Monthly Review</li>
              </ul>
            </div>

            {/* Col 3: Clinical Targets (ADA Guidelines) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
                Target Guidelines
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>• Fasting: 70–99 mg/dl</li>
                <li>• Post-Meal: &lt;140 mg/dl</li>
                <li>• Elevated: 140–199 mg/dl</li>
                <li>• Hypoglycemia: &lt;70 mg/dl</li>
                <li>• High Alert: ≥200 mg/dl</li>
              </ul>
            </div>

            {/* Col 4: Privacy & Security */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
                Security & Stack
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>• PostgreSQL Isolated DB</li>
                <li>• Bcrypt Password Hashing</li>
                <li>• Stateless JWT Tokens</li>
                <li>• React 18 & Tailwind CSS</li>
                <li>• Node.js & Express REST API</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Medical Disclaimer & Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-2xl leading-relaxed">
              <strong>Medical Disclaimer:</strong> Sweety is a patient self-monitoring and recording utility. It is not a substitute for professional medical diagnosis or personalized insulin dosing advice.
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              © {new Date().getFullYear()} Sweety. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login / Register / Demo) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />

      {/* Add / Edit Reading Modal */}
      <ReadingFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReading(null);
          setFormDefaultSlot(null);
        }}
        onSubmit={handleSaveReading}
        initialData={editingReading}
        defaultDate={selectedDate}
        defaultSlot={formDefaultSlot}
        existingDayReadings={readings}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingReading}
        onClose={() => setDeletingReading(null)}
        reading={deletingReading}
        onConfirm={handleDeleteReading}
      />
    </div>
  );
}
