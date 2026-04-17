import React from "react";

interface CurrentCallProps {
  calledNumbers: number[];
  timeLeft?: number | null;
  status: string | undefined;
}

function getLetter(number: number) {
  if (number >= 1 && number <= 15) return "B";
  if (number >= 16 && number <= 30) return "I";
  if (number >= 31 && number <= 45) return "N";
  if (number >= 46 && number <= 60) return "G";
  if (number >= 61 && number <= 75) return "O";
  return "-";
}

const CurrentCall: React.FC<CurrentCallProps> = ({
  calledNumbers,
  timeLeft,
  status,
}) => {
  const currentCall = calledNumbers?.slice(-1)[0];
  const isPlaying = status === "playing";

  const seconds =
    typeof timeLeft === "number" && !Number.isNaN(timeLeft)
      ? Math.max(0, timeLeft)
      : 0;

  const isCountdown =
    !isPlaying && status === "about_to_start" && seconds > 0;

  const isWaiting = !isPlaying && !isCountdown;

  let bannerLabel: string;
  let bannerCircleContent: string;

  if (isPlaying) {
    bannerLabel = "Current Call";
    bannerCircleContent =
      currentCall !== undefined
        ? `${getLetter(currentCall)}${currentCall}`
        : "—";
  } else if (isCountdown) {
    bannerLabel = "Countdown";
    bannerCircleContent = String(seconds);
  } else {
    bannerLabel = "Waiting";
    bannerCircleContent = "—";
  }

  return (
    <div className="w-full min-w-0 overflow-visible px-0.5 pt-1.5 pb-3 font-sans text-sm sm:px-1 sm:pb-4 sm:text-base">
      <div className="relative z-0 overflow-visible rounded-lg bg-[#6A1B9A] py-1.5 pl-2 pr-2 shadow-sm sm:rounded-xl sm:py-2 sm:pl-2.5 sm:pr-2.5">
        <span className="block min-w-0 pr-[4rem] text-sm font-bold leading-tight text-white sm:pr-[5rem] sm:text-base">
          {bannerLabel}
        </span>

        <div
          className="absolute right-1.5 top-1/2 z-20 flex size-[3.75rem] -translate-y-1/2 items-center justify-center rounded-full bg-[#F97316] text-sm font-bold leading-tight text-white shadow-md ring-2 ring-white/40 sm:right-2 sm:size-[4.5rem] sm:text-base sm:ring-[3px]"
          aria-hidden
        >
          <span className="max-w-[3.5rem] truncate px-0.5 text-center text-2xl sm:max-w-[4rem] sm:text-4xl">
            {bannerCircleContent}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CurrentCall;
