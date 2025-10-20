import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StatusBar, Animated } from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useBatchStore } from '../../configuration/batchStore';
import { useAuthStore } from '../../configuration/authStore';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../utils/dateUtils';

export default function CreateBatchScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { user, userRole } = useAuthStore();
  const { batches, addBatch } = useBatchStore();

  useEffect(() => {
    if (userRole && userRole !== 'manager') {
      Alert.alert(
        'Permission Denied',
        'You do not have permission to create new batches.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [userRole, navigation]);

  if (userRole && userRole !== 'manager') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.destructive, fontSize: 18 }}>Access Denied</Text>
      </View>
    );
  }
  
  const [newBatch, setNewBatch] = useState({
    name: '',
    type: '',
    supplier: '',
    arrivalDate: new Date().toISOString().split('T')[0] // Auto-set to today
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
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

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

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true
      })
    ]).start();
  }, []);

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

    const handleCreateBatch = () => {
    if (!newBatch.name.trim() || !newBatch.type.trim() || !newBatch.supplier.trim()) {
      Alert.alert('Error', 'Please fill in all required batch details.');
      return;
    }

    if (batchVariants.length === 0) {
      Alert.alert('Error', 'Please add at least one variant to the batch.');
      return;
    }

    const { totalQuantity, totalValue } = getBatchSummary();

    const batchData = {
      ...newBatch,
      id: `batch-${Date.now()}`,
      items: batchVariants.map(variant => ({
        variantType: variant.name,
        color: variant.color,
        price: variant.price,
        sizes: Object.entries(variant.sizes).map(([size, quantity]) => ({
          size,
          quantity,
          initialQuantity: quantity,
        })),
      })),
      totalQuantity,
      totalValue,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.displayName || user?.email,
      createdByUid: user?.uid,
      createdByRole: userRole,
    };

    addBatch(batchData);
    Alert.alert('Success', 'Batch created successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
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
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 40 }}>
            <Text style={{
              fontSize: 22,
              fontWeight: '800',
              color: 'white',
              marginBottom: 4,
              letterSpacing: 0.5
            }}>
              Create Batch
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '500',
              letterSpacing: 0.2
            }}>
              Add inventory items
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >

        <Animated.View 
          style={{ 
            padding: 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
          }}
        >
          {/* Batch Summary */}
          {batchVariants.length > 0 && (
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
              borderWidth: 1,
              borderColor: colors.border
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ backgroundColor: '#f59e0b', borderRadius: 10, padding: 8, marginRight: 12 }}>
                  <Ionicons name="stats-chart" size={20} color="white" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
                  Batch Summary
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: isDarkMode ? '400' : '500' }}>Total Variants</Text>
                  <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
                    {getBatchSummary().totalVariants}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: isDarkMode ? '400' : '500' }}>Total Quantity</Text>
                  <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
                    {getBatchSummary().totalQuantity} pcs
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: isDarkMode ? '400' : '500' }}>Total Value</Text>
                  <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '600' : '700', color: '#10b981' }}>
                    ${getBatchSummary().totalValue.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Batch Information */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ backgroundColor: '#6366f1', borderRadius: 10, padding: 8, marginRight: 12 }}>
                <Ionicons name="information-circle" size={20} color="white" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
                Batch Details
              </Text>
            </View>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, marginBottom: 8 }}>
                Batch Name *
              </Text>
              <View style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border
              }}>
                <TextInput
                  style={{
                    padding: 14,
                    fontSize: 15,
                    color: colors.foreground,
                    fontWeight: isDarkMode ? '400' : '500'
                  }}
                  placeholder="e.g., Summer Uniforms 2024"
                  placeholderTextColor="#9ca3af"
                  value={newBatch.name}
                  onChangeText={(text) => setNewBatch(prev => ({ ...prev, name: text }))}
                />
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, marginBottom: 8 }}>
                Type *
              </Text>
              <View style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border
              }}>
                <TextInput
                  style={{
                    padding: 16,
                    fontSize: 16,
                    color: colors.foreground,
                    fontWeight: '500'
                  }}
                  placeholder="Enter uniform type (e.g., Shirts, Trousers)"
                  placeholderTextColor="#9ca3af"
                  value={newBatch.type}
                  onChangeText={(text) => setNewBatch(prev => ({ ...prev, type: text }))}
                />
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, marginBottom: 8 }}>
                Supplier *
              </Text>
              <View style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border
              }}>
                <TextInput
                  style={{
                    padding: 14,
                    fontSize: 15,
                    color: colors.foreground,
                    fontWeight: isDarkMode ? '400' : '500'
                  }}
                  placeholder="e.g., ABC Uniforms Ltd."
                  placeholderTextColor="#9ca3af"
                  value={newBatch.supplier}
                  onChangeText={(text) => setNewBatch(prev => ({ ...prev, supplier: text }))}
                />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, marginBottom: 8 }}>
                Arrival Date
              </Text>
              <View style={{
                backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#bbf7d0',
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Ionicons name="calendar" size={18} color="#10b981" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, color: '#059669', fontWeight: '600' }}>
                  {formatDate(newBatch.arrivalDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Current Variant Editor */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ backgroundColor: '#8b5cf6', borderRadius: 10, padding: 8, marginRight: 12 }}>
                <Ionicons name="cube" size={20} color="white" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
                Product Variants
              </Text>
            </View>
            
            {/* Current Variant Form */}
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: '#8b5cf6',
              borderStyle: 'dashed'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="add-circle" size={20} color="#8b5cf6" />
                <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, marginLeft: 8 }}>
                  New Variant
                </Text>
              </View>

              {/* Variant Details */}
              <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, marginBottom: 6 }}>Variant Name *</Text>
                    <View style={{
                      backgroundColor: colors.muted,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border
                    }}>
                      <TextInput
                        style={{
                          padding: 12,
                          fontSize: 15,
                          color: colors.foreground,
                          fontWeight: '500'
                        }}
                        placeholder="e.g., Short Sleeve"
                        placeholderTextColor="#9ca3af"
                        value={currentVariant.name}
                        onChangeText={(text) => setCurrentVariant(prev => ({ ...prev, name: text }))}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, marginBottom: 6 }}>Color *</Text>
                    <View style={{
                      backgroundColor: colors.muted,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border
                    }}>
                      <TextInput
                        style={{
                          padding: 12,
                          fontSize: 15,
                          color: colors.foreground,
                          fontWeight: '500'
                        }}
                        placeholder="e.g., White"
                        placeholderTextColor="#9ca3af"
                        value={currentVariant.color}
                        onChangeText={(text) => setCurrentVariant(prev => ({ ...prev, color: text }))}
                      />
                    </View>
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, marginBottom: 6 }}>Price ($) *</Text>
                  <View style={{
                    backgroundColor: colors.card,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border
                  }}>
                    <TextInput
                      style={{
                        padding: 12,
                        fontSize: 15,
                        color: '#059669',
                        fontWeight: '700',
                        textAlign: 'center'
                      }}
                      placeholder="0.00"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={currentVariant.price.toString()}
                      onChangeText={(text) => setCurrentVariant(prev => ({ ...prev, price: parseFloat(text) || 0 }))}
                    />
                  </View>
                </View>
              </View>

              {/* Size Management */}
              <View>
                <Text style={{ fontSize: 14, fontWeight: isDarkMode ? '500' : '600', color: colors.foreground, marginBottom: 12 }}>Sizes & Quantities</Text>
                
                {/* Add Size Form */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{
                      backgroundColor: colors.card,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border
                    }}>
                      <TextInput
                        style={{
                          padding: 12,
                          fontSize: 15,
                          color: colors.foreground,
                          fontWeight: '500',
                          textAlign: 'center'
                        }}
                        placeholder="Size (e.g., XL, 32)"
                        placeholderTextColor="#9ca3af"
                        value={newSize}
                        onChangeText={setNewSize}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                      shadowColor: '#ef4444',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2
                    }}>
                      <TextInput
                        style={{
                          padding: 12,
                          fontSize: 15,
                          color: colors.foreground,
                          fontWeight: '500',
                          textAlign: 'center'
                        }}
                        placeholder="Quantity"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        value={newQuantity}
                        onChangeText={setNewQuantity}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleAddSize}
                    style={{
                      backgroundColor: '#8b5cf6',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Current Sizes Display */}
                {Object.keys(currentVariant.sizes).length > 0 && (
                  <View style={{ gap: 8, marginTop: 12 }}>
                    {Object.entries(currentVariant.sizes).map(([size, quantity]) => (
                      <View key={size} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#fef3c7',
                        padding: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#fde68a'
                      }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400e' }}>
                          {size}: <Text style={{ fontWeight: '700' }}>{quantity}</Text> pcs
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeSizeFromCurrent(size)}
                          style={{ 
                            backgroundColor: 'white', 
                            borderRadius: 8, 
                            padding: 6,
                            borderWidth: 1,
                            borderColor: '#fbbf24'
                          }}
                        >
                          <Ionicons name="close" size={14} color="#d97706" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Add Variant Button */}
              <TouchableOpacity
                onPress={handleAddVariant}
                style={{ marginTop: 16 }}
              >
                <View style={{
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  backgroundColor: '#8b5cf6',
                  shadowColor: '#8b5cf6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 3
                }}>

                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={{ color: 'white', fontSize: 15, fontWeight: '700', marginLeft: 8 }}>
                    Add Variant to Batch
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Added Variants List */}
            {batchVariants.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ backgroundColor: '#10b981', borderRadius: 10, padding: 8, marginRight: 12 }}>
                    <Ionicons name="checkmark-done" size={20} color="white" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
                    Added Variants ({batchVariants.length})
                  </Text>
                </View>
                {batchVariants.map((variant, index) => (
                  <View key={variant.id} style={{
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '500' : '600', color: colors.foreground }}>
                        {variant.name} - {variant.color}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeVariant(index)}
                        style={{ backgroundColor: '#fee2e2', borderRadius: 8, padding: 6 }}
                      >
                        <Ionicons name="remove" size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 14, color: colors.mutedForeground, marginBottom: 8 }}>
                      Price: ${variant.price.toFixed(2)}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {Object.entries(variant.sizes).map(([size, quantity]) => (
                        <View key={size} style={{
                          backgroundColor: '#e0f2fe',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 4
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: '500', color: '#0369a1' }}>
                            {size}: {quantity}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
          {/* Create Batch Button - At bottom */}
          <View style={{ paddingTop: 24, paddingBottom: 100 }}>
            <TouchableOpacity
              onPress={handleCreateBatch}
              style={{ width: '100%' }}
            >
              <View
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3
                }}
              >
                <Ionicons name="checkmark-circle" size={24} color={colors.primaryForeground} />
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.primaryForeground, marginLeft: 10 }}>
                  Create Batch
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
