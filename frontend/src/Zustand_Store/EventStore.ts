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
  const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Event {
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
  onHackMeet: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalEvents: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface EventState {
  events: Event[];
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  createEvent: (eventData: Partial<Event>) => Promise<void>;
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
  getEventById: (eventId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const useEventStore = create<EventState>()((set) => ({
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
  pagination: null,

  createEvent: async (eventData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/create', eventData);
      set((state) => ({
        events: [...state.events, response.data.data],
        loading: false
      }));
    } catch (error: unknown) {
      console.error('Error creating event:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to create event',
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
    } catch (error: unknown) {
      console.error('Error fetching event:', error);
      set({ 
        error: error instanceof AxiosError ? error.response?.data?.message : 'Failed to fetch event',
        loading: false 
      });
      throw error;
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));

export default useEventStore; 