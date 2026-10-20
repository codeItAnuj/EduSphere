/**
 * Core data models for the EduSphere E-Learning & Study Planner Dashboard.
 * Every type is explicitly documented so the architecture is easy to inspect.
 */

export enum TaskPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum TaskStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
}

export type TimeBlockPeriod = 'Morning' | 'Midday' | 'Afternoon' | 'Evening';

export interface StudyTask {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // ISO date string YYYY-MM-DD
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "10:30"
  durationMinutes: number;
  period: TimeBlockPeriod;
  createdAt: string;
}

export interface CourseItem {
  id: string;
  title: string;
  instructor: string;
  category: string;
  completedLessons: number;
  totalLessons: number;
  accentColor: string; // Hex color from EduSphere palette
  nextTopic: string;
  weeklyHours: number;
}

export interface DailyStudyLog {
  day: string; // 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  date: string; // YYYY-MM-DD
  studyHours: number;
  targetHours: number;
  completedTasks: number;
}

export type ActiveNavTab = 'dashboard' | 'tasks' | 'planner' | 'analytics' | 'courses';

export interface TaskFilterState {
  status: 'All' | TaskStatus;
  priority: 'All' | TaskPriority;
  courseId: string;
  searchQuery: string;
  sortBy: 'dueDate' | 'priority' | 'duration';
}
