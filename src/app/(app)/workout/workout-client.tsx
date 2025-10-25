
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
import { WORKOUTS_DATA, POSE_LANDMARKS, type Stage, type AngleRule } from '@/lib/poses';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { Landmark } from '@mediapipe/tasks-vision';
import { identifyExerciseFromPose } from '@/ai/flows/identify-exercise-from-pose';
import { generateFeedbackForPose } from '@/ai/flows/generate-feedback-flow';
import { calculateAngle } from '@/lib/pose-analysis';

const availableExercises = Object.keys(WORKOUTS_DATA).map(name => 
    name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
);

type FormAnalysis = {
    formScore: number;
    formAnalysis: string[];
    feedback: string;
    vocalizationNeeded: boolean;
}

export function WorkoutClient() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [identifiedExercise, setIdentifiedExercise] = useState<string | null>(null);
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestLandmarks, setLatestLandmarks] = useState<Landmark[]>([]);
  
  const exerciseToAnalyze = selectedExercise || identifiedExercise;
  const lastAnalysisTime = useRef(Date.now());
  const analysisCooldown = 2000; // 2 seconds

  const handlePoseDataForDrawing = useCallback((landmarks: Landmark[]) => {
    setLatestLandmarks(landmarks);
  }, []);

  const analyzeFormClientSide = (landmarks: Landmark[], exerciseName: string): { score: number, issues: string[] } => {
    const exerciseData = WORKOUTS_DATA[exerciseName as keyof typeof WORKOUTS_DATA];
    if (!exerciseData || landmarks.length === 0) {
      return { score: 100, issues: [] };
    }
  
    let totalScore = 100;
    const issues: string[] = [];
  
    // Find the current stage by checking which set of rules the user's pose most closely matches.
    let bestStage: { stageName: string; score: number } | null = null;
  
    for (const stageName in exerciseData.stages) {
      const stage = exerciseData.stages[stageName];
      let stageScore = 0;
      let rulesChecked = 0;
  
      for (const ruleName in stage.rules) {
        const rule = stage.rules[ruleName];
        rulesChecked++;
  
        const p1 = landmarks[POSE_LANDMARKS[rule.p1 as keyof typeof POSE_LANDMARKS]];
        const p2 = landmarks[POSE_LANDMARKS[rule.p2 as keyof typeof POSE_LANDMARKS]];
        const p3 = landmarks[POSE_LANDMARKS[rule.p3 as keyof typeof POSE_LANDMARKS]];
  
        if (p1 && p2 && p3) {
          const angle = calculateAngle(p1, p2, p3);
          if (angle >= rule.angle.min && angle <= rule.angle.max) {
            stageScore++;
          }
        }
      }
  
      const matchScore = rulesChecked > 0 ? (stageScore / rulesChecked) * 100 : 0;
  
      if (!bestStage || matchScore > bestStage.score) {
        bestStage = { stageName, score: matchScore };
      }
    }
  
    // Now, with the best-matched stage, perform the detailed analysis.
    if (bestStage && bestStage.score > 50) { // Only analyze if it's a decent match
      const stage = exerciseData.stages[bestStage.stageName];
      for (const ruleName in stage.rules) {
        const rule = stage.rules[ruleName];
        const p1 = landmarks[POSE_LANDMARKS[rule.p1 as keyof typeof POSE_LANDMARKS]];
        const p2 = landmarks[POSE_LANDMARKS[rule.p2 as keyof typeof POSE_LANDMARKS]];
        const p3 = landmarks[POSE_LANDMARKS[rule.p3 as keyof typeof POSE_LANDMARKS]];
  
        if (p1 && p2 && p3) {
          const angle = calculateAngle(p1, p2, p3);
          if (angle < rule.angle.min || angle > rule.angle.max) {
            totalScore -= 25; // Deduct points for each rule violation
            issues.push(rule.feedback);
          }
        }
      }
    }
  
    return { score: Math.max(0, totalScore), issues };
  };
  

  const handlePoseDataForAnalysis = useCallback(
    async (landmarks: Landmark[]) => {
      const now = Date.now();
      if (isProcessing || now - lastAnalysisTime.current < analysisCooldown) {
        return;
      }
      if (landmarks.length === 0) return;
      
      setIsProcessing(true);
      lastAnalysisTime.current = now;
      
      try {
        let currentExercise = selectedExercise 
            ? selectedExercise.toUpperCase().replace(/ /g, '_') 
            : identifiedExercise;

        // Step 1: Identify exercise if not pre-selected
        if (!selectedExercise) {
          const { exerciseName } = await identifyExerciseFromPose({ landmarks });
          if (exerciseName) {
            setIdentifiedExercise(exerciseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            currentExercise = exerciseName;
          }
        }
        
        // Step 2: Analyze form if an exercise is active
        if (currentExercise) {
          const { score, issues } = analyzeFormClientSide(landmarks, currentExercise);
          
          let feedback = "Keep it up!";
          if (issues.length > 0) {
              const feedbackResult = await generateFeedbackForPose({ exerciseName: currentExercise, issues });
              feedback = feedbackResult.feedback;
          }

          setFormAnalysis({
              formScore: score,
              formAnalysis: issues.length > 0 ? issues : ["Great form!"],
              feedback: feedback,
              vocalizationNeeded: score < 80 && issues.length > 0,
          });

        } else {
            setFormAnalysis(null);
        }

      } catch (error) {
        console.error("Error during pose analysis:", error);
        setFormAnalysis(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, selectedExercise, identifiedExercise]
  );

  useEffect(() => {
    if (selectedExercise) {
      setIdentifiedExercise(null);
      setFormAnalysis(null);
    }
  }, [selectedExercise]);

  const displayedExerciseName = exerciseToAnalyze
    ? exerciseToAnalyze.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : '---';

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
            <CameraView 
              onPoseData={handlePoseDataForDrawing}
              onAnalyzeData={handlePoseDataForAnalysis}
              landmarksToDraw={latestLandmarks}
            />
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
                    <p className="font-bold text-lg text-primary">{displayedExerciseName}</p>
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
