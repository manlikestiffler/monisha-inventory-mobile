import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import './global.css';

function AppContent() {
  const { isDarkMode } = useTheme();
  
  // Set navigation bar color for Android
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      // Force dark navigation bar regardless of theme for complete dark appearance
      NavigationBar.setBackgroundColorAsync('#000000');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, [isDarkMode]);
  
  return (
    <>
      <NavigationContainer theme={{
        dark: isDarkMode,
        colors: {
          background: isDarkMode ? '#0a0a0a' : '#ffffff',
          card: isDarkMode ? '#1a1a1a' : '#ffffff',
          text: isDarkMode ? '#ffffff' : '#0a0a0a',
          border: isDarkMode ? '#262626' : '#e5e7eb',
          notification: '#ef4444',
          primary: '#ef4444',
        },
      }}>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar 
        style="light"
        backgroundColor="#000000"
        translucent={false}
      />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <SafeAreaProvider style={{ backgroundColor: '#0a0a0a' }}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
