import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { roomId, playerId } = await req.json();

    if (!roomId || !playerId) {
      return NextResponse.json({ error: 'Missing room or player ID' }, { status: 400 });
    }

    // 1. Fetch the player's card
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('card')
      .eq('id', playerId)
      .single();
      
    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 2. Fetch the drawn numbers for the room
    const { data: drawnNumbersData, error: drawnError } = await supabase
      .from('drawn_numbers')
      .select('number')
      .eq('room_id', roomId);
      
    if (drawnError) {
      return NextResponse.json({ error: 'Could not fetch numbers' }, { status: 500 });
    }
    
    const drawnNumbers = drawnNumbersData.map(d => d.number);
    const card = player.card; // array of 25 items (numbers or "FREE")

    // 3. Mark the card with the drawn numbers
    const marks = card.map((val: any) => val === 'FREE' || drawnNumbers.includes(val));

    // 4. Validate BINGO logic horizontally, vertically, diagonally
    const winningLines = [
      [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
      [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
      [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
    ];

    const hasBingo = winningLines.some(line => line.every(index => marks[index]));

    if (hasBingo) {
      // Broadcast winner or update game state
      await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId);
      return NextResponse.json({ isValid: true, message: 'BINGO VERIFIED!' });
    } else {
      return NextResponse.json({ isValid: false, message: 'False Bingo claim' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
