import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Message } from '@/types/message';
import { MessageBubble } from '@/components/Message/Message';
import { ChatInputBar } from '@/components/ChatInput/ChatInput';
import { useChat } from '@/hooks/useChat';

export default function ChatScreen() {
  const { 
    messages, 
    loading, 
    error,
    handleFileUpload,
    handleResumeUpdate,
    sendMessage,
    addMessage
  } = useChat();
  
  const scrollViewRef = useRef<ScrollView>(null);

  const handleConfirmAction = async (confirm: boolean, structuredText?: string) => {
    if (confirm && structuredText) {
      await handleResumeUpdate(structuredText);
    } else {
      // Add decline message through hook
      addMessage({
        id: Date.now().toString(),
        text: 'Okay, the resume will not be updated.',
        sender: 'AI',
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Main scrollable content */}
      <View className="flex-1 mb-[60px]">
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerClassName="p-4 pb-5"
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View key={message.id} className="my-1 max-w-[80%]">
              <MessageBubble 
                message={message} 
                onConfirm={handleConfirmAction}
              />
            </View>
          ))}
          
          {loading && (
            <View className="p-5 items-center">
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
          
          {error ? (
            <Text className="text-red-500 bg-red-50 p-3 rounded-lg my-2 text-center">
              {error}
            </Text>
          ) : null}
        </ScrollView>
      </View>

      {/* Chat Input */}
      <ChatInputBar
        onSendMessage={sendMessage}
        onFileSelect={handleFileUpload}
        onError={(error) => console.error(error)}
      />
    </SafeAreaView>
  );
}