import { RoutinePlanner } from '@/components/routine/routine-planner';

export default function MyRoutinePage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b bg-card p-4 md:p-8">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">My Routine</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Generate a personalized workout routine or create your own.
        </p>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <RoutinePlanner />
      </div>
    </div>
  );
}
