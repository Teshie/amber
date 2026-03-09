"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCounter } from "../store/store";
import { api } from "./api";
import toast from "react-hot-toast";

/* -------------------- Types -------------------- */
interface Room {
  room_id: string;
  stake_amount: number;
  status: "pending" | "about_to_start" | "playing" | "claimed" | string;
  number_of_players: number;
  possible_win_cents: number;
  start_time?: string; // RFC3339
}

interface MePayload {
  balance_birr?: string; // e.g. "123.45"
  main_balance_birr?: string; // e.g. "67.89"
  balance?: number | string; // optional alt
  main_balance?: number | string; // optional alt
}

/* -------------------- Helpers -------------------- */
function parseNumberLoose(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function decodeJwtPayload<T = any>(token?: string | null): T | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/* -------------------- Component -------------------- */
const RELOAD_FLAG = "bingo_initial_reload_done";
const ROOMS_WS = "wss://henb.teshie.dev";
const WS_BASE = "wss://henb.teshie.dev";

const BingoBoard: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { setSockUrl } = useCounter() as any;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [me, setMe] = useState<MePayload | null>(null);

  // "now" tick to drive per-second countdowns
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const reload = () => {
    window.location.reload();
  };
  // Make sure we only ever trigger one initial reload (persisted in localStorage)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const already = localStorage.getItem(RELOAD_FLAG);
    if (!already) {
      localStorage.setItem(RELOAD_FLAG, "1");
      // Perform a single hard reload
      window.location.reload();
    }
  }, []);

  // Persist token if route is /login/<token>
  useEffect(() => {
    if (typeof window === "undefined") return;
    // e.g. /login/<JWT>
    const tokenFromPath = pathname?.split("/login/")[1];
    if (tokenFromPath && tokenFromPath.length > 10) {
      localStorage.setItem("token", tokenFromPath);
      localStorage.setItem("authToken", tokenFromPath);
    }
  }, [pathname]);

  // Fetch /me after we have a token
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = decodeJwtPayload<{ tid?: number }>(token);
    if (!payload?.tid) return;

    api
      .get(`/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setMe(res.data as MePayload))
      .catch((err) => {
        console.error("GET /me failed:", err?.response?.data || err?.message);
        toast.error("Failed to load your profile.");
      });
  }, [pathname]);

  // Rooms WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${ROOMS_WS}/ws/rooms`);

    ws.onopen = () => {
      // optional: console.log("rooms ws connected");
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (Array.isArray(data)) {
          setRooms(data as Room[]);
        }
      } catch (e) {
        console.error("rooms ws parse error", e);
      }
    };
    ws.onerror = (e) => {
      console.error("rooms ws error", e);
    };
    ws.onclose = () => {
      // optional: console.log("rooms ws closed");
    };

    return () => ws.close();
  }, []);

  // Compute total balance safely
  const balance = useMemo(() => {
    const a = parseNumberLoose(me?.balance_birr ?? me?.balance);
    const b = parseNumberLoose(me?.main_balance_birr ?? me?.main_balance);
    return a + b;
  }, [me]);

  const remainingSeconds = (startTime?: string): number => {
    if (!startTime) return 0;
    const t = Date.parse(startTime);
    if (Number.isNaN(t)) return 0;
    const diff = Math.floor((t - now) / 1000);
    return Math.max(0, diff);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="text-sm flex flex-col items-center min-h-screen notify font-mono">
      <div className="w-full text-white rounded-b-lg shadow-lg p-2">
        {/* Header: balance + refresh */}
        <div className="flex justify-between items-center p-1">
          <div className="balance p-1 mb-2 flex rounded items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 w-8 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
              />
            </svg>
            <p className="font-bold">{balance} ETB</p>
          </div>
          <button
            onClick={handleRefresh}
            className="current p-1 mb-2 flex rounded items-center font-bold"
            title="Refresh"
          >
            Refresh
          </button>
        </div>

        {/* Table header */}
        <div className="bg-orange-600 mb-1 p-2 rounded-t-lg shadow-md grid grid-cols-5 text-center items-center">
          <div className="font-semibold">Stake</div>
          <div className="font-semibold">Active</div>
          <div className="font-semibold">Players</div>
          <div className="font-semibold">Derash</div>
          <div className="font-semibold">Play</div>
        </div>

        {/* Loading indicator for rooms */}
        <div className="grid place-items-center">
          {rooms.length < 1 && (
            <div className="loader flex justify-center items-center" />
          )}
        </div>

        {/* Rooms list */}
        <div className="grid grid-cols-1 gap-4">
          {[...rooms]
            .sort((a, b) => a.stake_amount - b.stake_amount)
            .filter((r) => Number(r.stake_amount) !== 100) // hide 100 ETB stake
            .map((item) => {
              const remaining = remainingSeconds(item.start_time);
              const lowBalance = item.stake_amount > (balance || 0);
              const isPlaying = item.status === "playing";

              // Active column label
              let statusLabel = "";
              if (lowBalance) statusLabel = "Low balance";
              else if (remaining > 0) statusLabel = `${remaining}s`;
              else if (item.status === "claimed") statusLabel = "Finished";
              else if (
                item.status === "pending" ||
                item.status === "about_to_start"
              )
                statusLabel = "Ready";
              else statusLabel = item.status || "idle";

              const canPlay =
                !lowBalance &&
                (item.status === "pending" || item.status === "about_to_start");

              return (
                <div key={item.room_id} className="relative">
                  {/* “Active game” banner */}
                  {isPlaying && (
                    <div className="absolute right-1/2 border border-green-600 rounded-lg bg-green-500 -top-1 transform z-10 flex justify-center items-center">
                      <div className="bg-red-500 text-white text-xs font-bold px-2 rounded-lg shadow-md flex items-center">
                        Active game
                      </div>
                      <p className="relative flex h-3 w-3 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                      </p>
                    </div>
                  )}

                  <div className="current p-3 rounded-lg shadow-md grid grid-cols-5 text-center items-center">
                    {/* Stake */}
                    <div className="font-bold">{item.stake_amount} ETB</div>

                    {/* Active / countdown / status */}
                    <div
                      className={`${
                        isPlaying ? "text-gray-400" : "text-white"
                      }`}
                    >
                      {statusLabel}
                    </div>

                    {/* Players */}
                    <div>{item.number_of_players}</div>

                    {/* Derash / possible win */}
                    <div>{(item.possible_win_cents / 100 || 0) + " ETB"}</div>

                    {/* Play button */}
                    <button
                      disabled={isPlaying || lowBalance}
                      onClick={() => {
                        const token = localStorage.getItem("token") || "";
                        const wsUrl = `${WS_BASE}/ws/room/${encodeURIComponent(
                          item.room_id
                        )}?token=${encodeURIComponent(token)}`;

                        setSockUrl(wsUrl);
                        router.push(
                          `/board?room=${encodeURIComponent(item.room_id)}`
                        );
                      }}
                      className={`${
                        isPlaying || lowBalance
                          ? "bg-yellow-200 opacity-60 cursor-not-allowed"
                          : "bg-yellow-500"
                      } text-purple-900 px-4 py-1 rounded-lg font-semibold`}
                    >
                      Play
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <p className="mt-4 text-sm">© Dire Bingo 2025</p>
    </div>
  );
};

export default BingoBoard;
