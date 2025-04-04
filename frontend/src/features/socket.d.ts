import { Socket } from 'socket.io-client';

export declare let socket: Socket | null;

export declare const getSocket: () => Socket;
