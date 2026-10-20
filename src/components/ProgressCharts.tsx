import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import { CourseItem, DailyStudyLog, StudyTask, TaskPriority, TaskStatus } from '../types/edusphere';

interface ProgressChartsProps {
  tasks: StudyTask[];
  courses: CourseItem[];
  weeklyLogs: DailyStudyLog[];
  isDark: boolean;
  fullPage?: boolean;
}

/**
 * ProgressCharts renders interactive visualizations using Recharts:
 * 1. Weekly Study Activity & Task Velocity (Composed Bar + Line chart)
 * 2. Task Completion & Priority Distribution (Donut chart + Priority breakdown)
 * 3. Course Module Completion Bar Chart (shown in expanded analytics mode)
 */
export const ProgressCharts: React.FC<ProgressChartsProps> = ({
  tasks,
  courses,
  weeklyLogs,
  isDark,
  fullPage = false,
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Priority breakdown data
  const highPriorityPending = tasks.filter(
    (t) => t.priority === TaskPriority.HIGH && t.status === TaskStatus.PENDING
  ).length;
  const mediumPriorityPending = tasks.filter(
    (t) => t.priority === TaskPriority.MEDIUM && t.status === TaskStatus.PENDING
  ).length;
  const lowPriorityPending = tasks.filter(
    (t) => t.priority === TaskPriority.LOW && t.status === TaskStatus.PENDING
  ).length;

  const statusPieData = [
    { name: 'Completed', value: completedTasks, color: '#10B981' },
    { name: 'High Priority Pending', value: highPriorityPending, color: '#FF754C' },
    { name: 'Medium Priority Pending', value: mediumPriorityPending, color: '#F59E0B' },
    { name: 'Low Priority Pending', value: lowPriorityPending, color: '#6C5DD3' },
  ].filter((item) => item.value > 0);

  // Fallback if all tasks are deleted
  const safePieData =
    statusPieData.length > 0
      ? statusPieData
      : [{ name: 'No Tasks', value: 1, color: isDark ? '#334155' : '#E2E8F0' }];

  const courseChartData = courses.map((c) => {
    const courseTasks = tasks.filter((t) => t.courseId === c.id);
    const done = courseTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const progressPct = Math.round((c.completedLessons / c.totalLessons) * 100);
    return {
      name: c.title.split(' ')[0] + ' ' + (c.title.split(' ')[1] || ''),
      fullTitle: c.title,
      progressPct,
      completedTasks: done,
      totalCourseTasks: courseTasks.length,
      hours: c.weeklyHours,
      fill: c.accentColor,
    };
  });

  const gridColor = isDark ? '#1E293B' : '#F1F5F9';
  const axisTextColor = isDark ? '#94A3B8' : '#64748B';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Cols: Weekly Learning Activity Chart */}
        <div
          className={`lg:col-span-7 rounded-2xl border p-5 flex flex-col justify-between ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Weekly Study Hours & Task Velocity
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Daily focused study hours vs. daily goal target
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#6C5DD3]" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Study Hours</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#FF754C]" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Tasks Done</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisTextColor, fontSize: 12, fontFamily: 'JetBrains Mono' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisTextColor, fontSize: 12, fontFamily: 'JetBrains Mono' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  }}
                />
                <Bar
                  dataKey="studyHours"
                  name="Study Hours (h)"
                  fill="#6C5DD3"
                  radius={[8, 8, 0, 0]}
                  barSize={28}
                />
                <Line
                  type="monotone"
                  dataKey="completedTasks"
                  name="Completed Tasks"
                  stroke="#FF754C"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#FF754C', strokeWidth: 2, stroke: tooltipBg }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 Cols: Task Distribution Donut Chart */}
        <div
          className={`lg:col-span-5 rounded-2xl border p-5 flex flex-col justify-between ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <h3 className="text-base font-bold tracking-tight">Task Completion Breakdown</h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Live ratio of completed vs. pending priorities
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 my-2">
            <div className="h-48 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={76}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {safePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold font-mono tabular-nums">
                  {completionRate}%
                </span>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Completed
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Completed</span>
                </span>
                <span className="font-mono font-semibold tabular-nums">{completedTasks}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#FF754C]" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>High Priority</span>
                </span>
                <span className="font-mono font-semibold tabular-nums">{highPriorityPending}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Medium Priority</span>
                </span>
                <span className="font-mono font-semibold tabular-nums">{mediumPriorityPending}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#6C5DD3]" />
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Low Priority</span>
                </span>
                <span className="font-mono font-semibold tabular-nums">{lowPriorityPending}</span>
              </div>
            </div>
          </div>

          <div
            className={`pt-3 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
            }`}
          >
            <span>Total Tracked Tasks: {totalTasks}</span>
            <span className="font-mono tabular-nums">Pending: {pendingTasks}</span>
          </div>
        </div>
      </div>

      {/* Expanded Course Mastery Chart when viewing dedicated Progress Analytics tab */}
      {fullPage && (
        <div
          className={`rounded-2xl border p-6 ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Course Syllabus Mastery & Weekly Time Allocation
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Percentage of syllabus modules completed across enrolled EduSphere courses
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseChartData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="fullTitle"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisTextColor, fontSize: 12 }}
                />
                <YAxis
                  unit="%"
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisTextColor, fontSize: 12, fontFamily: 'JetBrains Mono' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="progressPct" name="Syllabus Completion (%)" radius={[8, 8, 0, 0]} barSize={42}>
                  {courseChartData.map((entry, idx) => (
                    <Cell key={`course-bar-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
