import React from "react";

interface BingoNumbersProps {
  calledNumbers: number[];
}

const BingoNumbers: React.FC<BingoNumbersProps> = ({ calledNumbers }) => {
  const columns = [
    { label: "B", numbers: Array.from({ length: 15 }, (_, i) => i + 1) },
    { label: "I", numbers: Array.from({ length: 15 }, (_, i) => i + 16) },
    { label: "N", numbers: Array.from({ length: 15 }, (_, i) => i + 31) },
    { label: "G", numbers: Array.from({ length: 15 }, (_, i) => i + 46) },
    { label: "O", numbers: Array.from({ length: 15 }, (_, i) => i + 61) },
  ];

  const lastCalledNumber = calledNumbers[calledNumbers.length - 1];

  return (
    <div className="flex flex-col items-center status rounded-lg">
      <div className="flex justify-between w-full mb-2 p-1 space-x-1">
        {columns.map((col) => (
          <div key={col.label} className="flex flex-col space-y-2 items-center">
            <div className="font-bold">{col.label}</div>
            {col.numbers.map((number) => {
              const isCalled = calledNumbers.includes(number);
              const isLastCalled = number === lastCalledNumber;
              return (
                <div
                  key={number}
                  className={`flex items-center justify-center w-6 h-6.5 text-center ${
                    isLastCalled
                      ? "last-called" // Add a blinking effect
                      : isCalled
                      ? "called-numbers"
                      : "numbers"
                  } rounded`}
                >
                  {number}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BingoNumbers;
