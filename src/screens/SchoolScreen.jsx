import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { GlassCard } from '../components/ui/GlassCard';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import AddSchoolModal from '../components/ui/AddSchoolModal';
import { useSchoolStore } from '../../configuration/schoolStore';
import { useOrderStore } from '../../configuration/orderStore';

export default function SchoolScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { schools, fetchSchools, getTotalStudentCount, getStudentCountForSchool } = useSchoolStore();
  const { orders, fetchOrders } = useOrderStore();
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [schoolStudentCounts, setSchoolStudentCounts] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    fetchSchools();
    fetchOrders();
    loadStudentCounts();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadStudentCounts = async () => {
    try {
      // Get total student count
      const total = await getTotalStudentCount();
      setTotalStudents(total);

      // Get student count for each school
      const counts = {};
      for (const school of schools) {
        counts[school.id] = await getStudentCountForSchool(school.id);
      }
      setSchoolStudentCounts(counts);
    } catch (error) {
      console.error('Error loading student counts:', error);
    }
  };

  // Reload student counts when schools change
  React.useEffect(() => {
    if (schools.length > 0) {
      loadStudentCounts();
    }
  }, [schools]);

  const getSchoolOrderStats = (schoolId) => {
    const schoolOrders = orders.filter(order => order.schoolId === schoolId);
    return {
      total: schoolOrders.length,
      completed: schoolOrders.filter(o => o.status === 'completed').length,
      pending: schoolOrders.filter(o => o.status === 'pending').length,
      totalValue: schoolOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    };
  };

  const getTotalStudents = () => {
    return totalStudents;
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
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
                Schools
              </Text>
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: '400'
              }}>
                Manage your school partners
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
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add-outline" size={20} color="white" />
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
                <Ionicons name="search-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Ionicons name="school" size={20} color={colors.primary} />
                  <View style={{ backgroundColor: colors.secondary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: colors.secondaryForeground, fontSize: 10, fontWeight: '600' }}>ACTIVE</Text>
                  </View>
                </View>
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                  {schools.length}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  Partner Schools
                </Text>
              </View>
            </View>
            
            <View style={{ flex: 1 }}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Ionicons name="people" size={20} color={colors.primary} />
                  <View style={{ 
                    backgroundColor: colors.accent, 
                    borderRadius: 6, 
                    paddingHorizontal: 8, 
                    paddingVertical: 3
                  }}>
                    <Text style={{ color: colors.accentForeground, fontSize: 10, fontWeight: '600' }}>LIVE</Text>
                  </View>
                </View>
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                  {getTotalStudents()}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  Total Students
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Modern Schools List */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.foreground, marginBottom: 24, letterSpacing: -0.5 }}>All Schools</Text>
          
          {schools.map((school, index) => (
            <TouchableOpacity
              key={school.id}
              onPress={() => setSelectedSchool(selectedSchool === school.id ? null : school.id)}
              activeOpacity={0.9}
              style={{ marginBottom: 20 }}
            >
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.1,
                  shadowRadius: 15,
                  elevation: 6
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 8 }}>
                      {school.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ backgroundColor: colors.muted, borderRadius: 6, padding: 4, marginRight: 8 }}>
                        <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                      </View>
                      <Text style={{ fontSize: 13, color: colors.mutedForeground, fontWeight: '500', flex: 1 }} numberOfLines={1}>
                        {school.address}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ backgroundColor: colors.muted, borderRadius: 6, padding: 4, marginRight: 8 }}>
                        <Ionicons name="person-outline" size={14} color={colors.mutedForeground} />
                      </View>
                      <Text style={{ fontSize: 13, color: colors.mutedForeground, fontWeight: '500' }}>
                        {(schoolStudentCounts[school.id] || 0).toLocaleString()} students
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginBottom: 8
                    }}>
                      <Text style={{ color: colors.primaryForeground, fontSize: 12, fontWeight: '600' }}>
                        Active
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Action Button */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('SchoolDetails', { schoolId: school.id })}
                >
                  <View
                    style={{
                      borderRadius: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      backgroundColor: colors.primary
                    }}
                  >
                    <Text style={{ color: colors.primaryForeground, fontSize: 14, fontWeight: '600' }}>View Details</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Premium Floating Action Button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 100, marginTop: 32, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
                backgroundColor: colors.primary
              }}
            >
              <Ionicons name="add" size={28} color={colors.primaryForeground} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add School Modal */}
      <AddSchoolModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </View>
  );
}
