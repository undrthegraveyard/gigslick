import { ENV } from './env';

export const API_CONFIG = {
  BASE_URL: ENV.API_URL,
  ENDPOINTS: {
    UPLOAD_RESUME: '/api/upload-resume',
    UPDATE_RESUME: '/api/update-resume',
    STRUCTURE_JOB: '/api/structure-job-description',
  },
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
};

export const FILE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ERROR_MESSAGES: {
    SIZE_EXCEEDED: 'File size exceeds 5MB limit',
    INVALID_TYPE: 'Only .docx files are supported',
  },
};