import type { DocumentPickerAsset } from 'expo-document-picker';

export interface Message {
  id: string;
  text: string;
  sender: 'AI' | 'Me';
  type?: 'file' | 'confirmation';
  file?: {
    name: string;
    size?: number;
    type?: string;
    path?: string;
  };
  structuredText?: string;
}

export interface FileAttachment {
  name: string;
  size?: number;
  type?: string;
  path?: string;
  uri?: string;
  mimeType?: string;
}

export interface FileUploadResponse {
  success: boolean;
  path: string;
  message?: string;
}

export interface JobStructureResponse {
  success: boolean;
  structuredText: string;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type MessageHandler = (text: string) => Promise<void> | void;
export type FileHandler = (file: DocumentPickerAsset) => Promise<void>;
export type ErrorHandler = (error: string) => void;
export type ConfirmationHandler = (confirm: boolean, structuredText?: string) => void;

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
};