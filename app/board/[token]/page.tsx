'use client'
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import BingoBoard from "../page";

const MainGate = () => {
  const pathname = usePathname(); // Full path, e.g., /login/4202578281d24d33be7a5b53d39d0685-397753549
  return (
    <div>
      <BingoBoard />
    </div>
  );
};

export default MainGate;
