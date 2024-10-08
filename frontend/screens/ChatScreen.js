import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, KeyboardAvoidingView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

const API_URL = 'http://localhost:5001';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! Please upload your resume or enter your unstructured job description.', sender: 'AI' },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollViewRef = useRef();
  const [lastUploadedResume, setLastUploadedResume] = useState(null);

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      console.log("Picked document:", result);

      if (result.assets && result.assets.length > 0) {
        await handleFileUpload(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      setError('Failed to pick a document. Please try again.');
    }
  }, []);

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError('');
    try {
      console.log("Uploading file:", file);
      
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('resume', blob, file.name);
      } else {
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        formData.append('resume', {
          uri: fileInfo.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name || 'resume.pdf',
        });
      }
  
      console.log("FormData:", formData);
  
      const response = await fetch(`${API_URL}/api/upload-resume`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
  
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
  
      const result = await response.json();
      console.log("Upload response:", result);
  
      const aiMessage = {
        id: Date.now().toString(),
        text: `Resume "${file.name}" uploaded successfully. Please describe your newest job to add to the resume.`,
        sender: 'AI',
        type: 'file',
        file: {
          name: file.name,
          size: file.size,
          type: file.mimeType,
        },
      };
  
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      setLastUploadedResume(file);
  
    } catch (err) {
      console.error("Upload error:", err);
      setError(`Error: Unable to upload the file. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpdate = async (structuredJobDetails) => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('structuredJobDetails', structuredJobDetails);
      
      // Assuming the last uploaded resume is stored in the state
      if (lastUploadedResume) {
        if (Platform.OS === 'web') {
          const response = await fetch(lastUploadedResume.uri);
          const blob = await response.blob();
          formData.append('resume', blob, lastUploadedResume.name);
        } else {
          const fileInfo = await FileSystem.getInfoAsync(lastUploadedResume.uri);
          formData.append('resume', {
            uri: fileInfo.uri,
            type: lastUploadedResume.mimeType || 'application/octet-stream',
            name: lastUploadedResume.name || 'resume.pdf',
          });
        }
      } else {
        throw new Error('No resume uploaded');
      }

      const response = await fetch(`${API_URL}/api/update-resume`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log("Resume update response:", result);

      const aiMessage = {
        id: Date.now().toString(),
        text: `Resume updated successfully. You can download the updated resume here: ${result.updatedResumePath}`,
        sender: 'AI',
        type: 'file',
        file: {
          name: 'Updated Resume',
          path: result.updatedResumePath,
        },
      };

      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (err) {
      console.error("Resume update error:", err);
      setError(`Error: Unable to update the resume. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'Me',
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setInputText('');

      setLoading(true);
      setError('');
      try {
        const response = await axios.post(`${API_URL}/api/structure-job-description`, {
          description: inputText,
        });

        console.log('Response received:', response.data);

        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: `Here's the structured job description. Would you like to add this to your resume?\n\n${response.data.structuredText}`,
          sender: 'AI',
        };
        setMessages(prevMessages => [...prevMessages, aiMessage]);

        // Add confirmation buttons
        const confirmationMessage = {
          id: (Date.now() + 2).toString(),
          text: 'Would you like to add this to your resume?',
          sender: 'AI',
          type: 'confirmation',
          onConfirm: () => handleResumeUpdate(response.data.structuredText),
          onDecline: () => {
            const declineMessage = {
              id: Date.now().toString(),
              text: 'Okay, the resume will not be updated.',
              sender: 'AI',
            };
            setMessages(prevMessages => [...prevMessages, declineMessage]);
          },
        };
        setMessages(prevMessages => [...prevMessages, confirmationMessage]);
      } catch (err) {
        console.error("Error:", err);
        setError(`Error: Unable to process job description. ${err.response?.data?.error || err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderMessage = ({ item }) => {
    if (item.type === 'file') {
      return (
        <View key={item.id} style={item.sender === 'Me' ? styles.myMessage : styles.aiMessage}>
          <Text style={styles.messageText}>{item.text}</Text>
          <View style={styles.filePreview}>
            <Ionicons name="document" size={24} color="#007AFF" />
            <Text style={styles.fileName}>{item.file.name}</Text>
            <Text style={styles.fileSize}>{(item.file.size / 1024).toFixed(2)} KB</Text>
          </View>
        </View>
      );
    } else if (item.type === 'confirmation') {
      return (
        <View key={item.id} style={styles.aiMessage}>
          <Text style={styles.messageText}>{item.text}</Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity style={styles.confirmButton} onPress={item.onConfirm}>
              <Text style={styles.confirmButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineButton} onPress={item.onDecline}>
              <Text style={styles.declineButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View key={item.id} style={item.sender === 'Me' ? styles.myMessage : styles.aiMessage}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollViewContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((item) => renderMessage({ item }))}
          </ScrollView>
  
          {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
  
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickDocument}>
            <Ionicons name="add" size={28} color="#007AFF" style={styles.addButton} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Enter unstructured job description..."
          />
          <TouchableOpacity onPress={sendMessage}>
            <Ionicons name="send" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 60, // Height of the input container
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 10,
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    margin: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  aiMessage: {
    backgroundColor: '#ECECEC',
    alignSelf: 'flex-start',
    margin: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 16,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginTop: 5,
  },
  fileName: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
  fileSize: {
    marginLeft: 10,
    fontSize: 12,
    color: 'gray',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#ECECEC',
    marginHorizontal: 10,
  },
  addButton: {
    paddingLeft: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  declineButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  declineButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});