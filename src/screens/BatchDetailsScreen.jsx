import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useBatchStore } from '../../configuration/batchStore';
import { formatDate, formatShortDate } from '../utils/dateUtils';

export default function BatchDetailsScreen({ navigation, route }) {
  const { batchId } = route.params;
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { batches } = useBatchStore();
  
  const [batchDetails, setBatchDetails] = useState(null);
  const [enrichedItems, setEnrichedItems] = useState([]);
  const [expandedVariants, setExpandedVariants] = useState({});
  const [summaryStats, setSummaryStats] = useState({
    totalItems: 0,
    totalValue: 0,
    totalQuantity: 0,
    depletedItems: 0
  });

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  const toggleVariantExpanded = (index) => {
    setExpandedVariants(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = () => {
    // 1. Fetch batch document from Firebase data
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    setBatchDetails(batch);

    // 2. Use batch items directly (Firebase structure) - match web version data structure
    const enriched = batch.items?.map(item => ({
      ...item,
      variantType: item.variantType || item.type || 'Unknown Variant',
      color: item.color || 'Unknown Color',
      price: item.price || 0,
      sizes: item.sizes || [],
      // Calculate total quantity from sizes array like web version
      totalQuantity: item.sizes?.reduce((sum, sizeObj) => sum + (parseInt(sizeObj.quantity) || 0), 0) || 0,
      isFullyDepleted: item.sizes?.every(sizeObj => sizeObj.quantity === 0) || false
    })) || [];

    setEnrichedItems(enriched);

    // 3. Calculate summary statistics matching web version
    const totalQuantity = enriched.reduce((sum, item) => 
      sum + (item.sizes?.reduce((sizeSum, size) => sizeSum + (parseInt(size.quantity) || 0), 0) || 0), 0);
    
    const totalValue = enriched.reduce((sum, item) => 
      sum + (item.sizes?.reduce((sizeSum, size) => sizeSum + ((parseInt(size.quantity) || 0) * (item.price || 0)), 0) || 0), 0);
    
    const depletedItems = enriched.filter(item => item.isFullyDepleted).length;

    setSummaryStats({
      totalItems: enriched.length,
      totalQuantity,
      totalValue,
      depletedItems
    });
  };


  // Move early return after all hooks are declared
  if (!batchDetails) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 16, color: colors.mutedForeground }}>Loading batch details...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Compact Header */}
        <View style={{ 
          paddingHorizontal: 24, 
          paddingTop: 60, 
          paddingBottom: 24,
          backgroundColor: colors.background
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: colors.secondary,
                borderRadius: 12,
                padding: 8,
                marginRight: 16
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground }}>
                {batchDetails.name}
              </Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 4 }}>
                {batchDetails.type}
              </Text>
            </View>
          </View>

          {/* Inline Summary Stats */}
          <View style={{ 
            backgroundColor: colors.card, 
            borderRadius: 16, 
            padding: 20, 
            marginBottom: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>
                  {summaryStats.totalQuantity}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600' }}>Total Items</Text>
                <Text style={{ fontSize: 10, color: summaryStats.totalQuantity === 0 ? '#ef4444' : '#22c55e', fontWeight: '600' }}>
                  {summaryStats.totalQuantity === 0 ? 'All Available' : 'All Available'}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>
                  ${summaryStats.totalValue.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600' }}>Total Value</Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.cardForeground }}>
                  {batchDetails.createdBy ? 
                    batchDetails.createdBy.split('@')[0]
                      .split(/[._]/)
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ') 
                    : 'Unknown'
                  }
                </Text>
                <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: '600' }}>Created By</Text>
              </View>
              
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.cardForeground }}>
                  {formatShortDate(batchDetails.createdAt || batchDetails.arrivalDate)}
                </Text>
                <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: '600' }}>Created On</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Variants Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground, marginBottom: 24 }}>
              Variants
            </Text>
            
            {enrichedItems.map((variant, index) => {
              const isVariantDepleted = variant.isFullyDepleted;
              const totalVariantQty = variant.sizes?.reduce((sum, s) => sum + parseInt(s.quantity || 0), 0) || 0;
              
              return (
                <View 
                  key={index} 
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    marginBottom: 24,
                    borderWidth: 2,
                    borderColor: isVariantDepleted ? '#ef4444' : colors.border,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 4
                  }}
                >
                  {/* Variant Header */}
                  <View style={{
                    backgroundColor: isVariantDepleted ? '#fef2f2' : colors.primary,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 10, 
                        fontWeight: '700', 
                        color: isVariantDepleted ? '#7f1d1d' : 'rgba(255, 255, 255, 0.8)', 
                        textTransform: 'uppercase', 
                        letterSpacing: 1,
                        marginBottom: 4 
                      }}>VARIANT TYPE</Text>
                      <Text style={{ 
                        fontSize: 22, 
                        fontWeight: '800', 
                        color: isVariantDepleted ? '#991b1b' : 'white'
                      }}>{variant.variantType || 'Unknown'}</Text>
                    </View>
                    {isVariantDepleted && (
                      <View style={{ 
                        backgroundColor: '#dc2626', 
                        paddingHorizontal: 12, 
                        paddingVertical: 6, 
                        borderRadius: 20 
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: 'white' }}>DEPLETED</Text>
                      </View>
                    )}
                  </View>

                  {/* Variant Info Grid */}
                  <View style={{ padding: 20 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                      {/* Color */}
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <View style={{
                          backgroundColor: colors.muted,
                          borderRadius: 12,
                          padding: 16,
                          alignItems: 'center'
                        }}>
                          <View style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: 16, 
                            backgroundColor: variant.color?.toLowerCase() || '#9ca3af', 
                            borderWidth: 2, 
                            borderColor: colors.border,
                            marginBottom: 8
                          }} />
                          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 2 }}>COLOR</Text>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.cardForeground }}>{variant.color || 'Grey'}</Text>
                        </View>
                      </View>

                      {/* Price */}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{
                          backgroundColor: colors.muted,
                          borderRadius: 12,
                          padding: 16,
                          alignItems: 'center'
                        }}>
                          <Ionicons name="pricetag" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
                          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 2 }}>PRICE</Text>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>${variant.price || 40}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Stock Summary */}
                    <View style={{
                      backgroundColor: totalVariantQty === 0 ? '#fef2f2' : '#f0fdf4',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: totalVariantQty === 0 ? '#fecaca' : '#bbf7d0'
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: totalVariantQty === 0 ? '#991b1b' : '#15803d' }}>TOTAL STOCK</Text>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: totalVariantQty === 0 ? '#dc2626' : '#16a34a' }}>
                          {totalVariantQty} <Text style={{ fontSize: 14 }}>units</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Sizes Grid */}
                    <View style={{ marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
                          Available Sizes
                        </Text>
                        <View style={{
                          backgroundColor: colors.primary,
                          borderRadius: 12,
                          paddingHorizontal: 10,
                          paddingVertical: 4
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
                            {variant.sizes?.length || 0} sizes
                          </Text>
                        </View>
                      </View>

                      {/* Show preview or all sizes based on count */}
                      {variant.sizes && variant.sizes.length > 6 ? (
                        // Collapsible view for many sizes
                        <View>
                          {/* Preview (first 6 sizes - 3 per row) */}
                          {!expandedVariants[index] && (
                            <View>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                                {variant.sizes.slice(0, 6).map((sizeObj, sizeIndex) => {
                                  const qty = parseInt(sizeObj.quantity || 0);
                                  const isDepleted = qty === 0;
                                  
                                  return (
                                    <View 
                                      key={sizeIndex}
                                      style={{
                                        backgroundColor: isDepleted ? '#fef2f2' : colors.muted,
                                        borderWidth: 2,
                                        borderColor: isDepleted ? '#dc2626' : colors.border,
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        minWidth: 80,
                                        alignItems: 'center'
                                      }}
                                    >
                                      <Text style={{ 
                                        fontSize: 11, 
                                        fontWeight: '600', 
                                        color: colors.mutedForeground, 
                                        marginBottom: 4 
                                      }}>SIZE</Text>
                                      <Text style={{ 
                                        fontSize: 20, 
                                        fontWeight: '800', 
                                        color: colors.cardForeground,
                                        marginBottom: 6
                                      }}>{sizeObj.size}</Text>
                                      <View style={{
                                        backgroundColor: isDepleted ? '#dc2626' : '#16a34a',
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 8
                                      }}>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
                                          {qty} pcs
                                        </Text>
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                              {/* Expand Button */}
                              <TouchableOpacity
                                onPress={() => toggleVariantExpanded(index)}
                                style={{
                                  backgroundColor: colors.primary,
                                  borderRadius: 12,
                                  padding: 16,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 8
                                }}
                              >
                                <Ionicons name="chevron-down" size={20} color="white" />
                                <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>
                                  Show More ({variant.sizes.length - 6} more)
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* Expanded view (all sizes) */}
                          {expandedVariants[index] && (
                            <View>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                                {variant.sizes.map((sizeObj, sizeIndex) => {
                                  const qty = parseInt(sizeObj.quantity || 0);
                                  const isDepleted = qty === 0;
                                  
                                  return (
                                    <View 
                                      key={sizeIndex}
                                      style={{
                                        backgroundColor: isDepleted ? '#fef2f2' : colors.muted,
                                        borderWidth: 2,
                                        borderColor: isDepleted ? '#dc2626' : colors.border,
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        minWidth: 80,
                                        alignItems: 'center'
                                      }}
                                    >
                                      <Text style={{ 
                                        fontSize: 11, 
                                        fontWeight: '600', 
                                        color: colors.mutedForeground, 
                                        marginBottom: 4 
                                      }}>SIZE</Text>
                                      <Text style={{ 
                                        fontSize: 20, 
                                        fontWeight: '800', 
                                        color: colors.cardForeground,
                                        marginBottom: 6
                                      }}>{sizeObj.size}</Text>
                                      <View style={{
                                        backgroundColor: isDepleted ? '#dc2626' : '#16a34a',
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 8
                                      }}>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
                                          {qty} pcs
                                        </Text>
                                      </View>
                                      {isDepleted && sizeObj.depletedAt && (
                                        <Text style={{ fontSize: 8, color: '#991b1b', marginTop: 6, textAlign: 'center' }}>
                                          Depleted
                                        </Text>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                              {/* Collapse Button */}
                              <TouchableOpacity
                                onPress={() => toggleVariantExpanded(index)}
                                style={{
                                  backgroundColor: colors.muted,
                                  borderRadius: 12,
                                  padding: 16,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 8,
                                  borderWidth: 2,
                                  borderColor: colors.border
                                }}
                              >
                                <Ionicons name="chevron-up" size={20} color={colors.foreground} />
                                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
                                  Show Less
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ) : (
                        // Standard view for few sizes (6 or less)
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                          {variant.sizes?.map((sizeObj, sizeIndex) => {
                            const qty = parseInt(sizeObj.quantity || 0);
                            const isDepleted = qty === 0;
                            
                            return (
                              <View 
                                key={sizeIndex}
                                style={{
                                  backgroundColor: isDepleted ? '#fef2f2' : colors.muted,
                                  borderWidth: 2,
                                  borderColor: isDepleted ? '#dc2626' : colors.border,
                                  borderRadius: 12,
                                  paddingHorizontal: 16,
                                  paddingVertical: 12,
                                  minWidth: 80,
                                  alignItems: 'center'
                                }}
                              >
                                <Text style={{ 
                                  fontSize: 11, 
                                  fontWeight: '600', 
                                  color: colors.mutedForeground, 
                                  marginBottom: 4 
                                }}>SIZE</Text>
                                <Text style={{ 
                                  fontSize: 20, 
                                  fontWeight: '800', 
                                  color: colors.cardForeground,
                                  marginBottom: 6
                                }}>{sizeObj.size}</Text>
                                <View style={{
                                  backgroundColor: isDepleted ? '#dc2626' : '#16a34a',
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                  borderRadius: 8
                                }}>
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
                                    {qty} pcs
                                  </Text>
                                </View>
                                {isDepleted && sizeObj.depletedAt && (
                                  <Text style={{ fontSize: 8, color: '#991b1b', marginTop: 6, textAlign: 'center' }}>
                                    Depleted
                                  </Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Depletion History Section */}
          <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>
                Depletion History
              </Text>
              {summaryStats.totalQuantity === 0 && (
                <View style={{
                  backgroundColor: '#dc2626',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: 'white' }}>
                    FULLY DEPLETED
                  </Text>
                </View>
              )}
            </View>
            
            {(() => {
              const depletedItems = [];
              
              enrichedItems.forEach(variant => {
                variant.sizes?.forEach(sizeObj => {
                  if (parseInt(sizeObj.quantity) === 0) {
                    depletedItems.push({
                      variant: variant.variantType,
                      color: variant.color,
                      size: sizeObj.size,
                      depletedAt: sizeObj.depletedAt,
                      sortDate: sizeObj.depletedAt 
                        ? (sizeObj.depletedAt.seconds * 1000) 
                        : (batchDetails.updatedAt ? batchDetails.updatedAt.seconds * 1000 : 0)
                    });
                  }
                });
              });
              
              // Sort by depletion date (newest first)
              depletedItems.sort((a, b) => b.sortDate - a.sortDate);
              
              if (depletedItems.length === 0) {
                return (
                  <View style={{
                    backgroundColor: colors.secondary,
                    borderRadius: 20,
                    padding: 32,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#bbf7d0'
                  }}>
                    <View style={{
                      backgroundColor: '#dcfce7',
                      borderRadius: 50,
                      padding: 16,
                      marginBottom: 16
                    }}>
                      <Ionicons name="checkmark-circle" size={40} color="#16a34a" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#15803d', textAlign: 'center', marginBottom: 8 }}>
                      All Stock Available
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                      No items have been depleted from this batch yet
                    </Text>
                  </View>
                );
              }
              
              return (
                <View>
                  {/* Depletion Count Badge */}
                  <View style={{
                    backgroundColor: colors.muted,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="information-circle" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                        Depleted Items
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: '#dc2626',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 4
                    }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: 'white' }}>
                        {depletedItems.length}
                      </Text>
                    </View>
                  </View>

                  {/* Depletion Cards */}
                  {depletedItems.map((item, index) => (
                    <View key={index} style={{ 
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: '#dc2626',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 2
                    }}>
                      {/* Item Header */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{
                          backgroundColor: '#fef2f2',
                          borderRadius: 10,
                          padding: 10,
                          marginRight: 12
                        }}>
                          <Ionicons name="cube" size={20} color="#dc2626" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.cardForeground, marginBottom: 2 }}>
                            {item.variant}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ 
                              width: 14, 
                              height: 14, 
                              borderRadius: 7, 
                              backgroundColor: item.color?.toLowerCase() || '#9ca3af', 
                              borderWidth: 1.5, 
                              borderColor: colors.border,
                              marginRight: 6
                            }} />
                            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.mutedForeground }}>
                              {item.color}
                            </Text>
                          </View>
                        </View>
                        <View style={{
                          backgroundColor: colors.muted,
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 6
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 2 }}>SIZE</Text>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.foreground, textAlign: 'center' }}>
                            {item.size}
                          </Text>
                        </View>
                      </View>

                      {/* Depletion Date */}
                      <View style={{
                        backgroundColor: colors.muted,
                        borderRadius: 10,
                        padding: 12,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}>
                        <Ionicons name="calendar-outline" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedForeground, marginRight: 6 }}>DEPLETED ON:</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
                          {formatDate(item.depletedAt) !== 'Invalid date' ? 
                            formatDate(item.depletedAt) 
                            : (formatDate(batchDetails.updatedAt) !== 'Invalid date' ? 
                                formatDate(batchDetails.updatedAt) + ' (est)'
                                : 'Not recorded'
                              )
                          }
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
      </ScrollView>
    </View>
  );
}
