import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export class FileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileError';
  }
}

export const fileHandler = {
  pickDocument: async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (result.canceled) {
        return null;
      }

      if (result.assets && result.assets.length > 0) {
        return result.assets[0];
      }

      throw new FileError('No file selected');
    } catch (error) {
      if (error instanceof FileError) {
        throw error;
      }
      throw new FileError('Failed to pick document');
    }
  },

  createFormData: async (
    file: DocumentPicker.DocumentPickerAsset, 
    additionalData?: Record<string, any>
  ): Promise<FormData> => {
    const formData = new FormData();

    try {
      if (!file.uri) {
        throw new FileError('Invalid file: Missing URI');
      }

      if (Platform.OS === 'web') {
        try {
          const response = await fetch(file.uri);
          if (!response.ok) throw new FileError('Failed to fetch file');
          const blob = await response.blob();
          formData.append('resume', blob, file.name);
        } catch (error) {
          throw new FileError('Failed to process file for web upload');
        }
      } else {
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        if (!fileInfo.exists) {
          throw new FileError('File does not exist');
        }

        formData.append('resume', {
          uri: fileInfo.uri,
          type: file.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          name: file.name,
        } as any);
      }

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }

      return formData;
    } catch (error) {
      if (error instanceof FileError) throw error;
      throw new FileError('Failed to create form data');
    }
  },
};