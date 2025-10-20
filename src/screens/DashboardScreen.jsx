import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Ionicons, 
  MaterialIcons,
  Feather
} from '@expo/vector-icons';
import { useBatchStore } from '../../configuration/batchStore';
import { useInventoryStore } from '../../configuration/inventoryStore';
import { useSchoolStore } from '../../configuration/schoolStore';
import { useOrderStore } from '../../configuration/orderStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import MetricCard from '../components/ui/MetricCard';
import AnimatedMetricCard from '../components/ui/AnimatedMetricCard';
import { GlassCard } from '../components/ui/GlassCard';
import { SkeletonMetricCard, SkeletonCard, SkeletonList } from '../components/ui/SkeletonLoader';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import { formatDate } from '../utils/dateUtils';
import MobileAnalyticsHub from '../components/dashboard/MobileAnalyticsHub';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const navigation = useNavigation();
  const { batches, loading: batchesLoading, subscribeToAllBatches, unsubscribeFromBatches } = useBatchStore();
  const { orders, loading: ordersLoading, fetchOrders } = useOrderStore();
  const { schools, loading: schoolsLoading, fetchSchools } = useSchoolStore();

  // All hooks must be declared at the top level
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // Initialize data fetching
  React.useEffect(() => {
    const unsubscribeBatches = subscribeToAllBatches();
    fetchOrders();
    fetchSchools();
    fetchRecentActivity();

    return () => {
      if (unsubscribeBatches) {
        unsubscribeBatches();
      }
      unsubscribeFromBatches();
    };
  }, []);

  // Fetch recent activity (matching web dashboard)
  const fetchRecentActivity = async () => {
    try {
      let allActivity = [];
      
      // Recent orders
      const recentOrders = orders.slice(0, 3).map(order => ({
        id: order.id,
        type: 'order',
        title: 'New order received',
        timestamp: new Date(order.orderDate || order.createdAt),
        icon: 'bag-outline',
        iconColor: '#4facfe'
      }));
      allActivity = [...allActivity, ...recentOrders];
      
      // Recent batches
      const recentBatches = batches.slice(0, 3).map(batch => ({
        id: batch.id,
        type: 'batch',
        title: 'New inventory added',
        timestamp: new Date(batch.createdAt || batch.arrivalDate),
        icon: 'cube-outline',
        iconColor: '#ef4444'
      }));
      allActivity = [...allActivity, ...recentBatches];
      
      // Recent schools
      const recentSchools = schools.slice(0, 2).map(school => ({
        id: school.id,
        type: 'school',
        title: 'New school registered',
        timestamp: new Date(school.createdAt || Date.now()),
        icon: 'book-outline',
        iconColor: '#10b981'
      }));
      allActivity = [...allActivity, ...recentSchools];
      
      // Sort by timestamp and take 5 most recent
      allActivity.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(allActivity.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  // Update recent activity when data changes
  React.useEffect(() => {
    if (orders.length > 0 || batches.length > 0 || schools.length > 0) {
      fetchRecentActivity();
    }
  }, [orders, batches, schools]);

  const loading = batchesLoading || ordersLoading || schoolsLoading;

  // Calculate metrics from Firebase data (matching web dashboard)
  
  // Calculate total inventory from batches (like web version)
  const totalInventory = batches.reduce((sum, batch) => {
    // Sum up quantities from all items in the batch
    const batchQuantity = batch.items?.reduce((itemSum, item) => {
      return itemSum + (item.sizes?.reduce((sizeSum, size) => sizeSum + (size.quantity || 0), 0) || 0);
    }, 0) || 0;
    return sum + batchQuantity;
  }, 0);

  // Count active schools (like web version)
  const activeSchools = schools.filter(school => school.status === 'active').length;

  // Calculate total revenue from all orders (like web version)
  const totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

  // Count total orders (like web version)
  const totalOrders = orders.length;
  
  // Keep these for internal use
  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => b.status === 'active').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;

  // Function to format time ago (matching web dashboard)
  const timeAgo = (date) => {
    if (!date) return 'Unknown time';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + (interval === 1 ? ' year ago' : ' years ago');
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + (interval === 1 ? ' month ago' : ' months ago');
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + (interval === 1 ? ' day ago' : ' days ago');
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + (interval === 1 ? ' hour ago' : ' hours ago');
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + (interval === 1 ? ' minute ago' : ' minutes ago');
    
    return Math.floor(seconds) + (Math.floor(seconds) === 1 ? ' second ago' : ' seconds ago');
  };

  React.useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    return () => clearTimeout(timer);
  }, []);

  const quickActions = [
    { title: 'Add Batch', icon: 'cube-outline', iconSet: Ionicons, color: '#ef4444', screen: 'CreateBatch' },
    { title: 'New Order', icon: 'bag-outline', iconSet: Ionicons, color: '#10b981', screen: 'Orders' },
    { title: 'Add Product', icon: 'add-outline', iconSet: Ionicons, color: '#f59e0b', screen: 'CreateProduct' },
    { title: 'View Reports', icon: 'bar-chart-outline', iconSet: Ionicons, color: '#8b5cf6', screen: 'Reports' }
  ];

  // Loading check moved after all hooks
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 24, color: '#ef4444' }}>⟳</Text>
        <Text style={{ marginTop: 10, color: colors.mutedForeground }}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      
      {/* Dashboard Header */}
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
              Dashboard
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: '400'
            }}>
              Inventory Management Overview
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
              <Ionicons name="notifications-outline" size={20} color="white" />
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
      
      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

        {/* Metrics Cards */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          {isLoading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View style={{ width: '47%' }}>
                <SkeletonMetricCard />
              </View>
              <View style={{ width: '47%' }}>
                <SkeletonMetricCard />
              </View>
              <View style={{ width: '47%' }}>
                <SkeletonMetricCard />
              </View>
              <View style={{ width: '47%' }}>
                <SkeletonMetricCard />
              </View>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {/* Primary Metrics Row */}
              <View style={{ flexDirection: 'row', gap: 16 }}>
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
                      <Ionicons name="cash" size={20} color={colors.primary} />
                      <View style={{ backgroundColor: colors.secondary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.secondaryForeground, fontSize: 10, fontWeight: '600' }}>LIVE</Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                      ${totalRevenue.toLocaleString()}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                      Total Revenue
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
                      <Ionicons name="bag" size={20} color={colors.primary} />
                      <View style={{ backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.accentForeground, fontSize: 10, fontWeight: '600' }}>LIVE</Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                      {totalOrders}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                      Total Orders
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Secondary Metrics Row */}
              <View style={{ flexDirection: 'row', gap: 16 }}>
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
                      <Ionicons name="cube" size={20} color={colors.primary} />
                      <View style={{ backgroundColor: colors.secondary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.secondaryForeground, fontSize: 10, fontWeight: '600' }}>LIVE</Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                      {totalInventory}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                      Total Inventory
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
                      <Ionicons name={activeSchools > 0 ? "school" : "warning"} size={20} color={colors.primary} />
                      <View style={{ backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.accentForeground, fontSize: 10, fontWeight: '600' }}>LIVE</Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                      {activeSchools}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                      Active Schools
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
          <Text style={{ fontSize: 20, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground, marginBottom: 16 }}>
            ⚡ Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {quickActions.map((action, index) => {
              const IconSet = action.iconSet;
              return (
                <TouchableOpacity
                  key={index}
                  style={{ width: '47%' }}
                  onPress={() => navigation.navigate(action.screen)}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 18,
                      borderWidth: 2,
                      borderColor: action.color,
                      shadowColor: action.color,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4
                    }}
                  >
                    <View style={{ alignItems: 'center' }}>
                      <View style={{
                        backgroundColor: action.color,
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10
                      }}>
                        <IconSet name={action.icon} size={24} color="white" />
                      </View>
                      <Text style={{ 
                        color: colors.foreground, 
                        fontWeight: isDarkMode ? '500' : '600', 
                        textAlign: 'center',
                        fontSize: 13
                      }}>
                        {action.title}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Analytics Hub Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ 
              backgroundColor: '#3b82f6', 
              borderRadius: 10, 
              padding: 8, 
              marginRight: 12 
            }}>
              <Ionicons name="analytics" size={20} color="white" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
              📈 Analytics Hub
            </Text>
          </View>
          <View
            style={{
              backgroundColor: 'transparent',
              borderRadius: 0,
              padding: 0,
              minHeight: 400
            }}
          >
            <MobileAnalyticsHub 
              products={[]}
              orders={orders}
              schools={schools}
              batches={batches}
              loading={loading}
            />
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 30, marginBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ 
              backgroundColor: '#ec4899', 
              borderRadius: 10, 
              padding: 8, 
              marginRight: 12 
            }}>
              <Ionicons name="time" size={20} color="white" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
              🕐 Recent Activity
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4
            }}
          >
            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontSize: 18, color: '#ef4444' }}>⟳</Text>
              </View>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const iconName = activity.icon;
                return (
                  <View key={`${activity.type}-${activity.id}-${index}`} style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    paddingVertical: 16,
                    borderBottomWidth: index < recentActivity.length - 1 ? 1 : 0, 
                    borderBottomColor: '#f3f4f6'
                  }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: `${activity.iconColor}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16
                    }}>
                      <Ionicons name={iconName} size={20} color={activity.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, fontSize: 16, marginBottom: 4 }}>
                        {activity.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                        {timeAgo(activity.timestamp)}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>
                  No recent activity found
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Active Batches Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ 
              backgroundColor: colors.muted, 
              borderRadius: 8, 
              padding: 6, 
              marginRight: 12 
            }}>
              <Ionicons name="cube-outline" size={18} color={colors.mutedForeground} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
              Active Batches
            </Text>
          </View>
          
          <View style={{ gap: 16 }}>
            {batches.filter(batch => batch.status === 'active').slice(0, 2).map((batch, index) => (
              <View
                key={batch.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ 
                      backgroundColor: colors.chart2, 
                      borderRadius: 8, 
                      padding: 8, 
                      marginRight: 12 
                    }}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: colors.foreground, fontSize: 16, marginBottom: 4 }}>
                        {batch.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                        {batch.supplier} • {formatDate(batch.arrivalDate)}
                      </Text>
                    </View>
                  </View>
                  <View style={{
                    backgroundColor: colors.chart2,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 4
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '500' }}>
                      {batch.items.length} items
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Floating Action Button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 100, marginTop: 30, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => console.log('Quick add action')}
            activeOpacity={0.8}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4
              }}
            >
              <Ionicons name="add" size={24} color={colors.primaryForeground} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
