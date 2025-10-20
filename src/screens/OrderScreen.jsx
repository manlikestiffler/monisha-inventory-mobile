import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity, StatusBar } from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import { GlassCard } from '../components/ui/GlassCard';
import { useOrderStore } from '../../configuration/orderStore';
import { useSchoolStore } from '../../configuration/schoolStore';
import { getSchoolById, getUniformById, getVariantById } from '../utils/staticData';
import { formatDate } from '../utils/dateUtils';

export default function OrderScreen() {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { orders = [], updateOrderStatus, fetchOrders } = useOrderStore();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    fetchOrders();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const filteredOrders = (statusFilter === 'all' 
    ? orders 
    : orders?.filter(order => order.status === statusFilter)) || [];

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'default';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getOrderSummary = () => {
    if (!orders) {
      return { total: 0, pending: 0, processing: 0, completed: 0, totalValue: 0 };
    }
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      totalValue: orders.reduce((sum, order) => sum + order.totalAmount, 0)
    };
  };

  const summary = getOrderSummary();

  // Move early return after all hooks are declared
  if (!orders || orders.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, color: '#ef4444' }}>⟳</Text>
        <Text style={{ marginTop: 10, color: colors.mutedForeground }}>Loading Orders...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{ 
            paddingHorizontal: 20, 
            paddingTop: 50, 
            paddingBottom: 20,
            backgroundColor: colors.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          <Animated.View
            style={{
              opacity: fadeAnim
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.25)', 
                borderRadius: 12, 
                padding: 10, 
                marginRight: 16 
              }}>
                <Ionicons name="bag" size={28} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 }}>
                  Orders
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 15, marginTop: 4 }}>
                  Track & process orders 🛒
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Summary Cards with Modern Design */}
        <View style={{ paddingHorizontal: 24, marginTop: -24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <GlassCard style={{ width: '32%', padding: 12 }} delay={100}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 16, padding: 8, marginBottom: 8 }}>
                  <Ionicons name="bag-outline" size={20} color="#ef4444" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: isDarkMode ? '700' : 'bold', color: colors.foreground }}>
                  {summary.total}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Total Orders</Text>
              </View>
            </GlassCard>
            
            <GlassCard style={{ width: '32%', padding: 12 }} delay={200}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 16, padding: 8, marginBottom: 8 }}>
                  <Ionicons name="time-outline" size={20} color="#f59e0b" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: isDarkMode ? '700' : 'bold', color: '#d97706' }}>
                  {summary.pending}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Pending</Text>
              </View>
            </GlassCard>
            
            <GlassCard style={{ width: '32%', padding: 12 }} delay={300}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: 16, padding: 8, marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#059669' }}>
                  {summary.completed}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Completed</Text>
              </View>
            </GlassCard>
          </View>

          <GlassCard style={{ marginBottom: 24, padding: 16 }} delay={400}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', borderRadius: 16, padding: 12, marginRight: 16 }}>
                <Ionicons name="star-outline" size={24} color="#8b5cf6" />
              </View>
              <View>
                <Text style={{ fontSize: 24, fontWeight: isDarkMode ? '700' : 'bold', color: colors.foreground }}>
                  ${summary.totalValue.toLocaleString()}
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground }}>Total Order Value</Text>
              </View>
            </View>
          </GlassCard>

        </View>

        {/* Status Filter */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: isDarkMode ? '700' : 'bold', color: colors.foreground, marginBottom: 16 }}>Filter Orders</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {['all', 'pending', 'processing', 'completed'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: statusFilter === status ? '#ef4444' : '#e5e7eb'
                }}
              >
                <Text style={{
                  fontWeight: '500',
                  textTransform: 'capitalize',
                  color: statusFilter === status ? 'white' : colors.foreground
                }}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Orders List */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: isDarkMode ? '700' : 'bold', color: colors.foreground, marginBottom: 24 }}>Recent Orders</Text>
          {filteredOrders.map((order, index) => {
            const school = getSchoolById(order.schoolId);
            return (
              <AnimatedCard key={order.id} style={{ marginBottom: 16 }} delay={index * 100}>
                <TouchableOpacity 
                  onPress={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                  style={{ padding: 16 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '700' : 'bold', color: colors.foreground, marginRight: 12 }}>
                            Order #{order.id}
                          </Text>
                          <Badge variant={getStatusVariant(order.status)}>
                            <Text style={{ fontSize: 12, fontWeight: '500', textTransform: 'capitalize' }}>
                              {order.status}
                            </Text>
                          </Badge>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '700' : 'bold', color: colors.foreground }}>
                            ${(order.totalAmount || 0).toFixed(2)}
                          </Text>
                          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                            {order.items?.length || 0} items
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="person-outline" size={16} color={colors.mutedForeground} />
                          <Text style={{ fontSize: 14, color: colors.mutedForeground, marginLeft: 4 }}>
                            {getSchoolById(order.schoolId)?.name || 'Unknown School'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="calendar-outline" size={16} color={colors.mutedForeground} />
                          <Text style={{ fontSize: 14, color: colors.mutedForeground, marginLeft: 4 }}>
                            {formatDate(order.orderDate)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                {selectedOrder === order.id && (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, marginTop: 16 }}>
                    <Text style={{ fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, marginBottom: 12 }}>Order Items:</Text>
                    {order.items?.map((item, itemIndex) => {
                      const uniform = getUniformById(item.uniformId);
                      const variant = getVariantById(item.variantId);

                      if (!variant) {
                        return (
                          <View key={itemIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontWeight: isDarkMode ? '400' : '500', color: '#ef4444' }}>
                                Unknown Item
                              </Text>
                              <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                                Variant not found
                              </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ fontWeight: isDarkMode ? '500' : '600', color: colors.foreground }}>
                                {item.quantity}x
                              </Text>
                              <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                                $0.00
                              </Text>
                            </View>
                          </View>
                        );
                      }

                      return (
                        <View key={itemIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '500', color: colors.cardForeground }}>
                              {uniform?.name} - {variant.size}
                            </Text>
                            <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                              {variant.color} • ${variant.price}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontWeight: '600', color: colors.cardForeground }}>
                              {item.quantity}x
                            </Text>
                            <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                              ${(item.quantity * variant.price).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                    
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                      <Button variant="outline" size="sm" style={{ flex: 1 }}>
                        <Text>Update Status</Text>
                      </Button>
                      <Button variant="default" size="sm" style={{ flex: 1 }}>
                        <Text style={{ color: 'white' }}>View Details</Text>
                      </Button>
                    </View>
                  </View>
                )}
              </AnimatedCard>
            );
          })}
        </Animated.View>

        {/* Floating Action Button */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 32, marginTop: 16 }}>
          <FloatingActionButton 
            icon="bag-outline"
            onPress={() => console.log('Add new order')}
            style={{ alignSelf: 'center' }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
