import axios, { AxiosError } from 'axios';

interface PointsUpdateRequest {
  userId: string;
  pointsChange: number;
  reason: string;
}

interface PointsUpdateResponse {
  message: string;
  newPoints: number;
  pointsChange: number;
}

export const BackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// Create axios instance with default config for points service
const pointsApi = axios.create({
  baseURL: `${BackendUrl}/user`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
pointsApi.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem('hackmeet-auth') || '{}').state?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class PointsService {
  async updateUserPoints(request: PointsUpdateRequest): Promise<PointsUpdateResponse> {
    try {
      const response = await pointsApi.post('/points/update', request);
      return response.data;
    } catch (error: unknown) {
      console.error('Error updating user points:', error);
      throw error instanceof AxiosError ? error : new Error('Failed to update user points');
    }
  }

  async getUserPoints(userId: string): Promise<{ points: number }> {
    try {
      const response = await pointsApi.get(`/points/${userId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching user points:', error);
      throw error instanceof AxiosError ? error : new Error('Failed to fetch user points');
    }
  }
}

export const pointsService = new PointsService();
export default pointsService; 