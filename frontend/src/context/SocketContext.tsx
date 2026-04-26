'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected');
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
