import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StatusBar, Switch } from 'react-native';
import { getColors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../configuration/authStore';
import { useTheme } from '../contexts/ThemeContext';

export default function PrivacySecurityScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { user, changePassword, enable2FA, disable2FA } = useAuthStore();
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    dataSharing: false,
    analyticsTracking: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      Alert.alert('Success', 'Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (enabled) => {
    setLoading(true);
    try {
      if (enabled) {
        await enable2FA();
        Alert.alert('Success', 'Two-factor authentication enabled!');
      } else {
        await disable2FA();
        Alert.alert('Success', 'Two-factor authentication disabled!');
      }
      setSecuritySettings(prev => ({ ...prev, twoFactorAuth: enabled }));
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      Alert.alert('Error', 'Failed to update two-factor authentication settings');
    } finally {
      setLoading(false);
    }
  };

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
            Privacy & Security
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, marginTop: 2 }}>
            Manage your account security
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Password Settings */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: isDarkMode ? '500' : '600', 
            color: colors.foreground, 
            marginBottom: 12,
            marginLeft: 4
          }}>
            Change Password
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
                Current Password
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
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                placeholder="Enter current password"
                secureTextEntry
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, marginBottom: 8 }}>
                New Password
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
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, marginBottom: 8 }}>
                Confirm New Password
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
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                placeholder="Confirm new password"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handlePasswordChange}
              disabled={loading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                {loading ? 'Changing...' : 'Change Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Settings */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: isDarkMode ? '500' : '600', 
            color: colors.foreground, 
            marginBottom: 12,
            marginLeft: 4
          }}>
            Security Settings
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
                  Two-Factor Authentication
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  Add an extra layer of security to your account
                </Text>
              </View>
              <Switch
                value={securitySettings.twoFactorAuth}
                onValueChange={handleToggle2FA}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
                disabled={loading}
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
                  Login Notifications
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  Get notified of new sign-ins to your account
                </Text>
              </View>
              <Switch
                value={securitySettings.loginNotifications}
                onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, loginNotifications: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: isDarkMode ? '500' : '600', 
            color: colors.foreground, 
            marginBottom: 12,
            marginLeft: 4
          }}>
            Privacy Settings
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
                  Data Sharing
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  Allow sharing of anonymized data for improvements
                </Text>
              </View>
              <Switch
                value={securitySettings.dataSharing}
                onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, dataSharing: value }))}
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
                  Analytics Tracking
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  Help us improve the app with usage analytics
                </Text>
              </View>
              <Switch
                value={securitySettings.analyticsTracking}
                onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, analyticsTracking: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* Account Security Info */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <View style={{
            backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
            borderRadius: 8,
            padding: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#f59e0b'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="information-circle" size={20} color="#f59e0b" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: isDarkMode ? colors.foreground : '#92400e', marginBottom: 4 }}>
                  Security Tips
                </Text>
                <Text style={{ fontSize: 13, color: isDarkMode ? colors.mutedForeground : '#92400e', lineHeight: 18 }}>
                  • Use a strong, unique password{'\n'}
                  • Enable two-factor authentication{'\n'}
                  • Keep your app updated{'\n'}
                  • Don't share your login credentials
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
