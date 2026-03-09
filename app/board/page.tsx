"use client";

import React, { useEffect, useState, useMemo } from "react";
import boards from "../data/board.json";
import { useRouter } from "next/navigation";
import { useCounter } from "../store/store";
import toast from "react-hot-toast";
import { api } from "../components/api";

/* -------------------- Types -------------------- */
interface MePayload {
  balance_birr?: string;
  main_balance_birr?: string;
  balance?: number | string;
  main_balance?: number | string;
}

/* -------------------- Helpers -------------------- */
function parseNumberLoose(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

const BingoBoard: React.FC = () => {
  const [showSecondHundred, setShowSecondHundred] = useState(false);
  const [me, setMe] = useState<MePayload | null>(null);
  const router = useRouter();

  const {
    winner,
    roomHeaderData,
    setPlayerBoard,
    userBoard,
    userBoard2,
  } = useCounter();

  const playing = roomHeaderData?.status === "playing";
  const stakeAmount = roomHeaderData?.stake_amount ?? 0;

  // Fetch balance from /me API
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    api
      .get(`/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setMe(res.data as MePayload))
      .catch((err) => {
        console.error("GET /me failed:", err?.response?.data || err?.message);
      });
  }, []);

  // Compute total balance from /me response
  const balance = useMemo(() => {
    const a = parseNumberLoose(me?.balance_birr ?? me?.balance);
    const b = parseNumberLoose(me?.main_balance_birr ?? me?.main_balance);
    return a + b;
  }, [me]);

  const lowBalance = stakeAmount > balance;

  // Handle board click - immediate selection and send to backend
  const handleBoardClick = (boardNumber: number) => {
    // Validation: Check balance
    if (lowBalance) {
      toast.error(`Insufficient balance (${balance} ETB < ${stakeAmount} ETB stake)`);
      return;
    }

    // Validation: Check if board already taken by others
    const isSelectedByOthers = roomHeaderData?.selected_board_numbers?.includes(boardNumber);
    if (isSelectedByOthers) {
      toast.error("Board already selected by another player");
      return;
    }

    // Validation: Check if game is playing - redirect to game if already playing
    if (playing) {
      router.push("/game");
      return;
    }

    // Determine which slot to use (no immediate redirect - wait for countdown)
    if (userBoard === null || userBoard === boardNumber) {
      if (userBoard === boardNumber) {
        toast.success(`Board ${boardNumber} already selected`);
        return;
      }
      setPlayerBoard(1, boardNumber);
      toast.success(`Board ${boardNumber} selected! Waiting for game to start...`);
    } else if (userBoard2 === null || userBoard2 === boardNumber) {
      if (userBoard2 === boardNumber) {
        toast.success(`Board ${boardNumber} already selected`);
        return;
      }
      setPlayerBoard(2, boardNumber);
      toast.success(`Board ${boardNumber} selected as 2nd board!`);
    } else {
      toast.error("You already have 2 boards selected");
    }
  };

  // Reload when a winner is announced
  useEffect(() => {
    if (winner) {
      window.location.reload();
    }
  }, [winner]);

  // Auto-redirect to /game when game is playing (with or without board)
  useEffect(() => {
    if (playing) {
      router.push("/game");
    }
  }, [playing, router]);

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
  const [hasRedirected, setHasRedirected] = useState(false);

  // Check if countdown is at 1 or less (disable selections)
  const isLastSecond = roomHeaderData?.status === "about_to_start" && secondsLeft <= 1;

  useEffect(() => {
    const interval = setInterval(
      () => setSecondsLeft(calculateTimeLeft()),
      1000
    );
    return () => clearInterval(interval);
  }, [futureTime]);

  // Auto-redirect when countdown reaches 1 second
  useEffect(() => {
    const countdownAtOne = roomHeaderData?.status === "about_to_start" && secondsLeft === 1;
    
    if (countdownAtOne && !hasRedirected) {
      setHasRedirected(true);
      router.push("/game");
    }
  }, [secondsLeft, roomHeaderData?.status, hasRedirected, router]);

  // Helper to render a range of boards
  const renderBoardButtons = (start: number, end: number) => {
    return (
      <div className="grid grid-cols-10 gap-2 sm:grid-cols-5">
        {boards.slice(start - 1, end).map((_, index) => {
          const boardNumber = start + index;
          const isSelectedByOthers =
            roomHeaderData?.selected_board_numbers?.includes(boardNumber) &&
            roomHeaderData?.status !== "playing";

          // Check if selected by current user
          const isSelectedByMe = userBoard === boardNumber || userBoard2 === boardNumber;
          const slotNumber = userBoard === boardNumber ? 1 : userBoard2 === boardNumber ? 2 : 0;

          // Disable if last second or already taken
          const isDisabled = isLastSecond || isSelectedByOthers;

          return (
            <button
              key={boardNumber}
              onClick={() => !isDisabled && handleBoardClick(boardNumber)}
              disabled={isDisabled}
              data-testid={`board-btn-${boardNumber}`}
              className={`relative flex items-center justify-center w-7 h-7 text-lg font-bold rounded-md shadow-md sm:w-8 sm:h-8 transition-all ${
                isLastSecond && !isSelectedByMe
                  ? "bg-gray-400 cursor-not-allowed opacity-50"
                  : isSelectedByOthers
                  ? "bg-red-500 cursor-not-allowed"
                  : isSelectedByMe
                  ? "bg-green-500 text-white"
                  : "bg-purple-300 hover:bg-purple-200 active:scale-95"
              }`}
              title={
                isLastSecond
                  ? "Game starting..."
                  : isSelectedByOthers
                  ? "Board already taken"
                  : isSelectedByMe
                  ? `Your board ${slotNumber}`
                  : "Click to select"
              }
            >
              {boardNumber}
              {isSelectedByMe && (
                <span className="absolute -top-1 -right-1 text-xs bg-black bg-opacity-50 rounded-full w-3 h-3 flex items-center justify-center">
                  {slotNumber}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // My selected boards preview
  const myBoards = [userBoard, userBoard2].filter((b) => b !== null) as number[];

  return (
    <div className="flex font-mono flex-col items-center min-h-screen bg-purple-400">
      <div className="mb-4 bg-purple-700 w-full rounded-b-xl">
        <div className="flex mt-2 text-black justify-around items-center space-x-4 mb-4">
          <div className="text-center bg-white rounded-full p-1 px-2">
            <p className="text-sm">Balance</p>
            <p className="text-sm font-bold">{balance} ETB</p>
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
        {/* Balance warning */}
        {lowBalance && (
          <div className="text-center text-red-200 text-sm pb-2">
            Insufficient balance ({balance} ETB)
          </div>
        )}
      </div>

      {/* 1–100 board buttons */}
      {renderBoardButtons(1, 100)}

      {/* Preview my selected boards */}
      {myBoards.length > 0 && (
        <div className="mt-4 flex sm:flex-row gap-4">
          {myBoards.map((boardNumber) => {
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

      <p className="mt-4 text-sm">© Dire Bingo 2025</p>
    </div>
  );
};

export default BingoBoard;
