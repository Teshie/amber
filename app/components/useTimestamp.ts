// utils/useTimestamp.ts
import { useState, useEffect } from 'react';

export const useTimestamp = () => {
  const [timestamp, setTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 1000); // Update timestamp every second to force re-render

    return () => clearInterval(interval); // Clean up the interval when component unmounts
  }, []);

  return timestamp;
};
