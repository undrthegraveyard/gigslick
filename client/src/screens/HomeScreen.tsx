import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/message';

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-3xl font-bold mb-2.5 text-primary">Resume Builder</Text>
        <Text className="text-lg text-center mb-8 text-gray-700">
          Create your professional resume with AI assistance
        </Text>
        <TouchableOpacity
          className="bg-primary px-8 py-4 rounded-full"
          onPress={() => navigation.navigate('Chat')}
        >
          <Text className="text-lg font-bold text-white">Start Building</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}