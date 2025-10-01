'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { DrawingUtils, FilesetResolver, PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

type Landmark = NormalizedLandmark;

export function WorkoutView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const { toast } = useToast();
  const animationFrameId = useRef<number | null>(null);

  const [formScore, setFormScore] = useState(0);
  const [aiFeedback, setAiFeedback] = useState('Waiting to start...');

  useEffect(() => {
    const createPoseLandmarker = async () => {
      try {
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
        });
        setPoseLandmarker(landmarker);
      } catch (error) {
        console.error('Error creating PoseLandmarker:', error);
        toast({
          variant: 'destructive',
          title: 'Initialization Error',
          description: 'Failed to load the pose tracking model. Please refresh the page.',
        });
      }
    };
    createPoseLandmarker();
  }, [toast]);
  
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
    }
  }, [toast]);

  useEffect(() => {
    if (hasCameraPermission && poseLandmarker && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        const drawingUtils = canvasCtx ? new DrawingUtils(canvasCtx) : null;
        
        let lastVideoTime = -1;

        const predictWebcam = () => {
            if (video.currentTime !== lastVideoTime && canvasCtx && drawingUtils) {
                lastVideoTime = video.currentTime;
                const startTimeMs = performance.now();
                const results = poseLandmarker.detectForVideo(video, startTimeMs);

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

                if (results.landmarks && results.landmarks.length > 0) {
                    const landmarks = results.landmarks[0];
                    drawingUtils.drawLandmarks(landmarks);
                    drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);
                }
                canvasCtx.restore();
            }
            animationFrameId.current = requestAnimationFrame(predictWebcam);
        };
        
        video.addEventListener('loadeddata', predictWebcam);
        
        return () => {
            video.removeEventListener('loadeddata', predictWebcam);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
    }
  }, [hasCameraPermission, poseLandmarker]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            
            {!hasCameraPermission && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center text-primary-foreground">
                    <h2 className="font-headline text-4xl font-bold text-white">Camera Access Required</h2>
                     <p className="mt-2 max-w-lg text-lg text-slate-300">
                        Please allow camera access in your browser to start your live workout.
                    </p>
                </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4 flex gap-4">
                <div className="rounded-lg bg-black/50 backdrop-blur-sm p-4 w-1/3">
                    <p className="font-bold text-primary">Form Score</p>
                    <p className="text-3xl font-bold text-white">{Math.round(formScore)}</p>
                </div>
                <div className="rounded-lg bg-black/50 backdrop-blur-sm p-4 flex-1 text-left">
                    <p className="font-bold text-primary">AI Feedback</p>
                    <p className="text-lg text-white">{aiFeedback}</p>
                </div>
            </div>
        </div>
        <div className="mt-4">
            { !hasCameraPermission && (
                <Alert variant="destructive">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access to use this feature. You may need to refresh the page after granting permission.
                    </AlertDescription>
                </Alert>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
