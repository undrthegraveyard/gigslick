import { useState, useCallback } from 'react';
import { Message, FileUploadResponse } from '@/types/message';
import { chatService } from '@/services/api/apiService';
import { fileHandler } from '@/services/file/fileService';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: 'Hello! Please upload your resume or enter your unstructured job description.', 
      sender: 'AI' 
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUploadedResume, setLastUploadedResume] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleFileUpload = async (file: DocumentPicker.DocumentPickerAsset) => {
    setLoading(true);
    setError('');
    try {
      const formData = await fileHandler.createFormData(file);
      const response = await chatService.uploadResume(formData);
      
      setLastUploadedResume(file);
      
      addMessage({
        id: Date.now().toString(),
        text: `Resume "${file.name}" uploaded successfully. Please describe your newest job to add to the resume.`,
        sender: 'AI',
        type: 'file',
        file: {
          name: file.name,
          size: file.size,
          type: file.mimeType,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpdate = async (structuredJobDetails: string) => {
    if (!lastUploadedResume) {
      setError('Please upload a resume first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = await fileHandler.createFormData(lastUploadedResume, {
        structuredJobDetails,
      });

      const result = await chatService.updateResume(formData);

      if (!result.success) {
        throw new Error(result.message || 'Failed to update resume');
      }

      addMessage({
        id: Date.now().toString(),
        text: 'Resume updated successfully! You can download it using the link below.',
        sender: 'AI',
        type: 'file',
        file: {
          name: 'Updated Resume',
          path: result.path,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update resume';
      setError(errorMessage);
      addMessage({
        id: Date.now().toString(),
        text: `Error: ${errorMessage}`,
        sender: 'AI',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    addMessage({
      id: Date.now().toString(),
      text,
      sender: 'Me',
    });

    setLoading(true);
    setError('');
    
    try {
      const response = await chatService.structureJobDescription(text);

      // Add AI response
      addMessage({
        id: (Date.now() + 1).toString(),
        text: `Here's the structured job description. Would you like to add this to your resume?\n\n${response.structuredText}`,
        sender: 'AI',
      });
      
      // Add confirmation prompt
      addMessage({
        id: (Date.now() + 2).toString(),
        text: 'Would you like to add this to your resume?',
        sender: 'AI',
        type: 'confirmation',
        structuredText: response.structuredText,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    error,
    handleFileUpload,
    handleResumeUpdate,
    sendMessage,
    addMessage,
  };
};