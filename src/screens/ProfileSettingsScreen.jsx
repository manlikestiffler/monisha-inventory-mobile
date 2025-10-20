import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StatusBar, Switch } from 'react-native';
import { getColors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../configuration/authStore';
import { useTheme } from '../contexts/ThemeContext';

export default function ProfileSettingsScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { user, userProfile, updateProfile } = useAuthStore();
  
  const [profileData, setProfileData] = useState({
    name: userProfile?.displayName || user?.displayName || '',
    email: user?.email || '',
    avatar: userProfile?.avatar || '',
    language: 'en',
    notifications: {
      email: true,
      browser: true,
      lowStock: true,
      orderUpdates: true
    }
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(profileData);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'ta', label: 'Tamil' }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: 50, 
        paddingBottom: 20,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            padding: 8,
            marginRight: 16
          }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>
            Profile Settings
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, marginTop: 2 }}>
            Update your personal information
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: isDarkMode ? '500' : '600', 
            color: colors.foreground, 
            marginBottom: 12,
            marginLeft: 4
          }}>
            Basic Information
          </Text>
          
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            padding: 16
          }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, marginBottom: 8 }}>
                Full Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.cardForeground,
                  backgroundColor: colors.card
                }}
                value={profileData.name}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, marginBottom: 8 }}>
                Email
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.cardForeground,
                  backgroundColor: colors.card
                }}
                value={profileData.email}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, marginBottom: 8 }}>
                Avatar URL
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.cardForeground,
                  backgroundColor: colors.card
                }}
                value={profileData.avatar}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, avatar: text }))}
                placeholder="Enter avatar URL (optional)"
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, marginBottom: 8 }}>
                Language
              </Text>
              <View style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                backgroundColor: colors.muted
              }}>
                {languageOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setProfileData(prev => ({ ...prev, language: option.value }))}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderBottomWidth: index < languageOptions.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border
                    }}
                  >
                    <Text style={{ fontSize: 16, color: colors.cardForeground }}>{option.label}</Text>
                    {profileData.language === option.value && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Notification Preferences */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: isDarkMode ? '500' : '600', 
            color: colors.foreground, 
            marginBottom: 12,
            marginLeft: 4
          }}>
            Notification Preferences
          </Text>
          
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            overflow: 'hidden'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground }}>
                  Email Notifications
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  Receive email updates about your account
                </Text>
              </View>
              <Switch
                value={profileData.notifications.email}
                onValueChange={(value) => setProfileData(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, email: value }
                }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground }}>
                  Push Notifications
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  Get real-time notifications on your device
                </Text>
              </View>
              <Switch
                value={profileData.notifications.browser}
                onValueChange={(value) => setProfileData(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, browser: value }
                }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground }}>
                  Low Stock Alerts
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  Get notified when inventory is running low
                </Text>
              </View>
              <Switch
                value={profileData.notifications.lowStock}
                onValueChange={(value) => setProfileData(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, lowStock: value }
                }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
