'use client';

import { identifyExerciseFromPose } from '@/ai/flows/identify-exercise-flow';
import { useToast } from '@/hooks/use-toast';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import { CircleUserRound, Loader, Video as VideoIcon } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

// Define a type for our keypoints for easier use
type Keypoint = poseDetection.Keypoint;

// Function to calculate the angle between three points
function calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
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
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(
    null
  );
  const { toast } = useToast();
  const animationFrameId = useRef<number | null>(null);
  const exerciseIdentificationTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const [formScore, setFormScore] = useState(0);
  const [aiFeedback, setAiFeedback] = useState('Waiting to start...');
  const [identifiedExercise, setIdentifiedExercise] = useState<string | null>(
    'Detecting...'
  );
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Initialize TensorFlow.js backend and load the model
  useEffect(() => {
    const initTfAndModel = async () => {
      try {
        await tf.setBackend('webgl');
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig: poseDetection.MoveNetModelConfig = {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        };
        const createdDetector = await poseDetection.createDetector(model, detectorConfig);
        setDetector(createdDetector);
      } catch (error) {
        console.error('Error initializing TensorFlow or loading model:', error);
        toast({
          variant: 'destructive',
          title: 'Initialization Error',
          description:
            'Failed to load the pose tracking model. Please refresh the page.',
        });
      }
    };
    initTfAndModel();
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
        stream.getTracks().forEach(track => track.stop());
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
    async (poseData: Keypoint[]) => {
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
    if (!hasCameraPermission || !detector || !video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const predict = async () => {
      try {
        const poses = await detector.estimatePoses(video, {
          flipHorizontal: false,
        });

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (poses.length > 0) {
          const keypoints = poses[0].keypoints;
          
          analyzePose(keypoints);
          drawSkeleton(keypoints, ctx);

          if (!exerciseIdentificationTimeoutId.current && !isIdentifying) {
            exerciseIdentificationTimeoutId.current = setTimeout(() => {
              identifyExercise(keypoints);
              exerciseIdentificationTimeoutId.current = null;
            }, 3000);
          }
        } else {
            setAiFeedback("No person detected.");
            setFormScore(0);
        }
      } catch (error) {
        console.error('Error during pose estimation:', error);
      }
      animationFrameId.current = requestAnimationFrame(predict);
    };

    const handleLoadedData = () => {
        if (!animationFrameId.current) {
            predict();
        }
    };
    
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        if (exerciseIdentificationTimeoutId.current) {
            clearTimeout(exerciseIdentificationTimeoutId.current);
        }
    }
  }, [hasCameraPermission, detector, identifyExercise, isIdentifying]);


  const analyzePose = (keypoints: Keypoint[]) => {
    // This is a simplified analysis for a squat
    const keypointsMap: { [key: string]: Keypoint } = {};
    keypoints.forEach(kp => {
        if(kp.name) keypointsMap[kp.name] = kp;
    });

    const requiredKeypoints = ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle', 'left_shoulder', 'right_shoulder'];
    for (const kpName of requiredKeypoints) {
        if (!keypointsMap[kpName] || keypointsMap[kpName].score! < 0.5) {
            setAiFeedback("Please make sure your full body is visible.");
            setFormScore(0);
            return;
        }
    }

    const leftKneeAngle = calculateAngle(keypointsMap.left_hip, keypointsMap.left_knee, keypointsMap.left_ankle);
    const rightKneeAngle = calculateAngle(keypointsMap.right_hip, keypointsMap.right_knee, keypointsMap.right_ankle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    
    const leftHipAngle = calculateAngle(keypointsMap.left_shoulder, keypointsMap.left_hip, keypointsMap.left_knee);
    const rightHipAngle = calculateAngle(keypointsMap.right_shoulder, keypointsMap.right_hip, keypointsMap.right_knee);
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

    let score = 0;
    let feedback = "";

    // Squat feedback logic
    if (avgKneeAngle > 160) {
      feedback = "Start by lowering your hips.";
      score = 20;
    } else if (avgKneeAngle > 120) {
      feedback = "Good start, go a bit lower.";
      score = 50 + ((160 - avgKneeAngle) / 40) * 20;
    } else if (avgKneeAngle > 90) {
      feedback = "Almost there, break parallel!";
      score = 70 + ((120 - avgKneeAngle) / 30) * 20;
    } else {
      feedback = "Great depth!";
      score = 90;
    }

    if (avgHipAngle < 150) {
        feedback += " Keep your chest up and back straight.";
        score = Math.max(0, score - 20);
    } else {
        score = Math.min(100, score + 10);
    }
    
    setAiFeedback(feedback);
    setFormScore(score);
  };

  const drawSkeleton = (keypoints: Keypoint[], ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 9;

    const minConfidence = 0.5;

    poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet).forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];
        
        if (kp1.score! > minConfidence && kp2.score! > minConfidence) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
        }
    });

    keypoints.forEach(kp => {
        if (kp.score! > minConfidence) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
  }

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
                    <p className="text-xs font-bold text-muted-foreground">CURRENT EXERCISE</p>
                    <p className="font-bold text-lg leading-tight">
                    {identifiedExercise || 'None Detected'}
                    </p>
                </div>
                </div>
            </Card>
        </div>
        <p className="text-muted-foreground mb-8">Real-time form correction powered by AI.</p>
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
                        Please allow camera access to use this feature. You may need to
                        refresh the page after granting permission.
                    </AlertDescription>
                    </Alert>
                )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
