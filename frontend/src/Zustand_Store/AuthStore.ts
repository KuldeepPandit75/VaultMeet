import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios, { AxiosError } from 'axios';

export enum Role {
  Admin = 'admin',
  User = 'user',
  Host = 'host'
}


export const BackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

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

export interface User {
  _id: string;
  socketId: string;
  username: string;
  fullname: {
    firstname: string;
    lastname: string;
  };
  email: string;
  role: Role;
  banner: string;
  avatar: string;
  bio?: string;
  location?: string;
  college?: string;
  skills?: string;
  interests?: string;
  social?: {
    github?: string;
    linkedin?: string;
    x?: string;
  };
  website?: string;
  connections?: Array<{
    user: string;
    status: string;
  }>;
  hackathonsJoined?: Array<{
    hackathonId: string;
    status: string;
    teamId: string;
  }>;
  bookmarks?: Array<{
    type: string;
    id: string;
  }>;
  notifications?: Array<{
    type: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
  }>;
  isVerified: boolean;
  featuredProject: {
    title: string;
    description: string;
    link: string;
    techUsed: string;
  };
  achievements: string;
  points: number;
}

interface Notification {
  _id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  senderId?: {
    _id: string;
    fullname: { firstname: string; lastname: string };
    avatar?: string;
    username?: string;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  setIsAuthenticated: (value: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (googleData: { email: string; name: string; picture: string; googleId: string }) => Promise<void>;
  register: (data: {
    fullname: { firstname: string; lastname: string };
    email: string;
    password: string;
    username: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
  verifyUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  updateBanner: (file: File) => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<{ result: string; _id: string; role: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  getUserProfileByUsername: (username: string) => Promise<User>;
  updateSocketId: (socketId: string, userId: string) => Promise<void>;
  getUserBySocketId: (socketId: string) => Promise<User>;
  profileBox: string;
  setProfileBox: (modalName:string) => void;
  
  // Connection methods
  sendConnectionRequest: (targetUserId: string) => Promise<{ status: string, message: string }>;
  respondToConnectionRequest: (senderId: string, action: 'accept' | 'decline') => Promise<void>;
  getConnectionStatus: (targetUserId: string) => Promise<{ status: string }>;
  getConnectionsCount: (userId: string) => Promise<{ connectionsCount: number }>;
  getConnections: (userId: string, page?: number, limit?: number) => Promise<{
    connections: Array<{
      _id: string;
      fullname: { firstname: string; lastname: string };
      avatar?: string;
      username?: string;
      email: string;
      location?: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalConnections: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>;
  removeConnection: (targetUserId: string) => Promise<{ message: string }>;

  // Chat methods
  getConversations: (page?: number, limit?: number) => Promise<{
    conversations: Array<{
      conversationId: string;
      otherUser: {
        _id: string;
        fullname: { firstname: string; lastname: string };
        avatar?: string;
        username?: string;
        isOnline?: boolean;
        lastSeen?: string;
      };
      lastMessage: {
        _id: string;
        message: string;
        senderId: string;
        createdAt: string;
      };
      unreadCount: number;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>;
  getMessages: (conversationId: string, page?: number, limit?: number) => Promise<{
    messages: Array<{
      _id: string;
      message: string;
      senderId: { _id: string; fullname: { firstname: string; lastname: string }; avatar?: string };
      receiverId: { _id: string; fullname: { firstname: string; lastname: string }; avatar?: string };
      createdAt: string;
      isRead: boolean;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalMessages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>;
  sendMessage: (receiverId: string, message: string) => Promise<{
    message: string;
    data: {
      _id: string;
      message: string;
      senderId: { _id: string; fullname: { firstname: string; lastname: string }; avatar?: string };
      receiverId: { _id: string; fullname: { firstname: string; lastname: string }; avatar?: string };
      createdAt: string;
    };
  }>;
  markMessagesAsRead: (conversationId: string) => Promise<{ message: string }>;
  getUnreadMessageCount: () => Promise<{ unreadCount: number }>;
  
  // Notification methods
  notifications: Notification[];
  unreadNotificationCount: number;
  getNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  getUnreadNotificationCount: () => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadNotificationCount: (count: number) => void;
  
  // Report methods
  submitReport: (reportData: {
    type: 'bug' | 'feature' | 'feedback' | 'abuse' | 'technical';
    category: 'game' | 'whiteboard' | 'chat' | 'video' | 'audio' | 'general' | 'other';
    title: string;
    description: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    roomId?: string;
    eventId?: string;
    tags?: string[];
  }) => Promise<{ message: string; report: Report }>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      loading: false,
      error: null,
      notifications: [],
      unreadNotificationCount: 0,

      setIsAuthenticated: (value) => set({ isAuthenticated: value }),

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/login', { email, password });
          const { token, user } = response.data;
          document.cookie = `token=${token}; path=/; secure; samesite=none; max-age=${7 * 24 * 60 * 60}`; // 7 days
          set({ token, user, isAuthenticated: true, loading: false });
        } catch (error: unknown) {
          console.error('Login failed:', error);
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to login',
            loading: false 
          });
          throw error;
        }
      },

      googleLogin: async (googleData) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/google-login', googleData);
          console.log("google login response", response.data);
          const { token, user } = response.data;
          document.cookie = `token=${token}; path=/; secure; samesite=none; max-age=${7 * 24 * 60 * 60}`; // 7 days
          
          set({ token, user, isAuthenticated: true, loading: false });
        } catch (error: unknown) {
          console.error('Google login failed:', error);
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to login with Google',
            loading: false 
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/register', data);
          const { token, user } = response.data;
          document.cookie = `token=${token}; path=/; secure; samesite=none; max-age=${7 * 24 * 60 * 60 *1000 *365 *5 }`; // 7 days
          set({ token, user, isAuthenticated: true, loading: false });
        } catch (error: unknown) {
          console.error('Registration failed:', error);
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to register',
            loading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/logout');
        } catch (error) {
          console.error('Logout failed:', error);
        } finally {
          document.cookie = `token=; path=/; secure; samesite=none; max-age=0`; // 7 days
          localStorage.removeItem('hackmeet-auth');
          set({ token: null, isAuthenticated: false, user: null, error: null });
        }
      },

      checkAuth: () => {
        const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state.token;
        const isAuth = !!token;
        set({ isAuthenticated: isAuth, token });
        return isAuth;
      },

      verifyUser: async () => {
        const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state.token;
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          set({ loading: true, error: null });
          await api.get('/me ');
        } catch (error) {
          console.error('Error verifying user:', error);
          document.cookie = `token=; path=/; secure; samesite=none; max-age=0`;
          set({ 
            isAuthenticated: false, 
            token: null, 
            user: null, 
            error: 'Session expired',
            loading: false 
          });
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      },

      updateProfile: async (data) => {
        try {
          set({ loading: true, error: null });
          const response = await api.put('/update', data);
          console.log(response.data);
          set({ user: response.data.user, loading: false });
        } catch (error: unknown) {
          console.error('Error updating profile:', error);
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to update profile',
            loading: false 
          });
          throw error;
        }
      },

      checkUsernameAvailability: async (username: string) => {
        try {
          const response = await api.get(`/check-username/${username}`);
          return response.data.available;
        } catch (error) {
          console.error('Error checking username:', error);
          return false;
        }
      },

      updateAvatar: async (file: File) => {
        try {
          set({ loading: true, error: null });
          const formData = new FormData();
          formData.append('avatar', file);
          
          const response = await api.post('/avatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          if (response.data.avatar) {
            set((state) => ({
              user: state.user ? { ...state.user, avatar: response.data.avatar } : null,
              loading: false
            }));
          } else {
            throw new Error('No avatar URL in response');
          }
        } catch (error: unknown) {
          console.error('Error updating avatar:', error);
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to update avatar',
            loading: false 
          });
          throw error;
        }
      },

      updateBanner: async (file: File) => {
        try {
          set({ loading: true, error: null });
          const formData = new FormData();
          formData.append('banner', file);
          
          const response = await api.post('/banner', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          if (response.data.banner) {
            set((state) => ({
              user: state.user ? { ...state.user, banner: response.data.banner } : null,
              loading: false
            }));
          } else {
            throw new Error('No banner URL in response');
          }
        } catch (error: unknown) {
          console.error('Error updating banner:', error);
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to update banner',
            loading: false 
          });
          throw error;
        }
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      sendOTP: async (email: string) => {
        set({ loading: true, error: null });
        try {
          await api.post('/send-otp', { email });
        } catch (error: unknown) {
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to send OTP',
            loading: false 
          });
          throw error;
        }
      },

      verifyOTP: async (email: string, otp: string) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/verify-otp', { email, otp });
          console.log(response.data);
          return response.data;
        } catch (error: unknown) {
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to verify OTP',
            loading: false 
          });
          throw error;
        }
      },

      resetPassword: async (email: string, otp: string, newPassword: string) => {
        set({ loading: true, error: null });
        try {
          await api.post('/reset-password', { email, otp, newPassword });
        } catch (error: unknown) {
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to reset password',
            loading: false 
          });
          throw error;
        }
      },

      getUserProfileByUsername: async (username: string) => {
        try{
          const response = await api.get(`/profile/${username}`);
          return response.data.user;
        }catch(error: unknown){
          console.error('Error getting user profile:', error);
          throw error;
        }
      },

      updateSocketId: async (socketId: string,userId: string) => {
        try{
          const response = await api.post('/update-socket-id', {socketId, userId});
          return response.data;
        }catch(error: unknown){
          console.error('Error updating socket ID:', error);
          throw error;
        }
      },

      getUserBySocketId: async (socketId: string) => {
        try{
          const response = await api.get(`/get-user-by-socket-id/${socketId}`);
          return response.data.user;
        }catch(error: unknown){
          console.error('Error getting user by socket ID:', error);
          throw error;
        }
      },

      profileBox: "close",
      setProfileBox: (modalName)=>set({profileBox:modalName}),

      // Connection methods
      sendConnectionRequest: async (targetUserId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post('/connections/send-request', { targetUserId });
          set({ loading: false });
          return response.data;
        } catch (error: unknown) {
          console.error('Error sending connection request:', error);
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to send connection request',
            loading: false 
          });
          throw error;
        }
      },

      respondToConnectionRequest: async (senderId: string, action: 'accept' | 'decline') => {
        set({ loading: true, error: null });
        try {
          await api.post('/connections/respond', { senderId, action });
          // Refresh notifications after responding
          const { getNotifications, getUnreadNotificationCount } = useAuthStore.getState();
          await getNotifications();
          await getUnreadNotificationCount();
          set({ loading: false });
        } catch (error: unknown) {
          console.error('Error responding to connection request:', error);
          set({ 
            error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to respond to connection request',
            loading: false 
          });
          throw error;
        }
      },

      getConnectionStatus: async (targetUserId: string) => {
        try {
          const response = await api.get(`/connections/status/${targetUserId}`);
          return response.data;
        } catch (error: unknown) {
          console.error('Error getting connection status:', error);
          throw error;
        }
      },

      getConnectionsCount: async (userId: string) => {
        try {
          const response = await api.get(`/connections/count/${userId}`);
          return response.data;
        } catch (error: unknown) {
          console.error('Error getting connections count:', error);
          throw error;
        }
      },

      getConnections: async (userId: string, page = 1, limit = 10) => {
        try {
          const response = await api.get(`/connections/${userId}?page=${page}&limit=${limit}`);
          return response.data;
        } catch (error: unknown) {
          console.error('Error getting connections:', error);
          throw error;
        }
      },

      removeConnection: async (targetUserId: string) => {
        try {
          const response = await api.delete('/connections/remove', { data: { targetUserId } });
          return response.data;
        } catch (error: unknown) {
          console.error('Error removing connection:', error);
          throw error;
        }
      },

      // Chat methods
      getConversations: async (page = 1, limit = 20) => {
        try {
          const response = await api.get(`/chat/conversations?page=${page}&limit=${limit}`);
          return response.data;
        } catch (error: unknown) {
          console.error('Error getting conversations:', error);
          throw error;
        }
      },

      getMessages: async (conversationId: string, page = 1, limit = 50) => {
        try {
          const response = await api.get(`/chat/messages/${conversationId}?page=${page}&limit=${limit}`);
          return response.data;
        } catch (error: unknown) {
          console.error('Error getting messages:', error);
          throw error;
        }
      },

      sendMessage: async (receiverId: string, message: string) => {
        try {
          const response = await api.post('/chat/send', { receiverId, message });
          return response.data;
        } catch (error: unknown) {
          console.error('Error sending message:', error);
          throw error;
        }
      },

      markMessagesAsRead: async (conversationId: string) => {
        try {
          const response = await api.patch('/chat/read', { conversationId });
          return response.data;
        } catch (error: unknown) {
          console.error('Error marking messages as read:', error);
          throw error;
        }
      },

      getUnreadMessageCount: async () => {
        try {
          const response = await api.get('/chat/unread-count');
          return response.data;
        } catch (error: unknown) {
          console.error('Error getting unread message count:', error);
          throw error;
        }
      },

      // Notification methods
      getNotifications: async () => {
        try {
          const response = await api.get('/notifications');
          set({ notifications: response.data.notifications });
        } catch (error: unknown) {
          console.error('Error getting notifications:', error);
          throw error;
        }
      },

      markNotificationAsRead: async (notificationId: string) => {
        try {
          await api.patch(`/notifications/${notificationId}/read`);
          // Update local state
          set((state) => ({
            notifications: state.notifications.map(notification =>
              notification._id === notificationId
                ? { ...notification, isRead: true }
                : notification
            )
          }));
          // Refresh unread count
          const { getUnreadNotificationCount } = useAuthStore.getState();
          await getUnreadNotificationCount();
        } catch (error: unknown) {
          console.error('Error marking notification as read:', error);
          throw error;
        }
      },

      markAllNotificationsAsRead: async () => {
        try {
          await api.patch('/notifications/read-all');
          // Update local state
          set((state) => ({
            notifications: state.notifications.map(notification => ({ ...notification, isRead: true })),
            unreadNotificationCount: 0
          }));
        } catch (error: unknown) {
          console.error('Error marking all notifications as read:', error);
          throw error;
        }
      },

      getUnreadNotificationCount: async () => {
        try {
          const response = await api.get('/notifications/unread-count');
          set({ unreadNotificationCount: response.data.unreadCount });
        } catch (error: unknown) {
          console.error('Error getting unread notification count:', error);
          throw error;
        }
      },

              setNotifications: (notifications: Notification[]) => set({ notifications }),
      setUnreadNotificationCount: (count: number) => set({ unreadNotificationCount: count }),

      // Report methods
      submitReport: async (reportData: {
        type: 'bug' | 'feature' | 'feedback' | 'abuse' | 'technical';
        category: 'game' | 'whiteboard' | 'chat' | 'video' | 'audio' | 'general' | 'other';
        title: string;
        description: string;
        severity?: 'low' | 'medium' | 'high' | 'critical';
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        roomId?: string;
        eventId?: string;
        tags?: string[];
      }) => {
        try {
          const response = await api.post('/reports', reportData);
          return response.data;
        } catch (error: unknown) {
          console.error('Error submitting report:', error);
          throw error;
        }
      },
    }),
    {
      name: 'hackmeet-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user
      })
    }
  )
);

export default useAuthStore; 