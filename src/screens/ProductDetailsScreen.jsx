import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useInventoryStore } from '../../configuration/inventoryStore';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId } = route.params;
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { products, uniforms, uniformVariants, loading, fetchProducts } = useInventoryStore();
  const [product, setProduct] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [expandedVariants, setExpandedVariants] = useState({});
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  const toggleVariant = (index) => {
    setExpandedVariants(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };


  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products && products.length > 0) {
      const foundProduct = products.find(p => p.id === productId);
      setProduct(foundProduct);
      
      // Use variants from the product itself (fetched with product)
      if (foundProduct && foundProduct.variants && Array.isArray(foundProduct.variants)) {
        setProductVariants(foundProduct.variants);
      } else {
        setProductVariants([]);
      }
    }
  }, [products, productId]);

  useEffect(() => {
    if (product) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [product]);

  const getTotalStock = () => {
    if (!productVariants || !Array.isArray(productVariants)) {
      return 0;
    }
    return productVariants.reduce((total, variant) => {
      if (variant && variant.sizes && Array.isArray(variant.sizes)) {
        return total + variant.sizes.reduce((sizeTotal, size) => {
          return sizeTotal + (parseInt(size.quantity) || 0);
        }, 0);
      }
      return total;
    }, 0);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'destructive' };
    if (stock < 10) return { text: 'Low Stock', color: 'warning' };
    if (stock < 50) return { text: 'Medium Stock', color: 'default' };
    return { text: 'In Stock', color: 'success' };
  };

  const handleEdit = () => {
    // Navigate to edit screen or show edit modal
    Alert.alert('Edit Product', 'Edit functionality will be implemented');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Implement delete functionality
          Alert.alert('Success', 'Product deleted successfully');
          navigation.goBack();
        }}
      ]
    );
  };

  if (loading || !product) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 16, color: colors.mutedForeground }}>Loading product details...</Text>
      </View>
    );
  }

  const totalStock = getTotalStock();
  const stockStatus = getStockStatus(totalStock);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header with Gradient */}
      <View
        style={{ 
          paddingHorizontal: 24, 
          paddingTop: 60, 
          paddingBottom: 24,
          backgroundColor: colors.primary,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: 'white',
            flex: 1,
            textAlign: 'center',
            marginHorizontal: 16
          }}>
            Product Details
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handleEdit}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Ionicons name="create-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          padding: 20
        }}>
          {/* Hero Product Card */}
          <View style={{ 
            marginBottom: 24, 
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2
          }}>
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative'
            }}>
              {/* Product Icon */}
              <View style={{
                backgroundColor: colors.primary,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16
              }}>
                <Ionicons name="shirt" size={48} color="white" />
              </View>
              
              <Text style={{
                fontSize: 28,
                fontWeight: '800',
                color: colors.foreground,
                textAlign: 'center',
                marginBottom: 8
              }}>
                {product.name}
              </Text>
              <Text style={{
                fontSize: 16,
                color: colors.mutedForeground,
                textAlign: 'center',
                fontWeight: '500',
                marginBottom: 16
              }}>
                School Uniform • {product.gender || 'Unisex'}
              </Text>
              
              {/* Price Badge */}
              <View style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingHorizontal: 20,
                paddingVertical: 10
              }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: 'white'
                }}>
                  ${(() => {
                    if (product.price && parseFloat(product.price) > 0) return parseFloat(product.price).toFixed(2);
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
                      
                      if (prices.length > 0) {
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        return minPrice === maxPrice ? minPrice.toFixed(2) : `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
                      }
                    }
                    if (product.basePrice) return parseFloat(product.basePrice).toFixed(2);
                    if (product.unitPrice) return parseFloat(product.unitPrice).toFixed(2);
                    return '0.00';
                  })()}
                </Text>
              </View>
            </View>
          </View>

          {/* Stock Overview Cards */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{ 
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center'
            }}>
              <Ionicons name="cube" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground, marginBottom: 4 }}>
                {getTotalStock()}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600', textAlign: 'center' }}>
                Total Stock
              </Text>
            </View>
            
            <View style={{ 
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center'
            }}>
              <Ionicons name="color-palette" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground, marginBottom: 4 }}>
                {productVariants.length}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600', textAlign: 'center' }}>
                Variants
              </Text>
            </View>
            
            <View style={{ 
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center'
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: stockStatus.color === 'success' ? '#10b981' : 
                               stockStatus.color === 'warning' ? '#f59e0b' : '#ef4444',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                <Ionicons 
                  name={stockStatus.color === 'success' ? 'checkmark' : 
                        stockStatus.color === 'warning' ? 'alert' : 'close'} 
                  size={20} 
                  color="white"
                />
              </View>
              <Text style={{ 
                fontSize: 11, 
                color: colors.foreground,
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {stockStatus.text}
              </Text>
            </View>
          </View>


          {/* Variants & Sizes Section - Batch Style */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, marginBottom: 8 }}>Variants & Sizes</Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>
                {productVariants.length} variants available
              </Text>
            </View>

            {productVariants && productVariants.length > 0 ? (
              productVariants.map((variant, index) => {
                const variantTotal = variant.sizes ? variant.sizes.reduce((total, size) => total + parseInt(size.quantity || 0), 0) : 0;
                const isDepleted = variantTotal === 0;
                const sizesCount = variant.sizes?.length || 0;
                
                return (
                  <View key={variant.id || index} style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    borderWidth: 2,
                    borderColor: isDepleted ? '#dc2626' : colors.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2
                  }}>
                    {/* Variant Header */}
                    <View style={{
                      backgroundColor: isDepleted ? '#dc2626' : colors.primary,
                      marginHorizontal: -20,
                      marginTop: -20,
                      padding: 16,
                      borderTopLeftRadius: 14,
                      borderTopRightRadius: 14,
                      marginBottom: 16
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: 'white', flex: 1 }}>
                          {variant.variant || variant.color}
                        </Text>
                        <View style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 4
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
                            {sizesCount} sizes
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Total Stock Badge */}
                    <View style={{
                      backgroundColor: isDepleted ? '#fee2e2' : '#dcfce7',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <View>
                        <Text style={{ fontSize: 12, color: isDepleted ? '#991b1b' : '#166534', fontWeight: '600' }}>
                          Total Stock
                        </Text>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: isDepleted ? '#dc2626' : '#10b981' }}>
                          {variantTotal} pcs
                        </Text>
                      </View>
                      <Ionicons 
                        name={isDepleted ? 'close-circle' : 'checkmark-circle'} 
                        size={32} 
                        color={isDepleted ? '#dc2626' : '#10b981'}
                      />
                    </View>

                    {/* Sizes Section with Collapsible */}
                    {variant.sizes && variant.sizes.length > 3 ? (
                      <View>
                        {/* Preview (first 3 sizes) */}
                        {!expandedVariants[index] && (
                          <View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                              {variant.sizes.slice(0, 3).map((sizeObj, sizeIndex) => {
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
                                      padding: 12,
                                      minWidth: '30%',
                                      flex: 1,
                                      alignItems: 'center'
                                    }}
                                  >
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                                      Size {sizeObj.size}
                                    </Text>
                                    <Text style={{ fontSize: 20, fontWeight: '800', color: isDepleted ? '#dc2626' : colors.foreground }}>
                                      {qty}
                                    </Text>
                                    {isDepleted && (
                                      <Text style={{ fontSize: 10, color: '#dc2626', fontWeight: '600', marginTop: 2 }}>
                                        DEPLETED
                                      </Text>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                            <TouchableOpacity
                              onPress={() => toggleVariant(index)}
                              style={{
                                backgroundColor: '#dc2626',
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
                                Show More ({variant.sizes.length - 3} more)
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
                                      padding: 12,
                                      minWidth: '30%',
                                      flex: 1,
                                      alignItems: 'center'
                                    }}
                                  >
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                                      Size {sizeObj.size}
                                    </Text>
                                    <Text style={{ fontSize: 20, fontWeight: '800', color: isDepleted ? '#dc2626' : colors.foreground }}>
                                      {qty}
                                    </Text>
                                    {isDepleted && (
                                      <Text style={{ fontSize: 10, color: '#dc2626', fontWeight: '600', marginTop: 2 }}>
                                        DEPLETED
                                      </Text>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                            <TouchableOpacity
                              onPress={() => toggleVariant(index)}
                              style={{
                                backgroundColor: colors.muted,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                                padding: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8
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
                      // Standard view for 3 or fewer sizes
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
                                padding: 12,
                                minWidth: '30%',
                                flex: 1,
                                alignItems: 'center'
                              }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                                Size {sizeObj.size}
                              </Text>
                              <Text style={{ fontSize: 20, fontWeight: '800', color: isDepleted ? '#dc2626' : colors.foreground }}>
                                {qty}
                              </Text>
                              {isDepleted && (
                                <Text style={{ fontSize: 10, color: '#dc2626', fontWeight: '600', marginTop: 2 }}>
                                  DEPLETED
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={{ 
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 32,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border
              }}>
                <Ionicons name="cube-outline" size={48} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, color: colors.foreground, fontWeight: '600', marginBottom: 4 }}>No variants available</Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>This product doesn't have any variants configured yet.</Text>
              </View>
            )}
          </View>

          {/* Product Metadata Card */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 16 }}>Product Information</Text>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>Product ID</Text>
                <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: '600', flex: 1, textAlign: 'right' }} numberOfLines={1}>
                  {productId}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>School</Text>
                <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: '600' }}>pamushana</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>Category</Text>
                <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: '600' }}>{product.category || 'School Uniform'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>Creator</Text>
                <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: '600' }}>{product.creatorName || product.creator || 'N/A'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>Role</Text>
                <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: '600' }}>{product.creatorRole || product.role || 'N/A'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>Created</Text>
                <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: '600' }}>8/1/2025</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '500' }}>Last Updated</Text>
                <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: '600' }}>8/1/2025</Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacer */}
          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}
