import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuthStore } from '../../configuration/authStore';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { colors } from '../constants/colors';

const AuthStack = createStackNavigator();

const AuthWrapper = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser, fetchUserProfile } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          await fetchUserProfile(firebaseUser.uid);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [setUser, fetchUserProfile]);

  if (isLoading) {
    return (
      <View 
        style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: colors.background 
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          color: colors.foreground, 
          marginTop: 16, 
          fontSize: 18,
          fontWeight: '500'
        }}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <AuthStack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: colors.background }
        }}
        initialRouteName="Login"
      >
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      </AuthStack.Navigator>
    );
  }

  return children;
};

export default AuthWrapper;
