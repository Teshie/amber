"use client";

import React from "react";
import { useCounter } from "../store/store";
import BoardSelectionView from "./BoardSelectionView";
import GameView from "./GameView";

const GameContainer: React.FC = () => {
  const { currentView } = useCounter();

  return (
    <div data-testid="game-container">
      {currentView === "game" ? <GameView /> : <BoardSelectionView />}
    </div>
  );
};

export default GameContainer;
