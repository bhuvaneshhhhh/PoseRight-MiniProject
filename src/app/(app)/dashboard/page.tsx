import { ProgressDashboard } from '@/components/progress/progress-dashboard';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <header>
        <h1 className="font-headline text-2xl md:text-3xl font-bold">Welcome Back, Alex!</h1>
        <p className="text-muted-foreground text-sm md:text-base">Here's a snapshot of your progress. Keep it up!</p>
      </header>
      <ProgressDashboard />
    </div>
  );
}
