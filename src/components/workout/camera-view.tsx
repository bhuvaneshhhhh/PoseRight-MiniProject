'use client';

import {
  DrawingUtils,
  PoseLandmarker,
  type PoseLandmarkerResult,
  type Landmark
} from '@mediapipe/tasks-vision';
import { useEffect, useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface CameraViewProps {
  onPoseData: (landmarks: Landmark[]) => void;
}

export function CameraView({ onPoseData }: CameraViewProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef<number>();
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const onResults = useCallback((results: PoseLandmarkerResult) => {
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
      const landmarks = results.landmarks[0];
      onPoseData(landmarks); // Send data to parent

      const drawingUtils = new DrawingUtils(canvasCtx);
      
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
  }, [onPoseData]);

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
      poseLandmarkerRef.current.detectForVideo(video, startTimeMs, (results) =>
        onResults(results)
      );
    }

    requestRef.current = requestAnimationFrame(predict);
  }, [onResults]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Devices Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (webcamRef.current && webcamRef.current.video) {
          webcamRef.current.video.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };
    
    getCameraPermission();
  }, [toast]);
  
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
        minPoseDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      });
      poseLandmarkerRef.current = landmarker;
      requestRef.current = requestAnimationFrame(predict);
    };

    if(hasCameraPermission) {
        initializePoseLandmarker();
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      poseLandmarkerRef.current?.close();
    };
  }, [predict, hasCameraPermission]);

  return (
    <>
      <Webcam
        ref={webcamRef}
        mirrored={true}
        className="absolute inset-0 h-full w-full object-contain"
        videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ transform: 'scaleX(-1)' }}
      />
      {hasCameraPermission === false && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
             <Alert variant="destructive" className="max-w-md">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser to use the live workout feature.
                  </AlertDescription>
              </Alert>
         </div>
      )}
    </>
  );
}
