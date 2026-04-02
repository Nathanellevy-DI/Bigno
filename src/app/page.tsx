'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async () => {
    setLoading(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // In a real app we'd save this to Supabase, but for preview we'll navigate directly
    // const { error } = await supabase.from('rooms').insert([{ code, status: 'waiting' }]);
    
    router.push(`/host/${code}`);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || roomCode.length !== 4) return;
    setLoading(true);
    
    // In a full implementation, we'd add the player to the Supabase game room here
    router.push(`/play/${roomCode}?nickname=${encodeURIComponent(nickname)}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-4 border-primary"
      >
        <div className="flex justify-center mb-6">
          <PartyPopper className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl font-extrabold text-foreground tracking-tight mb-2 uppercase">Bingo Night</h1>
        <p className="text-lg text-foreground/80 mb-8 font-medium">Digital cards • Real-time fun</p>

        <form onSubmit={handleJoinRoom} className="space-y-4 mb-8">
          <input
            type="text"
            placeholder="NICKNAME"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.toUpperCase())}
            className="w-full text-center p-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-xl font-bold uppercase transition"
            required
            maxLength={12}
          />
          <input
            type="text"
            placeholder="4-DIGIT CODE"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full text-center p-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-xl font-bold uppercase tracking-widest transition"
            required
            maxLength={4}
          />
          <button 
            type="submit" 
            disabled={loading || !nickname || roomCode.length !== 4}
            className="w-full bubble-btn text-xl disabled:opacity-50"
          >
            {loading ? 'JOINING...' : 'JOIN GAME'}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t-2 border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 font-bold">OR</span>
          <div className="flex-grow border-t-2 border-gray-200"></div>
        </div>

        <button 
          onClick={handleCreateRoom}
          disabled={loading}
          className="w-full bg-foreground text-white font-bold py-4 rounded-xl shadow-[0_4px_0_0_#000] active:shadow-none active:translate-y-1 transition-all text-xl disabled:opacity-50"
        >
          HOST A GAME
        </button>
      </motion.div>
    </main>
  );
}
