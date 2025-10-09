import { WorkoutView } from '@/components/live-workout/workout-view';

export default function LiveWorkoutPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <WorkoutView />
    </div>
  );
}
