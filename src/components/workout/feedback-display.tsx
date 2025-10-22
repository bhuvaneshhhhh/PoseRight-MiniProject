'use client';

import { generateAudioFeedback } from '@/ai/flows/generate-audio-feedback-flow';
import { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Progress } from '../ui/progress';
import { Loader2, Volume2 } from 'lucide-react';
import type { FormAnalysis } from '@/ai/flows/analyze-exercise-form';
import { Button } from '../ui/button';

interface FeedbackDisplayProps {
  analysis: FormAnalysis | null;
  isProcessing: boolean;
}

export function FeedbackDisplay({
  analysis,
  isProcessing,
}: FeedbackDisplayProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isManuallySpeaking, setIsManuallySpeaking] = useState(false);

  // Automatically speak critical feedback
  useEffect(() => {
    const speakCriticalFeedback = async () => {
      if (analysis?.vocalizationNeeded && analysis.feedback && !isSpeaking) {
        setIsSpeaking(true);
        try {
          const { audio } = await generateAudioFeedback({
            text: analysis.feedback,
          });
          if (audio) {
            setAudioUrl(audio);
          }
        } catch (error) {
          console.error('Failed to get spoken correction:', error);
        } finally {
          // Cooldown to prevent spamming audio
          setTimeout(() => setIsSpeaking(false), 5000);
        }
      }
    };
    speakCriticalFeedback();
  }, [analysis, isSpeaking]);

  // Play audio when URL is set
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch((e) => console.error('Audio playback failed:', e));
      
      const handleAudioEnd = () => {
          setAudioUrl(null); 
          setIsManuallySpeaking(false);
      }
      audioRef.current.addEventListener('ended', handleAudioEnd);
      
      return () => {
          if (audioRef.current) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            audioRef.current.removeEventListener('ended', handleAudioEnd);
          }
      }
    }
  }, [audioUrl]);
  
  const handleManualSpeak = async (text: string | string[]) => {
      if (isManuallySpeaking) return;
      setIsManuallySpeaking(true);

      const textToSpeak = Array.isArray(text) ? text.join('. ') : text;

      try {
        const { audio } = await generateAudioFeedback({ text: textToSpeak });
        if (audio) {
            setAudioUrl(audio);
        } else {
            setIsManuallySpeaking(false);
        }
      } catch (error) {
        console.error('Failed to get spoken feedback:', error);
        setIsManuallySpeaking(false);
      }
  }

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
          <CardDescription>
            Real-time feedback on your exercise form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">FORM SCORE</p>
            {analysis ? (
              <p className={`font-bold text-6xl ${scoreColor}`}>
                {analysis.formScore}%
              </p>
            ) : (
              <p className="font-bold text-6xl text-muted-foreground">--%</p>
            )}
            <Progress value={analysis?.formScore ?? 0} className="mt-2 h-2" />
          </div>

          <div className="p-4 rounded-lg bg-muted min-h-[60px] flex items-center justify-center relative">
            <p className="font-medium text-lg text-primary text-center">
              {isProcessing && <Loader2 className="animate-spin h-5 w-5" />}
              {!isProcessing &&
                (analysis?.feedback || 'Start exercising to get feedback.')}
            </p>
            {analysis?.feedback && (
                <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8" onClick={() => handleManualSpeak(analysis.feedback)} disabled={isManuallySpeaking}>
                    {isManuallySpeaking ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4"/>}
                </Button>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
                 <h3 className="font-semibold">Detailed Breakdown</h3>
                 {analysis?.formAnalysis && analysis.formAnalysis.length > 0 && (
                     <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleManualSpeak(analysis.formAnalysis)} disabled={isManuallySpeaking}>
                        {isManuallySpeaking ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4"/>}
                     </Button>
                 )}
            </div>
            {analysis?.formAnalysis && analysis.formAnalysis.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {analysis.formAnalysis.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No analysis yet. Let's see your first rep!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      {audioUrl && <audio ref={audioRef} src={audioUrl} hidden />}
    </>
  );
}
