'use client';

import {
  DrawingUtils,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { Dumbbell } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent } from '../ui/card';

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
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>();
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);

  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('DOWN');
  const [feedback, setFeedback] = useState('Begin Bicep Curls');

  const MIN_ANGLE = 45;
  const MAX_ANGLE = 160;

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

      // Draw skeleton
      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4,
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: '#FF0000',
        lineWidth: 2,
        radius: 4,
      });

      // --- Rule-based Logic for Bicep Curl ---
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

        if (elbowAngle > MAX_ANGLE) {
          if (stage !== 'DOWN') {
            setStage('DOWN');
          }
        } else if (elbowAngle < MIN_ANGLE) {
          if (stage === 'DOWN') {
            setRepCount((prev) => prev + 1);
            setStage('UP');
            setFeedback('Great rep! Now slowly lower.');
          } else {
            setFeedback('Hold the contraction!');
          }
        } else {
          setFeedback(`Angle: ${elbowAngle.toFixed(0)}°`);
        }

        if (stage === 'DOWN' && elbowAngle < MAX_ANGLE - 10 && elbowAngle > MIN_ANGLE) {
            setFeedback('Extend your arm fully at the bottom.');
        }

      } catch (e) {
        setFeedback('Please make sure your full arm is in view.');
      }
    } else {
      setFeedback('No person detected.');
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
      const results = poseLandmarkerRef.current.detectForVideo(
        video,
        startTimeMs
      );
      onResults(results);
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
      poseLandmarkerRef.current?.close();
    };
  }, [predict]);

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b">
        <h1 className="font-headline text-3xl font-bold">Live Workout</h1>
        <p className="text-muted-foreground">
          Real-time bicep curl detection and form analysis.
        </p>
      </header>
      <div className="flex-1 relative">
        <Webcam
          ref={webcamRef}
          mirrored={true}
          className="absolute w-full h-full object-cover"
          videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-4">
          <div className="rounded-lg bg-black/50 backdrop-blur-sm p-4 w-1/4 text-center">
            <p className="font-bold text-primary text-sm uppercase tracking-wider">
              Reps
            </p>
            <p className="text-5xl font-bold text-white tabular-nums">
              {repCount}
            </p>
          </div>
          <div className="rounded-lg bg-black/50 backdrop-blur-sm p-4 w-1/4 text-center">
            <p className="font-bold text-primary text-sm uppercase tracking-wider">
              Stage
            </p>
            <p className="text-3xl font-bold text-white capitalize">
                {stage}
            </p>
          </div>
          <div className="rounded-lg bg-black/50 backdrop-blur-sm p-4 flex-1 text-left flex items-center gap-4 min-w-[200px]">
              <Dumbbell className="w-8 h-8 text-primary" />
              <div>
                <p className="font-bold text-primary">Feedback</p>
                <p className="text-lg text-white">{feedback}</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
