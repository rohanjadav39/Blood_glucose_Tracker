import React, { useState, useEffect } from 'react';
import {
  Calendar,
  BarChart3,
  CalendarRange,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { formatDisplayDate } from '../utils/dateHelpers';
import { TabsList, TabTrigger } from './ui/Tabs';
import { ReportStatsCards } from './ReportStatsCard';
import { GlucoseTrendsChart } from './GlucoseTrendsChart';
import { MonthlyGlucoseChart } from './MonthlyGlucoseChart';
import { EmptyState } from './EmptyState';
import { ReadingCard } from './ReadingCard';
import { Button } from './ui/Button';

export function ReportsSection({
  selectedDate,
  onDateChange,
  onEditReading,
  onDeleteReading,
  onAddNewReading,
}) {
  const [activeTab, setActiveTab] = useState('daily');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.reports.getOverview(selectedDate);
      if (data.success) {
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedDate]);

  const { daily, monthToDate, monthly } = reportData || {};

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Glucose Analytics & Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time daily, month-to-date, and monthly diabetes reports.
          </p>
        </div>

        {/* Selected Reference Date Picker */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Reference Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchReport}
            isLoading={isLoading}
            className="h-8 w-8 text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
            title="Refresh reports"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex justify-center sm:justify-start">
        <TabsList className="w-full sm:w-auto">
          <TabTrigger
            active={activeTab === 'daily'}
            onClick={() => setActiveTab('daily')}
            icon={Clock}
          >
            Daily Report
          </TabTrigger>
          <TabTrigger
            active={activeTab === 'mtd'}
            onClick={() => setActiveTab('mtd')}
            icon={CalendarRange}
          >
            Month-to-Date
          </TabTrigger>
          <TabTrigger
            active={activeTab === 'monthly'}
            onClick={() => setActiveTab('monthly')}
            icon={Calendar}
          >
            Monthly (Previous Month)
          </TabTrigger>
        </TabsList>
      </div>

      {/* Tab 1: Daily Report */}
      {activeTab === 'daily' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 dark:bg-emerald-950/40 dark:border-emerald-800/60">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Daily Report Range
              </span>
              <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-100 mt-0.5">
                {formatDisplayDate(daily?.range?.startDate || selectedDate)}
              </h3>
            </div>
            <span className="text-xs text-emerald-700 bg-white/80 rounded-md px-2.5 py-1 border border-emerald-200 dark:bg-slate-900/80 dark:text-emerald-300 dark:border-emerald-800">
              {daily?.stats?.count || 0} reading{daily?.stats?.count === 1 ? '' : 's'} recorded
            </span>
          </div>

          {daily?.stats?.hasData ? (
            <>
              {/* Metrics */}
              <ReportStatsCards stats={daily.stats} title="Daily Summary" />

              {/* Glucose Chart */}
              <GlucoseTrendsChart
                readings={daily.readings}
                title={`Daily Slot Readings (${formatDisplayDate(selectedDate)})`}
              />

              {/* Slot Breakdown List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Slot Breakdown for {formatDisplayDate(selectedDate)}
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Highest: {daily.stats.highest} mg/dl • Lowest: {daily.stats.lowest} mg/dl
                  </span>
                </div>
                <div className="grid gap-3">
                  {daily.readings.map((reading) => (
                    <ReadingCard
                      key={reading.id}
                      reading={reading}
                      onEdit={onEditReading}
                      onDelete={onDeleteReading}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title={`No readings recorded for ${formatDisplayDate(selectedDate)}`}
              description="No glucose values were recorded on this day. Add a reading to see the daily average, peak, and lowest values."
              actionLabel="Add Reading"
              onAction={() => onAddNewReading(selectedDate)}
            />
          )}
        </div>
      )}

      {/* Tab 2: Month-to-Date Report */}
      {activeTab === 'mtd' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-xl bg-teal-50/70 border border-teal-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 dark:bg-teal-950/40 dark:border-teal-800/60">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Month-to-Date Range
              </span>
              <h3 className="text-base font-bold text-teal-950 dark:text-teal-100 mt-0.5">
                {formatDisplayDate(monthToDate?.range?.startDate)} –{' '}
                {formatDisplayDate(monthToDate?.range?.endDate)}
              </h3>
            </div>
            <span className="text-xs text-teal-700 bg-white/80 rounded-md px-2.5 py-1 border border-teal-200 dark:bg-slate-900/80 dark:text-teal-300 dark:border-teal-800">
              1st of the month to selected date
            </span>
          </div>

          {monthToDate?.stats?.hasData ? (
            <>
              {/* Metrics */}
              <ReportStatsCards
                stats={monthToDate.stats}
                title="Month-to-Date Summary"
              />

              {/* Monthly Glucose Line Chart */}
              <MonthlyGlucoseChart
                readings={monthToDate.readings || []}
                title="Month-to-Date Glucose Curve"
                subtitle="Daily variations and slot readings from 1st of month to selected date"
                periodLabel="Month-to-Date"
              />

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2">
                  Month-to-Date Insights
                </h4>
                <div className="grid sm:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div className="font-semibold text-slate-500 dark:text-slate-400">Average Control</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {monthToDate.stats.average} mg/dl
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Target: &lt;140 mg/dl
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div className="font-semibold text-slate-500 dark:text-slate-400">Peak Fluctuation</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {monthToDate.stats.highest - monthToDate.stats.lowest} mg/dl
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Spread between min & max
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div className="font-semibold text-slate-500 dark:text-slate-400">Logging Consistency</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {monthToDate.stats.count} readings
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Across current calendar month
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="No readings found in Month-to-Date period"
              description={`No blood glucose readings have been recorded between ${formatDisplayDate(
                monthToDate?.range?.startDate
              )} and ${formatDisplayDate(monthToDate?.range?.endDate)}.`}
              actionLabel="Add Glucose Reading"
              onAction={() => onAddNewReading(selectedDate)}
            />
          )}
        </div>
      )}

      {/* Tab 3: Monthly (Whole Previous Month) */}
      {activeTab === 'monthly' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-xl bg-sky-50/70 border border-sky-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 dark:bg-sky-950/40 dark:border-sky-800/60">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                Monthly Report (Previous Month)
              </span>
              <h3 className="text-base font-bold text-sky-950 dark:text-emerald-100 mt-0.5">
                {formatDisplayDate(monthly?.range?.startDate)} –{' '}
                {formatDisplayDate(monthly?.range?.endDate)}
              </h3>
            </div>
            <span className="text-xs text-sky-700 bg-white/80 rounded-md px-2.5 py-1 border border-sky-200 dark:bg-slate-900/80 dark:text-sky-300 dark:border-sky-800">
              Whole previous month ({monthly?.range?.previousMonthName || 'Previous Month'})
            </span>
          </div>

          {monthly?.stats?.hasData ? (
            <>
              {/* Metrics */}
              <ReportStatsCards
                stats={monthly.stats}
                title="Previous Month Summary"
              />

              {/* Monthly Glucose Line Chart */}
              <MonthlyGlucoseChart
                readings={monthly.readings || []}
                title={`Previous Month Trend (${monthly?.range?.previousMonthName || 'Monthly'})`}
                subtitle="Complete daily distribution and glycemic trend across the entire previous month"
                periodLabel={monthly?.range?.previousMonthName || 'Previous Month'}
              />

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2">
                  Monthly Performance Overview ({monthly?.range?.previousMonthName})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  This report summarizes all blood glucose readings recorded across the entire previous month.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div className="font-semibold text-slate-500 dark:text-slate-400">Overall Average</div>
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                      {monthly.stats.average} mg/dl
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Rounded to 1 decimal place
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div className="font-semibold text-slate-500 dark:text-slate-400">Total Month Samples</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {monthly.stats.count} readings
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Highest: {monthly.stats.highest} mg/dl • Lowest: {monthly.stats.lowest} mg/dl
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="No readings found for the previous month"
              description={`No blood glucose data was logged between ${formatDisplayDate(
                monthly?.range?.startDate
              )} and ${formatDisplayDate(monthly?.range?.endDate)}.`}
              actionLabel="Add Reading for Previous Month"
              onAction={() => onAddNewReading(monthly?.range?.startDate)}
            />
          )}
        </div>
      )}
    </div>
  );
}
