// socket.d.ts
declare module './socket' {
    import type { Socket } from 'socket.io-client';
  
    export function getSocket(): Socket;
  }
  