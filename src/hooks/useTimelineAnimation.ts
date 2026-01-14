import { useState, useRef, useEffect, useCallback } from 'react';

interface UseTimelineAnimationProps {
  durationInSeconds?: number; // How long to play the whole history
  totalFrames: number;
}

export function useTimelineAnimation({ 
  durationInSeconds = 30, // Default: 30 seconds to play full history
  totalFrames 
}: UseTimelineAnimationProps) {
  
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Refs to track state inside the requestAnimationFrame loop without triggering re-renders
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const speedRef = useRef(1); // 1x speed

  // Calculate how much "progress" to add per millisecond
  // progress per ms = (total frames) / (duration * 1000)
  const progressPerMs = totalFrames / (durationInSeconds * 1000);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      
      // Update Progress
      setProgress(prevProgress => {
        // Calculate the increment based on time elapsed
        const increment = deltaTime * progressPerMs * speedRef.current;
        const nextProgress = prevProgress + increment;

        // Auto-Pause if we hit the end
        if (nextProgress >= totalFrames - 0.01) {
          setIsPlaying(false);
          return totalFrames - 0.01;
        }
        
        return nextProgress;
      });
    }
    previousTimeRef.current = time;
    
    // Continue loop if still playing
    // (Note: We check a ref or the state setter callback logic to decide whether to continue. 
    // Here relying on the parent effect to cancel is safer/cleaner)
    requestRef.current = requestAnimationFrame(animate);
  }, [totalFrames, progressPerMs]);

  // The Effect that starts/stops the loop
  useEffect(() => {
    if (isPlaying) {
      // If we are at the end, reset to start before playing
      if (progress >= totalFrames - 1) {
        setProgress(0);
      }

      previousTimeRef.current = undefined; // Reset time tracking
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate, totalFrames]); // progress is intentionally omitted to avoid resetting the effect on every frame

  const togglePlay = () => setIsPlaying(p => !p);

  return {
    progress,
    setProgress, // Expose this so the slider can still manually update it
    isPlaying,
    togglePlay,
    setSpeed: (s: number) => { speedRef.current = s; }
  };
}
