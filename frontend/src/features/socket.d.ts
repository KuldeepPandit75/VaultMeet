// socket.d.ts
declare module './socket.js' {
    import type { Socket } from 'socket.io-client';
  
    export function getSocket(): Socket;
  }
  