import { DietPlanner } from '@/components/diet/diet-planner';

export default function MyDietPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b bg-card p-4 md:p-8">
        <h1 className="font-headline text-3xl font-bold">My Diet</h1>
        <p className="text-muted-foreground">
          Generate a personalized diet plan or create your own.
        </p>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <DietPlanner />
      </div>
    </div>
  );
}
