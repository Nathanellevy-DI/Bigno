'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Play, Square, Users, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ClaimData = {
  nickname: string;
  card: (number | 'FREE')[];
  marks: boolean[];
};

export default function HostPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const unwrappedParams = use(params);
  const code = unwrappedParams.roomCode;
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isAutoDrawing, setIsAutoDrawing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [claim, setClaim] = useState<ClaimData | null>(null);

  useEffect(() => {
    let roomChannel: any;

    const fetchRoomAndSetup = async () => {
      const { data: roomData } = await supabase.from('rooms').select('id, status').eq('code', code).single();
      
      if (roomData) {
        setRoomId(roomData.id);
        if (roomData.status === 'finished') {
           // We could fetch winner if we saved it, but for now we rely on transient state
        }

        // Fetch initial state
        const { data: playersData } = await supabase.from('players').select('*').eq('room_id', roomData.id);
        if (playersData) setPlayers(playersData);

        // Fetch already drawn numbers if this page was refreshed
        const { data: drawnData } = await supabase.from('drawn_numbers').select('number').eq('room_id', roomData.id).order('drawn_at', { ascending: true });
        if (drawnData) setDrawnNumbers(drawnData.map(d => d.number));

        // Listen for new players and broadcasts on a unified room channel
        roomChannel = supabase
          .channel(`room_${roomData.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players' }, (payload) => {
            if (payload.new.room_id === roomData.id) {
              setPlayers((prev) => [...prev, payload.new]);
            }
          })
          .on('broadcast', { event: 'BINGO_CLAIM' }, (payload) => {
            setClaim(payload.payload as ClaimData);
            setIsAutoDrawing(false); // Pause auto-drawing while evaluating
          })
          .subscribe();
      }
    };
    
    fetchRoomAndSetup();

    return () => {
      if (roomChannel) supabase.removeChannel(roomChannel);
    };
  }, [code]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoDrawing && !winner && !claim) {
      interval = setInterval(() => {
        drawNumber();
      }, 5000); // Draw every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoDrawing, drawnNumbers, winner, claim, roomId]);

  const drawNumber = async () => {
    if (drawnNumbers.length >= 75 || winner || !roomId || claim) {
      setIsAutoDrawing(false);
      return;
    }
    
    let nextNum;
    do {
      nextNum = Math.floor(Math.random() * 75) + 1;
    } while (drawnNumbers.includes(nextNum));

    // Save to Supabase (optimistic update)
    setDrawnNumbers(prev => [...prev, nextNum]);
    await supabase.from('drawn_numbers').insert([{ room_id: roomId, number: nextNum }]);
  };

  const handleAcceptClaim = async () => {
    if (!roomId || !claim) return;
    
    // Conclude game in DB
    await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId);
    
    // Broadcast win
    await supabase.channel(`room_${roomId}`).send({
      type: 'broadcast',
      event: 'BINGO_ACCEPTED',
      payload: { nickname: claim.nickname }
    });
    
    setWinner(claim.nickname);
    setClaim(null);
  };

  const handleDenyClaim = async () => {
    if (!roomId) return;
    
    // Broadcast denial
    await supabase.channel(`room_${roomId}`).send({
      type: 'broadcast',
      event: 'BINGO_DENIED',
    });
    
    setClaim(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center relative">
      <AnimatePresence>
        {claim && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-white p-8 rounded-3xl max-w-2xl w-full shadow-2xl my-8">
              <h2 className="text-4xl font-black text-bingo-red uppercase tracking-widest mb-2">Claim Evaluation</h2>
              <p className="text-xl font-bold text-gray-700 mb-8 w-full border-b pb-4">
                <span className="text-primary">{claim.nickname}</span> claims they have BINGO!
              </p>
              
              <div className="grid grid-cols-5 gap-2 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
                  <div key={i} className="text-center font-bold text-2xl text-gray-400">
                    {letter}
                  </div>
                ))}
                {claim.card.map((num, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square flex items-center justify-center font-bold text-xl rounded-lg border-2 ${
                      claim.marks[i] 
                        ? (drawnNumbers.includes(num as number) || num === 'FREE' ? 'bg-primary text-white border-primary' : 'bg-red-500 text-white border-red-700 relative')
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    {num}
                    {claim.marks[i] && !drawnNumbers.includes(num as number) && num !== 'FREE' && (
                      <span className="absolute -top-2 -right-2 text-xs bg-black text-white px-1 py-0.5 rounded-full">INVALID</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={handleDenyClaim} className="flex-1 py-4 font-bold text-xl text-white bg-gray-600 rounded-xl hover:bg-gray-700 shadow-md">
                  DENY CLAIM
                </button>
                <button onClick={handleAcceptClaim} className="flex-1 bubble-btn py-4 text-xl bg-green-500 hover:bg-green-600 border-none shadow-[0_4px_0_0_#166534]">
                  ACCEPT WIN
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <h2 className="text-2xl font-bold text-gray-500 mb-2">
            {winner ? 'WINNER!' : 'Latest Number'}
          </h2>
          {winner ? (
            <div className="w-full py-12 bg-green-100 border-4 border-green-500 rounded-3xl text-center mb-8">
              <p className="text-5xl font-black text-green-700 mb-2">🏆</p>
              <p className="text-3xl font-bold text-green-800">{winner}</p>
              <p className="text-xl font-medium text-green-600 mt-2">BINGO!</p>
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto bg-primary rounded-full flex items-center justify-center text-white text-8xl font-black shadow-[0_8px_0_0_#991b1b] mb-8">
              {drawnNumbers[drawnNumbers.length - 1] || '--'}
            </div>
          )}
          
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
