/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar as CalendarIcon,
  BarChart3,
  BookOpen,
  Plus,
  Search,
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Clock,
  RotateCcw,
  Code2,
  ArrowUpDown,
  Undo2,
  GraduationCap,
} from 'lucide-react';
import {
  ActiveNavTab,
  CourseItem,
  DailyStudyLog,
  StudyTask,
  TaskFilterState,
  TaskPriority,
  TaskStatus,
} from './types/edusphere';
import {
  getFormattedDateOffset,
  INITIAL_COURSES,
  INITIAL_TASKS,
  INITIAL_WEEKLY_LOGS,
} from './data/initialData';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TaskModal } from './components/TaskModal';
import { ProgressCharts } from './components/ProgressCharts';
import { StudyPlannerCalendar } from './components/StudyPlannerCalendar';
import { ArchitectureGuideModal } from './components/ArchitectureGuideModal';

export default function App() {
  // 1. Persistent state stored in browser localStorage
  const [tasks, setTasks] = useLocalStorage<StudyTask[]>('edusphere_tasks_v1', INITIAL_TASKS);
  const [courses, setCourses] = useLocalStorage<CourseItem[]>(
    'edusphere_courses_v1',
    INITIAL_COURSES
  );
  const [weeklyLogs, setWeeklyLogs] = useLocalStorage<DailyStudyLog[]>(
    'edusphere_weekly_logs_v1',
    INITIAL_WEEKLY_LOGS
  );
  const [isDark, setIsDark] = useLocalStorage<boolean>('edusphere_theme_dark_v1', true);

  // 2. Navigation & UI state
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(() => getFormattedDateOffset(0));
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [isArchGuideOpen, setIsArchGuideOpen] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState<StudyTask | null>(null);

  // Quick-add inline input state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [quickCourseId, setQuickCourseId] = useState<string>(INITIAL_COURSES[0].id);

  // 3. Filter & Sort state for tasks (Pending, Completed, Priority, Course, Search)
  const [filters, setFilters] = useState<TaskFilterState>({
    status: 'All',
    priority: 'All',
    courseId: 'All',
    searchQuery: '',
    sortBy: 'dueDate',
  });

  // 4. Derived Dashboard Metrics (Total, Completed, Pending, Completion %, Weekly Hours)
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const pending = total - completed;
    const highPriorityPending = tasks.filter(
      (t) => t.status === TaskStatus.PENDING && t.priority === TaskPriority.HIGH
    ).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalWeeklyHours = weeklyLogs.reduce((sum, item) => sum + item.studyHours, 0);

    return {
      total,
      completed,
      pending,
      highPriorityPending,
      completionPct,
      totalWeeklyHours: totalWeeklyHours.toFixed(1),
    };
  }, [tasks, weeklyLogs]);

  // 5. Filtered & Sorted Tasks Pipeline
  const filteredTasks = useMemo(() => {
    const priorityRank: Record<TaskPriority, number> = {
      [TaskPriority.HIGH]: 3,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 1,
    };

    return tasks
      .filter((task) => {
        if (filters.status !== 'All' && task.status !== filters.status) return false;
        if (filters.priority !== 'All' && task.priority !== filters.priority) return false;
        if (filters.courseId !== 'All' && task.courseId !== filters.courseId) return false;
        if (filters.searchQuery.trim() !== '') {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description.toLowerCase().includes(q);
          const matchCourse = task.courseTitle.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCourse) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'priority') {
          return priorityRank[b.priority] - priorityRank[a.priority];
        }
        if (filters.sortBy === 'duration') {
          return b.durationMinutes - a.durationMinutes;
        }
        // Default: sort by dueDate + startTime
        const dateCompare = a.dueDate.localeCompare(b.dueDate);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [tasks, filters]);

  // 6. Task CRUD Handlers
  const handleSaveTask = (
    taskData: Omit<StudyTask, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === existingId ? { ...t, ...taskData } : t))
      );
    } else {
      const newTask: StudyTask = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: getFormattedDateOffset(0),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const selectedCourse =
      courses.find((c) => c.id === quickCourseId) || courses[0];

    const newTask: StudyTask = {
      id: `task-${Date.now()}`,
      title: quickTitle.trim(),
      description: `Focused study block for ${selectedCourse.title}`,
      courseId: selectedCourse.id,
      courseTitle: selectedCourse.title,
      priority: quickPriority,
      status: TaskStatus.PENDING,
      dueDate: selectedDate,
      startTime: '11:00',
      endTime: '12:00',
      durationMinutes: 60,
      period: 'Morning',
      createdAt: getFormattedDateOffset(0),
    };
    setTasks((prev) => [newTask, ...prev]);
    setQuickTitle('');
  };

  const handleToggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const nextStatus =
          task.status === TaskStatus.COMPLETED
            ? TaskStatus.PENDING
            : TaskStatus.COMPLETED;
        return { ...task, status: nextStatus };
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (target) {
      setRecentlyDeleted(target);
    }
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleUndoDelete = () => {
    if (!recentlyDeleted) return;
    setTasks((prev) => [recentlyDeleted, ...prev]);
    setRecentlyDeleted(null);
  };

  const handleOpenCreateModal = (date?: string) => {
    setEditingTask(null);
    setModalDefaultDate(date || selectedDate);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: StudyTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleIncrementCourseLesson = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const nextCompleted =
          c.completedLessons < c.totalLessons
            ? c.completedLessons + 1
            : c.completedLessons;
        return {
          ...c,
          completedLessons: nextCompleted,
          weeklyHours: Number((c.weeklyHours + 0.5).toFixed(1)),
        };
      })
    );
  };

  const handleLogFocusMinutes = (minutes: number) => {
    const addedHours = Number((minutes / 60).toFixed(2));
    setWeeklyLogs((prev) =>
      prev.map((item, idx) =>
        idx === prev.length - 2
          ? {
              ...item,
              studyHours: Number((item.studyHours + addedHours).toFixed(1)),
              completedTasks: item.completedTasks + 1,
            }
          : item
      )
    );
  };

  const handleResetDemoData = () => {
    setTasks(INITIAL_TASKS);
    setCourses(INITIAL_COURSES);
    setWeeklyLogs(INITIAL_WEEKLY_LOGS);
    setRecentlyDeleted(null);
    setFilters({
      status: 'All',
      priority: 'All',
      courseId: 'All',
      searchQuery: '',
      sortBy: 'dueDate',
    });
  };

  const navItems: { id: ActiveNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'tasks', label: 'Study Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'planner', label: 'Daily Planner', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'analytics', label: 'Progress Charts', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-150 ${
        isDark ? 'dark bg-[#0B0F19] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Left Sidebar Navigation (260px fixed width on desktop) */}
      <aside
        className={`w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col justify-between p-5 ${
          isDark ? 'bg-[#111827] border-slate-800/90' : 'bg-white border-slate-200'
        }`}
      >
        <div>
          {/* EduSphere Brand Identity */}
          <div className="flex items-center justify-between lg:justify-start gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#6C5DD3] flex items-center justify-center text-white shadow-xs shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight whitespace-nowrap shrink-0">
                EduSphere
              </span>
            </div>

            {/* Mobile Quick Action */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                aria-label="Toggle color theme"
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-slate-800 bg-[#0B0F19] text-amber-400'
                    : 'border-slate-200 bg-slate-100 text-slate-700'
                }`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="px-3 py-2 rounded-xl bg-[#6C5DD3] text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                + New Task
              </button>
            </div>
          </div>

          {/* Primary Navigation Links */}
          <nav className="mt-5 flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#6C5DD3] text-white'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'tasks' && (
                    <span
                      className={`font-mono text-[11px] tabular-nums ml-2 ${
                        active
                          ? 'text-white/90'
                          : isDark
                          ? 'text-slate-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {metrics.pending}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Enrolled Course Progress Mini-List in Sidebar (Desktop) */}
          <div className="hidden lg:block mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-xs font-bold tracking-tight ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Active Tracks
              </span>
              <span
                className={`text-[11px] font-mono tabular-nums ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {courses.length} courses
              </span>
            </div>
            <div className="space-y-3">
              {courses.map((course) => {
                const pct = Math.round(
                  (course.completedLessons / course.totalLessons) * 100
                );
                return (
                  <div key={course.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[155px] font-medium">
                        {course.title}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums opacity-75">
                        {pct}%
                      </span>
                    </div>
                    <div
                      className={`h-1.5 w-full rounded-full overflow-hidden ${
                        isDark ? 'bg-slate-800' : 'bg-slate-100'
                      }`}
                    >
                      <div
                        className="h-full rounded-full transition-transform duration-200"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: course.accentColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Sidebar Controls: Architecture Guide, Theme Switcher & Demo Reset */}
        <div className="hidden lg:flex flex-col gap-2 pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsArchGuideOpen(true)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:border-[#6C5DD3]'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#6C5DD3]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#6C5DD3]" />
              <span>Architecture Guide</span>
            </span>
            <span className="text-[11px] text-[#6C5DD3]">Docs</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-[#0B0F19] border-slate-800 text-slate-200 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#6C5DD3]" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetDemoData}
              title="Reset tasks and study logs to default seed data"
              aria-label="Reset demo data"
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Header adhering to SaaS Top Bar Contract */}
        <header
          className={`hidden lg:flex items-center justify-between gap-8 px-8 py-4 border-b ${
            isDark ? 'bg-[#111827]/80 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Zone 1: Contextual Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              EduSphere Workspace
            </span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
            <span className="font-bold tracking-tight capitalize">
              {activeTab === 'dashboard'
                ? 'Student Learning Dashboard'
                : activeTab === 'tasks'
                ? 'Study Task Manager'
                : activeTab === 'planner'
                ? 'Daily Study Planner & Calendar'
                : activeTab === 'analytics'
                ? 'Learning Progress Analytics'
                : 'Enrolled Courses'}
            </span>
          </div>

          {/* Zone 2: Quick Global Task Search */}
          <div className="relative w-72">
            <Search
              className={`w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              placeholder="Search study tasks or courses..."
              className={`w-full pl-9 pr-3.5 py-1.5 rounded-xl border text-xs outline-none transition-colors ${
                isDark
                  ? 'bg-[#0B0F19] border-slate-800 text-slate-100 focus:border-[#6C5DD3]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#6C5DD3] focus:bg-white'
              }`}
            />
          </div>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4cc4] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Study Task
            </button>
          </div>
        </header>

        {/* Undo Toast Notification when a task is deleted */}
        {recentlyDeleted && (
          <div className="mx-6 lg:mx-8 mt-4 p-3 rounded-xl bg-[#6C5DD3]/15 border border-[#6C5DD3]/40 flex items-center justify-between text-xs">
            <span>
              Deleted task <strong>"{recentlyDeleted.title}"</strong> from storage.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleUndoDelete}
                className="font-semibold text-[#6C5DD3] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo Delete
              </button>
              <button
                type="button"
                onClick={() => setRecentlyDeleted(null)}
                className="opacity-60 hover:opacity-100 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Viewport Content */}
        <main className="flex-1 p-5 lg:p-8 space-y-8 max-w-[1440px] w-full mx-auto">
          {/* 4-Column KPI Summary Strip (Total Tasks, Completed Tasks, Pending Tasks, Study Velocity) */}
          <section aria-label="Task and learning metrics">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* KPI 1: Total Tasks */}
              <div
                onClick={() => {
                  setFilters((prev) => ({ ...prev, status: 'All' }));
                }}
                className={`rounded-2xl border p-5 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#111827] border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Total Study Tasks
                  </span>
                  <span className="text-xs font-semibold text-[#6C5DD3]">All Modules</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold font-mono tabular-nums">
                    {metrics.total}
                  </span>
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {courses.length} active courses
                  </span>
                </div>
              </div>

              {/* KPI 2: Completed Tasks */}
              <div
                onClick={() => {
                  setFilters((prev) => ({ ...prev, status: TaskStatus.COMPLETED }));
                }}
                className={`rounded-2xl border p-5 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#111827] border-slate-800 hover:border-emerald-500/50'
                    : 'bg-white border-slate-200 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Completed Tasks
                  </span>
                  <span className="text-xs font-semibold text-emerald-500">
                    {metrics.completionPct}% Done
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-emerald-500">
                    {metrics.completed}
                  </span>
                  <span
                    className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    Click to filter completed
                  </span>
                </div>
              </div>

              {/* KPI 3: Pending Tasks */}
              <div
                onClick={() => {
                  setFilters((prev) => ({ ...prev, status: TaskStatus.PENDING }));
                }}
                className={`rounded-2xl border p-5 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#111827] border-slate-800 hover:border-[#FF754C]/50'
                    : 'bg-white border-slate-200 hover:border-[#FF754C]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Pending Tasks
                  </span>
                  <span className="text-xs font-semibold text-[#FF754C]">
                    {metrics.highPriorityPending} High Priority
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-[#FF754C]">
                    {metrics.pending}
                  </span>
                  <span
                    className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    Click to filter pending
                  </span>
                </div>
              </div>

              {/* KPI 4: Weekly Focused Study Hours */}
              <div
                onClick={() => setActiveTab('analytics')}
                className={`rounded-2xl border p-5 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#111827] border-slate-800 hover:border-[#F59E0B]/50'
                    : 'bg-white border-slate-200 hover:border-[#F59E0B]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Weekly Study Hours
                  </span>
                  <span className="text-xs font-semibold text-[#F59E0B]">
                    Goal: 32.0h
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-[#F59E0B]">
                    {metrics.totalWeeklyHours}h
                  </span>
                  <span
                    className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    Persisted in localStorage
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* TAB 1: OVERVIEW DASHBOARD (Shows Task Manager + Progress Charts + Daily Study Planner) */}
          {(activeTab === 'dashboard' || activeTab === 'tasks') && (
            <section
              aria-label="Study Task Management and Filtering"
              className={`rounded-2xl border p-6 ${
                isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              {/* Section Header + Segmented Status & Priority Filters */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    Study Tasks & Assignment Queue
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Add, edit, complete, and filter study tasks by status, priority, or course
                  </p>
                </div>

                {/* Interactive Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Status Segmented Control: All | Pending | Completed */}
                  <div
                    className={`flex items-center gap-1 p-1 rounded-xl border ${
                      isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {(['All', TaskStatus.PENDING, TaskStatus.COMPLETED] as const).map((st) => {
                      const active = filters.status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setFilters((prev) => ({ ...prev, status: st }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-[#6C5DD3] text-white'
                              : isDark
                              ? 'text-slate-400 hover:text-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st === 'All' ? `All (${metrics.total})` : st}
                        </button>
                      );
                    })}
                  </div>

                  {/* Priority Segmented Control: All | High | Medium | Low */}
                  <div
                    className={`flex items-center gap-1 p-1 rounded-xl border ${
                      isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {(
                      [
                        'All',
                        TaskPriority.HIGH,
                        TaskPriority.MEDIUM,
                        TaskPriority.LOW,
                      ] as const
                    ).map((prio) => {
                      const active = filters.priority === prio;
                      return (
                        <button
                          key={prio}
                          type="button"
                          onClick={() => setFilters((prev) => ({ ...prev, priority: prio }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? prio === TaskPriority.HIGH
                                ? 'bg-[#FF754C] text-white'
                                : prio === TaskPriority.MEDIUM
                                ? 'bg-[#F59E0B] text-slate-950'
                                : 'bg-[#6C5DD3] text-white'
                              : isDark
                              ? 'text-slate-400 hover:text-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {prio === 'All' ? 'All Priorities' : prio}
                        </button>
                      );
                    })}
                  </div>

                  {/* Course Filter Select */}
                  <select
                    aria-label="Filter by course"
                    value={filters.courseId}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, courseId: e.target.value }))
                    }
                    className={`rounded-xl border px-3 py-2 text-xs font-medium outline-none ${
                      isDark
                        ? 'bg-[#0B0F19] border-slate-800 text-slate-200'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="All">All Courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>

                  {/* Sort Order Selector */}
                  <div className="relative inline-flex items-center">
                    <ArrowUpDown
                      className={`w-3.5 h-3.5 absolute left-3 pointer-events-none ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    />
                    <select
                      aria-label="Sort tasks by"
                      value={filters.sortBy}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          sortBy: e.target.value as TaskFilterState['sortBy'],
                        }))
                      }
                      className={`pl-8 pr-3 py-2 rounded-xl border text-xs font-medium outline-none ${
                        isDark
                          ? 'bg-[#0B0F19] border-slate-800 text-slate-200'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <option value="dueDate">Sort: Due Date</option>
                      <option value="priority">Sort: Priority</option>
                      <option value="duration">Sort: Duration</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Inline Task Creator Bar */}
              <form
                onSubmit={handleQuickAddTask}
                className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Quick add a study task for today (or press 'Add Study Task' for full options)..."
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-xs outline-none transition-colors ${
                    isDark
                      ? 'bg-[#0B0F19] border-slate-800 text-slate-100 focus:border-[#6C5DD3]'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#6C5DD3] focus:bg-white'
                  }`}
                />
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Quick add course"
                    value={quickCourseId}
                    onChange={(e) => setQuickCourseId(e.target.value)}
                    className={`rounded-xl border px-3 py-2.5 text-xs outline-none ${
                      isDark
                        ? 'bg-[#0B0F19] border-slate-800 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Quick add priority"
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
                    className={`rounded-xl border px-3 py-2.5 text-xs outline-none ${
                      isDark
                        ? 'bg-[#0B0F19] border-slate-800 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value={TaskPriority.HIGH}>High Priority</option>
                    <option value={TaskPriority.MEDIUM}>Medium Priority</option>
                    <option value={TaskPriority.LOW}>Low Priority</option>
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4cc4] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    + Quick Add
                  </button>
                </div>
              </form>

              {/* Task List Rows */}
              <div className="mt-5 space-y-2.5">
                {filteredTasks.length === 0 ? (
                  <div
                    className={`rounded-2xl border border-dashed p-10 text-center ${
                      isDark
                        ? 'border-slate-800 bg-[#0B0F19]/40 text-slate-400'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      No study tasks match your active filter criteria
                    </p>
                    <p className="text-xs mt-1">
                      Try clearing your filters or create a new study task to get started.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFilters({
                            status: 'All',
                            priority: 'All',
                            courseId: 'All',
                            searchQuery: '',
                            sortBy: 'dueDate',
                          })
                        }
                        className={`px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                          isDark
                            ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                            : 'border-slate-300 text-slate-700 hover:bg-white'
                        }`}
                      >
                        Reset Filters
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateModal()}
                        className="px-4 py-2 rounded-xl bg-[#6C5DD3] text-white text-xs font-semibold cursor-pointer"
                      >
                        + Create Task
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const isCompleted = task.status === TaskStatus.COMPLETED;
                    return (
                      <div
                        key={task.id}
                        className={`rounded-xl border px-4 py-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDark
                            ? 'bg-[#0B0F19] border-slate-800/90 hover:border-slate-700'
                            : 'bg-slate-50/60 border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task.id)}
                            aria-label={`Mark "${task.title}" as ${
                              isCompleted ? 'pending' : 'completed'
                            }`}
                            className="mt-0.5 text-[#6C5DD3] hover:scale-105 transition-transform shrink-0 cursor-pointer"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-semibold ${
                                  isCompleted ? 'line-through opacity-60' : ''
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

                            {/* Unboxed Metadata Line with middle-dot separators */}
                            <div
                              className={`flex flex-wrap items-center gap-2 text-xs mt-2 ${
                                isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              <span className="font-medium text-[#6C5DD3]">
                                {task.courseTitle}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                Due {task.dueDate}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                <Clock className="w-3 h-3" />
                                {task.startTime}–{task.endTime} ({task.durationMinutes}m)
                              </span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  task.priority === TaskPriority.HIGH
                                    ? 'text-[#FF754C] font-semibold'
                                    : task.priority === TaskPriority.MEDIUM
                                    ? 'text-[#F59E0B] font-semibold'
                                    : 'text-slate-400 font-medium'
                                }
                              >
                                {task.priority} Priority
                              </span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  isCompleted
                                    ? 'text-emerald-500 font-semibold'
                                    : 'text-slate-400'
                                }
                              >
                                {task.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Toggle Status, Edit, Delete */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              isCompleted
                                ? isDark
                                  ? 'border-slate-800 text-slate-400 hover:bg-slate-800'
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            }`}
                          >
                            {isCompleted ? 'Mark Pending' : 'Complete'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(task)}
                            aria-label={`Edit ${task.title}`}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              isDark
                                ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            aria-label={`Delete ${task.title}`}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              isDark
                                ? 'border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30'
                                : 'border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* PROGRESS CHARTS SECTION (Shown on Dashboard & Progress Analytics Tab) */}
          {(activeTab === 'dashboard' || activeTab === 'analytics') && (
            <section aria-label="Progress Charts and Study Analytics">
              <ProgressCharts
                tasks={tasks}
                courses={courses}
                weeklyLogs={weeklyLogs}
                isDark={isDark}
                fullPage={activeTab === 'analytics'}
              />
            </section>
          )}

          {/* DAILY STUDY PLANNER & CALENDAR SECTION (Shown on Dashboard & Planner Tab) */}
          {(activeTab === 'dashboard' || activeTab === 'planner') && (
            <section aria-label="Daily Study Planner and Calendar">
              <StudyPlannerCalendar
                tasks={tasks}
                selectedDate={selectedDate}
                onSelectDate={(date) => setSelectedDate(date)}
                onToggleTaskStatus={handleToggleTaskStatus}
                onEditTask={handleOpenEditModal}
                onDeleteTask={handleDeleteTask}
                onOpenNewTaskModal={(date) => handleOpenCreateModal(date)}
                onLogFocusMinutes={handleLogFocusMinutes}
                isDark={isDark}
              />
            </section>
          )}

          {/* ENROLLED COURSES SECTION (Shown on Dashboard & Courses Tab) */}
          {(activeTab === 'dashboard' || activeTab === 'courses') && (
            <section aria-label="Enrolled E-Learning Courses">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    Enrolled EduSphere Courses & Curriculum Progress
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Track lesson completion and schedule study blocks per subject
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {courses.map((course) => {
                  const progressPct = Math.round(
                    (course.completedLessons / course.totalLessons) * 100
                  );
                  const courseTasksCount = tasks.filter(
                    (t) => t.courseId === course.id && t.status === TaskStatus.PENDING
                  ).length;

                  return (
                    <div
                      key={course.id}
                      className={`rounded-2xl border p-5 flex flex-col justify-between transition-colors ${
                        isDark
                          ? 'bg-[#111827] border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                          <span>{course.category}</span>
                          <span className="font-mono tabular-nums">
                            {course.weeklyHours}h / week
                          </span>
                        </div>

                        <h3 className="text-base font-bold tracking-tight">
                          {course.title}
                        </h3>

                        <p
                          className={`text-xs mt-1 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          Instructor: {course.instructor} · {courseTasksCount} pending tasks
                        </p>

                        <div
                          className={`mt-4 p-3 rounded-xl border text-xs ${
                            isDark
                              ? 'bg-[#0B0F19] border-slate-800 text-slate-300'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-semibold">Up Next: </span>
                          {course.nextTopic}
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-mono tabular-nums font-semibold">
                            {course.completedLessons} / {course.totalLessons} Lessons Completed
                          </span>
                          <span
                            className="font-mono tabular-nums font-bold"
                            style={{ color: course.accentColor }}
                          >
                            {progressPct}%
                          </span>
                        </div>

                        <div
                          className={`h-2 w-full rounded-full overflow-hidden mb-4 ${
                            isDark ? 'bg-slate-800' : 'bg-slate-100'
                          }`}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-200"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: course.accentColor,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFilters((prev) => ({ ...prev, courseId: course.id }));
                              setActiveTab('tasks');
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              isDark
                                ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            View Course Tasks
                          </button>

                          <button
                            type="button"
                            onClick={() => handleIncrementCourseLesson(course.id)}
                            disabled={course.completedLessons >= course.totalLessons}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                            style={{ backgroundColor: course.accentColor }}
                          >
                            {course.completedLessons >= course.totalLessons
                              ? 'Module Completed'
                              : '+ Complete Lesson'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Add / Edit Study Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        editingTask={editingTask}
        courses={courses}
        defaultDate={modalDefaultDate}
        isDark={isDark}
      />

      {/* Interactive Code & Architecture Guide Modal */}
      <ArchitectureGuideModal
        isOpen={isArchGuideOpen}
        onClose={() => setIsArchGuideOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
