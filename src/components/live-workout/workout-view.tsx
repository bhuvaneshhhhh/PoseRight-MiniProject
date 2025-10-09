'use client';

import { identifyExerciseFromPose } from '@/ai/flows/identify-exercise-flow';
import { useToast } from '@/hooks/use-toast';
import {
  DrawingUtils,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { CircleUserRound, Loader, Video as VideoIcon } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
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
  const exerciseIdentificationTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const [drawingUtils, setDrawingUtils] = useState<DrawingUtils | null>(null);

  const [formScore, setFormScore] = useState(0);
  const [aiFeedback, setAiFeedback] = useState('Waiting to start...');
  const [identifiedExercise, setIdentifiedExercise] = useState<string | null>(
    'Detecting...'
  );
  const [isIdentifying, setIsIdentifying] = useState(false);

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
          outputSegmentationMasks: true,
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
      if (exerciseIdentificationTimeoutId.current) {
        clearTimeout(exerciseIdentificationTimeoutId.current);
      }
    };
  }, [toast]);

  const identifyExercise = useCallback(
    async (poseData: any[]) => {
      if (isIdentifying) return;
      setIsIdentifying(true);
      try {
        const { exerciseName } = await identifyExerciseFromPose({ poseData });
        setIdentifiedExercise(exerciseName);
      } catch (error) {
        console.error('Error identifying exercise:', error);
        setIdentifiedExercise('Error');
      } finally {
        setIsIdentifying(false);
      }
    },
    [isIdentifying]
  );

  // Prediction loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!hasCameraPermission || !poseLandmarker || !video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const utils = new DrawingUtils(ctx);
    setDrawingUtils(utils);

    const predict = async () => {
      if (video.readyState < 2) {
        animationFrameId.current = requestAnimationFrame(predict);
        return;
      }
      
      if (video.currentTime !== lastVideoTime) {
        const startTimeMs = performance.now();
        const results = poseLandmarker.detectForVideo(
          video,
          startTimeMs
        );
        lastVideoTime = video.currentTime;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          analyzePose(landmarks);

          // Filter landmarks based on visibility before drawing
          const visibleLandmarks = landmarks.filter(lm => (lm.visibility ?? 0) > 0.5);

          utils.drawLandmarks(visibleLandmarks, {
            radius: 10,
            color: 'black',
            fillColor: 'black',
          });
          utils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
            color: 'black',
            lineWidth: 12,
          });

          if (!exerciseIdentificationTimeoutId.current && !isIdentifying) {
            exerciseIdentificationTimeoutId.current = setTimeout(() => {
              identifyExercise(landmarks);
              exerciseIdentificationTimeoutId.current = null;
            }, 3000);
          }
        } else {
          setAiFeedback('No person detected.');
          setFormScore(0);
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
      if (exerciseIdentificationTimeoutId.current) {
        clearTimeout(exerciseIdentificationTimeoutId.current);
      }
    };
  }, [hasCameraPermission, poseLandmarker, identifyExercise, isIdentifying]);

  const analyzePose = (landmarks: any[]) => {
    // This is a simplified analysis for a squat
    const keypointsMap: { [key: string]: any } = {};
    
    landmarks.forEach((lm, i) => {
      const name = POSE_LANDMARKS[i];
      if (name) keypointsMap[name] = lm;
    });

    const requiredKeypoints = [
      'left_hip',
      'left_knee',
      'left_ankle',
      'right_hip',
      'right_knee',
      'right_ankle',
      'left_shoulder',
      'right_shoulder',
    ];

    for (const kpName of requiredKeypoints) {
      if (!keypointsMap[kpName] || keypointsMap[kpName].visibility! < 0.5) {
        setAiFeedback('Please make sure your full body is visible.');
        setFormScore(0);
        return;
      }
    }

    const leftKneeAngle = calculateAngle(
      keypointsMap.left_hip,
      keypointsMap.left_knee,
      keypointsMap.left_ankle
    );
    const rightKneeAngle = calculateAngle(
      keypointsMap.right_hip,
      keypointsMap.right_knee,
      keypointsMap.right_ankle
    );
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    const leftHipAngle = calculateAngle(
      keypointsMap.left_shoulder,
      keypointsMap.left_hip,
      keypointsMap.left_knee
    );
    const rightHipAngle = calculateAngle(
      keypointsMap.right_shoulder,
      keypointsMap.right_hip,
      keypointsMap.right_knee
    );
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

    let score = 0;
    let feedback = '';

    // Squat feedback logic
    if (avgKneeAngle > 160) {
      feedback = 'Start by lowering your hips.';
      score = 20;
    } else if (avgKneeAngle > 120) {
      feedback = 'Good start, go a bit lower.';
      score = 50 + ((160 - avgKneeAngle) / 40) * 20;
    } else if (avgKneeAngle > 90) {
      feedback = 'Almost there, break parallel!';
      score = 70 + ((120 - avgKneeAngle) / 30) * 20;
    } else {
      feedback = 'Great depth!';
      score = 90;
    }

    if (avgHipAngle < 150) {
      feedback += ' Keep your chest up and back straight.';
      score = Math.max(0, score - 20);
    } else {
      score = Math.min(100, score + 10);
    }

    setAiFeedback(feedback);
    setFormScore(score);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h1 className="font-headline text-3xl font-bold">Live Workout</h1>
        <Card className="p-2 px-4">
          <div className="flex items-center gap-2">
            {isIdentifying ? (
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <VideoIcon className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                CURRENT EXERCISE
              </p>
              <p className="font-bold text-lg leading-tight">
                {identifiedExercise || 'None Detected'}
              </p>
            </div>
          </div>
        </Card>
      </div>
      <p className="text-muted-foreground mb-8">
        Real-time form correction powered by AI.
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

const POSE_LANDMARKS = [
    'nose',
    'left_eye_inner',
    'left_eye',
    'left_eye_outer',
    'right_eye_inner',
    'right_eye',
    'right_eye_outer',
    'left_ear',
    'right_ear',
    'mouth_left',
    'mouth_right',
    'left_shoulder',
    'right_shoulder',
    'left_elbow',
    'right_elbow',
    'left_wrist',
    'right_wrist',
    'left_pinky',
    'right_pinky',
    'left_index',
    'right_index',
    'left_thumb',
    'right_thumb',
    'left_hip',
    'right_hip',
    'left_knee',
    'right_knee',
    'left_ankle',
    'right_ankle',
    'left_heel',
    'right_heel',
    'left_foot_index',
    'right_foot_index',
];
