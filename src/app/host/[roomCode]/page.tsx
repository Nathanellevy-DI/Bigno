'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Play, Square, Users, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HostPage({ params }: { params: { roomCode: string } }) {
  const code = params.roomCode;
  const [players, setPlayers] = useState<any[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isAutoDrawing, setIsAutoDrawing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    // In a real app we'd fetch existing players from Supabase
    // Fetch initial state:
    // supabase.from('players').select('*').eq('room_id', code).then(res => setPlayers(res.data || []));

    // Listen for new players
    const playersSub = supabase
      .channel('players_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players' }, (payload) => {
        setPlayers((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playersSub);
    };
  }, [code]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoDrawing && !winner) {
      interval = setInterval(() => {
        drawNumber();
      }, 5000); // Draw every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoDrawing, drawnNumbers, winner]);

  const drawNumber = async () => {
    if (drawnNumbers.length >= 75 || winner) {
      setIsAutoDrawing(false);
      return;
    }
    
    let nextNum;
    do {
      nextNum = Math.floor(Math.random() * 75) + 1;
    } while (drawnNumbers.includes(nextNum));

    setDrawnNumbers(prev => [...prev, nextNum]);
    // Save to Supabase
    // await supabase.from('drawn_numbers').insert([{ room_id: code, number: nextNum }]);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl flex justify-between items-center bg-white p-6 rounded-3xl shadow-md border-b-4 border-primary mb-8">
        <div>
          <h1 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Room Code</h1>
          <p className="text-5xl font-black text-foreground tracking-widest">{code}</p>
        </div>
        <div className="flex gap-4 items-center border-2 border-gray-100 p-4 rounded-2xl bg-gray-50 text-gray-700 font-bold">
          <Users className="text-primary" />
          <span className="text-2xl">{players.length} Players</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-primary/20 flex flex-col justify-center text-center">
          <h2 className="text-2xl font-bold text-gray-500 mb-2">Latest Number</h2>
          <div className="w-48 h-48 mx-auto bg-primary rounded-full flex items-center justify-center text-white text-8xl font-black shadow-[0_8px_0_0_#991b1b] mb-8">
            {drawnNumbers[drawnNumbers.length - 1] || '--'}
          </div>
          
          <div className="flex gap-4 justify-center">
            <button 
              onClick={drawNumber}
              disabled={isAutoDrawing || winner !== null}
              className="bubble-btn flex-1 text-lg flex items-center justify-center gap-2"
            >
              DRAW NEXT
            </button>
            <button 
              onClick={() => setIsAutoDrawing(!isAutoDrawing)}
              disabled={winner !== null}
              className={`flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-full shadow-[0_4px_0_0_#000] active:shadow-none active:translate-y-1 transition-all ${
                isAutoDrawing ? 'bg-black text-white border-2 border-black' : 'bg-white text-black border-2 border-gray-200 shadow-[0_4px_0_0_#e5e7eb]'
              }`}
            >
              {isAutoDrawing ? <Square fill="currentColor" /> : <Play fill="currentColor" />}
              {isAutoDrawing ? 'STOP AUTO' : 'AUTO DRAW'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-gray-100 h-full flex flex-col">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
            <Trophy className="text-yellow-500" />
            Previous Numbers ({drawnNumbers.length})
          </h2>
          <div className="flex-1 overflow-y-auto bg-gray-50 rounded-2xl p-4 flex gap-2 flex-wrap content-start">
            {drawnNumbers.slice(0, -1).reverse().map((num, i) => (
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} key={i}
                className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 text-lg"
              >
                {num}
              </motion.div>
            ))}
            {drawnNumbers.length <= 1 && (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                No numbers drawn yet. Start the game!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
