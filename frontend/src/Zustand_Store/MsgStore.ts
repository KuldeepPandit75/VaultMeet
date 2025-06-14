import { create } from 'zustand';

export interface Message {
  message: string;
  senderId: string;
  userId: string;
  timestamp: number;
}

interface MessageStore {
  messages: Message[];
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMessages: (messages) => set({ messages }),
})); 