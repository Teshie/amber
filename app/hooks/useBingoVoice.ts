"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function getLetter(number: number) {
  if (number >= 1 && number <= 15) return "B";
  if (number >= 16 && number <= 30) return "I";
  if (number >= 31 && number <= 45) return "N";
  if (number >= 46 && number <= 60) return "G";
  if (number >= 61 && number <= 75) return "O";
  return "-";
}

export function useBingoVoice(calledNumbers: number[]) {
  const [isUserInteracted, setIsUserInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentCall = calledNumbers?.slice(-1)[0];

  const playNumberAudio = useCallback(
    async (num: number) => {
      if (isMuted || !audioContextRef.current) return;

      const letter = getLetter(num).toLowerCase();
      try {
        const response = await fetch(`/voice/${letter}${num}.mp3`);
        const audioData = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(
          audioData
        );
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
      } catch (error) {
        console.error(`Failed to play audio for ${num}:`, error);
      }
    },
    [isMuted]
  );

  const enableAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
    setIsUserInteracted(true);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  useEffect(() => {
    if (isUserInteracted && currentCall !== undefined) {
      playNumberAudio(currentCall);
    }
  }, [currentCall, isUserInteracted, playNumberAudio]);

  return { enableAudio, toggleMute, isMuted, isUserInteracted };
}
