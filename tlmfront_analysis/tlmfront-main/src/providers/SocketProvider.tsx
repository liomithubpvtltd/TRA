'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WS_URL } from '@/api/axios';

interface SocketContextType {
  lastMessage: any;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnect: () => void;
  sendMessage: (data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);

    setStatus('connecting');
    const socket = new WebSocket(`${WS_URL}/ws/market/`);
    ws.current = socket;

    socket.onopen = () => {
      setStatus('connected');
      console.log('Central WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error('Error parsing central WebSocket message:', err);
      }
    };

    socket.onclose = () => {
      setStatus('disconnected');
      console.log('Central WebSocket disconnected, attempting reconnect in 5s...');
      reconnectTimeout.current = setTimeout(connect, 5000);
    };

    socket.onerror = (error) => {
      setStatus('error');
      console.error('Central WebSocket error. Possible causes: Backend down, Incorrect WS_URL, or Mixed Content (HTTPS vs WS).', error);
      socket.close();
    };
  };

  const sendMessage = (data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };

  const reconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
    connect();
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnect on intentional close
        ws.current.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ lastMessage, status, reconnect, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
