/**
 * API Endpoints configuration
 * Contains all the API endpoint paths used in the application
 */
export const API_ENDPOINTS = {
  UPLOAD_RESUME: '/api/upload-resume',
  STRUCTURE_JOB: '/api/structure-job-description',
  UPDATE_RESUME: '/api/update-resume'
};

/**
 * CORS Configuration
 * Allowed origins for CORS requests
 */
export const ALLOWED_ORIGINS = ['http://localhost:8081', 'http://localhost:5001'];

/**
 * File type constants
 * Supported file types and their MIME types
 */
export const FILE_TYPES = {
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

/**
 * File upload configurations
 */
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_FILE_TYPES: [FILE_TYPES.DOCX],
  UPLOAD_DIR: 'uploads'
};

/**
 * Error messages used throughout the application
 */
export const ERROR_MESSAGES = {
  // File upload related errors
  INVALID_FILE_TYPE: 'Invalid file type. Only DOCX files are allowed.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 5MB.',
  NO_FILE_RECEIVED: 'No file was received.',
  UPLOAD_FAILED: 'File upload failed.',
  FILE_WRITE_ERROR: 'Error saving file.',
  FILE_DELETE_ERROR: 'Error deleting file.',
  
  // Job description related errors
  MISSING_JOB_DESCRIPTION: 'Job description is required.',
  INVALID_JOB_DESCRIPTION: 'Invalid job description format.',
  JOB_DESCRIPTION_TOO_SHORT: 'Job description is too short.',
  PROCESSING_FAILED: 'Failed to process job description.',
  
  // Resume related errors
  NO_RESUME_UPLOADED: 'No resume has been uploaded.',
  MISSING_JOB_DETAILS: 'Structured job details are required.',
  INVALID_JOB_DETAILS: 'Invalid job details format.',
  UPDATE_FAILED: 'Failed to update resume.',
  EXPERIENCE_SECTION_NOT_FOUND: 'Could not find experience section in resume.',
  TEMPLATE_NOT_FOUND: 'Could not find job entry template in resume.',
  INVALID_RESUME_FORMAT: 'Invalid resume format or structure.',
  
  // OpenAI related errors
  AI_PROCESSING_ERROR: 'Error processing with AI service.',
  AI_RESPONSE_ERROR: 'Invalid response from AI service.',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error occurred.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable.'
};

/**
 * Success messages used throughout the application
 */
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully.',
  RESUME_UPDATED: 'Resume updated successfully.',
  JOB_STRUCTURED: 'Job description structured successfully.'
};

/**
 * OpenAI configuration
 */
export const OPENAI_CONFIG = {
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 300,
  TEMPERATURE: 0.5
};

/**
 * Validation constants
 */
export const VALIDATION = {
  MIN_JOB_DESCRIPTION_LENGTH: 10,
  MIN_JOB_DETAILS_LINES: 3,
  MAX_BULLET_POINTS: 5
};

/**
 * HTTP Status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Application routes
 */
export const ROUTES = {
  API: {
    PREFIX: '/api',
    RESUME: {
      UPLOAD: '/upload-resume',
      UPDATE: '/update-resume'
    },
    JOB: {
      STRUCTURE: '/structure-job-description'
    }
  }
};

/**
 * Logging levels
 */
export const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};