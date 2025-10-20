import React, { useState, useEffect } from 'react';
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
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../../config/firebase';
import { useAuthStore } from '../../configuration/authStore';
import { collection, getDocs, query, limit } from 'firebase/firestore';

const SignUpScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstUser, setFirstUser] = useState(false);
  const { setUser, saveStaffProfile, saveManagerProfile } = useAuthStore();

  // Check if this is the first user in the system
  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        // Check if any managers exist
        const managersQuery = query(collection(db, 'managers'), limit(1));
        const managersSnapshot = await getDocs(managersQuery);
        
        // Check if any staff exist
        const staffQuery = query(collection(db, 'staff'), limit(1));
        const staffSnapshot = await getDocs(staffQuery);
        
        // If both collections are empty, this is the first user
        if (managersSnapshot.empty && staffSnapshot.empty) {
          setFirstUser(true);
        }
      } catch (err) {
        console.error('Error checking for first user:', err);
      }
    };
    
    checkFirstUser();
  }, []);

  const handleSignup = async () => {
    // Form validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      // Create the user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Generate a display name from first and last name
      const displayName = `${firstName} ${lastName}`;
      
      // Base user profile data
      const profileData = {
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        emailVerified: false,
        photoURL: user.photoURL || '',
        appOrigin: 'inventory'
      };
      
      // If this is the first user and it matches superuser email, make them a manager
      const SUPER_ADMIN_EMAIL = 'tinashegomo96@gmail.com';
      
      if (firstUser || user.email === SUPER_ADMIN_EMAIL) {
        // First user or superuser is automatically a manager
        await saveManagerProfile(user.uid, profileData);
        setSuccessMessage('Account created! Please check your email to verify your account. You are registered as a manager.');
      } else {
        // All other users are registered as staff
        await saveStaffProfile(user.uid, profileData);
        setSuccessMessage('Account created! Please check your email to verify your account. You are registered as staff.');
      }
      
      // Set the user in the global state
      setUser(user);
      
      // Navigate back to login after showing success message
      setTimeout(() => {
        navigation.navigate('Login');
      }, 3000);
      
    } catch (err) {
      console.error('Signup error:', err);
      let errorMessage = 'An error occurred during signup';
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
          <View className="flex-1 justify-center px-8">
            {/* Header */}
            <View className="items-center mb-8">
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
                Create Account
              </Text>
              <Text className="text-gray-400 text-lg text-center px-4">
                Join Monisha Inventory Management System
              </Text>
              
              {firstUser && (
                <View className="mt-4 bg-red-900/30 border border-red-500/30 rounded-xl p-3">
                  <Text className="text-red-400 text-sm text-center">
                    You are the first user! You will be registered as a manager.
                  </Text>
                </View>
              )}
            </View>

            {/* Error Message */}
            {error ? (
              <View className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl">
                <Text className="text-red-400 text-sm text-center">{error}</Text>
              </View>
            ) : null}

            {/* Success Message */}
            {successMessage ? (
              <View className="mb-6 p-4 bg-green-900/30 border border-green-500/30 rounded-xl">
                <Text className="text-green-400 text-sm text-center">{successMessage}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View className="space-y-4">
              {/* Name Fields */}
              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-gray-300 text-sm font-medium mb-2 ml-1">First Name</Text>
                  <TextInput
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      setError('');
                    }}
                    placeholder="First Name"
                    placeholderTextColor="#6b7280"
                    autoComplete="given-name"
                    className="bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-base"
                    style={{
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#4b5563'
                    }}
                  />
                </View>
                
                <View className="flex-1">
                  <Text className="text-gray-300 text-sm font-medium mb-2 ml-1">Last Name</Text>
                  <TextInput
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      setError('');
                    }}
                    placeholder="Last Name"
                    placeholderTextColor="#6b7280"
                    autoComplete="family-name"
                    className="bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-base"
                    style={{
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#4b5563'
                    }}
                  />
                </View>
              </View>

              {/* Email Field */}
              <View>
                <Text className="text-gray-300 text-sm font-medium mb-2 ml-1">Email address</Text>
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
                  className="bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-base"
                  style={{
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#4b5563'
                  }}
                />
              </View>

              {/* Password Field */}
              <View>
                <Text className="text-gray-300 text-sm font-medium mb-2 ml-1">Password</Text>
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                  autoComplete="new-password"
                  className="bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-base"
                  style={{
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#4b5563'
                  }}
                />
              </View>

              {/* Confirm Password Field */}
              <View>
                <Text className="text-gray-300 text-sm font-medium mb-2 ml-1">Confirm Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError('');
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  secureTextEntry
                  autoComplete="new-password"
                  className="bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-base"
                  style={{
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#4b5563'
                  }}
                />
              </View>

              {/* Staff Notice */}
              {!firstUser && (
                <View className="bg-gray-800/30 border border-gray-600/30 rounded-xl p-3 mt-4">
                  <Text className="text-gray-400 text-sm text-center">
                    You are signing up as a staff member. Only authorized administrators can grant manager access.
                  </Text>
                </View>
              )}

              {/* Create Account Button */}
              <TouchableOpacity
                onPress={handleSignup}
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
                        Creating Account...
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: colors.primaryForeground, fontSize: 18, fontWeight: '600' }}>
                      Create Account
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Sign In Link */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                className="mt-6 items-center"
              >
                <Text className="text-gray-400 text-base">
                  Already have an account?{' '}
                  <Text className="text-red-400 font-semibold">
                    Sign in
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="mt-12 items-center">
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

export default SignUpScreen;
