// app/components/BingoButton.tsx
import React from 'react';

const BingoButton: React.FC = () => {
  return (
    <button className="w-full p-4 mt-4 text-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
      BINGO!
    </button>
  );
};

export default BingoButton;
