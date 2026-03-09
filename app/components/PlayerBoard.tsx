"use client";
import React from "react";
import boards from "../data/board.json";

interface PlayerBoardProps {
  userBoard?: number | null;
  markedNumbers?: number[];
  onNumberClick?: (num: number) => void;
  isPlaceholder?: boolean; // 👈 Optional prop for placeholder state
}

const PlayerBoard: React.FC<PlayerBoardProps> = ({
  userBoard,
  markedNumbers = [],
  onNumberClick,
  isPlaceholder = false,
}) => {
  // Handle placeholder state
  if (isPlaceholder || !userBoard || userBoard <= 0) {
    return (
      <div className="w-full boadr-main rounded-lg text-center ">
        <div className="flex justify-around mb-1">
          <span className="bg-yellow-500 py-0.5 w-7 h-6 rounded text-xs">
            B
          </span>
          <span className="bg-green-500 py-0.5 w-7 h-6 rounded text-xs">I</span>
          <span className="bg-blue-500 py-0.5 w-7 h-6 rounded text-xs">N</span>
          <span className="bg-orange-500 py-0.5 w-7 h-6 rounded text-xs">
            G
          </span>
          <span className="bg-purple-500 py-0.5 w-7 h-6 rounded text-xs">
            O
          </span>
        </div>
        <div className="grid grid-cols-5 gap-0.5 p-0.5 h-[180px] flex items-center justify-center">
          <div className="col-span-5 text-gray-400 text-xl text-red-700 animate-pulse">ካርቴላ ቁጥር አንድ </div>
        </div>
      </div>
    );
  }

  const numbers: (number | string)[][] = boards[userBoard - 1] || [];

  const getClassName = (number: number | string) => {
    if (number === "FREE") {
      return "called-numbers text-white cursor-default";
    }
    const isMarked =
      typeof number === "number" && markedNumbers.includes(number);

    return isMarked
      ? "bg-green-500 text-white"
      : "bg-[#B99470] border border-white/90";
  };

  const handleClick = (number: number | string) => {
    if (number === "FREE") return;
    if (typeof number === "number" && onNumberClick) {
      onNumberClick(number);
    }
  };

  return (
    <div className="w-full boadr-main rounded-lg text-center">
      <div className="flex justify-around mb-1">
        <span className="bg-yellow-500 py-0.5 w-7 h-5 rounded text-xs">B</span>
        <span className="bg-green-500 py-0.5 w-7 h-5 rounded text-xs">I</span>
        <span className="bg-blue-500 py-0.5 w-7 h-5 rounded text-xs">N</span>
        <span className="bg-orange-500 py-0.5 w-7 h-5 rounded text-xs">G</span>
        <span className="bg-purple-500 py-0.5 w-7 h-5 rounded text-xs">O</span>
      </div>

      <div className="grid grid-cols-5 gap-0.5 p-0.5">
        {numbers.flat().map((number: number | string, index: number) => (
          <button
            key={index}
            onClick={() => handleClick(number)}
            className={`flex items-center justify-center w-10 h-8 text-xl font-bold rounded shadow cursor-pointer ${getClassName(
              number
            )}`}
          >
            {number === "FREE" ? "*" : number}
          </button>
        ))}
      </div>

      <div className="text-red-600 font-bold text-xs">Board No.{userBoard}</div>
    </div>
  );
};

export default PlayerBoard;
