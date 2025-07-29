import { create } from 'zustand';

export interface Conversation {
  conversationId: string;
  otherUser: {
    _id: string;
    fullname: { firstname: string; lastname: string };
    avatar?: string;
    username?: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
  lastMessage?: {
    _id: string;
    message: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount?: number;
}

interface OpenChatWindow {
  conversation: Conversation;
  isMinimized: boolean;
}

interface ChatStore {
  openChats: OpenChatWindow[];
  openChat: (conversation: Conversation) => void;
  closeChat: (conversationId: string) => void;
  minimizeChat: (conversationId: string) => void;
  closeAllChats: () => void;
}

const useChatStore = create<ChatStore>((set, get) => ({
  openChats: [],
  
  openChat: (conversation: Conversation) => {
    const { openChats } = get();
    
    // Check if chat is already open
    const existingChatIndex = openChats.findIndex(
      chat => chat.conversation.conversationId === conversation.conversationId
    );

    if (existingChatIndex !== -1) {
      // Chat is already open, unminimize it
      set(state => ({
        openChats: state.openChats.map((chat, index) =>
          index === existingChatIndex 
            ? { ...chat, isMinimized: false }
            : chat
        )
      }));
    } else {
      // Open new chat window
      set(state => ({
        openChats: [...state.openChats, { conversation, isMinimized: false }]
      }));
    }
  },

  closeChat: (conversationId: string) => {
    set(state => ({
      openChats: state.openChats.filter(chat => chat.conversation.conversationId !== conversationId)
    }));
  },

  minimizeChat: (conversationId: string) => {
    set(state => ({
      openChats: state.openChats.map(chat =>
        chat.conversation.conversationId === conversationId
          ? { ...chat, isMinimized: !chat.isMinimized }
          : chat
      )
    }));
  },

  closeAllChats: () => {
    set({ openChats: [] });
  },
}));

export default useChatStore; 