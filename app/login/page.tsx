'use client'
import React, { useEffect, useState } from "react";
import { useCounter } from "@/app/store/store";
import BoardSelection from "@/app/board/page";

const WS_BASE = "wss://amber.teshie.dev";
const ROOM_10_ID = "10"; // Room 10 ETB

const MainPage = () => {
  const { setSockUrl } = useCounter();
  const [noToken, setNoToken] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token") || "";
    if (!token) {
      setNoToken(true);
      return;
    }

    // Auto-connect to Room 10
    const wsUrl = `${WS_BASE}/ws/room/${encodeURIComponent(ROOM_10_ID)}?token=${encodeURIComponent(token)}`;
    setSockUrl(wsUrl);
  }, [setSockUrl]);

  if (noToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-purple-400">
        <div className="text-white text-lg">Please login with a valid token</div>
      </div>
    );
  }

  return <BoardSelection />;
};

export default MainPage;
