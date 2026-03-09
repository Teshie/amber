"use client";
import React, { useEffect, useRef, useState } from "react";
import BingoBoard from "../components/BingoBoard";
import CurrentCall from "../components/CurrentCall";
import PlayerBoard from "../components/PlayerBoard";
import BingoNumbers from "../components/BingoNumbers";
import BingoButton from "../components/BingoButton";
import GameHeader from "../components/Header";
import { useCounter } from "../store/store";
import { useRouter } from "next/navigation";
import NotifyBoard from "../components/NotifyBoard";
import toast from "react-hot-toast";

const GamePage: React.FC = () => {
  const {
    leaveGameWithZero,
    leaveGame,
    winners,
    finalGameDetails,
    roomHeaderData,
    reload,
    winnerBoard,
    winner,
    timeLeft,
    won,
    closeMessege,
    notification,
    claimBingo,
    calledNumbers,
    selectedBoardNumbers,
    startGame,
    userBoard,
    userBoard2, // 👈 ADD THIS
    claimResult, // from store
  } = useCounter();

  const router = useRouter();
  const [isUserInteracted, setIsUserInteracted] = useState<boolean>(false);
  const reloads = () => setIsUserInteracted((prev) => !prev);

  const playing = ["playing", "about_to_start"].includes(
    roomHeaderData?.status ?? ""
  );

  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token") || null);
    }
  }, []);

  const refresh = () => {
    // optional soft refresh logic here
  };

  const redirectToGames = () => {
    if (token) {
      const sanitizedToken = token.replace("}", "");
      router.push(`/login/${sanitizedToken}`);
    }
  };

  const handleClose = () => {
    sessionStorage.removeItem("hasReloaded");
    redirectToGames();
  };

  const handleLeave = () => {
    if (token) {
      leaveGameWithZero();
      sessionStorage.removeItem("hasReloaded");
      const sanitizedToken = token.replace("}", "");
      router.push(`/login/${sanitizedToken}`);
    }
  };

  // Countdown from RFC3339 start_time
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

  useEffect(() => {
    if ((closeMessege as any)?.error_messege) {
      toast(`📢: ${(closeMessege as any)?.error_messege}`);
    }
  }, [closeMessege]);

  const winnersCount = winners?.length || 0;

  const lastNotificationRef = useRef<string | null>(null);
  useEffect(() => {
    const notificationKey = `${notification?.title}:${notification?.message}`;
    if (
      (notification?.title || notification?.message) &&
      notificationKey !== lastNotificationRef.current
    ) {
      toast(`📢: ${notification?.message}`, { style: { fontSize: "10px" } });
      lastNotificationRef.current = notificationKey;
    }
  }, [notification]);

  // Helper to format amounts nicely
  const fmt = (n?: number) =>
    typeof n === "number" && !Number.isNaN(n)
      ? n.toFixed(2).replace(/\.00$/, "")
      : n ?? "-";

  const [markedNumbers, setMarkedNumbers] = useState<number[]>([]);

  // Toggle mark for a number (shared across both boards)
  const handleNumberToggle = (num: number) => {
    setMarkedNumbers((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };
  // Winner display name for single-winner header
  const singleWinnerName =
    winnersCount === 1
      ? winners?.[0]?.user?.first_name ||
        winners?.[0]?.user?.username ||
        "Player"
      : null;
  const cols = Math.min(winnersCount || 0, 2) || 1;
  const gridCols = { 1: "grid-cols-1", 2: "grid-cols-2" }[cols];
  return (
    <div className="min-h-screen main font-mono">
      {winnersCount > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="notify p-4 rounded-lg shadow-lg bg-gray-800">
            {winnersCount > 1 && (
              <h2 className="text-white text-xl font-semibold text-center mb-4">
                Winners 🎉
              </h2>
            )}
            <div
              className={`grid grid-cols-${
                winnersCount > 2 ? 2 : winnersCount
              } sm:grid-cols-${winnersCount > 2 ? 2 : winnersCount} gap-2`}
            >
              {winners?.map((entry: any, index: number) => {
                const name =
                  entry?.user?.first_name || entry?.user?.username || "Player";
                return (
                  <div key={index} className="flex flex-col items-center">
                    {/* Keep per-card heading too (nice for multi-winner rounds) */}
                    <h3 className="text-white text-lg font-bold mb-2">
                      {name} Won 🎉
                    </h3>
                    <p className="text-white text-md mb-4">
                      Amount: {fmt(entry.win_amount)} Birr
                    </p>
                    <NotifyBoard
                      userBoard={entry.winner_board_number}
                      isSmall={true}
                      matched_to={entry.matched_to}
                    />
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleClose}
              className="w-full mt-4 p-2 text-lg font-bold bg-green-600 rounded"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Not won modal (uses claimResult.matched_to if present) */}
      {notification.title === "400" && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="notify p-4 rounded-lg shadow-lg bg-gray-800  max-w-md">
            <p className="text-white text-lg font-semibold mb-2">
              Board Not Won
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
              <NotifyBoard
                userBoard={
                  finalGameDetails?.user_board_number ?? userBoard ?? 0
                }
                isSmall={true}
                matched_to={claimResult?.matched_to}
              />
            </div>
            <button
              onClick={handleClose}
              className="w-full mt-4 p-2 text-lg font-bold bg-green-600 rounded"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex justify-between p-2 header rounded-lg mb-2 text-center text-xs sm:text-sm">
        <div className="flex flex-col">
          <span>Game ID</span>
          <span className="font-bold">
            {roomHeaderData?.room_id?.split("-")[0]}
          </span>
        </div>
        <div className="flex flex-col">
          <span>Derash</span>
          <span className="font-bold">{fmt(roomHeaderData?.possible_win)}</span>
        </div>
        <div className="flex flex-col">
          <span>Players</span>
          <span className="font-bold">
            {roomHeaderData?.number_of_players ?? "-"}
          </span>
        </div>
        <div className="flex flex-col">
          <span>Bet</span>
          <span className="font-bold">{fmt(roomHeaderData?.stake_amount)}</span>
        </div>
        <div className="flex flex-col">
          <span>Call</span>
          <span className="font-bold">{calledNumbers?.length}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between">
        <div className="flex justify-between space-x-2 h-full w-full">
          <div className="">
            <BingoNumbers calledNumbers={calledNumbers} />
          </div>
          <div className="flex flex-col justify-between  w-full">
            <div className="flex flex-col items-center justify-center">
              <CurrentCall
                calledNumbers={calledNumbers}
                timeLeft={secondsLeft}
                status={roomHeaderData?.status}
              />
            </div>

            {/* Board 1 - Show actual board or placeholder */}
            <div className="">
              {true ? (
                <PlayerBoard
                  userBoard={
                    userBoard ?? finalGameDetails?.user_board_number ?? 0
                  }
                  markedNumbers={markedNumbers}
                  onNumberClick={handleNumberToggle}
                />
              ) : (
                <div className="w-full boadr-main rounded-lg text-center ">
                  <div className="flex justify-around mb-1">
                    <span className="bg-yellow-500 py-0.5 w-7 h-6 rounded text-xs">
                      B
                    </span>
                    <span className="bg-green-500 py-0.5 w-7 h-7 rounded text-xs">
                      I
                    </span>
                    <span className="bg-blue-500 py-0.5 w-7 h-7 rounded text-xs">
                      N
                    </span>
                    <span className="bg-orange-500 py-0.5 w-7 h-7 rounded text-xs">
                      G
                    </span>
                    <span className="bg-purple-500 py-0.5 w-7 h-7 rounded text-xs">
                      O
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-0.5 p-0.5 h-[180px]  flex items-center justify-center">
                    <div className="col-span-5 text-gray-400 text-sm">
                      Board One Here
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Board 2 - Show actual board or placeholder */}
            <div className="mt-1">
              {userBoard2 || finalGameDetails?.user_board_number_2 ? (
                <PlayerBoard
                  userBoard={
                    userBoard2 ?? finalGameDetails?.user_board_number_2 ?? 0
                  }
                  markedNumbers={markedNumbers}
                  onNumberClick={handleNumberToggle}
                />
              ) : (
                <div className="w-full boadr-main rounded-lg text-center">
                  <div className="flex justify-around mb-1">
                    <span className="bg-yellow-500 py-0.5 w-7 h-6 rounded text-xs">
                      B
                    </span>
                    <span className="bg-green-500 py-0.5 w-7 h-7 rounded text-xs">
                      I
                    </span>
                    <span className="bg-blue-500 py-0.5 w-7 h-7 rounded text-xs">
                      N
                    </span>
                    <span className="bg-orange-500 py-0.5 w-7 h-7 rounded text-xs">
                      G
                    </span>
                    <span className="bg-purple-500 py-0.5 w-7 h-7 rounded text-xs">
                      O
                    </span>
                  </div>
                  <div className="grid grid-cols-5 bg green-500 gap-0.5 p-0.5 h-[180px] flex items-center justify-center">
                    <div className="col-span-5 text-red-700 animate-pulse text-xl">
                      ካርቴላ ቁጥር ሁለት{" "}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BINGO Claim */}
      <button
        disabled={calledNumbers?.length <= 3}
        onClick={claimBingo}
        className="w-full p-2 mt-1 text-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg"
      >
        BINGO!
      </button>

      <div className="flex justify-between w-full px-4 mt-4">
        <button
          onClick={refresh}
          className="px-6 py-2 text-white bg-blue-500 rounded-full sm:px-4 sm:py-1"
        >
          Refresh
        </button>
        <button
          onClick={handleLeave}
          disabled={calledNumbers?.length > 0}
          className="px-6 py-2 text-white bg-orange-500 rounded-full sm:px-4 sm:py-1 disabled:opacity-60"
        >
          Leave
        </button>
      </div>
    </div>
  );
};

export default GamePage;
