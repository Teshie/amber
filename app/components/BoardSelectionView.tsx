"use client";

import React, { useEffect, useMemo, useState } from "react";
import boards from "../data/board.json";
import {
  useCounter,
  S1_FIXED_STAKE_ETB,
} from "../store/store";
import toast from "react-hot-toast";
import { api } from "./api";
import PlayerBoard from "./PlayerBoard";

interface MePayload {
  balance_birr?: string;
  main_balance_birr?: string;
  balance?: number | string;
  main_balance?: number | string;
}

function parseNumberLoose(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

const BoardSelectionView: React.FC = () => {
  const [meProfile, setMeProfile] = useState<MePayload | null>(null);

  const {
    winner,
    balance: wsBalance,
    roomHeaderData,
    setPlayerBoard,
    clearBoard,
    userBoard,
    userBoard2,
    rejoinDefaultRoomBoard,
    closeMessege,
    dismissCloseMessage,
    setCurrentView,
  } = useCounter();

  const playing = roomHeaderData?.status === "playing";
  const stakeAmount = S1_FIXED_STAKE_ETB;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    api
      .get("/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setMeProfile(res.data as MePayload))
      .catch((err) => {
        console.warn(
          "GET /me (board page):",
          err?.response?.data || err?.message
        );
      });
  }, []);

  const meWalletTotal = useMemo(() => {
    if (!meProfile) return undefined;
    const hasField =
      meProfile.balance_birr != null ||
      meProfile.main_balance_birr != null ||
      meProfile.balance != null ||
      meProfile.main_balance != null;
    if (!hasField) return undefined;
    const a = parseNumberLoose(meProfile.balance_birr ?? meProfile.balance);
    const b = parseNumberLoose(
      meProfile.main_balance_birr ?? meProfile.main_balance
    );
    return a + b;
  }, [meProfile]);

  const effectiveWalletBalance =
    typeof wsBalance === "number" && Number.isFinite(wsBalance)
      ? wsBalance
      : meWalletTotal;

  const cantPlay =
    typeof effectiveWalletBalance === "number" &&
    Number.isFinite(effectiveWalletBalance) &&
    stakeAmount > effectiveWalletBalance;

  const refreshMeSoon = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    window.setTimeout(() => {
      api
        .get(`/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setMeProfile(res.data as MePayload))
        .catch(() => {});
    }, 450);
  };

  const futureTime = roomHeaderData?.start_time
    ? Date.parse(roomHeaderData.start_time)
    : 0;

  const calculateTimeLeft = () => {
    const nowUTC = Date.now();
    const difference = futureTime - nowUTC;
    return Math.max(Math.floor(difference / 1000), 0);
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.max(Math.floor((futureTime - Date.now()) / 1000), 0)
  );

  useEffect(() => {
    setSecondsLeft(calculateTimeLeft());
    const interval = setInterval(
      () => setSecondsLeft(calculateTimeLeft()),
      1000
    );
    return () => clearInterval(interval);
  }, [futureTime]);

  const isLastSecond =
    roomHeaderData?.status === "about_to_start" && secondsLeft <= 1;

  const [hasSwitched, setHasSwitched] = useState(false);

  useEffect(() => {
    const countdownAtOne =
      roomHeaderData?.status === "about_to_start" && secondsLeft === 1;

    if (countdownAtOne && !hasSwitched) {
      setHasSwitched(true);
      setCurrentView("game");
    }
  }, [secondsLeft, roomHeaderData?.status, hasSwitched, setCurrentView]);

  useEffect(() => {
    if (playing) {
      setCurrentView("game");
    }
  }, [playing, setCurrentView]);

  useEffect(() => {
    if (!winner) return;
    rejoinDefaultRoomBoard();
    setHasSwitched(false);
  }, [winner, rejoinDefaultRoomBoard]);

  useEffect(() => {
    const err = closeMessege?.error_messege?.trim();
    if (!err) return;
    const low = err.toLowerCase();
    const isBalance = low.includes("insufficient");
    const isTaken = low.includes("already taken");
    if (isBalance || isTaken) {
      toast.error(err);
    }
    dismissCloseMessage();
  }, [closeMessege, dismissCloseMessage]);

  // Tap your number = unselect (WS clear → server refund before round). New picks fill slot 1, then slot 2.
  const handleBoardClick = (boardNumber: number, isDisabled: boolean) => {
    if (isDisabled) return;

    if (cantPlay) {
      toast.error("Insufficient balance for this stake.");
      return;
    }
    if (playing) {
      return;
    }

    const isMine = userBoard === boardNumber || userBoard2 === boardNumber;
    const isSelectedByOthers =
      roomHeaderData?.selected_board_numbers?.includes(boardNumber) && !isMine;

    if (isSelectedByOthers) {
      toast.error("Board already selected by another player");
      return;
    }

    if (userBoard === boardNumber) {
      clearBoard(1);
      refreshMeSoon();
      return;
    }
    if (userBoard2 === boardNumber) {
      clearBoard(2);
      refreshMeSoon();
      return;
    }

    const numericWallet =
      typeof effectiveWalletBalance === "number" &&
      Number.isFinite(effectiveWalletBalance)
        ? effectiveWalletBalance
        : typeof meWalletTotal === "number" && Number.isFinite(meWalletTotal)
          ? meWalletTotal
          : undefined;

    if (userBoard === null) {
      if (
        stakeAmount > 0 &&
        numericWallet !== undefined &&
        numericWallet < stakeAmount
      ) {
        toast.error(
          `Insufficient balance (${numericWallet} ETB; need ${stakeAmount} ETB)`
        );
        return;
      }
      setPlayerBoard(1, boardNumber);
      refreshMeSoon();
      return;
    }

    if (userBoard2 === null) {
      if (
        stakeAmount > 0 &&
        numericWallet !== undefined &&
        numericWallet < stakeAmount
      ) {
        toast.error(
          `Insufficient balance (${numericWallet} ETB; need ${stakeAmount} ETB for 2nd board`
        );
        return;
      }
      setPlayerBoard(2, boardNumber);
      refreshMeSoon();
      return;
    }
  };

  const renderCartelaButton = (boardNumber: number) => {
    const notPlaying = roomHeaderData?.status !== "playing";
    const isOccupiedInRoom =
      notPlaying &&
      roomHeaderData?.selected_board_numbers?.includes(boardNumber);

    const isMine =
      userBoard === boardNumber || userBoard2 === boardNumber;
    const slotBadge =
      userBoard === boardNumber ? 1 : userBoard2 === boardNumber ? 2 : 0;

    const mergedMine = new Set<number>();
    if (userBoard != null && userBoard >= 1) mergedMine.add(userBoard);
    if (userBoard2 != null && userBoard2 >= 1) mergedMine.add(userBoard2);
    const atMaxSelection = mergedMine.size >= 2 && !mergedMine.has(boardNumber);

    const isDisabled = Boolean(
      isLastSecond ||
        (isOccupiedInRoom && !isMine) ||
        (atMaxSelection && !isMine)
    );

    let cellClass =
      "relative flex aspect-square min-h-0 w-full min-w-0 items-center justify-center rounded-md border border-black/10 text-[11px] font-bold tabular-nums shadow-sm active:opacity-90 sm:text-xs md:text-sm ";
    if (isOccupiedInRoom && !isMine) {
      cellClass += "bg-[#FF9F43] text-black";
    } else if (isMine) {
      cellClass += "bg-green-600 text-white ring-1 ring-black/20";
    } else {
      cellClass += "bg-[#EDE7F3] text-gray-900";
    }
    if (isDisabled)
      cellClass += ` cursor-not-allowed${isMine ? "" : " opacity-80"}`;

    return (
      <button
        key={boardNumber}
        type="button"
        onClick={() => handleBoardClick(boardNumber, isDisabled)}
        className={cellClass}
        disabled={isDisabled}
        data-testid={`board-btn-${boardNumber}`}
        title={
          isDisabled
            ? isLastSecond
              ? "Game starting…"
              : isOccupiedInRoom && !isMine
                ? "Board already taken"
                : ""
            : ""
        }
      >
        {boardNumber}
        {isMine && slotBadge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/55 text-[8px] font-bold text-white sm:h-4 sm:w-4 sm:text-[9px]">
            {slotBadge}
          </span>
        )}
      </button>
    );
  };

  const userBalanceDisplay =
    typeof effectiveWalletBalance === "number" &&
    Number.isFinite(effectiveWalletBalance)
      ? effectiveWalletBalance.toLocaleString()
      : "—";
  const walletLine =
    userBalanceDisplay === "—" ? "—" : `${userBalanceDisplay} ETB`;
  const stakeDisplay =
    roomHeaderData?.stake_amount != null &&
    !Number.isNaN(Number(roomHeaderData.stake_amount))
      ? String(roomHeaderData.stake_amount)
      : "—";
  const stakeLine = stakeDisplay === "—" ? "—" : `${stakeDisplay} ETB`;
  const countdownDisplay = playing
    ? "0"
    : secondsLeft > 0
      ? String(secondsLeft)
      : "—";

  const previewBoardIds = useMemo(() => {
    const ids: number[] = [];
    if (userBoard != null && userBoard >= 1) ids.push(userBoard);
    if (userBoard2 != null && userBoard2 >= 1) ids.push(userBoard2);
    return Array.from(new Set(ids));
  }, [userBoard, userBoard2]);

  return (
    <div
      className="flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-[#C3A9D8] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] font-sans"
      data-testid="board-selection-view"
    >
      <header className="mx-auto mb-1 w-full max-w-lg shrink-0">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div
            className="flex min-h-[2.65rem] items-center justify-center rounded-md border border-[#B39BC9] bg-white px-0.5 py-1 shadow-sm sm:min-h-[2.95rem]"
            title="Seconds until the game starts"
          >
            <span className="text-lg font-bold leading-none text-[#EA580C] tabular-nums sm:text-xl">
              {countdownDisplay}
            </span>
          </div>
          <div className="flex min-h-[2.65rem] flex-col items-center justify-center gap-0 rounded-md border border-[#B39BC9] bg-white px-0.5 py-1 text-center shadow-sm sm:min-h-[2.95rem]">
            <span className="text-[9px] font-semibold leading-tight text-[#312E81] sm:text-[10px]">
              Wallet
            </span>
            <span className="max-w-full truncate text-xs font-bold leading-tight text-[#312E81] tabular-nums sm:text-sm">
              {walletLine}
            </span>
          </div>
          <div className="flex min-h-[2.65rem] flex-col items-center justify-center gap-0 rounded-md border border-[#B39BC9] bg-white px-0.5 py-1 text-center shadow-sm sm:min-h-[2.95rem]">
            <span className="text-[9px] font-semibold leading-tight text-[#312E81] sm:text-[10px]">
              Stake
            </span>
            <span className="max-w-full truncate text-xs font-bold leading-tight text-[#312E81] tabular-nums sm:text-sm">
              {stakeLine}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-2 flex h-[50dvh] min-h-0 w-full max-w-lg shrink-0 flex-col px-1">
        <section
          className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/80 sm:rounded-xl"
          aria-label="Cartela numbers"
        >
          <div className="no-scrollbar h-full min-h-0 overflow-y-auto overscroll-y-contain p-1.5 [-webkit-overflow-scrolling:touch] sm:p-2">
            <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
              {boards.map((_, i) => renderCartelaButton(i + 1))}
            </div>
          </div>
        </section>
      </div>

      {previewBoardIds.length > 0 && (
        <div
          className="mx-auto mt-2 flex w-full max-w-lg shrink-0 flex-wrap items-start justify-center gap-2.5 px-1 sm:gap-3"
          aria-label="Selected cartela previews"
        >
          {previewBoardIds.map((id) => (
            <PlayerBoard key={id} userBoard={id} variant="compact" readOnly />
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1" aria-hidden />

      <p className="shrink-0 py-1 text-center text-[10px] text-white/85 sm:text-xs">
        © Sky Bingo 2026
      </p>
    </div>
  );
};

export default BoardSelectionView;
