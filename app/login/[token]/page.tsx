'use client'
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCounter } from "@/app/store/store";
import BoardSelection from "@/app/board/page";

const WS_BASE = "wss://henb.teshie.dev";
const ROOM_10_ID = "10"; // Room 10 ETB

const MainGate = () => {
  const pathname = usePathname();
  const { setSockUrl } = useCounter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Extract and store token from path
    const tokenFromPath = pathname?.split("/login/")[1];
    if (tokenFromPath && tokenFromPath.length > 10) {
      const sanitized = tokenFromPath.replace("}", "");
      localStorage.setItem("token", sanitized);
      localStorage.setItem("authToken", sanitized);
    }

    // Auto-connect to Room 10
    const token = localStorage.getItem("token") || "";
    if (token) {
      const wsUrl = `${WS_BASE}/ws/room/${encodeURIComponent(ROOM_10_ID)}?token=${encodeURIComponent(token)}`;
      setSockUrl(wsUrl);
    }
  }, [pathname, setSockUrl]);

  return <BoardSelection />;
};

export default MainGate;
