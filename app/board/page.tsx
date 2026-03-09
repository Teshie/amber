"use client";

import React, { useEffect, useState } from "react";
import boards from "../data/board.json";
import { useRouter } from "next/navigation";
import { useCounter } from "../store/store";
import toast from "react-hot-toast";

interface BingoBoardProps {
  wallet?: number;
  activeGame?: number;
  stake?: number;
}

const BingoBoard: React.FC<BingoBoardProps> = ({}) => {
  const [showSecondHundred, setShowSecondHundred] = useState(false);
  const router = useRouter();

  const {
    winner,
    balance,
    roomHeaderData,
    setPlayerBoard,
    selectedBoardNumbers,
    resetPlayerBoards,
    setBoardNumber,
  } = useCounter();

  // local selection (up to 2 boards)
  const [selectedBoards, setSelectedBoards] = useState<number[]>([]);

  const playing = roomHeaderData?.status === "playing";
  const stakeAmount = roomHeaderData?.stake_amount;
  const cantPlay = (stakeAmount ?? 0) > (balance ?? 0);

  const toggleBoardSelection = (boardNumber: number) => {
    setSelectedBoards((prev) => {
      // If already selected, deselect it
      if (prev.includes(boardNumber)) {
        return prev.filter((bn) => bn !== boardNumber);
      }

      // If not selected and we have less than 2, add it
      if (prev.length < 2) {
        return [...prev, boardNumber];
      }

      // If we already have 2, replace the second one
      return [prev[0], boardNumber];
    });
  };

  const handleStartGameClick = () => {
    // Check if any selected board is already taken
    const hasTakenBoard = selectedBoards.some((board) =>
      roomHeaderData?.selected_board_numbers?.includes(board)
    );

    if (hasTakenBoard) {
      toast.error("One of the selected boards is already taken.");
      return;
    }

    if (selectedBoards.length === 0) {
      toast.error("Please select at least one board first.");
      return;
    }

    resetPlayerBoards();

    // Directly set all selected boards, no confirmation modal
    selectedBoards.forEach((board, index) => {
      const slot = (index + 1) as 1 | 2;
      // local pending state (if needed)
      setBoardNumber(board, slot);
      // send exact board to backend
      setPlayerBoard(slot, board);
    });

    router.push(`/game`);
  };

  // Optional: reload when a winner is announced
  useEffect(() => {
    if (winner) {
      window.location.reload();
    }
  }, [winner]);

  // Countdown from roomHeaderData.start_time
  const futureTime = roomHeaderData?.start_time
    ? Date.parse(roomHeaderData.start_time)
    : 0;

  const calculateTimeLeft = () => {
    const nowUTC = Date.now();
    const difference = futureTime - nowUTC;
    return Math.max(Math.floor(difference / 1000), 0);
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateTimeLeft());

  useEffect(() => {
    const interval = setInterval(
      () => setSecondsLeft(calculateTimeLeft()),
      1000
    );
    return () => clearInterval(interval);
  }, [futureTime]);

  // helper to render a range of boards
  const renderBoardButtons = (start: number, end: number) => {
    return (
      <div className="grid grid-cols-10 gap-2 sm:grid-cols-5">
        {boards.slice(start - 1, end).map((_, index) => {
          const boardNumber = start + index;
          const isSelectedByOthers =
            roomHeaderData?.selected_board_numbers?.includes(boardNumber) &&
            roomHeaderData?.status !== "playing";

          const isSelectedByMe = selectedBoards.includes(boardNumber);
          const selectionIndex = selectedBoards.indexOf(boardNumber);

          const isDisabled = isSelectedByOthers && !isSelectedByMe;

          return (
            <button
              key={boardNumber}
              onClick={() => {
                if (!isDisabled) {
                  toggleBoardSelection(boardNumber);
                }
              }}
              className={`relative flex items-center justify-center w-7 h-7 text-lg font-bold rounded-md shadow-md sm:w-8 sm:h-8 ${
                isSelectedByOthers
                  ? "bg-red-500"
                  : isSelectedByMe
                  ? "bg-green-500 text-white"
                  : "bg-purple-300"
              } ${isDisabled ? "opacity-70 cursor-not-allowed" : ""}`}
              disabled={isDisabled}
              title={
                isDisabled
                  ? "Board already taken"
                  : isSelectedByMe
                  ? `Selected as board ${selectionIndex + 1}`
                  : "Select board"
              }
            >
              {boardNumber}
              {isSelectedByMe && (
                <span className="absolute -top-1 -right-1 text-xs bg-black bg-opacity-50 rounded-full w-3 h-3 flex items-center justify-center">
                  {selectionIndex + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };
  const isWaiting =
    !playing &&
    !(roomHeaderData?.status === "about_to_start" && secondsLeft > 0);

  return (
    <div className="flex font-mono flex-col items-center min-h-screen bg-purple-400">
      <div className="mb-4 bg-purple-700 w-full rounded-b-xl">
        <div className="flex mt-2 text-black justify-around items-center space-x-4 mb-4">
          <div className="text-center bg-white rounded-full p-1">
            <p className="text-sm">Active Game</p>
            <p className="text-sm font-bold">{playing ? 1 : 0}</p>
          </div>
          <div className="text-center w-24 bg-white rounded-full p-1">
            <p className="text-sm">Stake</p>
            <p className="text-sm font-bold">{roomHeaderData?.stake_amount}</p>
          </div>
          <div className="text-center w-24 bg-white rounded-full p-1">
            <p className="text-sm">Start in</p>
            <p className="text-sm font-bold">
              {playing
                ? "playing..."
                : roomHeaderData?.status === "about_to_start" && secondsLeft > 0
                ? `${secondsLeft}s`
                : "waiting"}
            </p>
          </div>
        </div>
      </div>

      {/* 1–100 board buttons */}
      {renderBoardButtons(1, 100)}

      {/* Preview selected boards (one or two) */}
      {selectedBoards.length > 0 && (
        <div className="mt-4 flex  sm:flex-row gap-4">
          {selectedBoards.map((boardNumber) => {
            const grid = boards[boardNumber - 1];
            if (!grid) return null;

            return (
              <div key={boardNumber} className="flex flex-col items-center">
                <p className="mb-1 text-sm font-bold">Board {boardNumber}</p>
                <div className="grid grid-cols-5 gap-1">
                  {grid.flat().map((number, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center w-5 h-5 text-sm bg-purple-300 rounded-md shadow-md"
                    >
                      {number === "FREE" ? "F" : number}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show 100–200 toggle */}
      {boards.length > 100 && (
        <div className="mt-3 w-full flex flex-col items-center gap-2">
          {showSecondHundred &&
            renderBoardButtons(101, Math.min(200, boards.length))}

          <button
            onClick={() => setShowSecondHundred((v) => !v)}
            className="px-4 py-1 bg-purple-700 text-white rounded-full text-sm shadow"
          >
            {showSecondHundred ? "Hide 100–200" : "Show 100–200"}
          </button>
        </div>
      )}

      {/* Bottom buttons */}
      <div className="flex justify-between w-full mt-4 px-4">
        <button className="px-6 py-2 text-white bg-blue-500 rounded-full sm:px-4 sm:py-1">
          Back
        </button>
        <button
          disabled={playing || selectedBoards.length === 0 || isWaiting}
          onClick={handleStartGameClick}
          className="px-6 py-2 text-white bg-orange-500 rounded-full sm:px-4 sm:py-1 disabled:opacity-60"
        >
          Start Game
        </button>
      </div>

      <p className="mt-4 text-sm">© Dire Bingo 2024</p>
    </div>
  );
};

export default BingoBoard;
