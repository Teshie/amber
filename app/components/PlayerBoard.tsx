"use client";
import React from "react";
import boards from "../data/board.json";

interface PlayerBoardProps {
  userBoard?: number | null;
  markedNumbers?: number[];
  /** Latest calls — the last value gets a one-shot ripple on this cartela when present */
  calledNumbers?: number[];
  onNumberClick?: (num: number) => void;
  isPlaceholder?: boolean;
  /** Shown when there is no cartela (empty slot); default matches “wait” copy from design */
  placeholderText?: string;
  /** Smaller grid for lobby / board-picker previews */
  variant?: "default" | "compact";
  /** No cell clicks (e.g. selection preview on /board) */
  readOnly?: boolean;
}

const HEADER_STYLES = [
  "bg-[#FBBF24]",
  "bg-[#16A34A]",
  "bg-[#2563EB]",
  "bg-[#DC2626]",
  "bg-[#7E22CE]",
] as const;

const BINGO = ["B", "I", "N", "G", "O"] as const;

function FreeStar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.125rem] w-[1.125rem] drop-shadow-sm sm:h-[1.3rem] sm:w-[1.3rem] md:h-[1.35rem] md:w-[1.35rem]"
      aria-hidden
    >
      <path
        fill="#FBBF24"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  );
}

const DEFAULT_PLACEHOLDER =
  "እባክዎ ይህ ጨዋታ እስኪጨርስ ይጠብቁ";

const PlayerBoard: React.FC<PlayerBoardProps> = ({
  userBoard,
  markedNumbers = [],
  calledNumbers = [],
  onNumberClick,
  isPlaceholder = false,
  placeholderText = DEFAULT_PLACEHOLDER,
  variant = "default",
  readOnly = false,
}) => {
  const isCompact = variant === "compact";

  const shellClass = isCompact
    ? "w-full min-w-0 max-w-[5.5rem] rounded-md border border-white/90 bg-white/[0.35] p-0.5 shadow-sm font-sans sm:max-w-[6.5rem]"
    : "w-full min-w-0 max-w-full rounded-xl border border-white bg-white/[0.28] p-1.5 shadow-sm backdrop-blur-[2px] font-sans sm:p-2";

  const headerRow = (
    <div
      className={
        isCompact
          ? "mb-px grid grid-cols-5 gap-px"
          : "mb-1 grid grid-cols-5 gap-0.5 sm:mb-1.5 sm:gap-1"
      }
    >
      {BINGO.map((ch, i) => (
        <div
          key={ch}
          className={`text-center font-bold leading-none text-white ${
            isCompact
              ? "rounded-[2px] py-px text-[7px] sm:text-[8px]"
              : "rounded-sm py-0.5 text-sm sm:rounded-md sm:py-1 sm:text-base"
          } ${HEADER_STYLES[i]}`}
        >
          {ch}
        </div>
      ))}
    </div>
  );

  if (isPlaceholder || !userBoard || userBoard <= 0) {
    return (
      <div className={shellClass}>
        {headerRow}
        <div
          className={
            isCompact
              ? "flex min-h-[2.25rem] items-center justify-center rounded border border-white/50 bg-white/15 px-0.5 py-1"
              : "flex min-h-[140px] items-center justify-center rounded-lg border border-white/50 bg-white/20 px-2 py-4 sm:min-h-[168px] sm:rounded-xl sm:py-6"
          }
        >
          <p
            className={
              isCompact
                ? "text-center text-[7px] font-medium leading-snug text-[#312E81] sm:text-[8px]"
                : "text-center text-base font-medium leading-snug text-[#312E81] sm:text-lg"
            }
          >
            {placeholderText}
          </p>
        </div>
      </div>
    );
  }

  const numbers: (number | string)[][] = boards[userBoard - 1] || [];

  const cellBase = isCompact
    ? "flex aspect-square w-full min-h-0 min-w-0 max-w-full items-center justify-center rounded-[2px] border py-0 text-center text-[7px] font-bold tabular-nums leading-none sm:text-[8px]"
    : "flex aspect-[5/4] w-full min-h-0 min-w-0 max-w-full items-center justify-center rounded-md border py-px text-center text-sm font-bold tabular-nums leading-tight sm:rounded-lg sm:text-lg md:text-xl";

  const lastCalled =
    calledNumbers.length > 0
      ? calledNumbers[calledNumbers.length - 1]
      : undefined;

  const getCellClasses = (
    number: number | string,
    isMarked: boolean,
    isJustCalled: boolean
  ) => {
    const ripple = isJustCalled ? " bingo-call-ripple" : "";
    if (number === "FREE") {
      return `${cellBase} cursor-default border-transparent bg-[#16A34A] shadow-inner`;
    }
    if (isMarked) {
      return `${cellBase} border-[#15803d] bg-[#16A34A] text-white shadow-sm${ripple}`;
    }
    return `${cellBase} border-gray-300 bg-white text-gray-900 shadow-sm active:opacity-90${ripple}`;
  };

  const handleClick = (number: number | string) => {
    if (number === "FREE") return;
    if (typeof number === "number" && onNumberClick) {
      onNumberClick(number);
    }
  };

  const gridGap = isCompact ? "gap-px" : "gap-0.5 sm:gap-1";

  return (
    <div
      className={`${shellClass}${readOnly ? " pointer-events-none select-none" : ""}`}
    >
      <p
        className={
          isCompact
            ? "mb-px text-center text-[7px] font-semibold leading-none text-[#312E81]/90 sm:text-[8px]"
            : "mb-1 text-center text-sm font-medium leading-snug text-gray-500 sm:mb-1.5 sm:text-base"
        }
      >
        Cartela #{userBoard}
      </p>
      {headerRow}
      <div className={`grid min-w-0 grid-cols-5 overflow-visible ${gridGap}`}>
        {numbers.flat().map((number: number | string, index: number) => {
          const isMarked =
            typeof number === "number" && markedNumbers.includes(number);
          const isJustCalled =
            typeof number === "number" &&
            lastCalled !== undefined &&
            number === lastCalled;

          if (number === "FREE") {
            return (
              <div
                key={index}
                className={getCellClasses(number, false, false)}
                aria-label="Free space"
              >
                {isCompact ? (
                  <span className="text-[6px] font-bold text-white sm:text-[7px]" aria-hidden>
                    ★
                  </span>
                ) : (
                  <FreeStar />
                )}
              </div>
            );
          }

          const cellClass = getCellClasses(number, isMarked, isJustCalled);

          if (readOnly || !onNumberClick) {
            return (
              <div key={index} className={cellClass}>
                {number}
              </div>
            );
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(number)}
              className={cellClass}
            >
              {number}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerBoard;
