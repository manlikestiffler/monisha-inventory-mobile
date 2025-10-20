import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../configuration/authStore';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { collection, getDocs, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function AdminSuperAdminScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { user: currentUser } = useAuthStore();
  
  // Check if current user is super admin
  const isSuperAdmin = currentUser?.email === 'tinashegomo96@gmail.com';
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmPromote, setConfirmPromote] = useState(null);
  const [confirmDemote, setConfirmDemote] = useState(null);

  useEffect(() => {
    if (!isSuperAdmin) {
      Alert.alert(
        'Access Denied',
        'Only super admin can access this feature.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      fetchUsers();
    }
  }, [navigation, isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch managers
      const managersSnapshot = await getDocs(collection(db, 'inventory_managers'));
      const managersData = managersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'manager'
      }));

      // Fetch staff
      const staffSnapshot = await getDocs(collection(db, 'inventory_staff'));
      const staffData = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'staff'
      }));

      // Combine both sets of users and remove duplicates by email
      const allUsers = [...managersData, ...staffData];
      
      // Remove duplicates based on email (keep the first occurrence)
      const uniqueUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.email === user.email)
      );
      
      // Sort by creation date (newest first)
      uniqueUsers.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setUsers(uniqueUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePromoteUser = async (userId) => {
    try {
      setLoading(true);
      
      // Get user data from staff collection
      const staffDoc = await getDoc(doc(db, 'inventory_staff', userId));
      
      if (!staffDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = staffDoc.data();
      
      // Create a new manager document with the same data
      await setDoc(doc(db, 'inventory_managers', userId), {
        ...userData,
        role: 'manager',
        promotedAt: new Date().toISOString(),
        promotedBy: currentUser.email
      });
      
      // Delete the staff document
      await deleteDoc(doc(db, 'inventory_staff', userId));
      
      // Refresh the user list
      await fetchUsers();
      
      setConfirmPromote(null);
      Alert.alert('Success', 'User promoted to manager successfully');
    } catch (err) {
      console.error('Error promoting user:', err);
      Alert.alert('Error', 'Failed to promote user');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoteUser = async (userId) => {
    try {
      setLoading(true);
      
      // Get user data from managers collection
      const managerDoc = await getDoc(doc(db, 'inventory_managers', userId));
      
      if (!managerDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = managerDoc.data();
      
      // Create a new staff document with the same data
      await setDoc(doc(db, 'inventory_staff', userId), {
        ...userData,
        role: 'staff',
        demotedAt: new Date().toISOString(),
        demotedBy: currentUser.email
      });
      
      // Delete the manager document
      await deleteDoc(doc(db, 'inventory_managers', userId));
      
      // Refresh the user list
      await fetchUsers();
      
      setConfirmDemote(null);
      Alert.alert('Success', 'User demoted to staff successfully');
    } catch (err) {
      console.error('Error demoting user:', err);
      Alert.alert('Error', 'Failed to demote user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      
      // Find the user
      const userToDelete = users.find(user => user.id === userId);
      
      if (!userToDelete) {
        throw new Error('User not found');
      }
      
      // Delete from the appropriate collection
      if (userToDelete.role === 'manager') {
        await deleteDoc(doc(db, 'inventory_managers', userId));
      } else {
        await deleteDoc(doc(db, 'inventory_staff', userId));
      }
      
      // Refresh the user list
      await fetchUsers();
      
      setConfirmDelete(null);
      Alert.alert('Success', 'User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      Alert.alert('Error', 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = (
      user.displayName?.toLowerCase().includes(searchString) ||
      user.email?.toLowerCase().includes(searchString) ||
      user.firstName?.toLowerCase().includes(searchString) ||
      user.lastName?.toLowerCase().includes(searchString)
    );
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const getUserStats = () => {
    const totalUsers = users.length;
    const managers = users.filter(u => u.role === 'manager').length;
    const staff = users.filter(u => u.role === 'staff').length;
    const verified = users.filter(u => u.emailVerified).length;
    
    return { totalUsers, managers, staff, verified };
  };

  const stats = getUserStats();

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  if (!isSuperAdmin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Ionicons name="shield-outline" size={64} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
        <Text style={{ color: colors.destructive, fontSize: 18, fontWeight: '600' }}>Access Denied</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          Only super admin can access this feature
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={{ 
        paddingHorizontal: 24, 
        paddingTop: 60, 
        paddingBottom: 24,
        backgroundColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              padding: 12,
              marginRight: 16
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: 'white' }}>
              Super Admin Dashboard
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
              Complete user management and database access
            </Text>
          </View>
          <View style={{
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 6
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFC107' }}>
              SUPER ADMIN
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <View style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                backgroundColor: '#3B82F6',
                borderRadius: 12,
                padding: 8,
                marginRight: 12
              }}>
                <Ionicons name="people" size={20} color="white" />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '500' }}>Total Users</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>{stats.totalUsers}</Text>
              </View>
            </View>
          </View>

          <View style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                backgroundColor: '#10B981',
                borderRadius: 12,
                padding: 8,
                marginRight: 12
              }}>
                <Ionicons name="shield" size={20} color="white" />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '500' }}>Managers</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>{stats.managers}</Text>
              </View>
            </View>
          </View>

          <View style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                backgroundColor: '#8B5CF6',
                borderRadius: 12,
                padding: 8,
                marginRight: 12
              }}>
                <Ionicons name="person" size={20} color="white" />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '500' }}>Staff</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>{stats.staff}</Text>
              </View>
            </View>
          </View>

          <View style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                backgroundColor: '#059669',
                borderRadius: 12,
                padding: 8,
                marginRight: 12
              }}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '500' }}>Verified</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>{stats.verified}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.border
        }}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Search users..."
                placeholderTextColor={colors.mutedForeground}
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.foreground,
                  fontSize: 14
                }}
              />
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['all', 'manager', 'staff'].map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => setSelectedRole(role)}
                style={{
                  backgroundColor: selectedRole === role ? colors.primary : colors.muted,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: selectedRole === role ? 'white' : colors.foreground
                }}>
                  {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Users List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.mutedForeground }}>Loading users...</Text>
          </View>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => (
            <View
              key={`${user.role}-${user.id || user.email || index}`}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  backgroundColor: user.role === 'manager' ? colors.primary : colors.secondary,
                  borderRadius: 24,
                  padding: 12,
                  marginRight: 16
                }}>
                  <Ionicons 
                    name={user.role === 'manager' ? 'shield' : 'person'} 
                    size={24} 
                    color="white" 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, flex: 1 }}>
                      {user.displayName || `${user.firstName} ${user.lastName}` || 'User'}
                    </Text>
                    {user.email === 'tinashegomo96@gmail.com' && (
                      <View style={{
                        backgroundColor: '#FFC107',
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 2
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#000' }}>
                          SUPER ADMIN
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, marginBottom: 4 }}>
                    {user.email}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{
                      backgroundColor: user.role === 'manager' ? '#dcfce7' : '#dbeafe',
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 2
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: user.role === 'manager' ? '#166534' : '#1e40af'
                      }}>
                        {user.role?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: user.emailVerified ? '#dcfce7' : '#fecaca',
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 2
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: user.emailVerified ? '#166534' : '#dc2626'
                      }}>
                        {user.emailVerified ? 'VERIFIED' : 'NOT VERIFIED'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              {user.email !== 'tinashegomo96@gmail.com' && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {user.role === 'staff' && (
                    <TouchableOpacity
                      onPress={() => setConfirmPromote(user)}
                      style={{
                        flex: 1,
                        backgroundColor: '#3B82F6',
                        borderRadius: 12,
                        paddingVertical: 10,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Ionicons name="arrow-up" size={16} color="white" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
                        Promote
                      </Text>
                    </TouchableOpacity>
                  )}
                  {user.role === 'manager' && (
                    <TouchableOpacity
                      onPress={() => setConfirmDemote(user)}
                      style={{
                        flex: 1,
                        backgroundColor: '#F59E0B',
                        borderRadius: 12,
                        paddingVertical: 10,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Ionicons name="arrow-down" size={16} color="white" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
                        Demote
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => setConfirmDelete(user)}
                    style={{
                      flex: 1,
                      backgroundColor: '#EF4444',
                      borderRadius: 12,
                      paddingVertical: 10,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <Ionicons name="trash" size={16} color="white" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={{ 
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, color: colors.foreground, fontWeight: '600' }}>No Users Found</Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginTop: 4 }}>
              {searchTerm ? 'No users match your search criteria' : 'No users have been registered yet'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modals */}
      {confirmDelete && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                backgroundColor: '#EF4444',
                borderRadius: 24,
                padding: 12,
                marginBottom: 12
              }}>
                <Ionicons name="trash" size={24} color="white" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 8 }}>
                Confirm User Deletion
              </Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                Are you sure you want to permanently delete {confirmDelete.displayName || `${confirmDelete.firstName} ${confirmDelete.lastName}`}? 
                This action cannot be undone.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setConfirmDelete(null)}
                style={{
                  flex: 1,
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteUser(confirmDelete.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Delete User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {confirmPromote && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                backgroundColor: '#3B82F6',
                borderRadius: 24,
                padding: 12,
                marginBottom: 12
              }}>
                <Ionicons name="arrow-up" size={24} color="white" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 8 }}>
                Confirm User Promotion
              </Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                Are you sure you want to promote {confirmPromote.displayName || `${confirmPromote.firstName} ${confirmPromote.lastName}`} to Manager? 
                This will give them additional privileges.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setConfirmPromote(null)}
                style={{
                  flex: 1,
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handlePromoteUser(confirmPromote.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#3B82F6',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Promote to Manager</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {confirmDemote && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                backgroundColor: '#F59E0B',
                borderRadius: 24,
                padding: 12,
                marginBottom: 12
              }}>
                <Ionicons name="arrow-down" size={24} color="white" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 8 }}>
                Confirm User Demotion
              </Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                Are you sure you want to demote {confirmDemote.displayName || `${confirmDemote.firstName} ${confirmDemote.lastName}`} to Staff? 
                This will remove their management privileges.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setConfirmDemote(null)}
                style={{
                  flex: 1,
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDemoteUser(confirmDemote.id)}
                style={{
                  flex: 1,
                  backgroundColor: '#F59E0B',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Demote to Staff</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
