import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { fileHandler, FileError } from '@/services/file/fileService';
import type { FileHandler, ErrorHandler } from '@/types/message';

interface FileUploadButtonProps {
  onFileSelect: FileHandler;
  onError: ErrorHandler;
  disabled?: boolean;
  loading?: boolean;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  onError,
  disabled = false,
  loading = false
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handlePress = async () => {
    if (disabled || isUploading) return;

    try {
      setIsUploading(true);
      const file = await fileHandler.pickDocument();
      
      if (file) {
        await onFileSelect(file);
      }
    } catch (error) {
      if (error instanceof FileError) {
        onError(error.message);
      } else {
        onError('Failed to pick or upload document');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <TouchableOpacity 
      className={`p-2 ${disabled ? 'opacity-50' : 'active:opacity-70'}`}
      onPress={handlePress}
      disabled={disabled || isUploading}
    >
      {isUploading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Ionicons 
          name="add" 
          size={28} 
          color={disabled ? '#A0AEC0' : '#007AFF'} 
        />
      )}
    </TouchableOpacity>
  );
};