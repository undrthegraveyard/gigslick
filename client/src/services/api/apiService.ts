import axios from 'axios';
import { API_CONFIG } from '@/config/constants';
import type { FileUploadResponse, JobStructureResponse } from '@/types/message';

class ChatService {
  private api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  async uploadResume(formData: FormData): Promise<FileUploadResponse> {
    try {
      const response = await this.api.post(API_CONFIG.ENDPOINTS.UPLOAD_RESUME, formData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateResume(formData: FormData): Promise<FileUploadResponse> {
    try {
      const response = await this.api.post(API_CONFIG.ENDPOINTS.UPDATE_RESUME, formData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async structureJobDescription(description: string): Promise<JobStructureResponse> {
    try {
      const response = await this.api.post(API_CONFIG.ENDPOINTS.STRUCTURE_JOB, {
        description,
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to structure job description');
      }
      
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new AppError(message, error.response?.status?.toString());
    }
    throw error;
  }

  private async retryRequest<T>(request: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.retryRequest(request, retries - 1);
      }
      throw error;
    }
  }
}

export const chatService = new ChatService();