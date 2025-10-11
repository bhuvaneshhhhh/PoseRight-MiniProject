
'use client';

import {
  DrawingUtils,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent } from '../ui/card';

export function WorkoutView() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>();
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);

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

      // Added pulsing effect for landmarks
      const pulseFactor = 0.5 * Math.sin(Date.now() * 0.01) + 0.5; // Oscillates between 0 and 1
      const landmarkRadius = 6 + 2 * pulseFactor; // Base radius 6, pulses up to 8

      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
        color: '#000000',
        lineWidth: 12,
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: '#808080',
        lineWidth: 4,
        radius: landmarkRadius,
      });
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
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.3,
        minTrackingConfidence: 0.6,
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
    <div className="h-full w-full flex flex-col">
      <header className="p-4 border-b bg-card z-10 shrink-0">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">Live Workout</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Demo tracking
        </p>
      </header>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="relative bg-black flex flex-col items-center justify-center lg:w-1/3 lg:h-full">
            <div className="relative w-full aspect-video lg:aspect-auto lg:h-full">
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
        </div>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            <Card>
                <CardContent className="p-6">
                    <h2 className="font-headline text-xl font-bold mb-4">Workout Instructions</h2>
                    <p className="text-muted-foreground">
                        This area can be used to display exercise instructions, upcoming moves, or other relevant information for the user during their workout. For now, it's a placeholder.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
