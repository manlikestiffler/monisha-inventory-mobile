import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Animated, Image, Modal, FlatList } from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// Icons now using @expo/vector-icons
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { GlassCard } from '../components/ui/GlassCard';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import { useInventoryStore } from '../../configuration/inventoryStore';
import { getUniformById, getVariantById, getTotalStockForVariant } from '../utils/staticData';

export default function ProductScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { products, loading, setupRealtimeListeners, cleanup } = useInventoryStore();
  const [selectedUniformType, setSelectedUniformType] = useState('all');
  const [selectedVariant, setSelectedVariant] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [showUniformTypeModal, setShowUniformTypeModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    setupRealtimeListeners();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    // Cleanup listeners on unmount
    return () => {
      cleanup();
    };
  }, []);

  // Extract unique values from database
  const getUniqueUniformTypes = () => {
    const types = products.map(p => p.uniformType || p.type).filter(Boolean);
    return ['all', ...new Set(types)];
  };

  const getUniqueVariants = () => {
    const variants = products.flatMap(p => p.variants || []).map(v => v.variantType || v.type).filter(Boolean);
    return ['all', ...new Set(variants)];
  };

  const getUniqueSchools = () => {
    const schools = products.map(p => p.schoolId || p.school).filter(Boolean);
    return ['all', ...new Set(schools)];
  };

  const getUniqueColors = () => {
    const colors = products.flatMap(p => p.variants || []).map(v => v.color).filter(Boolean);
    return ['all', ...new Set(colors)];
  };

  const filteredProducts = products.filter(product => {
    const matchesUniformType = selectedUniformType === 'all' || 
      product.uniformType === selectedUniformType || 
      product.type === selectedUniformType;
    
    const matchesVariant = selectedVariant === 'all' || 
      (product.variants && product.variants.some(v => 
        v.variantType === selectedVariant || v.type === selectedVariant
      ));
    
    const matchesSchool = selectedSchool === 'all' || 
      product.schoolId === selectedSchool || 
      product.school === selectedSchool;
    
    const matchesColor = selectedColor === 'all' || 
      (product.variants && product.variants.some(v => v.color === selectedColor));
    
    return matchesUniformType && matchesVariant && matchesSchool && matchesColor;
  });

  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'out', color: 'destructive', text: 'Out of Stock' };
    if (stock <= 10) return { status: 'low', color: 'warning', text: 'Low Stock' };
    return { status: 'good', color: 'success', text: 'In Stock' };
  };

  const getTotalProductStock = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.variants) return 0;
    
    return product.variants.reduce((total, variant) => {
      if (variant.sizes && Array.isArray(variant.sizes)) {
        return total + variant.sizes.reduce((sizeTotal, size) => {
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
          onPress={() => navigation?.navigate('CreateProduct') || console.log('Navigate to Create Product')}
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
                Products
              </Text>
              <Text style={{
                fontSize: 13,
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: '400'
              }}>
                Manage your uniform inventory
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
                onPress={() => navigation.navigate('CreateProduct')}
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
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <View style={{ backgroundColor: colors.secondary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: colors.secondaryForeground, fontSize: 10, fontWeight: '600' }}>ACTIVE</Text>
                  </View>
                </View>
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                  {products.filter(p => p.stock > 0).length}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  In Stock
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
                  shadowRadius: 12,
                  elevation: 6
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Ionicons name="trending-up" size={20} color={colors.primary} />
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
                  {products.filter(p => getTotalProductStock(p.id) > 10).length}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontWeight: '500' }}>
                  Good Stock
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Modern Compact Filters */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginBottom: 20 }}>
          {/* Filter Header */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingHorizontal: 4
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                backgroundColor: colors.primary, 
                borderRadius: 8, 
                padding: 6, 
                marginRight: 8 
              }}>
                <Ionicons name="options" size={16} color="white" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
                Filters
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedUniformType('all');
                setSelectedVariant('all');
                setSelectedSchool('all');
                setSelectedColor('all');
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: colors.muted
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: isDarkMode ? '500' : '600', color: colors.mutedForeground }}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Compact Filter Grid */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: '#f1f5f9'
          }}>
            {/* Active Filters Summary */}
            {(selectedUniformType !== 'all' || selectedVariant !== 'all' || selectedSchool !== 'all' || selectedColor !== 'all') && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: isDarkMode ? '500' : '600', color: colors.mutedForeground, marginBottom: 8 }}>Active Filters</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {selectedUniformType !== 'all' && (
                    <View style={{
                      backgroundColor: colors.primary,
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: 'white', marginRight: 4 }}>
                        {selectedUniformType}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedUniformType('all')}>
                        <Ionicons name="close" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedVariant !== 'all' && (
                    <View style={{
                      backgroundColor: '#8b5cf6',
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: 'white', marginRight: 4 }}>
                        {selectedVariant}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedVariant('all')}>
                        <Ionicons name="close" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedSchool !== 'all' && (
                    <View style={{
                      backgroundColor: '#10b981',
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: 'white', marginRight: 4 }}>
                        {selectedSchool.length > 15 ? selectedSchool.substring(0, 15) + '...' : selectedSchool}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedSchool('all')}>
                        <Ionicons name="close" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedColor !== 'all' && (
                    <View style={{
                      backgroundColor: (() => {
                        const colorMap = {
                          'Gray': '#6b7280', 'Grey': '#6b7280',
                          'Blue': '#3b82f6', 'Navy': '#1e40af',
                          'Red': '#ef4444', 'Green': '#10b981',
                          'Black': '#1f2937', 'White': '#f9fafb',
                          'Yellow': '#eab308', 'Orange': '#f97316',
                          'Purple': '#8b5cf6', 'Pink': '#ec4899'
                        };
                        return colorMap[selectedColor] || '#6b7280';
                      })(),
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: selectedColor === 'White' ? 1 : 0,
                      borderColor: '#e5e7eb'
                    }}>
                      <Text style={{ 
                        fontSize: 10, 
                        fontWeight: '600', 
                        color: selectedColor === 'White' || selectedColor === 'Yellow' ? '#374151' : 'white', 
                        marginRight: 4 
                      }}>
                        {selectedColor}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedColor('all')}>
                        <Ionicons 
                          name="close" 
                          size={12} 
                          color={selectedColor === 'White' || selectedColor === 'Yellow' ? '#374151' : 'white'} 
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Filter Categories - 2x2 Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {/* Uniform Type */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: isDarkMode ? 'rgba(254, 202, 202, 0.1)' : '#fef2f2',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: selectedUniformType !== 'all' ? colors.primary : '#fecaca'
                }}
                onPress={() => setShowUniformTypeModal(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="shirt" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, marginLeft: 6 }}>
                    Uniform Type
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                  {selectedUniformType === 'all' ? `${getUniqueUniformTypes().length - 1} types` : selectedUniformType}
                </Text>
              </TouchableOpacity>

              {/* Variants */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : '#faf5ff',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: selectedVariant !== 'all' ? '#8b5cf6' : '#e9d5ff'
                }}
                onPress={() => setShowVariantModal(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="layers" size={14} color="#8b5cf6" />
                  <Text style={{ fontSize: 12, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, marginLeft: 6 }}>
                    Variants
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                  {selectedVariant === 'all' ? `${getUniqueVariants().length - 1} variants` : selectedVariant}
                </Text>
              </TouchableOpacity>

              {/* School */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: selectedSchool !== 'all' ? '#10b981' : '#bbf7d0'
                }}
                onPress={() => setShowSchoolModal(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="school" size={14} color="#10b981" />
                  <Text style={{ fontSize: 12, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, marginLeft: 6 }}>
                    School
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }} numberOfLines={1}>
                  {selectedSchool === 'all' ? `${getUniqueSchools().length - 1} schools` : selectedSchool}
                </Text>
              </TouchableOpacity>

              {/* Colors */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: selectedColor !== 'all' ? '#f59e0b' : '#fed7aa'
                }}
                onPress={() => setShowColorModal(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="color-palette" size={14} color="#f59e0b" />
                  <Text style={{ fontSize: 12, fontWeight: isDarkMode ? '500' : '600', color: colors.cardForeground, marginLeft: 6 }}>
                    Colors
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {selectedColor !== 'all' ? (
                    <>
                      <View style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: (() => {
                          const colorMap = {
                            'Gray': '#6b7280', 'Grey': '#6b7280',
                            'Blue': '#3b82f6', 'Navy': '#1e40af',
                            'Red': '#ef4444', 'Green': '#10b981',
                            'Black': '#1f2937', 'White': '#f9fafb',
                            'Yellow': '#eab308', 'Orange': '#f97316',
                            'Purple': '#8b5cf6', 'Pink': '#ec4899'
                          };
                          return colorMap[selectedColor] || '#6b7280';
                        })(),
                        marginRight: 6,
                        borderWidth: selectedColor === 'White' ? 1 : 0,
                        borderColor: '#e5e7eb'
                      }} />
                      <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{selectedColor}</Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                      {getUniqueColors().length - 1} colors
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

      {/* Modern Products Grid */}
      <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <View style={{ 
            backgroundColor: '#8b5cf6', 
            borderRadius: 10, 
            padding: 8, 
            marginRight: 12 
          }}>
            <Ionicons name="list" size={20} color="white" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: isDarkMode ? '600' : '700', color: colors.foreground }}>
            🛍️ All Products
          </Text>
        </View>
        
        <View>
          {filteredProducts.map((product, index) => {
            const totalStock = getTotalProductStock(product.id);
            const stockStatus = getStockStatus(totalStock);
            
            return (
              <TouchableOpacity
                key={product.id}
                activeOpacity={0.9}
                style={{ width: '100%', marginBottom: 20 }}
              >
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    padding: 0,
                    borderWidth: 1,
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.1,
                    shadowRadius: 15,
                    elevation: 6,
                    overflow: 'hidden'
                  }}
                >
                  {/* Product Content - Full Width */}
                  <View style={{ padding: 20 }}>
                    {/* Product Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '800', color: colors.cardForeground, fontSize: 20, marginBottom: 4, lineHeight: 24 }} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>
                          {product.type || 'School Uniform'}
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: stockStatus.status === 'good' ? '#dcfce7' : 
                                       stockStatus.status === 'low' ? '#fef3c7' : '#fee2e2',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderColor: stockStatus.status === 'good' ? '#bbf7d0' : 
                                   stockStatus.status === 'low' ? '#fde68a' : '#fecaca'
                      }}>
                        <Text style={{ 
                          color: stockStatus.status === 'good' ? '#166534' : 
                                stockStatus.status === 'low' ? '#92400e' : '#991b1b',
                          fontSize: 12, 
                          fontWeight: '600' 
                        }}>
                          {stockStatus.text}
                        </Text>
                      </View>
                    </View>

                    {/* Product Details Grid */}
                    <View style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>Gender</Text>
                        <Text style={{ fontSize: 14, color: colors.cardForeground, fontWeight: '600' }}>
                          {product.gender || 'Male'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>Level</Text>
                        <Text style={{ fontSize: 14, color: colors.cardForeground, fontWeight: '600' }}>
                          {product.level || 'N/A'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>School</Text>
                        <Text style={{ fontSize: 14, color: colors.cardForeground, fontWeight: '600' }}>
                          pamushana
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>Stock</Text>
                        <Text style={{ fontSize: 14, color: colors.cardForeground, fontWeight: '700' }}>
                          {totalStock} units
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>Price</Text>
                        <Text style={{ fontSize: 16, color: colors.cardForeground, fontWeight: '800' }}>
                          ${(() => {
                            // Debug: Log product structure
                            console.log('Product Price Debug:', {
                              name: product.name,
                              price: product.price,
                              variants: product.variants,
                              variantCount: product.variants?.length
                            });
                            
                            // Check variants for price (primary source in Firebase)
                            if (product.variants && product.variants.length > 0) {
                              // Get all unique prices from variants and their sizes
                              const prices = [];
                              
                              product.variants.forEach(variant => {
                                // Check variant.price (legacy format)
                                if (variant.price && parseFloat(variant.price) > 0) {
                                  prices.push(parseFloat(variant.price));
                                }
                                
                                // Check variant.sizes[].price (new web format)
                                if (variant.sizes && Array.isArray(variant.sizes)) {
                                  variant.sizes.forEach(size => {
                                    if (size.price && parseFloat(size.price) > 0) {
                                      prices.push(parseFloat(size.price));
                                    }
                                  });
                                }
                              });
                              
                              console.log('All found prices:', prices);
                              
                              if (prices.length > 0) {
                                const minPrice = Math.min(...prices);
                                const maxPrice = Math.max(...prices);
                                // If all variants have the same price, show single price
                                if (minPrice === maxPrice) {
                                  return minPrice.toFixed(2);
                                }
                                // Otherwise show price range
                                return `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
                              }
                            }
                            // Fallback: Check if product has price directly
                            if (product.price && parseFloat(product.price) > 0) return parseFloat(product.price).toFixed(2);
                            if (product.basePrice && parseFloat(product.basePrice) > 0) return parseFloat(product.basePrice).toFixed(2);
                            if (product.unitPrice && parseFloat(product.unitPrice) > 0) return parseFloat(product.unitPrice).toFixed(2);
                            console.log('No valid price found, returning 0.00');
                            return '0.00';
                          })()}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Action Button */}
                    <TouchableOpacity
                      onPress={() => navigation?.navigate('ProductDetails', { productId: product.id }) || console.log('Navigate to Product Details:', product.id)}
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
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

        {/* Spacer for bottom padding */}
        <View style={{ paddingBottom: 100 }} />
      </ScrollView>

      {/* Filter Modals */}
      {/* Uniform Type Modal */}
      <Modal
        visible={showUniformTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUniformTypeModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>Select Uniform Type</Text>
            </View>
            <FlatList
              data={getUniqueUniformTypes()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ 
                    padding: 16, 
                    borderBottomWidth: 1, 
                    borderBottomColor: '#f8fafc',
                    backgroundColor: selectedUniformType === item ? '#fef2f2' : 'white'
                  }}
                  onPress={() => {
                    setSelectedUniformType(item);
                    setShowUniformTypeModal(false);
                  }}
                >
                  <Text style={{ 
                    fontSize: 16, 
                    color: selectedUniformType === item ? colors.primary : '#374151',
                    fontWeight: selectedUniformType === item ? '600' : '400'
                  }}>
                    {item === 'all' ? 'All Types' : item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Variant Modal */}
      <Modal
        visible={showVariantModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVariantModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>Select Variant</Text>
            </View>
            <FlatList
              data={getUniqueVariants()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ 
                    padding: 16, 
                    borderBottomWidth: 1, 
                    borderBottomColor: '#f8fafc',
                    backgroundColor: selectedVariant === item ? '#faf5ff' : 'white'
                  }}
                  onPress={() => {
                    setSelectedVariant(item);
                    setShowVariantModal(false);
                  }}
                >
                  <Text style={{ 
                    fontSize: 16, 
                    color: selectedVariant === item ? '#8b5cf6' : '#374151',
                    fontWeight: selectedVariant === item ? '600' : '400'
                  }}>
                    {item === 'all' ? 'All Variants' : item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* School Modal */}
      <Modal
        visible={showSchoolModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSchoolModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>Select School</Text>
            </View>
            <FlatList
              data={getUniqueSchools()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ 
                    padding: 16, 
                    borderBottomWidth: 1, 
                    borderBottomColor: '#f8fafc',
                    backgroundColor: selectedSchool === item ? '#f0fdf4' : 'white'
                  }}
                  onPress={() => {
                    setSelectedSchool(item);
                    setShowSchoolModal(false);
                  }}
                >
                  <Text style={{ 
                    fontSize: 16, 
                    color: selectedSchool === item ? '#10b981' : '#374151',
                    fontWeight: selectedSchool === item ? '600' : '400'
                  }}>
                    {item === 'all' ? 'All Schools' : item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Color Modal */}
      <Modal
        visible={showColorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowColorModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>Select Color</Text>
            </View>
            <FlatList
              data={getUniqueColors()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ 
                    padding: 16, 
                    borderBottomWidth: 1, 
                    borderBottomColor: '#f8fafc',
                    backgroundColor: selectedColor === item ? '#fffbeb' : 'white',
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    setSelectedColor(item);
                    setShowColorModal(false);
                  }}
                >
                  {item !== 'all' && (
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: (() => {
                        const colorMap = {
                          'Gray': '#6b7280', 'Grey': '#6b7280',
                          'Blue': '#3b82f6', 'Navy': '#1e40af',
                          'Red': '#ef4444', 'Green': '#10b981',
                          'Black': '#1f2937', 'White': '#f9fafb',
                          'Yellow': '#eab308', 'Orange': '#f97316',
                          'Purple': '#8b5cf6', 'Pink': '#ec4899'
                        };
                        return colorMap[item] || '#6b7280';
                      })(),
                      marginRight: 12,
                      borderWidth: item === 'White' ? 1 : 0,
                      borderColor: '#e5e7eb'
                    }} />
                  )}
                  <Text style={{ 
                    fontSize: 16, 
                    color: selectedColor === item ? '#f59e0b' : '#374151',
                    fontWeight: selectedColor === item ? '600' : '400'
                  }}>
                    {item === 'all' ? 'All Colors' : item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
