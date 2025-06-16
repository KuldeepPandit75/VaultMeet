import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { create } from 'zustand';

export interface Message {
  message: string;
  senderId: string;
  userId: string;
  timestamp: number;
}

interface SocketStore {
  messages: Message[];
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  remoteUsers: IAgoraRTCRemoteUser[];
  addRemoteUser: (user: IAgoraRTCRemoteUser) => void;
  removeRemoteUser: (user: IAgoraRTCRemoteUser) => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMessages: (messages) => set({ messages }),
  remoteUsers: [],
  addRemoteUser: (user) =>
    set((state) => ({
      remoteUsers: state.remoteUsers.find(u => u.uid === user.uid) 
        ? state.remoteUsers 
        : [...state.remoteUsers, user],
    })),
  removeRemoteUser: (user) =>
    set((state) => ({
      remoteUsers: state.remoteUsers.filter((u) => u.uid !== user.uid),
    })),
})); 