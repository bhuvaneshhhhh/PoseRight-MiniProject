'use client';

import { generateFeedbackForPose } from '@/ai/flows/generate-feedback-flow';
import { useToast } from '@/hooks/use-toast';
import { POSE_CONNECTIONS, POSE_LANDMARKS, WORKOUTS_DATA } from '@/lib/poses';
import {
  DrawingUtils,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { Loader, Video as VideoIcon } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent } from '../ui/card';

let lastVideoTime = -1;

// Function to calculate the angle between three points
function calculateAngle(a: any, b: any, c: any): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

export function WorkoutView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(
    null
  );
  const { toast } = useToast();
  const animationFrameId = useRef<number | null>(null);

  const [formScore, setFormScore] = useState(0);
  const [aiFeedback, setAiFeedback] = useState('Waiting to start...');
  const [identifiedExercise, setIdentifiedExercise] = useState<string | null>(
    'Detecting...'
  );
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const feedbackTimeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const { PoseLandmarker, FilesetResolver } = await import(
          '@mediapipe/tasks-vision'
        );
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          outputSegmentationMasks: false, 
        });
        setPoseLandmarker(landmarker);
      } catch (error) {
        console.error('Error initializing MediaPipe:', error);
        toast({
          variant: 'destructive',
          title: 'Initialization Error',
          description:
            'Failed to load the pose tracking model. Please refresh the page.',
        });
      }
    };
    initMediaPipe();
  }, [toast]);

  // Request camera permission
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description:
            'Your browser does not support camera access. Please use a different browser.',
        });
        setHasCameraPermission(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description:
            'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
       if (feedbackTimeoutId.current) {
        clearTimeout(feedbackTimeoutId.current);
      }
    };
  }, [toast]);


  const getAIFeedback = useCallback(async (exercise: string, issues: string[]) => {
    if (isGeneratingFeedback || issues.length === 0) return;
    setIsGeneratingFeedback(true);
    try {
        const { feedback } = await generateFeedbackForPose({ exerciseName: exercise, issues });
        setAiFeedback(feedback);
    } catch (error) {
        console.error('Error generating feedback:', error);
    } finally {
        setIsGeneratingFeedback(false);
    }
  }, [isGeneratingFeedback]);

  // Prediction loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!hasCameraPermission || !poseLandmarker || !video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawingUtils = new DrawingUtils(ctx);

    const predict = async () => {
      if (video.readyState < 2) {
        animationFrameId.current = requestAnimationFrame(predict);
        return;
      }

      if (video.currentTime !== lastVideoTime) {
        const startTimeMs = performance.now();
        const results = poseLandmarker.detectForVideo(video, startTimeMs);
        lastVideoTime = video.currentTime;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          analyzePoseAndDetectExercise(landmarks);

          // Draw skeleton
          drawingUtils.drawLandmarks(
            landmarks.filter(lm => (lm.visibility ?? 0) > 0.5),
            { radius: 6, color: 'black', fillColor: 'black' }
          );
          drawingUtils.drawConnectors(landmarks, POSE_CONNECTIONS, {
            color: 'black',
            lineWidth: 8,
          });

        } else {
          setIdentifiedExercise('NO_PERSON');
          setFormScore(0);
          setAiFeedback('No person detected in frame.');
        }
      }
      animationFrameId.current = requestAnimationFrame(predict);
    };

    const handleLoadedData = () => {
      video.play();
      if (!animationFrameId.current) {
        predict();
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', predict);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', predict);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (feedbackTimeoutId.current) {
        clearTimeout(feedbackTimeoutId.current);
      }
    };
  }, [hasCameraPermission, poseLandmarker, getAIFeedback]);

  const analyzePoseAndDetectExercise = (landmarks: any[]) => {
    const keypointsMap: { [key: string]: any } = {};
    landmarks.forEach((lm, i) => {
      const name = POSE_LANDMARKS[i];
      if (name) keypointsMap[name] = lm;
    });

    let detectedExercise = 'STANDING'; // Default to standing
    let currentStage = 'up';
    let totalScore = 100;
    const issues: string[] = [];

    // Check for Squat first
    const squatData = WORKOUTS_DATA['SQUAT'];
    if (squatData) {
        const downStage = squatData.stages.down;
        
        let isDownStage = true;
        // Check if user is in the "down" stage of a squat
        for (const joint in downStage.rules) {
            const rule = downStage.rules[joint as keyof typeof downStage.rules];
            const angle = calculateAngle(keypointsMap[rule.p1], keypointsMap[rule.p2], keypointsMap[rule.p3]);
            if (angle < rule.angle.min) {
                isDownStage = false;
                break;
            }
        }

        if (isDownStage) {
            detectedExercise = 'SQUAT';
            currentStage = 'down';
        }
    }
    
    // Set identified exercise
    setIdentifiedExercise(detectedExercise);

    // Form Scoring & Feedback Logic
    const exerciseData = WORKOUTS_DATA[detectedExercise as keyof typeof WORKOUTS_DATA];
    if (exerciseData) {
      const stageData = exerciseData.stages[currentStage as keyof typeof exerciseData.stages];
      for (const joint in stageData.rules) {
        const rule = stageData.rules[joint as keyof typeof stageData.rules];
        const p1 = keypointsMap[rule.p1];
        const p2 = keypointsMap[rule.p2];
        const p3 = keypointsMap[rule.p3];
        
        if (p1?.visibility > 0.5 && p2?.visibility > 0.5 && p3?.visibility > 0.5) {
            const angle = calculateAngle(p1, p2, p3);
            if (angle < rule.angle.min || angle > rule.angle.max) {
                totalScore -= 25; // Deduct points for each issue
                issues.push(rule.feedback);
            }
        }
      }
    }

    setFormScore(Math.max(0, totalScore));

    if (issues.length > 0) {
      if (!feedbackTimeoutId.current && !isGeneratingFeedback) {
        feedbackTimeoutId.current = setTimeout(() => {
          getAIFeedback(detectedExercise, issues);
          feedbackTimeoutId.current = null;
        }, 3000);
      }
    } else {
        setAiFeedback("Great form! Keep it up.");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h1 className="font-headline text-3xl font-bold">Live Workout</h1>
        <Card className="p-2 px-4">
          <div className="flex items-center gap-2">
            {isGeneratingFeedback ? (
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <VideoIcon className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                CURRENT POSTURE/EXERCISE
              </p>
              <p className="font-bold text-lg leading-tight">
                {identifiedExercise?.replace('_', ' ') || 'None Detected'}
              </p>
            </div>
          </div>
        </Card>
      </div>
      <p className="text-muted-foreground mb-8">
        Real-time form correction powered by our algorithmic engine.
      </p>
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />

            {!hasCameraPermission && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center text-primary-foreground">
                <h2 className="font-headline text-4xl font-bold text-white">
                  Camera Access Required
                </h2>
                <p className="mt-2 max-w-lg text-lg text-slate-300">
                  Please allow camera access in your browser to start your live
                  workout.
                </p>
              </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 flex gap-4">
              <div className="rounded-lg bg-black/50 backdrop-blur-sm p-4 w-1/3">
                <p className="font-bold text-primary">Form Score</p>
                <p className="text-3xl font-bold text-white">
                  {Math.round(formScore)}
                </p>
              </div>
              <div className="rounded-lg bg-black/50 backdrop-blur-sm p-4 flex-1 text-left">
                <p className="font-bold text-primary">AI Feedback</p>
                <p className="text-lg text-white">{aiFeedback}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            {!hasCameraPermission && (
              <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to use this feature. You may need
                  to refresh the page after granting permission.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
