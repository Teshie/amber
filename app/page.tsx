"use client";
import { Suspense } from "react";
import RandomNumber from "./components/RandomNumber";
import WebSocketDemo from "./components/WebSocketDemo";
import BingoBoard from "./board/page";

const HomePage: React.FC = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <BingoBoard  />
      </Suspense>
    </div>
  );
};

export default HomePage;
