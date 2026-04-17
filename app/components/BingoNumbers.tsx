import React from "react";

interface BingoNumbersProps {
  calledNumbers: number[];
  className?: string;
}

const HEADER_STYLES: Record<string, string> = {
  B: "bg-[#FBBF24]",
  I: "bg-[#16A34A]",
  N: "bg-[#2563EB]",
  G: "bg-[#DC2626]",
  O: "bg-[#7E22CE]",
};

const BingoNumbers: React.FC<BingoNumbersProps> = ({
  calledNumbers,
  className = "",
}) => {
  const columns = [
    { label: "B", numbers: Array.from({ length: 15 }, (_, i) => i + 1) },
    { label: "I", numbers: Array.from({ length: 15 }, (_, i) => i + 16) },
    { label: "N", numbers: Array.from({ length: 15 }, (_, i) => i + 31) },
    { label: "G", numbers: Array.from({ length: 15 }, (_, i) => i + 46) },
    { label: "O", numbers: Array.from({ length: 15 }, (_, i) => i + 61) },
  ];

  const lastCalledNumber = calledNumbers[calledNumbers.length - 1];

  return (
    <div
      className={`flex h-full min-h-0 min-w-0 w-full flex-col rounded-xl border border-white bg-white/[0.2] p-1 shadow-sm backdrop-blur-[1px] sm:p-1.5 ${className}`}
    >
      <div className="flex min-h-0 min-w-0 flex-1 gap-0.5 sm:gap-1">
        {columns.map((col) => (
          <div
            key={col.label}
            className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch gap-1 sm:gap-1.5"
          >
            <div
              className={`flex h-7 w-full min-w-0 shrink-0 items-center justify-center rounded-md text-xs font-bold leading-none text-white sm:h-8 sm:rounded-lg sm:text-sm ${HEADER_STYLES[col.label]}`}
            >
              {col.label}
            </div>
            {col.numbers.map((number) => {
              const isCalled = calledNumbers.includes(number);
              const isLastCalled = number === lastCalledNumber;
              return (
                <div
                  key={number}
                  className={`flex min-h-[1.05rem] w-full flex-1 basis-0 items-center justify-center rounded-lg border border-white px-px text-center text-xs font-bold tabular-nums leading-none tracking-tight shadow-none sm:min-h-[1.2rem] sm:px-0.5 sm:text-[13px] md:text-sm ${
                    isCalled
                      ? isLastCalled
                        ? "bingo-grid-current-blink border-white"
                        : "bg-[#16A34A] text-white"
                      : "border-white/75 bg-[rgba(190,194,206,0.58)] text-white"
                  } `}
                >
                  {number}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BingoNumbers;
