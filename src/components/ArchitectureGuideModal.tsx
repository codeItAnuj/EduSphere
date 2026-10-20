import React from 'react';
import { X, Code2, Database, Layers, BarChart3, Filter } from 'lucide-react';

interface ArchitectureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

/**
 * Provides an interactive Code & Architecture Reference sheet so the student can
 * easily explain every file, React hook, function, and state flow during code review.
 */
export const ArchitectureGuideModal: React.FC<ArchitectureGuideModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="arch-modal-title"
    >
      <div
        className={`w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border p-6 ${
          isDark
            ? 'bg-[#111827] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="arch-modal-title" className="text-lg font-bold tracking-tight">
              EduSphere React Architecture & Function Walkthrough
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Complete reference of how state, hooks, filters, charts, and localStorage work together
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close architecture guide"
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs leading-relaxed">
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-[#6C5DD3] mb-1.5">
              <Database className="w-4 h-4" />
              1. Persistent State with useLocalStorage (src/hooks/useLocalStorage.ts)
            </div>
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              Uses a lazy initializer inside <code className="font-mono">useState(() =&gt; ...)</code>{' '}
              that reads <code className="font-mono">window.localStorage.getItem(key)</code> on initial
              mount and parses JSON. A <code className="font-mono">useEffect</code> listener watches
              for state changes and writes updated tasks (<code className="font-mono">edusphere_tasks_v1</code>),
              courses, weekly logs, and theme mode (<code className="font-mono">edusphere_theme_v1</code>)
              so data persists across browser refreshes.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-[#FF754C] mb-1.5">
              <Code2 className="w-4 h-4" />
              2. CRUD Operations for Tasks (src/App.tsx & src/components/TaskModal.tsx)
            </div>
            <ul className={`space-y-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <li>
                <strong>Add / Edit Task (handleSaveTask):</strong> Checks if <code className="font-mono">existingId</code> is passed. If editing, maps over <code className="font-mono">tasks</code> and replaces the matching task object immutably. If adding, creates a new <code className="font-mono">StudyTask</code> with a unique ID and prepends it to state.
              </li>
              <li>
                <strong>Toggle Complete (handleToggleTaskStatus):</strong> Flips <code className="font-mono">status</code> between <code className="font-mono">TaskStatus.PENDING</code> and <code className="font-mono">TaskStatus.COMPLETED</code> and updates the weekly study log counter.
              </li>
              <li>
                <strong>Delete Task (handleDeleteTask):</strong> Uses <code className="font-mono">tasks.filter(t =&gt; t.id !== id)</code> to remove the item immutably and stores the last deleted task in <code className="font-mono">recentlyDeleted</code> so the user can Undo.
              </li>
            </ul>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-[#F59E0B] mb-1.5">
              <Filter className="w-4 h-4" />
              3. Multi-Criteria Filtering & Sorting Pipeline (useMemo in src/App.tsx)
            </div>
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              The <code className="font-mono">filteredTasks</code> array is computed via{' '}
              <code className="font-mono">useMemo</code> by chaining predicates: matching{' '}
              <code className="font-mono">filters.status</code> (All / Pending / Completed),{' '}
              <code className="font-mono">filters.priority</code> (All / High / Medium / Low),{' '}
              <code className="font-mono">filters.courseId</code>, and case-insensitive search query on
              title/description, followed by a comparator sort by Due Date, Priority weight, or Duration.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-500 mb-1.5">
              <BarChart3 className="w-4 h-4" />
              4. Progress Charts & Daily Study Calendar (ProgressCharts.tsx & StudyPlannerCalendar.tsx)
            </div>
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              Uses <strong>Recharts</strong> (<code className="font-mono">ComposedChart</code>,{' '}
              <code className="font-mono">Bar</code>, <code className="font-mono">Line</code>,{' '}
              <code className="font-mono">PieChart</code>) inside{' '}
              <code className="font-mono">ResponsiveContainer</code> to visualize weekly study hours and
              real-time task completion ratios. The Calendar generates a 7-column CSS Grid for the active
              month and groups tasks into Morning, Midday, Afternoon, and Evening study blocks.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-[#6C5DD3] mb-1.5">
              <Layers className="w-4 h-4" />
              5. File Tree Overview
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              <div>src/types/edusphere.ts — Data interfaces</div>
              <div>src/hooks/useLocalStorage.ts — Storage sync</div>
              <div>src/data/initialData.ts — Seed tasks & courses</div>
              <div>src/components/TaskModal.tsx — Add/Edit modal</div>
              <div>src/components/ProgressCharts.tsx — Recharts UI</div>
              <div>src/components/StudyPlannerCalendar.tsx — Planner</div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4cc4] text-white text-xs font-semibold cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
