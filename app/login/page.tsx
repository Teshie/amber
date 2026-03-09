'use client'
import React, { useEffect, useState } from "react";
import { useCounter } from "@/app/store/store";
import BoardSelection from "@/app/board/page";

const WS_BASE = "wss://henb.teshie.dev";
const ROOM_10_ID = "10"; // Room 10 ETB

const MainPage = () => {
  const { setSockUrl } = useCounter();
  const [isConnected, setIsConnected] = useState(false);
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
    setIsConnected(true);
  }, [setSockUrl]);

  if (noToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-purple-400">
        <div className="text-white text-lg">Please login with a valid token</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-purple-400">
        <div className="text-white text-lg">Connecting to Room 10...</div>
      </div>
    );
  }

  return <BoardSelection />;
};

export default MainPage;
