import { useState, useRef, useEffect, useCallback } from 'react';

/* --- TIMELINE ANIMATION HOOK --- */
/* Manages the playback loop for the market history timeline */

interface UseTimelineAnimationProps {
  durationInSeconds?: number; // Default: 30s
  totalFrames: number;
}

export function useTimelineAnimation({ 
  durationInSeconds = 30, 
  totalFrames 
}: UseTimelineAnimationProps) {
  
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const speedRef = useRef(1); 

  const progressPerMs = totalFrames / (durationInSeconds * 1000);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      
      setProgress(prevProgress => {
        const increment = deltaTime * progressPerMs * speedRef.current;
        const nextProgress = prevProgress + increment;

        // Auto-Pause at end
        if (nextProgress >= totalFrames - 0.01) {
          setIsPlaying(false);
          return totalFrames - 0.01;
        }
        
        return nextProgress;
      });
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [totalFrames, progressPerMs]);

  useEffect(() => {
    if (isPlaying) {
      if (progress >= totalFrames - 1) {
        setProgress(0);
      }

      previousTimeRef.current = undefined; 
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate, totalFrames]); 

  const togglePlay = () => setIsPlaying(p => !p);

  return {
    progress,
    setProgress, 
    isPlaying,
    togglePlay,
    setSpeed: (s: number) => { speedRef.current = s; }
  };
}
