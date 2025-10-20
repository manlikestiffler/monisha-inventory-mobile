import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../../config/firebase';
import { useAuthStore } from '../../configuration/authStore';

const LoginScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, fetchUserProfile } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError('Please verify your email before logging in.');
        setLoading(false);
        return;
      }

      setUser(user);
      await fetchUserProfile(user.uid);
      
      // Navigation will be handled by the auth state listener
      
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'An error occurred during login';
      
      switch (err.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        default:
          errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <StatusBar style="light" />
      <View
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
          <View className="flex-1 justify-center px-8">
            {/* Header */}
            <View className="items-center mb-12">
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 32,
                  backgroundColor: colors.primary,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <Text style={{ 
                  color: colors.primaryForeground, 
                  fontSize: 40, 
                  fontWeight: 'bold',
                  textShadowColor: 'rgba(0,0,0,0.3)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2
                }}>M</Text>
              </View>
              
              <Text className="text-white text-4xl font-bold mb-3 tracking-tight">
                Welcome Back
              </Text>
              <Text className="text-gray-400 text-lg text-center px-4">
                Sign in to Monisha Inventory Management System
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View className="space-y-6">
              <View>
                <Text className="text-gray-300 text-sm font-medium mb-3 ml-1">Email address</Text>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor="#6b7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-4 text-white text-base focus:border-red-500"
                  style={{
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#4b5563'
                  }}
                />
              </View>

              <View>
                <Text className="text-gray-300 text-sm font-medium mb-3 ml-1">Password</Text>
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                  autoComplete="current-password"
                  className="bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-4 text-white text-base focus:border-red-500"
                  style={{
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#4b5563'
                  }}
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className="mt-8"
                style={{
                  opacity: loading ? 0.7 : 1
                }}
              >
                <View
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 32,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8
                  }}
                >
                  {loading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color={colors.primaryForeground} className="mr-2" />
                      <Text style={{ color: colors.primaryForeground, fontSize: 18, fontWeight: '600' }}>
                        Signing in...
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: colors.primaryForeground, fontSize: 18, fontWeight: '600' }}>
                      Sign in
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <TouchableOpacity
                onPress={() => navigation.navigate('SignUp')}
                className="mt-8 items-center"
              >
                <Text className="text-gray-400 text-base">
                  Don't have an account?{' '}
                  <Text className="text-red-400 font-semibold">
                    Create one
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="mt-16 items-center">
              <Text className="text-gray-500 text-sm text-center px-8 leading-5">
                Secure inventory management for uniform distribution
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
