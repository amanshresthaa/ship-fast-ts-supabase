import { useState, useEffect, useRef, useCallback } from 'react';

interface UseQuizTimerProps {
  initialTimeInMinutes?: number;
  autoSubmitOnExpiry?: boolean;
  onTimeExpired?: () => void;
}

interface UseQuizTimerReturn {
  timeLeft: string;
  isExpired: boolean;
  totalSeconds: number;
  pause: () => void;
  resume: () => void;
  reset: (newTimeInMinutes?: number) => void;
  isPaused: boolean;
}

export const useQuizTimer = ({
  initialTimeInMinutes = 60,
  autoSubmitOnExpiry = false,
  onTimeExpired
}: UseQuizTimerProps = {}): UseQuizTimerReturn => {
  const [totalSeconds, setTotalSeconds] = useState(initialTimeInMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = useCallback((seconds: number): string => {
    if (seconds <= 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const timeLeft = formatTime(totalSeconds);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback((newTimeInMinutes?: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const newTime = newTimeInMinutes ? newTimeInMinutes * 60 : initialTimeInMinutes * 60;
    setTotalSeconds(newTime);
    setIsExpired(false);
    setIsPaused(false);
  }, [initialTimeInMinutes]);

  useEffect(() => {
    if (isPaused || isExpired || totalSeconds <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTotalSeconds(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          setIsExpired(true);
          if (onTimeExpired) {
            onTimeExpired();
          }
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, isExpired, totalSeconds, onTimeExpired]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeLeft,
    isExpired,
    totalSeconds,
    pause,
    resume,
    reset,
    isPaused
  };
};
