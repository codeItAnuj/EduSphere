# EduSphere — E-Learning Platform & Study Planner Dashboard

An interactive E-Learning platform and student study planner dashboard built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Recharts**.

## Key Features

- **Dashboard Overview**: Live KPI metrics for Total Tasks, Completed Tasks, Pending Tasks, and Weekly Study Hours.
- **Full Task CRUD**: Add, edit, toggle completion, and delete study tasks (with instant Undo support).
- **Multi-Criteria Task Filtering**: Filter tasks by status (`All`, `Pending`, `Completed`), priority (`High`, `Medium`, `Low`), course module, and live search query, plus sorting by Due Date, Priority, or Duration.
- **Daily Study Planner & Calendar View**: Interactive monthly calendar with task count badges, time-blocked daily schedule (`Morning`, `Midday`, `Afternoon`, `Evening`), and a 25-minute Pomodoro Focus Session Timer.
- **Progress Analytics Charts**: Interactive Recharts visualizations including a Composed Bar/Line chart for Weekly Study Hours & Task Velocity, a Donut chart for Task Completion Breakdown, and a Course Syllabus Mastery chart.
- **Dark & Light Mode Toggle**: Instant theme switching between EduSphere Dark Slate and Light Mode.
- **Persistent Storage (`localStorage`)**: All tasks, courses, study logs, and theme settings persist across browser refreshes via a custom `useLocalStorage` hook.

## Project Architecture

- `src/types/edusphere.ts` — Core TypeScript interfaces and enums (`StudyTask`, `CourseItem`, `DailyStudyLog`, `TaskPriority`, `TaskStatus`).
- `src/hooks/useLocalStorage.ts` — Custom generic hook syncing React state with `window.localStorage`.
- `src/data/initialData.ts` — Default seed data for courses, study tasks, and weekly study logs.
- `src/components/TaskModal.tsx` — Accessible modal form for creating and editing study tasks.
- `src/components/ProgressCharts.tsx` — Recharts analytics charts (`ComposedChart`, `PieChart`, `BarChart`).
- `src/components/StudyPlannerCalendar.tsx` — Monthly calendar grid, daily time-blocked schedule, and Pomodoro timer.
- `src/components/ArchitectureGuideModal.tsx` — In-app code architecture & function reference guide.
- `src/App.tsx` — Main dashboard workspace, state handlers, and filtering pipeline.

## Getting Started Locally

```bash
npm install
npm run dev
```
