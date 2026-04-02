'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

type BingoCardProps = {
  numbers: (number | 'FREE')[];
  drawnNumbers: number[];
  onBingo: () => void;
};

export default function BingoCard({ numbers, drawnNumbers, onBingo }: BingoCardProps) {
  const [marks, setMarks] = useState<boolean[]>(new Array(25).fill(false));

  // Initialize FREE space to be marked
  useEffect(() => {
    const newMarks = [...marks];
    const freeIndex = numbers.indexOf('FREE');
    if (freeIndex !== -1) {
      newMarks[freeIndex] = true;
      setMarks(newMarks);
    }
  }, []);

  const toggleMark = (index: number) => {
    const value = numbers[index];
    if (value === 'FREE') return;


    const newMarks = [...marks];
    newMarks[index] = !newMarks[index];
    setMarks(newMarks);
  };

  const checkBingo = () => {
    // Basic BINGO logic (rows, cols, diagonals)
    // 0  1  2  3  4
    // 5  6  7  8  9
    // 10 11 12 13 14
    // 15 16 17 18 19
    // 20 21 22 23 24
    const winningLines = [
      [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
      [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Cols
      [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
    ];

    const hasBingo = winningLines.some(line => line.every(index => marks[index]));
    if (hasBingo) {
      onBingo();
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-4 sm:p-6 rounded-3xl shadow-xl border-4 border-primary/20">
      <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-6">
        {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
          <div key={i} className="text-center font-extrabold text-3xl sm:text-5xl text-primary pb-2 border-b-4 border-primary/10">
            {letter}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {numbers.map((num, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleMark(i)}
            className={`
              relative aspect-square flex items-center justify-center text-lg sm:text-2xl font-bold rounded-2xl shadow-sm transition-colors border-2
              ${marks[i] 
                ? 'bg-primary text-white border-primary shadow-inner scale-95' 
                : 'bg-white text-foreground border-gray-200 hover:border-primary/50'
              }
              ${num === 'FREE' && 'bg-primary/10 border-primary/30 text-primary'}
            `}
          >
            {num}
            {marks[i] && (
              <motion.div
                layoutId={`mark-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-4/5 h-4/5 rounded-full bg-primary/20" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <button onClick={checkBingo} className="bubble-btn text-2xl px-12 py-4 uppercase bg-bingo-red shadow-[0_4px_0_0_#9a3412]">
          BINGO!
        </button>
      </div>
    </div>
  );
}
