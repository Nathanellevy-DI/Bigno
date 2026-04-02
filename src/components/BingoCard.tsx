'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

type BingoCardProps = {
  numbers: (number | 'FREE')[];
  drawnNumbers: number[];
  onBingoClaim: (marks: boolean[]) => void;
};

export default function BingoCard({ numbers, drawnNumbers, onBingoClaim }: BingoCardProps) {
  const [marks, setMarks] = useState<boolean[]>(new Array(25).fill(false));
  const [showConfirm, setShowConfirm] = useState(false);

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

  const attemptBingo = () => {
    setShowConfirm(true);
  };

  const confirmBingo = () => {
    setShowConfirm(false);
    onBingoClaim(marks);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-4 sm:p-6 rounded-3xl shadow-xl border-4 border-primary/20 relative overflow-hidden">
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
          >
            <h3 className="text-3xl font-black text-foreground mb-4">Are you sure?</h3>
            <p className="text-gray-600 mb-8 font-medium">Have you really connected five in a row?</p>
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={confirmBingo} className="flex-1 bubble-btn py-4">
                YES, BINGO!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <button onClick={attemptBingo} className="bubble-btn text-2xl px-12 py-4 uppercase bg-bingo-red shadow-[0_4px_0_0_#9a3412]">
          BINGO!
        </button>
      </div>
    </div>
  );
}
