'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

export function WorkoutView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const { toast } = useToast();

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
    
    // Cleanup function to stop video stream when component unmounts
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            
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
                    <p className="text-3xl font-bold text-white">-</p>
                </div>
                <div className="rounded-lg bg-black/50 backdrop-blur-sm p-4 flex-1 text-left">
                    <p className="font-bold text-primary">AI Feedback</p>
                    <p className="text-lg text-white">Waiting to start...</p>
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
