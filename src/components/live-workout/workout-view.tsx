'use client';

import {
  DrawingUtils,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { Dumbbell, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { generateAudioFeedback } from '@/ai/flows/generate-audio-feedback-flow';
import { generateFeedbackForPose } from '@/ai/flows/generate-feedback-flow';

/**
 * Calculates the angle (in degrees) between three 2D points (x, y).
 */
const calculateAngle = (a: number[], b: number[], c: number[]): number => {
  if (a.length < 2 || b.length < 2 || c.length < 2) return 0;
  const radians =
    Math.atan2(c[1] - b[1], c[0] - b[0]) -
    Math.atan2(a[1] - b[1], a[0] - b[0]);
  let angle = Math.abs(radians * (180.0 / Math.PI));
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
};

export function WorkoutView() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>();
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [feedbackText, setFeedbackText] = useState('Begin Bicep Curls');
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const handleNewFeedback = useCallback(
    (issues: string[] = [], forceImmediate = false) => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      const generateAndPlayFeedback = async () => {
        if (isAudioLoading) return;

        const { feedback: newFeedback } = await generateFeedbackForPose({
          exerciseName: 'Bicep Curl',
          issues: issues,
        });

        if (newFeedback === feedbackText && !forceImmediate) return;

        setFeedbackText(newFeedback);
        setIsAudioLoading(true);

        try {
          const { audio } = await generateAudioFeedback({ text: newFeedback });
          if (audioRef.current) {
            audioRef.current.src = audio;
            audioRef.current.play().catch(e => {
              console.error("Audio playback failed:", e);
              setIsAudioLoading(false);
            });
          } else {
             setIsAudioLoading(false);
          }
        } catch (error) {
          console.error('Failed to generate audio feedback:', error);
          setIsAudioLoading(false);
        }
      };
      
      if (forceImmediate) {
        generateAndPlayFeedback();
      } else if (issues.length > 0) {
        feedbackTimeoutRef.current = setTimeout(generateAndPlayFeedback, 1500);
      } else {
         feedbackTimeoutRef.current = setTimeout(generateAndPlayFeedback, 1500);
      }
    },
    [isAudioLoading, feedbackText]
  );

  const onResults = (results: PoseLandmarkerResult) => {
    const videoWidth = webcamRef.current?.video?.videoWidth || 1280;
    const videoHeight = webcamRef.current?.video?.videoHeight || 720;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement?.getContext('2d');

    if (!canvasCtx || !canvasElement) return;

    canvasElement.width = videoWidth;
    canvasElement.height = videoHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, videoWidth, videoHeight);

    if (results.landmarks && results.landmarks.length > 0) {
      const drawingUtils = new DrawingUtils(canvasCtx);
      const landmarks = results.landmarks[0];

      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
        color: '#000000',
        lineWidth: 8,
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: '#808080',
        lineWidth: 4,
        radius: 6,
      });

      try {
        const getLandmarkCoords = (idx: number) => [
          landmarks[idx].x * videoWidth,
          landmarks[idx].y * videoHeight,
        ];
        const rightShoulder = getLandmarkCoords(12);
        const rightElbow = getLandmarkCoords(14);
        const rightWrist = getLandmarkCoords(16);

        const elbowAngle = calculateAngle(
          rightShoulder,
          rightElbow,
          rightWrist
        );
        
        let currentIssues: string[] = [];
        
        const hipVisible = landmarks[24].visibility > 0.5;
        const shoulderVisible = landmarks[12].visibility > 0.5;
        const elbowVisible = landmarks[14].visibility > 0.5;

        if (hipVisible && shoulderVisible && elbowVisible) {
          // Check for shoulder moving forward (a common mistake)
          if(landmarks[12].x < landmarks[14].x) {
             currentIssues.push("Try not to swing your arm; keep your elbow locked at your side.");
          }
        } else {
            currentIssues.push("Make sure your full arm is visible to the camera.");
        }
        
        if (currentIssues.length > 0) {
            handleNewFeedback(currentIssues);
        } else {
            handleNewFeedback([]); // No issues, will generate positive feedback
        }

      } catch (e) {
        handleNewFeedback(['Arm not visible'], true);
      }
    } else {
      setFeedbackText('No person detected.');
    }
    canvasCtx.restore();
  };

  const predict = useCallback(() => {
    if (
      !webcamRef.current ||
      !webcamRef.current.video ||
      !poseLandmarkerRef.current
    ) {
      requestRef.current = requestAnimationFrame(predict);
      return;
    }

    const video = webcamRef.current.video;
    if (video.readyState < 2) {
      requestRef.current = requestAnimationFrame(predict);
      return;
    }

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const startTimeMs = performance.now();
      poseLandmarkerRef.current.detectForVideo(
        video,
        startTimeMs,
        (results) => onResults(results)
      );
    }

    requestRef.current = requestAnimationFrame(predict);
  }, []);

  useEffect(() => {
    const initializePoseLandmarker = async () => {
      const { PoseLandmarker, FilesetResolver } = await import(
        '@mediapipe/tasks-vision'
      );
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
        outputSegmentationMasks: false,
      });
      poseLandmarkerRef.current = landmarker;
      requestRef.current = requestAnimationFrame(predict);
    };
    initializePoseLandmarker();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      poseLandmarkerRef.current?.close();
    };
  }, [predict]);
  
  const handleAudioEnd = () => {
    setTimeout(() => setIsAudioLoading(false), 500);
  };


  return (
    <div className="h-full w-full flex flex-col">
      <header className="p-4 border-b bg-background z-10">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">Live Workout</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Demo tracking
        </p>
      </header>
      <div className="flex-1 relative bg-black flex items-center justify-center">
        <div className="relative w-full h-full">
            <Webcam
              ref={webcamRef}
              mirrored={true}
              className="absolute inset-0 w-full h-full object-contain"
              videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ transform: 'scaleX(-1)' }}
            />
        </div>
         <audio ref={audioRef} className="hidden" onEnded={handleAudioEnd} />

        <div className="absolute bottom-4 left-4 right-4 flex flex-col md:flex-row gap-4">
          <div className="rounded-lg bg-black/50 backdrop-blur-sm p-4 flex-1 text-left flex items-center gap-4 min-w-0">
              {isAudioLoading ? (
                <Volume2 className="w-8 h-8 text-primary animate-pulse flex-shrink-0" />
              ) : (
                <Dumbbell className="w-8 h-8 text-primary flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-bold text-primary">Feedback</p>
                <p className="text-base md:text-lg text-white truncate">{feedbackText}</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
