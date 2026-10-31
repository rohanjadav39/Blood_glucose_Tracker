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

  // Navigation & state
  const [activeView, setActiveView] = useState('readings'); // 'readings' | 'reports'
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [readings, setReadings] = useState([]);
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [deletingReading, setDeletingReading] = useState(null);

  // Toast / Notification banner
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch readings for current user and selectedDate
  const fetchReadings = async () => {
    if (!isAuthenticated) return;
    setIsLoadingReadings(true);
    try {
      const res = await api.readings.getAll({ date: selectedDate });
      if (res.success) {
        setReadings(res.readings || []);
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
  }, [isAuthenticated, selectedDate]);

  // Reading CRUD Handlers
  const handleOpenAdd = (date = selectedDate, prefillSlot = null) => {
    setEditingReading(null);
    setSelectedDate(date);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (reading) => {
    setEditingReading(reading);
    setIsFormOpen(true);
  };

  const handleSaveReading = async (readingData) => {
    try {
      if (readingData.id) {
        await api.readings.update(readingData.id, readingData);
        showToast('Glucose reading updated successfully.');
      } else {
        await api.readings.create(readingData);
        showToast('Glucose reading logged successfully.');
      }
      await fetchReadings();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteReading = async (id) => {
    try {
      await api.readings.delete(id);
      showToast('Glucose reading removed.', 'info');
      await fetchReadings();
    } catch (err) {
      console.error('Failed to delete reading:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-emerald-600">
          <HeartPulse className="h-10 w-10 animate-bounce" />
          <span className="text-sm font-semibold text-slate-600">
            Loading Sweety Tracker...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-xl border text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toast.type === 'destructive'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
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
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onOpenNewReading={() => handleOpenAdd(selectedDate)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!isAuthenticated ? (
          /* ================= Guest / Landing View ================= */
          <div className="max-w-4xl mx-auto py-8 sm:py-16">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-sm">
                <HeartPulse className="h-4 w-4 text-emerald-600" />
                Smart Diabetes Glucose Monitoring
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                Track Your Blood Glucose with Precision & Peace of Mind.
              </h1>
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
                Log up to 4 daily readings (fasting, breakfast, lunch, and dinner) and generate automated daily and monthly reports with medical-grade validation.
              </p>

              {/* CTAs */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => {
                    setAuthMode('register');
                    setIsAuthOpen(true);
                  }}
                  className="w-full sm:w-auto gap-2 shadow-lg shadow-emerald-600/25 text-base"
                >
                  Create Free Account
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
                  className="w-full sm:w-auto gap-2 text-base border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Explore Demo Patient (1-Click)
                </Button>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="mt-16 grid sm:grid-cols-3 gap-6">
              <Card className="p-6 border-slate-200/80 hover:border-emerald-300 transition-all shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  4 Daily Fixed Slots
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Record Morning (fasting), After breakfast, After lunch, and After dinner readings with zero duplicate slot conflicts.
                </p>
              </Card>

              <Card className="p-6 border-slate-200/80 hover:border-emerald-300 transition-all shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  Strict Clinical Validation
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Prevents future dates, ensures whole numbers between 40 and 600 mg/dl, and limits to maximum 4 readings per day.
                </p>
              </Card>

              <Card className="p-6 border-slate-200/80 hover:border-emerald-300 transition-all shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  Comprehensive Reports
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Instant calculation of highest, lowest, and average readings rounded to 1 decimal place across daily, month-to-date, and previous month ranges.
                </p>
              </Card>
            </div>
          </div>
        ) : (
          /* ================= Authenticated Patient Dashboard ================= */
          <div className="space-y-6">
            {/* Patient Header Welcome Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-lg shadow-emerald-700/15">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4" />
                    Patient Blood Glucose Monitor
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                    Hello, {user?.name || 'Patient'}!
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
                    Viewing log for{' '}
                    <span className="font-bold underline">
                      {formatDisplayDate(selectedDate)}
                    </span>
                    . {readings.length} of 4 daily slots recorded.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    onClick={() => handleOpenAdd(selectedDate)}
                    variant="secondary"
                    className="gap-2 bg-white text-emerald-800 hover:bg-emerald-50 shadow font-semibold"
                  >
                    <PlusCircle className="h-4 w-4 text-emerald-700" />
                    Log Reading
                  </Button>
                </div>
              </div>
            </div>

            {/* Dashboard Primary Navigation Tabs */}
            <div className="flex border-b border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveView('readings')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                  activeView === 'readings'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Activity className="h-4 w-4" />
                Daily Readings Log
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-semibold">
                  {readings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('reports')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                  activeView === 'reports'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <FileText className="h-4 w-4" />
                Reports & Analytics
              </button>
            </div>

            {/* View 1: Daily Readings CRUD */}
            {activeView === 'readings' && (
              <div className="animate-in fade-in duration-200">
                <ReadingsList
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  readings={readings}
                  onAddNew={(date, prefillSlot) => handleOpenAdd(date, prefillSlot)}
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
                  onEditReading={handleOpenEdit}
                  onDeleteReading={(reading) => setDeletingReading(reading)}
                  onAddNewReading={(date) => handleOpenAdd(date)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Sweety Tracker</span>
            <span>– Blood Glucose Monitoring System</span>
          </div>
          <div>
            Built with Node.js, Express, PostgreSQL & React (Shadcn UI)
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
        }}
        onSubmit={handleSaveReading}
        initialData={editingReading}
        defaultDate={selectedDate}
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
