"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/* =========================
   Types
========================= */

type NotificationMsg = {
  title: string | null;
  message: string | null;
};

export interface GameRoomState {
  room_id: string;
  stake_amount: number;
  status: string;
  start_time?: string | null;
  possible_win: number;
  number_of_players: number;
  selected_board_numbers: number[];
  players?: Array<{
    telegram_id: number;
    first_name: string;
    username?: string;
    board_number?: number;
    board_number_2?: number;
    has_paid: boolean;
  }>;
}

type WinnerUser = {
  id?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type WinnerEntry = {
  request_id?: string;
  is_self?: boolean;
  win_amount?: number;
  winner_board_number?: number;
  matched_to?: number[];
  user?: WinnerUser;
  message?: string;
};

type FinalGameDetails = {
  user_board_number?: number;
  user_board_number_2?: number;
};

type CloseMessage = {
  error_messege?: string;
};

type ClaimResult = {
  type?: string;
  ok: boolean;
  request_id?: string;
  winner_board_number?: number;
  matched_to?: number[];
  message?: string;
  user?: WinnerUser;
};

interface CounterContextType {
  /* ---- Room & Game state ---- */
  roomHeaderData?: GameRoomState;
  gameRoomState?: {
    board_number?: number | null;
    board_number_2?: number | null;
    time_left?: number | null;
    stake_amount?: number;
  };
  selectedBoardNumbers: number[];
  calledNumbers: number[];
  timeLeft?: number;
  winners: WinnerEntry[];
  finalGameDetails?: FinalGameDetails;
  winner?: string | null;
  winnerBoard?: number;
  won: boolean;
  closeMessege?: CloseMessage;
  notification: NotificationMsg;
  balance?: number;
  username?: string;
  userBoard?: number | null;
  userBoard2?: number | null;

  claimResult?: ClaimResult | null;
  stakeAmount?: number;
  receivedMessages: any[];

  /* ---- Local counters (demo) ---- */
  count: number;
  increment: () => void;
  decrement: () => void;

  /* ---- WebSocket wiring ---- */
  setSockUrl: (url: string) => void;
  reconnectWebSocket: () => void;

  /* ---- Game actions ---- */
  startGame: () => void;
  claimBingo: () => void;

  leaveGame: () => void;
  leaveGameWithZero: () => void;

  /* ---- Board selection ---- */
  setBoardNumber: (n: number, slot?: 1 | 2) => void;
  setPlayerBoard: (slot?: 1 | 2, board?: number) => void; // <-- board arg added
  clearBoard: (slot: 1 | 2) => void;
  resetPlayerBoards: () => void; // ✅ add this

  /* ---- Misc ---- */
  reload: () => void;
}

/* =========================
   Constants / Helpers
========================= */

const API_BASE =
  (typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_HTTP_API ||
      `${window.location.protocol}//${window.location.host}`)) ||
  "https://henb.teshie.dev";

const LSK_ROOM_ID = "arada.currentRoomId";
const LSK_WS_URL = "arada.currentRoomWS";

/** Safe parse JSON */
function safeParse<T = any>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function displayName(u?: WinnerUser): string {
  if (!u) return "Player";
  const first = (u.first_name || "").trim();
  const last = (u.last_name || "").trim();
  const user = (u.username || "").trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (user) return user;
  return "Player";
}

/* =========================
   Context
========================= */

const CounterContext = createContext<CounterContextType | undefined>(undefined);

/* =========================
   Provider
========================= */

export const CounterProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  /* ---- UI & derived state ---- */
  const [count, setCount] = useState<number>(0);
  const [roomHeaderData, setRoomHeaderData] = useState<
    GameRoomState | undefined
  >(undefined);
  const [selectedBoardNumbers, setSelectedBoardNumbers] = useState<number[]>(
    []
  );
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);

  const [winners, setWinners] = useState<WinnerEntry[]>([]);
  const [finalGameDetails, setFinalGameDetails] = useState<
    FinalGameDetails | undefined
  >(undefined);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnerBoard, setWinnerBoard] = useState<number | undefined>(undefined);
  const [won, setWon] = useState<boolean>(false);
  const [closeMessege, setCloseMessage] = useState<CloseMessage | undefined>(
    undefined
  );
  const [notification, setNotifications] = useState<NotificationMsg>({
    title: "",
    message: "",
  });
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [userBoard, setUserBoard] = useState<number | null>(null);
  const [userBoard2, setUserBoard2] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number | undefined>(undefined);

  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);

  /* ---- Board selection (local “pending” numbers) ---- */
  const [boardNumber, setBoardNumberState] = useState<number>(0);
  const [boardNumber2, setBoardNumber2State] = useState<number>(0);

  /* ---- WebSocket plumbing ---- */
  const [sockUrl, setSockUrlState] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  // Awaiting clear state for both slots
  const awaitingClearRef = useRef<{
    active: boolean;
    slot?: 1 | 2;
    timeoutId?: any;
    onCleared?: () => void;
  }>({ active: false });

  /* ---- Token capture from /login/:token path ---- */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tokenPath = pathname.split("/login/")[1];
      if (tokenPath) {
        const sanitized = tokenPath.replace("}", "");
        localStorage.setItem("token", sanitized);
        localStorage.setItem("authToken", sanitized);
      }
    }
  }, [pathname]);

  /* ---- Persist WS URL + RoomID ---- */
  const setSockUrl = (url: string) => {
    setSockUrlState(url);
    try {
      localStorage.setItem(LSK_WS_URL, url);
      const m = /\/ws\/room\/([^?]+)/.exec(url);
      if (m && m[1]) {
        localStorage.setItem(LSK_ROOM_ID, decodeURIComponent(m[1]));
      }
    } catch {}
  };
  // Clear both boards (server + local) WITHOUT leaving the room
  const resetPlayerBoards = () => {
    const s = wsRef.current;

    // Tell server both boards are cleared (if WS is open)
    if (s && s.readyState === WebSocket.OPEN) {
      s.send(JSON.stringify({ action: "set_board", board_number: null }));
      s.send(JSON.stringify({ action: "set_board_2", board_number: null }));
    }

    // Local clear
    setUserBoard(null);
    setUserBoard2(null);
    setBoardNumberState(0);
    setBoardNumber2State(0);
  };

  /* ---- Rehydrate from DB if page refreshes ---- */
  const rehydrateFromDB = useCallback(async () => {
    try {
      const roomID = localStorage.getItem(LSK_ROOM_ID);
      if (!roomID) return;

      const res = await fetch(
        `${API_BASE}/rooms/${encodeURIComponent(roomID)}`,
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        }
      );
      if (!res.ok) return;
      const dto = await res.json();

      const mapped: GameRoomState = {
        room_id: dto.room_id,
        stake_amount: Number(dto.stake_amount) || 0,
        status: dto.status || "idle",
        start_time: dto.start_time || null,
        possible_win: Number(dto.possible_win_cents) / 100 || 0,
        number_of_players: Number(dto.number_of_players) || 0,
        selected_board_numbers: Array.isArray(dto.selected_board_numbers)
          ? dto.selected_board_numbers
          : [],
        players: Array.isArray(dto.players) ? dto.players : [],
      };

      setRoomHeaderData(mapped);
      setSelectedBoardNumbers(mapped.selected_board_numbers || []);
      setStakeAmount(mapped.stake_amount);

      if (dto.start_time) {
        const to = new Date(dto.start_time).getTime();
        const now = Date.now();
        const diff = Math.max(Math.floor((to - now) / 1000), 0);
        setTimeLeft(diff);
      }
    } catch (e) {
      console.warn("rehydrateFromDB failed:", e);
    }
  }, []);

  // Helper to complete clear acknowledgement
  const completeClearAck = () => {
    awaitingClearRef.current.active = false;
    if (awaitingClearRef.current.timeoutId) {
      clearTimeout(awaitingClearRef.current.timeoutId);
      awaitingClearRef.current.timeoutId = undefined;
    }
    const cb = awaitingClearRef.current.onCleared;
    awaitingClearRef.current.onCleared = undefined;
    cb?.();
  };

  /* ---- WS connect/reconnect ---- */
  const connectWebSocket = useCallback(() => {
    const url =
      sockUrl ||
      (typeof window !== "undefined"
        ? localStorage.getItem(LSK_WS_URL) || ""
        : "");
    if (!url) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.close();
      } catch {}
    }

    const s = new WebSocket(url);
    wsRef.current = s;

    s.onopen = () => {
      console.log("WS open:", url);
    };

    s.onmessage = (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        console.warn("non-JSON WS msg:", ev.data);
        return;
      }

      setReceivedMessages((prev) =>
        (prev.length > 100 ? prev.slice(-80) : prev).concat(msg)
      );

      switch (msg.type) {
        case "room_state": {
          const r = msg.room || {};

          const mapped: GameRoomState = {
            room_id: r.room_id || "",
            stake_amount: Number(r.stake_amount) || 0,
            status: r.status || "idle",
            start_time: r.start_time || null,
            possible_win: Math.round(Number(r.possible_win_cents) || 0) / 100,
            number_of_players: Number(r.number_of_players) || 0,
            selected_board_numbers: Array.isArray(r.selected_board_numbers)
              ? r.selected_board_numbers
              : [],
            players: Array.isArray(r.players) ? r.players : [],
          };

          setRoomHeaderData(mapped);
          setSelectedBoardNumbers(mapped.selected_board_numbers || []);
          setStakeAmount(mapped.stake_amount);

          if (typeof r.time_left === "number") setTimeLeft(r.time_left);
          if (typeof r.balance === "number") setBalance(r.balance);
          if (typeof r.username === "string") setUsername(r.username);

          // Handle both boards from server
          const yourBoard1 =
            typeof msg.your_board_number === "number"
              ? msg.your_board_number
              : null;
          const yourBoard2 =
            typeof msg.your_board_number_2 === "number"
              ? msg.your_board_number_2
              : null;

          setUserBoard(yourBoard1);
          setUserBoard2(yourBoard2);

          // Handle board clear acknowledgements
          if (awaitingClearRef.current.active) {
            const targetSlot = awaitingClearRef.current.slot;

            if (targetSlot === 1 && yourBoard1 == null) {
              completeClearAck();
            } else if (targetSlot === 2 && yourBoard2 == null) {
              completeClearAck();
            } else if (
              !targetSlot &&
              yourBoard1 == null &&
              yourBoard2 == null
            ) {
              completeClearAck();
            }
          }
          break;
        }

        case "called_numbers": {
          const arr = Array.isArray(msg.called_numbers)
            ? msg.called_numbers
            : [];
          setCalledNumbers(arr);
          break;
        }

        case "claim_result": {
          const cr: ClaimResult = {
            type: "claim_result",
            ok: !!msg.ok,
            request_id:
              typeof msg.request_id === "string" ? msg.request_id : "",
            winner_board_number:
              typeof msg.winner_board_number === "number"
                ? msg.winner_board_number
                : undefined,
            matched_to: Array.isArray(msg.matched_to)
              ? msg.matched_to
              : undefined,
            message: typeof msg.message === "string" ? msg.message : undefined,
            user:
              msg.user && typeof msg.user === "object"
                ? (msg.user as WinnerUser)
                : undefined,
          };
          setClaimResult(cr);

          if (cr.ok) {
            const name = displayName(cr.user);
            const winAmount = roomHeaderData?.possible_win ?? undefined;

            const entry: WinnerEntry = {
              request_id: cr.request_id,
              is_self: undefined,
              win_amount: winAmount,
              winner_board_number: cr.winner_board_number,
              matched_to: cr.matched_to,
              user: cr.user,
              message: cr.message,
            };
            setWinners([entry]);
            setWon(true);
            if (typeof cr.winner_board_number === "number") {
              setWinnerBoard(cr.winner_board_number);
            }
            setWinner(name);
            setNotifications({
              title: "200",
              message: cr.message || `${name} won the game`,
            });
          } else {
            setNotifications({
              title: "400",
              message: cr.message || "Bingo claim rejected.",
            });
            setFinalGameDetails({
              user_board_number: cr.winner_board_number,
            });
          }
          break;
        }

        case "claim_ok": {
          const cr: ClaimResult = {
            type: "claim_ok",
            ok: true,
            request_id:
              typeof msg.request_id === "string" ? msg.request_id : "",
            winner_board_number:
              typeof msg.winner_board_number === "number"
                ? msg.winner_board_number
                : undefined,
            matched_to: Array.isArray(msg.matched_to)
              ? msg.matched_to
              : undefined,
            message:
              typeof msg.message === "string"
                ? msg.message
                : "Bingo claim accepted!",
            user:
              msg.user && typeof msg.user === "object"
                ? (msg.user as WinnerUser)
                : undefined,
          };
          setClaimResult(cr);

          const name = displayName(cr.user);
          const winAmount = roomHeaderData?.possible_win ?? undefined;
          const entry: WinnerEntry = {
            request_id: cr.request_id,
            is_self: undefined,
            win_amount: winAmount,
            winner_board_number: cr.winner_board_number,
            matched_to: cr.matched_to,
            user: cr.user,
            message: cr.message,
          };
          setWinners([entry]);
          setWon(true);
          if (typeof cr.winner_board_number === "number")
            setWinnerBoard(cr.winner_board_number);
          setWinner(name);
          setNotifications({
            title: "200",
            message: cr.message || `${name} won the game`,
          });
          break;
        }

        case "claim_rejected": {
          const cr: ClaimResult = {
            type: "claim_rejected",
            ok: false,
            request_id:
              typeof msg.request_id === "string" ? msg.request_id : "",
            winner_board_number:
              typeof msg.winner_board_number === "number"
                ? msg.winner_board_number
                : undefined,
            matched_to: Array.isArray(msg.matched_to)
              ? msg.matched_to
              : undefined,
            message:
              typeof msg.message === "string"
                ? msg.message
                : "Bingo claim rejected.",
            user:
              msg.user && typeof msg.user === "object"
                ? (msg.user as WinnerUser)
                : undefined,
          };
          setClaimResult(cr);
          setFinalGameDetails({
            user_board_number: cr.winner_board_number,
            user_board_number_2: undefined,
          });
          setNotifications({ title: "400", message: cr.message });
          break;
        }

        case "winner": {
          setWinner(msg.winner_name || "");
          if (typeof msg.winner_board_number === "number") {
            setWinnerBoard(msg.winner_board_number);
          }
          setWon(true);
          break;
        }

        case "winners": {
          const arr = Array.isArray(msg.winners) ? msg.winners : [];
          setWinners(
            arr.map((w: any) => ({
              is_self: !!w.is_self,
              win_amount:
                typeof w.win_amount === "number" ? w.win_amount : undefined,
              winner_board_number:
                typeof w.winner_board_number === "number"
                  ? w.winner_board_number
                  : undefined,
              matched_to: Array.isArray(w.matched_to)
                ? w.matched_to
                : undefined,
              user: w.user,
              message: typeof w.message === "string" ? w.message : undefined,
            }))
          );
          setWon(arr.length > 0);
          if (
            arr.length > 0 &&
            typeof arr[0].winner_board_number === "number"
          ) {
            setWinnerBoard(arr[0].winner_board_number);
          }
          const name = displayName(arr?.[0]?.user);
          if (arr.length > 0) {
            setWinner(name);
            setNotifications({
              title: "200",
              message: arr?.[0]?.message || `${name} won the game`,
            });
          }
          break;
        }

        case "final_game_details": {
          setFinalGameDetails({
            user_board_number: msg.user_board_number,
            user_board_number_2: msg.user_board_number_2,
          });
          break;
        }

        case "notification": {
          setNotifications({
            title: msg.title || "",
            message: msg.message || "",
          });
          break;
        }

        case "error": {
          setCloseMessage({
            error_messege: msg.error || "unknown error",
          });
          break;
        }

        default:
          console.log("unhandled WS message:", msg);
      }
    };

    s.onerror = (err) => {
      console.error("WS error:", err);
    };

    s.onclose = () => {
      console.log("WS closed");
      rehydrateFromDB();
    };
  }, [sockUrl, rehydrateFromDB, roomHeaderData?.possible_win]);

  useEffect(() => {
    connectWebSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sockUrl]);

  /* ---- On first mount, try to rehydrate state from DB immediately ---- */
  useEffect(() => {
    rehydrateFromDB();
  }, [rehydrateFromDB]);

  /* ---- Generic send ---- */
  const send = (payload: object) => {
    const s = wsRef.current;
    if (!s || s.readyState !== WebSocket.OPEN) return;
    s.send(JSON.stringify(payload));
  };

  /* ---- Actions ---- */
  const startGame = () => send({ action: "start" });

  const claimBingo = () => {
    // backend ignores board_number, checks both boards for this user
    send({ action: "claim", board_number: null });
  };


  // Clear a specific board slot
  const clearBoard = (slot: 1 | 2) => {
    const s = wsRef.current;
    if (!s || s.readyState !== WebSocket.OPEN) return;

    const action = slot === 1 ? "set_board" : "set_board_2";
    s.send(JSON.stringify({ action, board_number: null }));

    // Optimistic local update
    if (slot === 1) {
      setUserBoard(null);
      setBoardNumberState(0);
    } else {
      setUserBoard2(null);
      setBoardNumber2State(0);
    }
  };

  // Leave sequence that clears both boards
  const leaveGameWithZero = () => {
    const s = wsRef.current;
    if (!s || s.readyState !== WebSocket.OPEN) return;
  
    // Send leave action FIRST to trigger refund
    s.send(JSON.stringify({ action: "leave" }));
  
  
    // Optimistic local clear
    setUserBoard(null);
    setUserBoard2(null);
    setBoardNumberState(0);
    setBoardNumber2State(0);
  
    try {
      s.close();
    } catch {}
  
    try {
      localStorage.removeItem(LSK_ROOM_ID);
      localStorage.removeItem(LSK_WS_URL);
    } catch {}
  };

  const leaveGame = () => {
    const s = wsRef.current;
    if (!s || s.readyState !== WebSocket.OPEN) return;
    s.send(JSON.stringify({ action: "leave" }));
    try {
      s.close();
    } catch {}
  };

  // Set local board number per slot
  const setBoardNumber = (n: number, slot: 1 | 2 = 1) => {
    if (slot === 1) {
      setBoardNumberState(n);
    } else {
      setBoardNumber2State(n);
    }
  };

  // Set board for specific slot (NOW accepts explicit board number)
  const setPlayerBoard = (slot: 1 | 2 = 1, explicitBoard?: number) => {
    const boardToUse =
      explicitBoard !== undefined
        ? explicitBoard
        : slot === 1
        ? boardNumber
        : boardNumber2;

    if (!boardToUse || boardToUse < 1) return;

    send({
      action: slot === 1 ? "set_board" : "set_board_2",
      board_number: boardToUse,
    });
  };

  const reconnectWebSocket = () => {
    const url =
      sockUrl ||
      (typeof window !== "undefined"
        ? localStorage.getItem(LSK_WS_URL) || ""
        : "");
    if (!url) return;
    try {
      wsRef.current?.close();
    } catch {}
    setTimeout(connectWebSocket, 50);
  };

  const reload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  /* ---- Provide context ---- */
  return (
    <CounterContext.Provider
      value={{
        roomHeaderData,
        gameRoomState: {
          board_number: userBoard ?? null,
          board_number_2: userBoard2 ?? null,
          time_left: timeLeft ?? null,
          stake_amount: stakeAmount,
        },
        selectedBoardNumbers,
        calledNumbers,
        timeLeft,
        winners,
        finalGameDetails,
        winner,
        winnerBoard,
        won,
        closeMessege,
        notification,
        balance,
        username,
        userBoard,
        userBoard2,
        stakeAmount,
        receivedMessages,
        claimResult,

        count,
        increment: () => setCount((v) => v + 1),
        decrement: () => setCount((v) => v - 1),

        setSockUrl,
        reconnectWebSocket,
        startGame,
        claimBingo,
        leaveGame,
        leaveGameWithZero,

        setBoardNumber,
        setPlayerBoard,
        clearBoard,

        reload,
        resetPlayerBoards, // ✅ add this
      }}
    >
      {children}
    </CounterContext.Provider>
  );
};

/* =========================
   Hook
========================= */

export const useCounter = () => {
  const ctx = useContext(CounterContext);
  if (!ctx) throw new Error("useCounter must be used within a CounterProvider");
  return ctx;
};
