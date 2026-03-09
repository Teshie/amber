import React, { useEffect, useState, useRef } from "react";

interface BingoNumbersProps {
  calledNumbers: number[];
  timeLeft?: number | null;
  status: string | undefined;
}

const CurrentCall: React.FC<BingoNumbersProps> = ({
  calledNumbers,
  timeLeft,
  status,
}) => {
  const [isUserInteracted, setIsUserInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentCall = calledNumbers?.slice(-1)[0];
  const lastFour = calledNumbers?.slice(-2);

  // Map numbers to Bingo letters
  function getLetter(number: number) {
    if (number >= 1 && number <= 15) return "B";
    if (number >= 16 && number <= 30) return "I";
    if (number >= 31 && number <= 45) return "N";
    if (number >= 46 && number <= 60) return "G";
    if (number >= 61 && number <= 75) return "O";
    return "-";
  }

  // Play number sound using Web Audio API
  const playNumberAudio = async (num: number) => {
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
  };

  // Initialize the audio context after user interaction
  const handlePlayButtonClick = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
    setIsUserInteracted(true); // Enable autoplay after user clicks the play button
  };

  // Play audio when a new number is called
  useEffect(() => {
    if (isUserInteracted && currentCall !== undefined) {
      playNumberAudio(currentCall);
    }
  }, [currentCall, isUserInteracted]);

  // Toggle mute/unmute
  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <div className="w-full text-sm text-center mb-1">
      {/* Status and Play Button */}
      <div className="p-2 status rounded-lg flex justify-between items-center text-sm font-bold mb-2">
        <p>{timeLeft === 0 ? status : timeLeft}</p>
        {!isUserInteracted ? (
          <button
            onClick={handlePlayButtonClick}
            className="current text-white rounded flex items-center"
            aria-label="Activate voice playback"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
              />
            </svg>
            <span>Voice</span>
          </button>
        ) : (
          <button
            onClick={toggleMute}
            className="current text-white rounded flex items-center"
            aria-label={
              isMuted ? "Unmute voice playback" : "Mute voice playback"
            }
          >
            {isMuted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                />
              </svg>
            )}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </button>
        )}
      </div>

      {/* Current Call */}
      <div className="p-2 current current-text text-blue-600 rounded-lg flex justify-around items-center text-sm font-bold  relative">
        {false  ? (
          <div className="flex text-four flex-row-reverse justify-center items-center h-10 p-1 rounded-lg">
            {lastFour?.map((number) => (
              <p
                key={number}
                className="mx-1 header text-center w-10 h-full flex justify-center items-center rounded-full text-white"
              >
                {getLetter(number)}-{number}
              </p>
            ))}
          </div>
        ) : (
          <p>Current Call</p>
        )}
        <div className="status relative w-12 h-12 rounded-full p-3 text-2xl text-center items-center flex justify-center font-bold text-white bg-blue-600">
          <div className="absolute inset-0 -m-2.5 rounded-full status flex justify-center items-center">
            <span>
              {getLetter(currentCall)}-{currentCall}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentCall;
