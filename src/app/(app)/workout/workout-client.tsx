'use client';

import { CameraView } from '@/components/workout/camera-view';
import { FeedbackDisplay } from '@/components/workout/feedback-display';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { WORKOUTS_DATA } from '@/lib/poses';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { Landmark } from '@mediapipe/tasks-vision';
import { identifyExerciseFromPose } from '@/ai/flows/identify-exercise-from-pose';
import { analyzeExerciseForm, type FormAnalysis } from '@/ai/flows/analyze-exercise-form';

const availableExercises = Object.keys(WORKOUTS_DATA);

export function WorkoutClient() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [identifiedExercise, setIdentifiedExercise] = useState<string | null>(null);
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const exerciseToAnalyze = selectedExercise || identifiedExercise;
  const lastAnalysisTime = useRef(Date.now());
  const analysisCooldown = 2000; // 2 seconds

  const handlePoseData = useCallback(
    async (landmarks: Landmark[]) => {
      const now = Date.now();
      if (isProcessing || now - lastAnalysisTime.current < analysisCooldown) return;

      setIsProcessing(true);
      lastAnalysisTime.current = now;
      
      try {
        let currentExercise = exerciseToAnalyze;

        // Step 1: Identify exercise if not pre-selected
        if (!selectedExercise) {
          const { exerciseName } = await identifyExerciseFromPose({ landmarks });
          if (exerciseName) {
            setIdentifiedExercise(exerciseName);
            currentExercise = exerciseName;
          }
        }
        
        // Step 2: Analyze form if an exercise is active
        if (currentExercise) {
          const analysisResult = await analyzeExerciseForm({
            exerciseName: currentExercise,
            landmarks,
          });
          setFormAnalysis(analysisResult);
        } else {
            // If no exercise is identified or selected, clear analysis
            setFormAnalysis(null);
        }

      } catch (error) {
        console.error("Error during pose analysis:", error);
        setFormAnalysis(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, selectedExercise, exerciseToAnalyze]
  );

  useEffect(() => {
    // When the user pre-selects an exercise, clear any auto-identified one
    if (selectedExercise) {
      setIdentifiedExercise(null);
      setFormAnalysis(null); // Reset analysis
    }
  }, [selectedExercise]);

  return (
    <div className="h-full w-full flex flex-col">
      <header className="p-4 border-b bg-card z-10 shrink-0">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">Live Workout</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Let the AI analyze your form in real-time.
        </p>
      </header>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="relative bg-black flex flex-col items-center justify-center lg:w-1/2 lg:h-full">
          <div className="relative w-full aspect-video lg:aspect-auto lg:h-full">
            <CameraView onPoseData={handlePoseData} />
          </div>
        </div>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="exercise-select"
                    className="block text-sm font-medium text-muted-foreground mb-2"
                  >
                    Pre-select an Exercise (Optional)
                  </label>
                  <Select
                    onValueChange={(value) => setSelectedExercise(value === 'none' ? null : value)}
                    value={selectedExercise || 'none'}
                  >
                    <SelectTrigger id="exercise-select">
                      <SelectValue placeholder="Auto-detect exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Auto-detect exercise</SelectItem>
                      {availableExercises.map((ex) => (
                        <SelectItem key={ex} value={ex}>
                          {ex}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                    <p className="text-sm text-muted-foreground">CURRENT EXERCISE</p>
                    <p className="font-bold text-lg text-primary">{exerciseToAnalyze || '---'}</p>
                </div>
              </CardContent>
            </Card>

            <FeedbackDisplay analysis={formAnalysis} isProcessing={isProcessing} />
          </div>
        </div>
      </div>
    </div>
  );
}
