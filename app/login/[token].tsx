import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import BingoBoard from "../board/page";

const MainGate = () => {
  return (
    <div>
      <BingoBoard/>
    </div>
  );
};

export default MainGate;
