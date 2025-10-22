'use client';

import { provideSpokenCorrections } from '@/ai/flows/provide-spoken-corrections';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { Loader2 } from 'lucide-react';
import type { FormAnalysis } from '@/ai/flows/analyze-exercise-form';

interface FeedbackDisplayProps {
  analysis: FormAnalysis | null;
  isProcessing: boolean;
}

export function FeedbackDisplay({ analysis, isProcessing }: FeedbackDisplayProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const speakFeedback = async () => {
      if (analysis?.vocalizationNeeded && analysis.instructions && !isSpeaking) {
        setIsSpeaking(true);
        try {
          const { audio } = await provideSpokenCorrections({ text: analysis.instructions });
          if (audio) {
            setAudioUrl(audio);
          }
        } catch (error) {
          console.error('Failed to get spoken correction:', error);
        } finally {
            // Add a small delay before allowing another vocalization
            setTimeout(() => setIsSpeaking(false), 2000);
        }
      }
    };
    speakFeedback();
  }, [analysis, isSpeaking]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      // Reset URL so it can be triggered again for the same instruction
      setAudioUrl(null);
    }
  }, [audioUrl]);
  
  const scoreColor =
    analysis && analysis.formScore > 80
      ? 'text-green-500'
      : analysis && analysis.formScore > 50
      ? 'text-yellow-500'
      : 'text-red-500';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Form Analysis</CardTitle>
          <CardDescription>Real-time feedback on your exercise form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">FORM SCORE</p>
            {analysis ? (
              <p className={`font-bold text-6xl ${scoreColor}`}>{analysis.formScore}%</p>
            ) : (
              <p className="font-bold text-6xl text-muted-foreground">--%</p>
            )}
            <Progress value={analysis?.formScore ?? 0} className="mt-2 h-2" />
          </div>

          <div className="p-4 rounded-lg bg-muted text-center min-h-[60px] flex items-center justify-center">
            <p className="font-medium text-lg text-primary">
                {isProcessing && <Loader2 className="animate-spin h-5 w-5" />}
                {!isProcessing && (analysis?.feedback || "Start exercising to get feedback.")}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Detailed Breakdown</h3>
            {analysis?.formAnalysis && analysis.formAnalysis.length > 0 ? (
                 <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {analysis.formAnalysis.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No analysis yet. Let's see your first rep!</p>
            )}
          </div>
        </CardContent>
      </Card>
      {audioUrl && <audio ref={audioRef} src={audioUrl} hidden />}
    </>
  );
}
