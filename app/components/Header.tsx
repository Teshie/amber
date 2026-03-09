// app/components/GameHeader.tsx
import React from 'react';

const GameHeader: React.FC = () => {
  return (
    <div className="flex justify-between p-4 bg-purple-300 rounded-lg mb-4 text-center text-xs sm:text-sm">
      <div className="flex flex-col">
        <span>Game</span>
        <span className="font-bold">29407</span>
      </div>
      <div className="flex flex-col">
        <span>Derash</span>
        <span className="font-bold">-</span>
      </div>
      <div className="flex flex-col">
        <span>Bonus</span>
        <span className="font-bold">-</span>
      </div>
      <div className="flex flex-col">
        <span>Players</span>
        <span className="font-bold">-</span>
      </div>
      <div className="flex flex-col">
        <span>Bet</span>
        <span className="font-bold">0</span>
      </div>
      <div className="flex flex-col">
        <span>Call</span>
        <span className="font-bold">0</span>
      </div>
    </div>
  );
};

export default GameHeader;
