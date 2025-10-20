import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StatusBar, Animated, Alert, Linking } from 'react-native';
import { getColors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../configuration/authStore';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { user, userProfile, userRole, logout, deleteUserAccount } = useAuthStore();
  
  // Check if current user is super user
  const isSuperUser = user?.email === 'tinashegomo96@gmail.com';
  const { isDarkMode, toggleTheme } = useTheme();
  const colors = getColors(isDarkMode);
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleProfileSettings = () => {
    navigation.navigate('ProfileSettings');
  };

  const handlePrivacySecurity = () => {
    navigation.navigate('PrivacySecurity');
  };

  const handleLanguage = () => {
    Alert.alert('Language', 'Language selection coming soon!');
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact our support team.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email Support', onPress: () => Linking.openURL('mailto:support@monisha.com') },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export functionality coming soon!');
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: 'shield-outline', title: 'Privacy & Security', subtitle: 'Manage your account security', hasChevron: true, onPress: handlePrivacySecurity },
        { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Push notifications', toggle: notifications, onToggle: setNotifications },
      ]
    },
    {
      title: 'App Settings',
      items: [
        { icon: 'moon-outline', title: 'Dark Mode', subtitle: 'Switch to dark theme', toggle: isDarkMode, onToggle: toggleTheme },
        { icon: 'globe-outline', title: 'Language', subtitle: 'English (UK)', hasChevron: true, onPress: handleLanguage },
        { icon: 'cloud-download-outline', title: 'Auto Backup', subtitle: 'Backup data automatically', toggle: autoBackup, onToggle: setAutoBackup },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get help and contact support', hasChevron: true, onPress: handleHelpSupport },
        { icon: 'download-outline', title: 'Export Data', subtitle: 'Download your data', hasChevron: true, onPress: handleExportData },
      ]
    },
    ...(isSuperUser ? [{
      title: 'Super Admin',
      items: [
        { icon: 'shield-outline', title: 'Super Admin Dashboard', subtitle: 'Complete user management and database access', hasChevron: true, onPress: () => navigation.navigate('AdminSuperAdmin') },
      ]
    }] : [])
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: 20, 
        paddingBottom: 20,
        backgroundColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: 'white',
              marginBottom: 2
            }}>
              Settings
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: '400'
            }}>
              Manage your preferences
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                padding: 8,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="help-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                padding: 8,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="information-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* User Profile Header */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={handleProfileSettings}
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center'
            }}
            activeOpacity={0.7}
          >
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}>
              <Text style={{ 
                color: 'white', 
                fontSize: 20, 
                fontWeight: 'bold' 
              }}>
                {user?.name?.charAt(0).toUpperCase() || user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: colors.foreground,
                marginBottom: 4 
              }}>
                {user?.name || user?.displayName || user?.email || 'User'}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: colors.mutedForeground,
                marginBottom: 6 
              }}>
                {user?.email || 'No email'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{
                  backgroundColor: userRole === 'manager' ? '#dcfce7' : '#dbeafe',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  alignSelf: 'flex-start'
                }}>
                  <Text style={{ 
                    color: userRole === 'manager' ? '#166534' : '#1e40af', 
                    fontSize: 12, 
                    fontWeight: isDarkMode ? '500' : '600' 
                  }}>
                    {userRole === 'manager' ? 'Manager' : 'Staff'}
                  </Text>
                </View>
                {isSuperUser && (
                  <View style={{
                    backgroundColor: '#fef3c7',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    alignSelf: 'flex-start'
                  }}>
                    <Text style={{ 
                      color: '#92400e', 
                      fontSize: 12, 
                      fontWeight: isDarkMode ? '500' : '600' 
                    }}>
                      Super User
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Settings Groups */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20 }}>
          {settingsGroups.map((group, groupIndex) => (
            <View key={group.title} style={{ marginBottom: 20 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: isDarkMode ? '500' : '600', 
                color: colors.foreground, 
                marginBottom: 12,
                marginLeft: 4
              }}>
                {group.title}
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
                {group.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.title}
                    onPress={item.onPress}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderBottomWidth: itemIndex < group.items.length - 1 ? 1 : 0,
                      borderBottomColor: '#f3f4f6'
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ 
                      backgroundColor: colors.primary, 
                      borderRadius: 10, 
                      padding: 8, 
                      marginRight: 12
                    }}>
                      <Ionicons name={item.icon} size={20} color="white" />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: colors.cardForeground, fontSize: 16 }}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                        {item.subtitle}
                      </Text>
                    </View>
                    
                    {item.toggle !== undefined ? (
                      <Switch
                        value={item.toggle}
                        onValueChange={item.onToggle}
                        trackColor={{ false: '#e5e7eb', true: colors.primary }}
                        thumbColor="#ffffff"
                      />
                    ) : item.hasChevron ? (
                      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </Animated.View>

        {/* App Information */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: colors.foreground, 
            marginBottom: 12,
            marginLeft: 4
          }}>
            App Information
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
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Version</Text>
                <Text style={{ fontWeight: '600', color: colors.cardForeground, fontSize: 14 }}>1.0.0</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Build</Text>
                <Text style={{ fontWeight: '600', color: colors.cardForeground, fontSize: 14 }}>2024.1.1</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Last Updated</Text>
                <Text style={{ fontWeight: '600', color: colors.cardForeground, fontSize: 14 }}>Oct 2024</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sign Out & Delete Account */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: colors.foreground, 
            marginBottom: 12,
            marginLeft: 4
          }}>
            Account Actions
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
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6'
              }}
              activeOpacity={0.7}
            >
              <View style={{ 
                backgroundColor: '#f59e0b', 
                borderRadius: 10, 
                padding: 8, 
                marginRight: 12
              }}>
                <Ionicons name="log-out-outline" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: colors.cardForeground, fontSize: 16 }}>
                  Sign Out
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  Sign out of your account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16
              }}
              activeOpacity={0.7}
            >
              <View style={{ 
                backgroundColor: '#dc2626', 
                borderRadius: 10, 
                padding: 8, 
                marginRight: 12
              }}>
                <Ionicons name="trash-outline" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: colors.destructive, fontSize: 16 }}>
                  Delete Account
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>
                  Permanently delete your account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
            Monisha Inventory Management System
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: 'center', marginTop: 4, opacity: 0.7 }}>
            © 2024 All rights reserved
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
