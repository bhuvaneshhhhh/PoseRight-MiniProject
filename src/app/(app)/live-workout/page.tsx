import { WorkoutView } from '@/components/live-workout/workout-view';

export default function LiveWorkoutPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <header>
        <h1 className="font-headline text-3xl font-bold">Live Workout</h1>
        <p className="text-muted-foreground">Real-time form correction powered by AI.</p>
      </header>
      <WorkoutView />
    </div>
  );
}
