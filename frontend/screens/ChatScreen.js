import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

const API_URL = 'http://localhost:5001'; // Update this to your actual backend URL

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! Please upload your resume or enter your unstructured job description.', sender: 'AI' },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      formData.append('resume', {
        uri: file.uri,
        type: file.mimeType,
        name: file.name,
      });
  
      console.log("FormData:", formData);
  
      const response = await axios.post(`${API_URL}/api/upload-resume`,  formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });
  
      console.log("Upload response:", response.data);
  
      const aiMessage = {
        id: (messages.length + 1).toString(),
        text: `Resume "${file.name}" uploaded successfully. Please describe your newest job to add to the resume.`,
        sender: 'AI',
        type: 'file',
        file: {
          name: file.name,
          size: file.size,
          type: file.mimeType,
        },
      };
  
      setMessages(prevMessages => [aiMessage, ...prevMessages]);
    } catch (err) {
      console.error("Upload error:", err);
      setError(`Error: Unable to upload the file. ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim()) {
        const newMessage = {
            id: (messages.length + 1).toString(),
            text: inputText,
            sender: 'Me',
        };
        setMessages(prevMessages => [newMessage, ...prevMessages]);
        setInputText('');

        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_URL}/api/structure-job-description`, {
                description: inputText,
            });

            console.log('Response received:', response.data);

            const aiMessage = {
                id: (messages.length + 2).toString(),
                text: response.data.structuredText,
                sender: 'AI',
            };
            setMessages(prevMessages => [aiMessage, newMessage, ...prevMessages]);
        } catch (err) {
            console.error("Upload error:", err);
            console.error("Error response:", err.response);
            setError(`Error: Unable to upload the file. ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    }
}

  const renderMessage = ({ item }) => {
    if (item.type === 'file') {
      return (
        <View style={item.sender === 'Me' ? styles.myMessage : styles.aiMessage}>
          <Text style={styles.messageText}>{item.text}</Text>
          <View style={styles.filePreview}>
            <Ionicons name="document" size={24} color="#007AFF" />
            <View>
              <Text style={styles.fileName}>{item.file.name}</Text>
              <Text style={styles.fileSize}>{(item.file.size / 1024).toFixed(2)} kB</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={item.sender === 'Me' ? styles.myMessage : styles.aiMessage}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
      />

      {loading && <ActivityIndicator size="large" color="#007AFF" />}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    margin: 10,
    padding: 10,
    borderRadius: 10,
  },
  aiMessage: {
    backgroundColor: '#ECECEC',
    alignSelf: 'flex-start',
    margin: 10,
    padding: 10,
    borderRadius: 10,
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
});
