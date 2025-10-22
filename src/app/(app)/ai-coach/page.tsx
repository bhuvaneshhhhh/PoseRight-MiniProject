import { Chatbot } from '@/components/chatbot/chatbot';

export default function AiCoachPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b bg-card p-4 md:p-8">
        <h1 className="font-headline text-2xl font-bold md:text-3xl">
          AI Fitness Coach
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Ask me anything about workouts, nutrition, or your fitness plan.
        </p>
      </header>
      <div className="flex-1 overflow-y-auto">
        <Chatbot />
      </div>
    </div>
  );
}
