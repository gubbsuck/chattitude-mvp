// hooks/useMultiplayerRoom.ts
import { useEffect, useState } from 'react';
import { database } from '../lib/firebase';
import { ref, push, onValue, set, off, update } from 'firebase/database';

interface RoomData {
  thesis: string;
  player1Name: string;
  player2Name: string | null;
  currentPlayer: number;
  dialogQuality: number;
  messages: any[];
  playerStats: {
    player1: { constructive: number; destructive: number };
    player2: { constructive: number; destructive: number };
  };
  createdAt: number;
}

export const useMultiplayerRoom = (roomId: string | null) => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(database, `rooms/${roomId}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
        setIsConnected(true);
      }
    });

    return () => {
      off(roomRef);
      unsubscribe();
    };
  }, [roomId]);

  const createRoom = async (thesis: string, player1Name: string): Promise<string> => {
    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key!;

    const initialData: RoomData = {
      thesis,
      player1Name,
      player2Name: null,
      currentPlayer: 1,
      dialogQuality: 100,
      messages: [],
      playerStats: {
        player1: { constructive: 0, destructive: 0 },
        player2: { constructive: 0, destructive: 0 },
      },
      createdAt: Date.now(),
    };

    await set(newRoomRef, initialData);
    return roomId;
  };

  const joinRoom = async (roomId: string, player2Name: string) => {
    const roomRef = ref(database, `rooms/${roomId}`);
    await update(roomRef, {
      player2Name,
    });
  };

  const sendMessage = async (
    roomId: string,
    playerNum: number,
    playerName: string,
    text: string,
    analysis: any
  ) => {
    const roomRef = ref(database, `rooms/${roomId}`);
    
    // Get current room data first
    const snapshot = await new Promise<any>((resolve) => {
      onValue(roomRef, (snap) => {
        resolve(snap.val());
      }, { onlyOnce: true });
    });

    const currentData = snapshot || {};
    const currentMessages = currentData.messages || [];
    const currentStats = currentData.playerStats || {
      player1: { constructive: 0, destructive: 0 },
      player2: { constructive: 0, destructive: 0 },
    };
    const currentQuality = currentData.dialogQuality || 100;

    // Create new message
    const newMessage = {
      player: playerName,
      playerNum,
      text,
      timestamp: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      analysis,
    };

    // Update stats and quality
    let newQuality = currentQuality;
    const playerKey = playerNum === 1 ? 'player1' : 'player2';
    let newStats = { ...currentStats };

    if (analysis.category === 'dirty_trick' && analysis.confidence >= 75) {
      newQuality = Math.max(0, currentQuality - 10);
      newStats[playerKey].destructive += 1;
    } else if (analysis.category === 'constructive' && analysis.confidence >= 75) {
      newQuality = Math.min(100, currentQuality + 15);
      newStats[playerKey].constructive += 1;
    }

    // Switch turn
    const nextPlayer = playerNum === 1 ? 2 : 1;

    // Update room
    await update(roomRef, {
      messages: [...currentMessages, newMessage],
      dialogQuality: newQuality,
      playerStats: newStats,
      currentPlayer: nextPlayer,
    });
  };

  return {
    roomData,
    isConnected,
    createRoom,
    joinRoom,
    sendMessage,
  };
};
