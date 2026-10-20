import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Pencil,
  Trash2,
} from 'lucide-react';
import { StudyTask, TaskPriority, TaskStatus, TimeBlockPeriod } from '../types/edusphere';

interface StudyPlannerCalendarProps {
  tasks: StudyTask[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleTaskStatus: (id: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onOpenNewTaskModal: (date: string) => void;
  onLogFocusMinutes: (minutes: number) => void;
  isDark: boolean;
}

const TIME_PERIODS: { label: TimeBlockPeriod; window: string }[] = [
  { label: 'Morning', window: '06:00 – 12:00' },
  { label: 'Midday', window: '12:00 – 14:00' },
  { label: 'Afternoon', window: '14:00 – 18:00' },
  { label: 'Evening', window: '18:00 – 23:00' },
];

/**
 * Interactive Daily Study Planner & Monthly Calendar View.
 * Allows students to click any date on the calendar, inspect time-blocked sessions
 * (Morning, Midday, Afternoon, Evening), and run an integrated Focus Timer.
 */
export const StudyPlannerCalendar: React.FC<StudyPlannerCalendarProps> = ({
  tasks,
  selectedDate,
  onSelectDate,
  onToggleTaskStatus,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskModal,
  onLogFocusMinutes,
  isDark,
}) => {
  // Parse selectedDate (YYYY-MM-DD) for month navigation
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return new Date(y || 2026, (m || 10) - 1, 1);
  });

  // Focus Study Timer state (25 min Pomodoro default)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onLogFocusMinutes(25);
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, onLogFocusMinutes]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (string | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push(iso);
  }

  const tasksForSelectedDate = tasks
    .filter((t) => t.dueDate === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalScheduledMinutes = tasksForSelectedDate.reduce((acc, t) => acc + t.durationMinutes, 0);
  const completedForDay = tasksForSelectedDate.filter((t) => t.status === TaskStatus.COMPLETED).length;

  const activeFocusTask = tasks.find((t) => t.id === activeFocusTaskId) || tasksForSelectedDate[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 5 Cols: Interactive Monthly Calendar & Focus Session Timer */}
      <div className="lg:col-span-5 space-y-6">
        {/* Monthly Calendar Card */}
        <div
          className={`rounded-2xl border p-5 ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold tracking-tight">{monthName}</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Select a day to view or schedule study blocks
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))}
                aria-label="Previous month"
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDark
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))}
                aria-label="Next month"
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDark
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className={`text-[11px] font-semibold py-1 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((isoDate, idx) => {
              if (!isoDate) {
                return <div key={`empty-${idx}`} className="h-10" />;
              }
              const dayNumber = parseInt(isoDate.split('-')[2], 10);
              const dayTasks = tasks.filter((t) => t.dueDate === isoDate);
              const isSelected = isoDate === selectedDate;
              const hasHighPriority = dayTasks.some(
                (t) => t.priority === TaskPriority.HIGH && t.status === TaskStatus.PENDING
              );
              const allDone =
                dayTasks.length > 0 && dayTasks.every((t) => t.status === TaskStatus.COMPLETED);

              return (
                <button
                  key={isoDate}
                  type="button"
                  onClick={() => onSelectDate(isoDate)}
                  className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-colors font-mono text-xs tabular-nums cursor-pointer ${
                    isSelected
                      ? 'bg-[#6C5DD3] text-white font-bold'
                      : isDark
                      ? 'hover:bg-slate-800/80 text-slate-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span>{dayNumber}</span>
                  {dayTasks.length > 0 && (
                    <span
                      className={`text-[9px] leading-none mt-0.5 font-sans font-semibold ${
                        isSelected
                          ? 'text-white/90'
                          : allDone
                          ? 'text-emerald-500'
                          : hasHighPriority
                          ? 'text-[#FF754C]'
                          : 'text-[#6C5DD3]'
                      }`}
                    >
                      {dayTasks.length}t
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Study Focus Timer Card */}
        <div
          className={`rounded-2xl border p-5 ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight">EduSphere Focus Session Timer</h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeFocusTask
                  ? `Focusing on: ${activeFocusTask.title}`
                  : 'Select a study task to time your session'}
              </p>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 flex items-center justify-between ${
              isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <div className="text-3xl font-extrabold font-mono tabular-nums tracking-tight text-[#6C5DD3]">
                {formatTimer(timerSeconds)}
              </div>
              <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Pomodoro Study Block · 25m Sprint
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRunning((prev) => !prev)}
                className="px-4 py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4cc4] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isRunning ? 'Pause' : 'Start Focus'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                aria-label="Reset focus timer"
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right 7 Cols: Daily Time-Blocked Study Planner */}
      <div
        className={`lg:col-span-7 rounded-2xl border p-6 ${
          isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold tracking-tight">
              Daily Study Planner · <span className="font-mono tabular-nums">{selectedDate}</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="font-mono tabular-nums">{tasksForSelectedDate.length}</span> sessions
              scheduled ·{' '}
              <span className="font-mono tabular-nums">
                {(totalScheduledMinutes / 60).toFixed(1)}h
              </span>{' '}
              total study time ·{' '}
              <span className="font-mono tabular-nums">
                {completedForDay}/{tasksForSelectedDate.length}
              </span>{' '}
              completed
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenNewTaskModal(selectedDate)}
            className="px-4 py-2 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4cc4] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule Session
          </button>
        </div>

        {/* Time-Blocked Timeline */}
        <div className="mt-5 space-y-5">
          {TIME_PERIODS.map((block) => {
            const periodTasks = tasksForSelectedDate.filter((t) => t.period === block.label);
            return (
              <div key={block.label} className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold tracking-tight">{block.label} Session</span>
                  <span className={`font-mono tabular-nums ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {block.window}
                  </span>
                </div>

                {periodTasks.length === 0 ? (
                  <div
                    className={`rounded-xl border border-dashed px-4 py-3 text-xs flex items-center justify-between ${
                      isDark
                        ? 'border-slate-800/80 text-slate-500 bg-[#0B0F19]/40'
                        : 'border-slate-200 text-slate-400 bg-slate-50/50'
                    }`}
                  >
                    <span>No study tasks scheduled in this window</span>
                    <button
                      type="button"
                      onClick={() => onOpenNewTaskModal(selectedDate)}
                      className="text-[#6C5DD3] font-semibold hover:underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      + Add slot
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {periodTasks.map((task) => {
                      const isDone = task.status === TaskStatus.COMPLETED;
                      return (
                        <div
                          key={task.id}
                          className={`rounded-xl border p-3.5 transition-colors flex items-start justify-between gap-3 ${
                            isDark
                              ? 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => onToggleTaskStatus(task.id)}
                              aria-label={`Mark "${task.title}" as ${isDone ? 'pending' : 'completed'}`}
                              className="mt-0.5 text-[#6C5DD3] hover:scale-105 transition-transform shrink-0 cursor-pointer"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-400" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-semibold ${
                                    isDone ? 'line-through opacity-60' : ''
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>
                              <p
                                className={`text-xs mt-0.5 line-clamp-1 ${
                                  isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                {task.description}
                              </p>

                              {/* Clean unboxed metadata with middle-dot separators */}
                              <div
                                className={`flex flex-wrap items-center gap-2 text-xs mt-2 ${
                                  isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#6C5DD3] font-medium">
                                  <Clock className="w-3 h-3" />
                                  {task.startTime} – {task.endTime} ({task.durationMinutes}m)
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{task.courseTitle}</span>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={
                                    task.priority === TaskPriority.HIGH
                                      ? 'text-[#FF754C] font-semibold'
                                      : task.priority === TaskPriority.MEDIUM
                                      ? 'text-[#F59E0B] font-semibold'
                                      : 'text-slate-400'
                                  }
                                >
                                  {task.priority} Priority
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveFocusTaskId(task.id);
                                setIsRunning(true);
                              }}
                              title="Start focus timer for this task"
                              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                isDark
                                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                              }`}
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              aria-label="Edit task"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark
                                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                              }`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task.id)}
                              aria-label="Delete task"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark
                                  ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800'
                                  : 'text-slate-500 hover:text-red-600 hover:bg-slate-200/70'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
