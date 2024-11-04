import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { FileUploadButton } from '../FileUpload/FileUpload';

interface ChatInputBarProps {
  onSendMessage: (text: string) => Promise<void> | void;
  onFileSelect: (file: DocumentPickerAsset) => Promise<void>;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onFileSelect,
  onError,
  disabled = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    if (disabled || isSubmitting || !inputText.trim()) return;

    try {
      setIsSubmitting(true);
      await onSendMessage(inputText.trim());
      setInputText('');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-200 z-50"
    >
      <View className="flex-row items-center p-2 min-h-[60px] bg-white">
        <FileUploadButton 
          onFileSelect={onFileSelect} 
          onError={onError}
          disabled={disabled} 
        />
        <TextInput
          className="flex-1 mx-2 px-3 py-2 max-h-[100px] bg-gray-100 rounded-full"
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter unstructured job description..."
          multiline
          editable={!disabled}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity 
          className={`p-2 ${(disabled || !inputText.trim()) ? 'opacity-50' : 'active:opacity-70'}`}
          onPress={handleSend}
          disabled={disabled || !inputText.trim() || isSubmitting}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={disabled ? '#999' : '#007AFF'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};