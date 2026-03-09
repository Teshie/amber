import React, { useState } from "react";
import boards from "../data/board.json";
import { useCounter } from "../store/store";

interface NotifyBoardProps {
  userBoard?: number;
  isSmall?: boolean;
  matched_to?: number[]; // can be undefined
}

const NotifyBoard: React.FC<NotifyBoardProps> = ({
  userBoard,
  isSmall = false,
  matched_to = [],
}) => {
  // Board numbers (array of arrays); flatten to 25 items
  const numbers: (number | string)[] = userBoard
    ? (boards[userBoard - 1] as any[]).flat()
    : [];
  const { calledNumbers } = useCounter();

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const onClickCell = (n: number | string) => {
    if (typeof n !== "number") return;
    setSelectedNumbers((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  };

  // Shared sizing for perfect grid alignment
  const textSize = isSmall ? "text-xs sm:text-sm" : "text-xl sm:text-2xl";
  const cellBase =
    "w-full aspect-square flex items-center justify-center font-bold rounded shadow-md";

  const cellClass = (n: number | string) => {
    if (n === "FREE")
      return `${cellBase} called-numbers text-white cursor-default ${textSize}`;

    const isCalled = calledNumbers?.includes(n as number);
    const isMatch = matched_to?.includes(n as number);
    const isSelected = selectedNumbers.includes(n as number);

    // Precedence: matched → called → selected → default
    if (isMatch) return `${cellBase} bg-green-500 text-white ${textSize}`;
    if (isCalled) return `${cellBase} bg-red-500 text-white ${textSize}`;
    if (isSelected) return `${cellBase} called-numbers text-white ${textSize}`;
    return `${cellBase} bg-[#B99470] shadow-lg backdrop-blur-md border border-white/90 ${textSize}`;
  };

  return (
    <div
      className={`notify w-full boadr-main rounded-lg text-center ${
        isSmall ? "small-board" : ""
      }`}
    >
      {/* B I N G O header: use the SAME 5-col grid so columns line up */}
      <div className="grid grid-cols-5 gap-1 mb-2">
        {["B", "I", "N", "G", "O"].map((ch) => (
          <span
            key={ch}
            className="w-full py-1 rounded-lg text-white font-bold text-center
                                    bg-gradient-to-b from-black/30 to-black/20 backdrop-blur
                                    bg-yellow-500 first:bg-yellow-500
                                    [&:nth-child(2)]:bg-green-500
                                    [&:nth-child(3)]:bg-blue-500
                                    [&:nth-child(4)]:bg-orange-500
                                    [&:nth-child(5)]:bg-purple-500"
          >
            {ch}
          </span>
        ))}
      </div>

      {/* Numbers grid – squares that align perfectly under the header */}
      <div className="grid grid-cols-5 gap-1 p-1">
        {numbers.map((n, i) => (
          <button
            key={`${n}-${i}`}
            onClick={() => onClickCell(n)}
            className={cellClass(n)}
          >
            {n === "FREE" ? "*" : n}
          </button>
        ))}
      </div>

      {userBoard && (
        <div className="text-red-600 font-bold mt-1">Board No.{userBoard}</div>
      )}
    </div>
  );
};

export default NotifyBoard;
