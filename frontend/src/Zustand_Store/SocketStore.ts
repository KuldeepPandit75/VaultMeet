import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { create } from 'zustand';
import axios from 'axios';

export interface Message {
  message: string;
  senderId: string;
  userId: string;
  timestamp: number;
}

export interface RoomParticipant {
  status: 'pending' | 'allowed' | 'banned';
  id: string;
  socketId: string;
}

export interface Room {
  roomId: string;
  participants: RoomParticipant[];
  createdAt: string;
  lastActive: string;
  adminId: string;
}

export interface RoomData {
  socketId: string;
}

export interface JoinRequestData {
  roomId: string;
  socketId: string;
}

export interface ApproveRequestData {
  roomId: string;
  participantId: string;
}

export interface PendingRequest {
  status: 'pending';
  id: string;
  user?: {
    fullname: {
      firstname: string;
      lastname: string;
    };
    username: string;
    avatar?: string;
  } | null;
  timestamp: number;
}

interface SocketStore {
  messages: Message[];
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  remoteUsers: IAgoraRTCRemoteUser[];
  addRemoteUser: (user: IAgoraRTCRemoteUser) => void;
  removeRemoteUser: (user: IAgoraRTCRemoteUser) => void;
  clearRemoteUsers: () => void;
  // Whiteboard state
  isWhiteboardOpen: boolean;
  setIsWhiteboardOpen: (open: boolean) => void;
  // Unread messages tracking
  unreadCount: number;
  incrementUnreadCount: () => void;
  clearUnreadCount: () => void;
  // Room management
  currentRoom: Room | null;
  userRooms: Room[];
  setCurrentRoom: (room: Room | null) => void;
  setUserRooms: (rooms: Room[]) => void;
  // Room API functions
  createRoom: () => Promise<{ success: boolean; room?: Room; message?: string }>;
  checkRoomPermission: (roomId: string) => Promise<{ success: boolean; canJoin?: boolean; message?: string; room?: Room; isAdmin?: boolean }>;
  joinRoomRequest: (joinData: JoinRequestData) => Promise<{ success: boolean; room?: Room; message?: string }>;
  approveJoinRequest: (approveData: ApproveRequestData) => Promise<{ success: boolean; room?: Room; message?: string }>;
  rejectJoinRequest: (rejectData: ApproveRequestData) => Promise<{ success: boolean; room?: Room; message?: string }>;
  deleteRoom: (roomId: string) => Promise<{ success: boolean; message?: string }>;
  getRoomDetails: (roomId: string) => Promise<{ success: boolean; room?: Room; message?: string }>;
  getUserRooms: () => Promise<{ success: boolean; rooms?: Room[]; message?: string }>;
  updateRoomActivity: (roomId: string) => Promise<{ success: boolean; message?: string }>;
  manualCleanup: () => Promise<{ success: boolean; deletedCount?: number; message?: string }>;
  getPendingRequests: (roomId: string) => Promise<{ success: boolean; pendingRequests?: PendingRequest[]; message?: string }>;
}

const BackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${BackendUrl}/user`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useSocketStore = create<SocketStore>((set, get) => ({
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
  clearRemoteUsers: () =>
    set(() => ({
      remoteUsers: [],
    })),
  // Whiteboard state
  isWhiteboardOpen: false,
  setIsWhiteboardOpen: (open) => set({ isWhiteboardOpen: open }),
  // Unread messages tracking
  unreadCount: 0,
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  clearUnreadCount: () => set({ unreadCount: 0 }),

  // Room management state
  currentRoom: null,
  userRooms: [],
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setUserRooms: (rooms) => set({ userRooms: rooms }),

  // Room API functions
  createRoom: async () => {
    try {
      const response = await api.post('/rooms/create');
      const { room } = response.data;
      set({ currentRoom: room });
      return { success: true, room };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  checkRoomPermission: async (roomId: string) => {
    try {
      const response = await api.get(`/rooms/permission/${roomId}`);
      const { canJoin, message, room, isAdmin } = response.data;
      return { success: true, canJoin, message, room, isAdmin };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check room permission';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  joinRoomRequest: async (joinData: JoinRequestData) => {
    try {
      const response = await api.post('/rooms/join-request', joinData);
      const { room } = response.data;
      return { success: true, room };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send join request';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  approveJoinRequest: async (approveData: ApproveRequestData) => {
    try {
      const response = await api.post('/rooms/approve-request', approveData);
      const { room } = response.data;
      return { success: true, room };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve join request';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  rejectJoinRequest: async (rejectData: ApproveRequestData) => {
    try {
      const response = await api.post('/rooms/reject-request', rejectData);
      const { room } = response.data;
      return { success: true, room };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject join request';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  deleteRoom: async (roomId: string) => {
    try {
      const response = await api.delete(`/rooms/${roomId}`);
      const { message } = response.data;
      
      // Remove from current room if it's the deleted room
      const { currentRoom } = get();
      if (currentRoom?.roomId === roomId) {
        set({ currentRoom: null });
      }
      
      return { success: true, message };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete room';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  getRoomDetails: async (roomId: string) => {
    try {
      const response = await api.get(`/rooms/${roomId}`);
      const { room } = response.data;
      set({ currentRoom: room });
      return { success: true, room };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get room details';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  getUserRooms: async () => {
    try {
      const response = await api.get('/rooms/user/rooms');
      const { rooms } = response.data;
      set({ userRooms: rooms });
      return { success: true, rooms };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user rooms';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  updateRoomActivity: async (roomId: string) => {
    try {
      const response = await api.put('/rooms/update-activity', { roomId });
      const { message } = response.data;
      return { success: true, message };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update room activity';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  manualCleanup: async () => {
    try {
      const response = await api.post('/rooms/cleanup');
      const { message, deletedCount } = response.data;
      return { success: true, deletedCount, message };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform manual cleanup';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  getPendingRequests: async (roomId: string) => {
    try {
      const response = await api.get(`/rooms/${roomId}/pending-requests`);
      const { pendingRequests } = response.data;
      return { success: true, pendingRequests };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get pending requests';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },
})); 