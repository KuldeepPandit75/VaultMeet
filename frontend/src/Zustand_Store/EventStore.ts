import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { BackendUrl } from './AuthStore';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${BackendUrl}/event`,
  withCredentials: true,
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem('vaultmeet-auth') || '{}').state?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Event {
  _id: string;
  company: {
    name: string;
    website: string;
    industry: string;
    logo: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    socialProfiles?: string;
  };
  name: string;
  banner: string;
  type: 'hackathon' | 'workshop' | 'webinar' | 'tech-talk' | 'other';
  description: string;
  mode: 'online' | 'offline' | 'hybrid';
  startDate: Date;
  endDate: Date;
  duration: string;
  targetAudience: 'students' | 'professionals' | 'startups' | 'all';
  maxParticipants: number;
  venue?: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    contactPerson: string;
  };
  stages?: Stage[];
  prizes: {
    hasPrizes: boolean;
    details?: string;
    sponsorshipDetails?: string;
    prizePool?: string;
  };
  promotion: {
    needsPromotion: boolean;
    marketingMaterials: string[];
  };
  additionalNotes?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  stats: {
    registeredParticipants: number;
    approvedParticipants: number;
  };
}

interface Stage {
  stageName: string;
  stageDescription?: string;
  stageStartDate: Date;
  stageEndDate?: Date;
  onVaultMeet: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalEvents: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Registration {
  _id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'approved' | 'rejected';
  experience: string;
  motivation: string;
  skills: string;
  previousProjects?: string;
  expectations: string;
  teamPreference: string;
  teamId?: string;
  createdAt: Date;
}

interface NewsItem {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  source: string;
  date: string;
  category: string;
}

interface TeamMember {
  userId: {
    _id: string;
    fullname: { firstname: string; lastname: string };
    email: string;
    avatar?: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  joinedAt: Date;
}

interface Team {
  _id: string;
  name: string;
  eventId: string;
  leaderId: {
    _id: string;
    fullname: { firstname: string; lastname: string };
    email: string;
    avatar?: string;
  };
  members: TeamMember[];
  inviteCode: string;
  maxMembers: number;
  createdAt: Date;
}

interface EventState {
  events: Event[];
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  userRegistration: Registration | null;
  userTeam: Team | null;
  userEvents: Event[];
  userEventsPagination: PaginationInfo | null;
  createEvent: (eventData: Partial<Event>) => Promise<Event>;
  updateEvent: (eventId: string, eventData: Event) => Promise<Event>;
  publishEvent: (eventId: string) => Promise<Event>;
  unpublishEvent: (eventId: string) => Promise<Event>;
  deleteEvent: (eventId: string) => Promise<void>;
  uploadCompanyLogo: (file: File) => Promise<string>;
  uploadEventBanner: (file: File) => Promise<string>;
  uploadMarketingMaterials: (files: File[]) => Promise<string[]>;
  getPublishedEvents: (params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    mode?: 'online' | 'offline' | 'hybrid';
    type?: string;
  }) => Promise<void>;
  getUserCreatedEvents: (userId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => Promise<{ events: Event[]; pagination: PaginationInfo }>;
  getEventById: (eventId: string) => Promise<Event>;
  // Registration methods
  registerForEvent: (eventId: string, registrationData: {
    experience: string;
    motivation: string;
    skills: string;
    previousProjects?: string;
    expectations: string;
    teamPreference: string;
  }) => Promise<Registration>;
  getRegistrationStatus: (eventId: string) => Promise<{ registration: Registration | null; team: Team | null }>;
  // Team methods
  createTeam: (eventId: string, teamName: string) => Promise<Team>;
  joinTeam: (eventId: string, teamId: string, inviteCode: string) => Promise<Team>;
  getTeamDetails: (eventId: string, teamId: string) => Promise<Team>;
  getTeamByInviteCode: (eventId: string, inviteCode: string) => Promise<{ team: Team; event: void }>;
  // Participant management methods
  getEventParticipants: (eventId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => Promise<void>;
  updateParticipantStatus: (eventId: string, participantId: string, status: string) => Promise<void>;
  bulkUpdateParticipants: (eventId: string, participantIds: string[], status: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  postNews: (link: string) => Promise<void>;
  getNews: (page?: number, limit?: number) => Promise<{success:boolean,data:NewsItem[], pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }}>;
}

const useEventStore = create<EventState>()((set) => ({
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
  pagination: null,
  userRegistration: null,
  userTeam: null,
  userEvents: [],
  userEventsPagination: null,

  createEvent: async (eventData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/create', eventData);
      const createdEvent = response.data.data;
      set((state) => ({
        events: [...state.events, createdEvent],
        loading: false
      }));
      return createdEvent;
    } catch (error: unknown) {
      console.error('Error creating event:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to create event',
        loading: false 
      });
      throw error;
    }
  },

  updateEvent: async (eventId, eventData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/${eventId}`, eventData);
      const updatedEvent = response.data.data;
      set((state) => ({
        events: state.events.map(event => event._id === eventId ? updatedEvent : event),
        currentEvent: state.currentEvent?._id === eventId ? updatedEvent : state.currentEvent,
        loading: false
      }));
      return updatedEvent;
    } catch (error: unknown) {
      console.error('Error updating event:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to update event',
        loading: false 
      });
      throw error;
    }
  },

  publishEvent: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/${eventId}/publish`);
      const publishedEvent = response.data.data;
      set((state) => ({
        events: state.events.map(event => event._id === eventId ? publishedEvent : event),
        currentEvent: state.currentEvent?._id === eventId ? publishedEvent : state.currentEvent,
        loading: false
      }));
      return publishedEvent;
    } catch (error: unknown) {
      console.error('Error publishing event:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to publish event',
        loading: false 
      });
      throw error;
    }
  },

  unpublishEvent: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/${eventId}/unpublish`);
      const unpublishedEvent = response.data.data;
      set((state) => ({
        events: state.events.map(event => event._id === eventId ? unpublishedEvent : event),
        currentEvent: state.currentEvent?._id === eventId ? unpublishedEvent : state.currentEvent,
        loading: false
      }));
      return unpublishedEvent;
    } catch (error: unknown) {
      console.error('Error unpublishing event:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to unpublish event',
        loading: false 
      });
      throw error;
    }
  },

  deleteEvent: async (eventId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/${eventId}`);
      set((state) => ({
        events: state.events.filter(event => event._id !== eventId),
        userEvents: state.userEvents.filter(event => event._id !== eventId),
        currentEvent: state.currentEvent?._id === eventId ? null : state.currentEvent,
        loading: false
      }));
    } catch (error: unknown) {
      console.error('Error deleting event:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to delete event',
        loading: false 
      });
      throw error;
    }
  },

  getPublishedEvents: async (params) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      // Add filter params
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.mode) queryParams.append('mode', params.mode);
      if (params.type) queryParams.append('type', params.type);

      const response = await api.get(`/published?${queryParams.toString()}`);
      
      // Convert string dates to Date objects
      const eventsWithDates = response.data.data.events.map((event: Omit<Event, 'startDate' | 'endDate'> & { startDate: string; endDate: string }) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate)
      }));
      
      set({
        events: eventsWithDates,
        pagination: response.data.data.pagination,
        loading: false
      });
    } catch (error: unknown) {
      console.error('Error fetching published events:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to fetch events',
        loading: false 
      });
      throw error;
    }
  },

  uploadCompanyLogo: async (file: File) => {
    try {
      set({ loading: true, error: null });
      const formData = new FormData();
      formData.append('companyLogo', file);
      
      const response = await api.post('/upload-company-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      set({ loading: false });
      return response.data.url;
    } catch (error: unknown) {
      console.error('Error uploading company logo:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to upload company logo',
        loading: false 
      });
      throw error;
    }
  },

  uploadEventBanner: async (file: File) => {
    try {
      set({ loading: true, error: null });
      const formData = new FormData();
      formData.append('eventBanner', file);
      
      const response = await api.post('/upload-event-banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      set({ loading: false });
      return response.data.url;
    } catch (error: unknown) {
      console.error('Error uploading event banner:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to upload event banner',
        loading: false 
      });
      throw error;
    }
  },

  uploadMarketingMaterials: async (files: File[]) => {
    try {
      set({ loading: true, error: null });
      const formData = new FormData();
      files.forEach(file => {
        formData.append('marketingMaterials', file);
      });
      
      const response = await api.post('/upload-marketing-materials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      set({ loading: false });
      return response.data.urls;
    } catch (error: unknown) {
      console.error('Error uploading marketing materials:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to upload marketing materials',
        loading: false 
      });
      throw error;
    }
  },

  getEventById: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/${eventId}`);
      
      // Convert string dates to Date objects
      const eventData = {
        ...response.data.data,
        startDate: new Date(response.data.data.startDate),
        endDate: new Date(response.data.data.endDate),
        stages: response.data.data.stages?.map((stage: Omit<Stage, 'stageStartDate' | 'stageEndDate'> & { 
          stageStartDate: string; 
          stageEndDate?: string;
        }) => ({
          ...stage,
          stageStartDate: new Date(stage.stageStartDate),
          stageEndDate: stage.stageEndDate ? new Date(stage.stageEndDate) : null
        }))
      };
      
      set({
        currentEvent: eventData,
        loading: false
      });
      return eventData;
    } catch (error: unknown) {
      console.error('Error fetching event:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to fetch event',
        loading: false 
      });
      throw error;
    }
  },

  registerForEvent: async (eventId, registrationData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/${eventId}/register`, registrationData);
      const registration = response.data.data;
      set({ userRegistration: registration, loading: false });
      return registration;
    } catch (error: unknown) {
      console.error('Error registering for event:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to register for event',
        loading: false 
      });
      throw error;
    }
  },

  getRegistrationStatus: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/${eventId}/registration-status`);
      const { registration, team } = response.data.data;
      set({ 
        userRegistration: registration, 
        userTeam: team, 
        loading: false 
      });
      return { registration, team };
    } catch (error: unknown) {
      console.error('Error getting registration status:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to get registration status',
        loading: false 
      });
      throw error;
    }
  },

  createTeam: async (eventId, teamName) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/${eventId}/teams`, { name: teamName });
      const team = response.data.data;
      set({ userTeam: team, loading: false });
      return team;
    } catch (error: unknown) {
      console.error('Error creating team:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to create team',
        loading: false 
      });
      throw error;
    }
  },

  joinTeam: async (eventId, teamId, inviteCode) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/${eventId}/teams/${teamId}/join`, { inviteCode });
      const team = response.data.data;
      set({ userTeam: team, loading: false });
      return team;
    } catch (error: unknown) {
      console.error('Error joining team:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to join team',
        loading: false 
      });
      throw error;
    }
  },

  getTeamDetails: async (eventId, teamId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/${eventId}/teams/${teamId}`);
      const team = response.data.data;
      set({ userTeam: team, loading: false });
      return team;
    } catch (error: unknown) {
      console.error('Error getting team details:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to get team details',
        loading: false 
      });
      throw error;
    }
  },

  getTeamByInviteCode: async (eventId, inviteCode) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/${eventId}/teams/by-invite/${inviteCode}`);
      const { team, event } = response.data.data;
      set({ loading: false });
      return { team, event };
    } catch (error: unknown) {
      console.error('Error getting team by invite code:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to get team by invite code',
        loading: false 
      });
      throw error;
    }
  },

  getEventParticipants: async (eventId, params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);

      const response = await api.get(`/${eventId}/participants?${queryParams.toString()}`);
      set({ loading: false });
      return response.data.data;
    } catch (error: unknown) {
      console.error('Error getting event participants:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to get event participants',
        loading: false 
      });
      throw error;
    }
  },

  updateParticipantStatus: async (eventId, participantId, status) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/${eventId}/participants/${participantId}/status`, { status });
      set({ loading: false });
      return response.data.data;
    } catch (error: unknown) {
      console.error('Error updating participant status:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to update participant status',
        loading: false 
      });
      throw error;
    }
  },

  bulkUpdateParticipants: async (eventId, participantIds, status) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/${eventId}/participants/bulk-status`, { 
        participantIds, 
        status 
      });
      set({ loading: false });
      return response.data.data;
    } catch (error: unknown) {
      console.error('Error bulk updating participants:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to bulk update participants',
        loading: false 
      });
      throw error;
    }
  },

  getUserCreatedEvents: async (userId, params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);

      const response = await api.get(`/user/${userId}?${queryParams.toString()}`);
      
      // Convert string dates to Date objects
      const eventsWithDates = response.data.data.events.map((event: Omit<Event, 'startDate' | 'endDate'> & { 
        startDate: string; 
        endDate: string 
      }) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate)
      }));
      
      set({
        userEvents: eventsWithDates,
        userEventsPagination: response.data.data.pagination,
        loading: false
      });
      
      return { 
        events: eventsWithDates, 
        pagination: response.data.data.pagination 
      };
    } catch (error: unknown) {
      console.error('Error fetching user created events:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to fetch user events',
        loading: false 
      });
      throw error;
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  postNews: async (link) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/post-news', { link });
      set({ loading: false });
      return response.data.data;
    } catch (error: unknown) {
      console.error('Error posting news:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to post news',
        loading: false 
      });
      throw error;
    }
  },

  getNews: async (page = 1, limit = 6) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/get-news?page=${page}&limit=${limit}`);
      set({ loading: false });
      return {
        success: response.data.success,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error: unknown) {
      console.error('Error getting news:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to get news',
        loading: false 
      });
      throw error;
    }
  }
}));

export default useEventStore; 