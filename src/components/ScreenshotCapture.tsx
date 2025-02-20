
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScreenshotCaptureProps {
  onAnalysisComplete: (analysis: string) => void;
}

export const ScreenshotCapture = ({ onAnalysisComplete }: ScreenshotCaptureProps) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAndAnalyze = async () => {
    try {
      setIsCapturing(true);
      
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve(null);
        };
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      // Send to our Supabase Edge Function for analysis
      const { data, error } = await supabase.functions.invoke('analyze-screenshot', {
        body: { image: imageBase64 }
      });

      if (error) throw error;

      onAnalysisComplete(data.analysis);
      
      toast({
        title: "Success",
        description: "Screenshot analyzed successfully",
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast({
        title: "Error",
        description: "Failed to capture or analyze screenshot",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={captureAndAnalyze}
      disabled={isCapturing}
      title="Capture and analyze screen content"
    >
      <Camera className={`w-4 h-4 ${isCapturing ? 'animate-pulse' : ''}`} />
    </Button>
  );
};
