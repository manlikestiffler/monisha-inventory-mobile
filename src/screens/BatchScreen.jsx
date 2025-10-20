import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useBatchStore } from '../../configuration/batchStore';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import { formatDate } from '../utils/dateUtils'; 
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { GlassCard } from '../components/ui/GlassCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { getUniformById, getVariantById } from '../utils/staticData';

export default function BatchScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { 
    batches, 
    loading, 
    error, 
    fetchBatches, 
    subscribeToAllBatches, 
    unsubscribeFromBatches, 
    addBatch, 
    updateBatch, 
    deleteBatch 
  } = useBatchStore();
  const [selectedBatch, setSelectedBatch] = useState(null);
  // Removed modal state - using navigation instead
  const [newBatch, setNewBatch] = useState({
    name: '',
    type: '',
    supplier: '',
    arrivalDate: new Date().toISOString().split('T')[0]
  });
  
  const [batchVariants, setBatchVariants] = useState([]);
  const [currentVariant, setCurrentVariant] = useState({
    name: '',
    color: '',
    price: 0,
    sizes: {}
  });
  const [newSize, setNewSize] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const sizesRef = React.useRef({});
  
  // Autocomplete options from existing data
  const [typeOptions, setTypeOptions] = useState([]);
  const [variantOptions, setVariantOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Initialize real-time batch synchronization
  React.useEffect(() => {
    const unsubscribe = subscribeToAllBatches();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      unsubscribeFromBatches();
    };
  }, []);

  // Handle errors
  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleAddBatch = () => {
    if (!newBatch.name.trim() || !newBatch.type.trim() || !newBatch.supplier.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (batchVariants.length === 0) {
      Alert.alert('Error', 'Please add at least one variant to the batch');
      return;
    }

    // Convert batchVariants to items for backward compatibility
    const items = [];
    batchVariants.forEach(variant => {
      Object.entries(variant.sizes).forEach(([size, quantity]) => {
        if (quantity > 0) {
          items.push({
            id: `item-${Date.now()}-${Math.random()}`,
            variantId: `variant-${Date.now()}-${Math.random()}`,
            uniformId: `uniform-${Date.now()}-${Math.random()}`,
            name: variant.name,
            color: variant.color,
            size: size,
            price: variant.price,
            quantity: quantity,
            remainingQuantity: quantity
          });
        }
      });
    });

    const batch = {
      ...newBatch,
      id: `batch-${Date.now()}`,
      status: 'active',
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      remainingItems: items.reduce((sum, item) => sum + item.quantity, 0),
      items: items
    };

    addBatch(batch);
    setNewBatch({
      name: '',
      type: '',
      supplier: '',
      arrivalDate: new Date().toISOString().split('T')[0]
    });
    setBatchVariants([]);
    setCurrentVariant({ name: '', color: '', price: 0, sizes: {} });
    sizesRef.current = {};
    setShowAddModal(false);
    Alert.alert('Success', 'Batch added successfully!');
  };

  // Fetch existing data for autocomplete
  React.useEffect(() => {
    const fetchAutocompleteData = () => {
      const types = new Set();
      const variants = new Set();
      const colors = new Set();
      const sizes = new Set();
      
      batches.forEach(batch => {
        if (batch.type) types.add(batch.type);
        batch.items?.forEach(item => {
          if (item.name) variants.add(item.name);
          if (item.color) colors.add(item.color);
          if (item.size) sizes.add(item.size);
        });
      });
      
      setTypeOptions(Array.from(types));
      setVariantOptions(Array.from(variants));
      setColorOptions(Array.from(colors));
      setSizeOptions(Array.from(sizes));
    };
    
    fetchAutocompleteData();
  }, [batches]);

  const handleAddSize = () => {
    if (!newSize.trim() || !newQuantity || parseInt(newQuantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid size and quantity');
      return;
    }
    
    const updatedSizes = {
      ...sizesRef.current,
      [newSize.trim()]: parseInt(newQuantity)
    };
    
    sizesRef.current = updatedSizes;
    setCurrentVariant(prev => ({ ...prev, sizes: updatedSizes }));
    setNewSize('');
    setNewQuantity('');
  };

  const handleAddVariant = () => {
    if (!currentVariant.name.trim() || !currentVariant.color.trim() || currentVariant.price <= 0) {
      Alert.alert('Error', 'Please fill in variant name, color, and price');
      return;
    }
    
    if (Object.keys(sizesRef.current).length === 0) {
      Alert.alert('Error', 'Please add at least one size to the variant');
      return;
    }
    
    const variantToAdd = {
      id: `variant-${Date.now()}`,
      name: currentVariant.name.trim(),
      color: currentVariant.color.trim(),
      price: parseFloat(currentVariant.price),
      sizes: { ...sizesRef.current }
    };
    
    setBatchVariants(prev => [...prev, variantToAdd]);
    setCurrentVariant({ name: '', color: '', price: 0, sizes: {} });
    sizesRef.current = {};
  };

  const removeVariant = (variantIndex) => {
    setBatchVariants(prev => prev.filter((_, index) => index !== variantIndex));
  };

  const removeSizeFromCurrent = (sizeToRemove) => {
    const updatedSizes = { ...sizesRef.current };
    delete updatedSizes[sizeToRemove];
    sizesRef.current = updatedSizes;
    setCurrentVariant(prev => ({ ...prev, sizes: updatedSizes }));
  };

  // Calculate batch summary
  const getBatchSummary = () => {
    const totalVariants = batchVariants.length;
    const totalQuantity = batchVariants.reduce((total, variant) => 
      total + Object.values(variant.sizes).reduce((sum, qty) => sum + qty, 0), 0
    );
    const totalValue = batchVariants.reduce((total, variant) => 
      total + Object.values(variant.sizes).reduce((sum, qty) => sum + (qty * variant.price), 0), 0
    );
    
    return { totalVariants, totalQuantity, totalValue };
  };

  const addItemToBatch = () => {
    // Legacy compatibility
  };

  const updateBatchItem = (itemIndex, field, value) => {
    // Legacy function for backward compatibility
  };

  const removeBatchItem = (itemIndex) => {
    // Legacy function for backward compatibility
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getBatchStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'secondary';
      default: return 'outline';
    }
  };

  const getBatchDepletionStatus = (batch) => {
    const total = getTotalItems(batch);
    const remaining = getRemainingItems(batch);
    
    if (total === 0) return { status: 'unknown', color: '#6b7280', text: 'No Data' };
    
    const percentage = (remaining / total) * 100;
    
    if (remaining === 0) {
      return { status: 'depleted', color: '#dc2626', text: 'Depleted' };
    } else if (percentage <= 10) {
      return { status: 'critical', color: '#f59e0b', text: 'Critical' };
    } else if (percentage <= 25) {
      return { status: 'low', color: '#f59e0b', text: 'Low Stock' };
    } else {
      return { status: 'good', color: '#10b981', text: 'Good' };
    }
  };

  const getTotalItems = (batch) => {
    // Use totalQuantity from Firestore data structure
    return batch.totalQuantity || 0;
  };

  const getRemainingItems = (batch) => {
    // Calculate remaining items from the items array sizes
    if (!batch.items || !Array.isArray(batch.items)) return 0;
    
    return batch.items.reduce((total, item) => {
      if (item.sizes && Array.isArray(item.sizes)) {
        return total + item.sizes.reduce((sizeTotal, size) => {
          return sizeTotal + (parseInt(size.quantity) || 0);
        }, 0);
      }
      return total;
    }, 0);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      
      {/* Fixed Floating Action Button */}
      <View style={{
        position: 'absolute',
        bottom: 100,
        right: 20,
        zIndex: 1000
      }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateBatch')}
          activeOpacity={0.8}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#dc2626',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <Ionicons name="cube-outline" size={28} color="white" />
          </View>
        </TouchableOpacity>
      </View>
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
                Batch Inventory
              </Text>
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: '400'
              }}>
                Track your stock batches
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
                onPress={() => navigation.navigate('CreateBatch')}
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
                <Ionicons name="filter-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
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
                    <Text style={{ color: colors.secondaryForeground, fontSize: 10, fontWeight: '600' }}>TOTAL</Text>
                  </View>
                </View>
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                  {batches.length}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  Total Batches
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
                  <Ionicons name="trending-up" size={20} color={colors.primary} />
                  <View style={{ backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: colors.accentForeground, fontSize: 10, fontWeight: '600' }}>LIVE</Text>
                  </View>
                </View>
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                  {batches.filter(b => b.status === 'active').length}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  Active Batches
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Batch List */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginTop: 30 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ 
              backgroundColor: '#3b82f6', 
              borderRadius: 10, 
              padding: 8, 
              marginRight: 12 
            }}>
              <Ionicons name="list" size={20} color="white" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
              📋 All Batches
            </Text>
          </View>
        
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Loading batches...</Text>
          </View>
        ) : batches.length === 0 ? (
          <View style={{ 
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2
          }}>
            <Ionicons name="cube-outline" size={40} color={colors.mutedForeground} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginTop: 12, marginBottom: 6 }}>
              No Batches Found
            </Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
              Start by creating your first batch to track inventory
            </Text>
          </View>
        ) : batches.map((batch, index) => (
          <TouchableOpacity
            key={batch.id}
            onPress={() => setSelectedBatch(selectedBatch === batch.id ? null : batch.id)}
            activeOpacity={0.9}
            style={{ marginBottom: 20 }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 0,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                overflow: 'hidden'
              }}
            >
              {/* Header Section */}
              <View style={{ padding: 20, paddingBottom: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 8, lineHeight: 20 }}>
                      {batch.name}
                    </Text>
                    <View style={{ gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ backgroundColor: colors.muted, borderRadius: 4, padding: 3, marginRight: 6 }}>
                          <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
                        </View>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '500' }}>
                          {formatDate(batch.createdAt) || 'No Date'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ backgroundColor: colors.muted, borderRadius: 4, padding: 3, marginRight: 6 }}>
                          <Ionicons name="cube-outline" size={12} color={colors.mutedForeground} />
                        </View>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '500', flex: 1 }} numberOfLines={1}>
                          {batch.createdBy || 'Unknown Creator'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                    <View style={{
                      backgroundColor: batch.status === 'active' ? colors.chart2 : 
                                     batch.status === 'pending' ? colors.chart4 : colors.mutedForeground,
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      marginBottom: 4
                    }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '500', textTransform: 'capitalize' }}>
                        {batch.status}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: getBatchDepletionStatus(batch).color,
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      marginBottom: 8
                    }}>
                      <Text style={{ color: 'white', fontSize: 9, fontWeight: '600' }}>
                        {getBatchDepletionStatus(batch).text}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: '#f3f4f6',
                      borderRadius: 8,
                      padding: 6,
                      transform: [{ rotate: selectedBatch === batch.id ? '90deg' : '0deg' }]
                    }}>
                      <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Stats Section */}
              <View style={{ 
                paddingHorizontal: 20,
                paddingVertical: 16
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 4, textAlign: 'center' }}>Total Items</Text>
                    <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '700' : '800', color: colors.foreground, textAlign: 'center' }}>
                      {getTotalItems(batch)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 4, textAlign: 'center' }}>Remaining</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#059669', textAlign: 'center' }}>
                      {getRemainingItems(batch)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 4, textAlign: 'center' }}>Progress</Text>
                    <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '700' : '800', color: '#dc2626', textAlign: 'center' }}>
                      {getTotalItems(batch) > 0 ? Math.round((getRemainingItems(batch) / getTotalItems(batch)) * 100) : 0}%
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Modern Progress Bar */}
              <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                <View style={{ backgroundColor: '#e2e8f0', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                  <View
                    style={{
                      width: `${getTotalItems(batch) > 0 ? (getRemainingItems(batch) / getTotalItems(batch)) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#dc2626',
                      borderRadius: 8
                    }}
                  />
                </View>
              </View>

              {/* Expanded Details */}
              {selectedBatch === batch.id && (
                <Animated.View>
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
                    <Text style={{ fontWeight: isDarkMode ? '600' : '700', color: colors.foreground, marginBottom: 12, fontSize: 14 }}>Batch Items</Text>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                      {batch.items && batch.items.map((item, itemIndex) => {
                        return (
                          <View key={itemIndex} style={{ 
                            backgroundColor: colors.card,
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: '#e2e8f0'
                          }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <View style={{ flex: 1, marginRight: 12 }}>
                                <Text style={{ fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, fontSize: 14, marginBottom: 2 }} numberOfLines={1}>
                                  {item.variantType} - {item.color}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={1}>
                                  ${item.price}
                                </Text>
                              </View>
                              <View style={{ alignItems: 'flex-end', minWidth: 50 }}>
                                <Text style={{ fontWeight: isDarkMode ? '600' : '700', color: colors.cardForeground, fontSize: 14 }}>
                                  {item.sizes ? item.sizes.reduce((total, size) => total + parseInt(size.quantity || 0), 0) : 0}
                                </Text>
                                <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: isDarkMode ? '400' : '500' }}>remaining</Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                    
                    <View style={{ marginTop: 12 }}>
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('BatchDetails', { batchId: batch.id })}
                        style={{ width: '100%' }}
                      >
                        <View
                          style={{
                            backgroundColor: '#dc2626',
                            borderRadius: 8,
                            paddingVertical: 10,
                            paddingHorizontal: 16,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center', fontSize: 14 }}>View Batch Details</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              )}
            </View>
          </TouchableOpacity>
        ))}
        </Animated.View>

        {/* Spacer for bottom padding */}
        <View style={{ paddingBottom: 100 }} />

      </ScrollView>
    </View>
  );
}
