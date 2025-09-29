import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '../ui/card';

export function WorkoutView() {
  const placeholder = PlaceHolderImages.find(p => p.id === 'live-workout-placeholder');

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          {placeholder && (
            <Image
              src={placeholder.imageUrl}
              alt={placeholder.description}
              fill
              className="object-cover"
              data-ai-hint={placeholder.imageHint}
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center text-primary-foreground">
            <h2 className="font-headline text-4xl font-bold text-white">Coming Soon</h2>
            <p className="mt-2 max-w-lg text-lg text-slate-300">
              Our advanced AI-powered live workout analysis with skeleton tracking and real-time form feedback is currently under development. Get ready to perfect your form!
            </p>
            <div className="mt-8 flex gap-4">
                <div className="rounded-lg bg-white/10 p-4">
                    <p className="font-bold text-primary">Form Score</p>
                    <p className="text-3xl font-bold text-white">-</p>
                </div>
                <div className="rounded-lg bg-white/10 p-4 text-left">
                    <p className="font-bold text-primary">AI Feedback</p>
                    <p className="text-lg text-white">Waiting to start...</p>
                </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
