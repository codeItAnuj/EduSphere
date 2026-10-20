import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, Flag, CheckCircle2 } from 'lucide-react';
import {
  CourseItem,
  StudyTask,
  TaskPriority,
  TaskStatus,
  TimeBlockPeriod,
} from '../types/edusphere';
import { getFormattedDateOffset } from '../data/initialData';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<StudyTask, 'id' | 'createdAt'>, existingId?: string) => void;
  editingTask: StudyTask | null;
  courses: CourseItem[];
  defaultDate?: string;
  isDark: boolean;
}

/**
 * Helper to infer the study period block (Morning / Midday / Afternoon / Evening)
 * from a 24-hour time string ("HH:MM").
 */
function inferPeriodFromTime(startTime: string): TimeBlockPeriod {
  const hour = parseInt(startTime.split(':')[0] || '9', 10);
  if (hour < 12) return 'Morning';
  if (hour < 14) return 'Midday';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  courses,
  defaultDate,
  isDark,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || 'course-react-backend');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.HIGH);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [dueDate, setDueDate] = useState(defaultDate || getFormattedDateOffset(0));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form fields when editing an existing task or opening modal for a specific date
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setCourseId(editingTask.courseId);
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setDueDate(editingTask.dueDate);
      setStartTime(editingTask.startTime);
      setEndTime(editingTask.endTime);
      setDurationMinutes(editingTask.durationMinutes);
      setErrorMessage('');
    } else {
      setTitle('');
      setDescription('');
      setCourseId(courses[0]?.id || 'course-react-backend');
      setPriority(TaskPriority.MEDIUM);
      setStatus(TaskStatus.PENDING);
      setDueDate(defaultDate || getFormattedDateOffset(0));
      setStartTime('09:00');
      setEndTime('10:30');
      setDurationMinutes(90);
      setErrorMessage('');
    }
  }, [editingTask, isOpen, defaultDate, courses]);

  // Automatically recalculate duration in minutes when start/end times change
  const handleTimeChange = (newStart: string, newEnd: string) => {
    setStartTime(newStart);
    setEndTime(newEnd);
    const [sh, sm] = newStart.split(':').map(Number);
    const [eh, em] = newEnd.split(':').map(Number);
    if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
      const diff = eh * 60 + em - (sh * 60 + sm);
      if (diff > 0) {
        setDurationMinutes(diff);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a clear study task title.');
      return;
    }

    const selectedCourse = courses.find((c) => c.id === courseId) || courses[0];
    const period = inferPeriodFromTime(startTime);

    onSave(
      {
        title: title.trim(),
        description: description.trim() || 'Scheduled study block in EduSphere planner.',
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        priority,
        status,
        dueDate,
        startTime,
        endTime,
        durationMinutes: Math.max(15, Number(durationMinutes) || 60),
        period,
      },
      editingTask?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 transition-colors ${
          isDark
            ? 'bg-[#111827] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="task-modal-title" className="text-lg font-bold tracking-tight">
              {editingTask ? 'Edit Study Task' : 'Create New Study Task'}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Changes are automatically saved to browser localStorage.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" htmlFor="task-title-input">
              Task Title
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="e.g., Complete React Custom Hooks & Context API Lab"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${
                isDark
                  ? 'bg-[#0B0F19] border-slate-800 text-slate-100 focus:border-[#6C5DD3]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#6C5DD3] focus:bg-white'
              }`}
              autoFocus
            />
          </div>

          {/* Course / Subject Selector */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" htmlFor="task-course-select">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#6C5DD3]" />
                Course Module
              </span>
            </label>
            <select
              id="task-course-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${
                isDark
                  ? 'bg-[#0B0F19] border-slate-800 text-slate-100 focus:border-[#6C5DD3]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#6C5DD3] focus:bg-white'
              }`}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.category})
                </option>
              ))}
            </select>
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-[#FF754C]" />
                  Priority Level
                </span>
              </label>
              <div
                className={`grid grid-cols-3 gap-1 p-1 rounded-xl border ${
                  isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                {[TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH].map((level) => {
                  const active = priority === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level)}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? level === TaskPriority.HIGH
                            ? 'bg-[#FF754C] text-white'
                            : level === TaskPriority.MEDIUM
                            ? 'bg-[#F59E0B] text-slate-950'
                            : 'bg-[#6C5DD3] text-white'
                          : isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Task Status
                </span>
              </label>
              <div
                className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${
                  isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                {[TaskStatus.PENDING, TaskStatus.COMPLETED].map((st) => {
                  const active = status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? st === TaskStatus.COMPLETED
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#6C5DD3] text-white'
                          : isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Date & Time Slot Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" htmlFor="task-date-input">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#6C5DD3]" />
                  Study Date
                </span>
              </label>
              <input
                id="task-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-mono tabular-nums outline-none ${
                  isDark
                    ? 'bg-[#0B0F19] border-slate-800 text-slate-100 focus:border-[#6C5DD3]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#6C5DD3]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" htmlFor="task-start-input">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Start Time
                </span>
              </label>
              <input
                id="task-start-input"
                type="time"
                value={startTime}
                onChange={(e) => handleTimeChange(e.target.value, endTime)}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-mono tabular-nums outline-none ${
                  isDark
                    ? 'bg-[#0B0F19] border-slate-800 text-slate-100 focus:border-[#6C5DD3]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#6C5DD3]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" htmlFor="task-end-input">
                End Time ({durationMinutes}m)
              </label>
              <input
                id="task-end-input"
                type="time"
                value={endTime}
                onChange={(e) => handleTimeChange(startTime, e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-mono tabular-nums outline-none ${
                  isDark
                    ? 'bg-[#0B0F19] border-slate-800 text-slate-100 focus:border-[#6C5DD3]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#6C5DD3]'
                }`}
              />
            </div>
          </div>

          {/* Study Notes / Description */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" htmlFor="task-desc-input">
              Study Notes & Objectives
            </label>
            <textarea
              id="task-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key chapters, exercises, or deliverables to complete during this session..."
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors resize-none ${
                isDark
                  ? 'bg-[#0B0F19] border-slate-800 text-slate-100 focus:border-[#6C5DD3]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#6C5DD3] focus:bg-white'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 ${
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#6C5DD3] hover:bg-[#5b4cc4] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {editingTask ? 'Save Changes' : 'Add Study Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
