import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Message, ConfirmationHandler } from '@/types/message';

interface MessageBubbleProps {
  message: Message;
  onConfirm?: ConfirmationHandler;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onConfirm }) => {
  const isUserMessage = message.sender === 'Me';
  const baseMessageClass = "rounded-xl p-3 mb-2";
  const messageTypeClass = isUserMessage
    ? "bg-blue-500 text-white self-end ml-[20%]"
    : "bg-white text-gray-900 self-start mr-[20%] shadow-sm";

  const handleConfirm = (confirmed: boolean) => {
    if (onConfirm && message.structuredText) {
      onConfirm(confirmed, message.structuredText);
    }
  };

  if (message.type === 'confirmation') {
    return (
      <View className={`${baseMessageClass} ${messageTypeClass}`}>
        <Text className="text-base leading-5 mb-3">{message.text}</Text>
        <View className="flex-row justify-end space-x-2">
          <TouchableOpacity
            className="bg-green-500 px-4 py-2 rounded-full"
            onPress={() => handleConfirm(true)}
          >
            <Text className="text-white font-medium">Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-red-500 px-4 py-2 rounded-full"
            onPress={() => handleConfirm(false)}
          >
            <Text className="text-white font-medium">No</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!message) return null;

  const renderFilePreview = () => (
    message.file && (
      <View className="flex-row items-center bg-gray-50 rounded-lg p-2 mt-2">
        <Ionicons name="document" size={24} color="#007AFF" />
        <View className="flex-1 ml-2">
          <Text 
            className="font-medium text-sm text-gray-900" 
            numberOfLines={1}
          >
            {message.file.name}
          </Text>
          {message.file.size && (
            <Text className="text-xs text-gray-600">
              {(message.file.size / 1024).toFixed(2)} KB
            </Text>
          )}
        </View>
      </View>
    )
  );

  const renderErrorState = () => (
    message.error && (
      <View className="mt-2">
        <Text className="text-red-500 text-sm mb-1">{message.error}</Text>
        {onRetry && (
          <TouchableOpacity
            className="bg-gray-200 py-1 px-3 rounded-md self-start"
            onPress={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#374151" />
            ) : (
              <Text className="text-gray-700">Retry</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    )
  );

  return (
    <View className={`${baseMessageClass} ${messageTypeClass}`}>
      <Text className={`text-base leading-5 ${isUserMessage ? 'text-white' : 'text-gray-900'}`}>
        {message.text}
      </Text>
      
      {message.type === 'file' && renderFilePreview()}
      {renderErrorState()}
      
      {message.timestamp && (
        <Text className={`text-xs mt-1 ${isUserMessage ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      )}
    </View>
  );
};