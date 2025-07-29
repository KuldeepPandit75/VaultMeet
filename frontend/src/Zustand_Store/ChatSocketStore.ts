import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface ChatSocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  joinChat: (userId: string) => void;
  sendMessage: (data: { senderId: string; receiverId: string; message: string; conversationId: string }) => void;
  startTyping: (data: { senderId: string; receiverId: string; conversationId: string }) => void;
  stopTyping: (data: { senderId: string; receiverId: string; conversationId: string }) => void;
  markAsRead: (data: { conversationId: string; userId: string }) => void;
}

const useChatSocketStore = create<ChatSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connect: () => {
    const socket = io("http://localhost:4000");
    socket.on("connect", () => {
      console.log("Connected to chat socket server");
      set({ socket, isConnected: true });
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from chat socket server");
      set({ isConnected: false });
    });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
  emit: (event: string, data: any) => {
    const { socket } = get();
    if (socket) {
      socket.emit(event, data);
    }
  },
  on: (event: string, callback: (data: any) => void) => {
    const { socket } = get();
    if (socket) {
      socket.on(event, callback);
    }
  },
  off: (event: string) => {
    const { socket } = get();
    if (socket) {
      socket.off(event);
    }
  },
  joinChat: (userId: string) => {
    const { emit } = get();
    emit("join-chat", userId);
  },
  sendMessage: (data) => {
    const { emit } = get();
    emit("send-message", data);
  },
  startTyping: (data) => {
    const { emit } = get();
    emit("typing-start", data);
  },
  stopTyping: (data) => {
    const { emit } = get();
    emit("typing-stop", data);
  },
  markAsRead: (data) => {
    const { emit } = get();
    emit("mark-read", data);
  },
}));

export default useChatSocketStore; 