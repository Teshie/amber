import React, { useState } from 'react';
import boards from '../data/board.json'; // Adjust the path based on your file structure

interface PlayerBoardProps {
  userBoard?: number;
}

const PlayerBoard: React.FC<PlayerBoardProps> = ({ userBoard }) => {
  // Find the board corresponding to the `userBoard` number
  const numbers = userBoard ? boards[userBoard - 1] : []; // Handle undefined case

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const handleNumberClick = (number: number | string) => {
    if (typeof number === 'number') {
      if (selectedNumbers.includes(number)) {
        // If already selected, remove it
        setSelectedNumbers(selectedNumbers.filter((n) => n !== number));
      } else {
        // If not selected, add it
        setSelectedNumbers([...selectedNumbers, number]);
      }
    }
  };

  return (
    <div className="w-full boadr-main rounded-lg text-center">
      <div className="flex justify-around mb-2">
        <span className="bg-yellow-500 px-2 py-1 rounded-lg">B</span>
        <span className="bg-green-500 px-2 py-1 rounded-lg">I</span>
        <span className="bg-blue-500 px-2 py-1 rounded-lg">N</span>
        <span className="bg-orange-500 px-2 py-1 rounded-lg">G</span>
        <span className="bg-purple-500 px-2 py-1 rounded-lg">O</span>
      </div>
      <div className="grid grid-cols-5 gap-1 p-1">
        {numbers.flat().map((number:any, index:any) => (
          <div
            key={index}
            onClick={() => handleNumberClick(number)}
            className={`flex items-center  justify-center w-10 h-10 text-2xl font-bold rounded shadow-md cursor-pointer ${
              number === 'FREE'
                ? 'called-numbers text-white cursor-default'
                : typeof number === 'number' && selectedNumbers.includes(number)
                ? 'called-numbers text-white'
                : 'numbers'
            }`}
          >
            {number==="FREE"?"*":number}
          </div>
        ))}
      </div>
      <div className=" text-red-600 font-bold">Board No.{userBoard}</div>
    </div>
  );
};

export default PlayerBoard;
