'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import BingoCard from '@/components/BingoCard';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayPage({ params }: { params: { roomCode: string } }) {
  const code = params.roomCode;
  const searchParams = useSearchParams();
  const nickname = searchParams.get('nickname') || 'Player';
  
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [latestNumber, setLatestNumber] = useState<number | null>(null);
  
  // Generate a random Bingo card
  const cardNumbers = useMemo(() => {
    const card: (number | 'FREE')[] = [];
    const used = new Set<number>();
    
    // B (1-15), I (16-30), N (31-45), G (46-60), O (61-75)
    const ranges = [
      { min: 1, max: 15 },
      { min: 16, max: 30 },
      { min: 31, max: 45 },
      { min: 46, max: 60 },
      { min: 61, max: 75 }
    ];

    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 5; r++) {
        if (c === 2 && r === 2) {
          card.push('FREE'); // FREE space
          continue;
        }
        let num;
        do {
          num = Math.floor(Math.random() * (ranges[r].max - ranges[r].min + 1)) + ranges[r].min;
        } while (used.has(num));
        used.add(num);
        card.push(num);
      }
    }
    return card;
  }, []);

  useEffect(() => {
    // In a real app we'd fetch the existing drawn numbers from Supabase on mount
    // const fetchState = async () => { ... } 

    // Listen for new drawn numbers from the host
    const numSub = supabase
      .channel('numbers_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'drawn_numbers', filter: `room_id=eq.${code}` }, (payload) => {
        const newNum = payload.new.number;
        setDrawnNumbers((prev) => [...prev, newNum]);
        setLatestNumber(newNum);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(numSub);
    };
  }, [code]);

  // Clear latest number ping after 3 seconds
  useEffect(() => {
    if (latestNumber !== null) {
      const timer = setTimeout(() => setLatestNumber(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [latestNumber]);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-lg flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold bg-white px-4 py-2 rounded-full border-2 border-gray-200">
          🎮 {nickname}
        </h2>
        <div className="text-sm font-bold bg-primary text-white px-4 py-2 rounded-full uppercase tracking-widest">
          ROOM {code}
        </div>
      </div>

      <AnimatePresence>
        {latestNumber !== null && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-bingo-red text-white text-3xl font-black py-4 px-12 rounded-full shadow-[0_6px_0_0_#9a3412] flex items-center gap-4 border-4 border-white"
          >
            <span>NEW NUMBER:</span>
            <span className="text-5xl">{latestNumber}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <BingoCard 
        numbers={cardNumbers} 
        drawnNumbers={drawnNumbers} 
        onBingo={() => {
          // Call API to validate
          // For demo, just alert
          alert('BINGO! Checking card...');
        }} 
      />
    </div>
  );
}
