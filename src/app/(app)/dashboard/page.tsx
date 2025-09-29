import { ProgressDashboard } from '@/components/progress/progress-dashboard';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold">Welcome Back, Alex!</h1>
        <p className="text-muted-foreground">Here's a snapshot of your progress. Keep it up!</p>
      </header>
      <ProgressDashboard />
    </div>
  );
}
