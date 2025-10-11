import { SchedulePlanner } from '@/components/schedule/schedule-planner';

export default function SchedulePage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <header>
        <h1 className="font-headline text-2xl md:text-3xl font-bold">Workout Schedule</h1>
        <p className="text-muted-foreground text-sm md:text-base">Plan your week and stay on track with your fitness goals.</p>
      </header>
      <SchedulePlanner />
    </div>
  );
}
