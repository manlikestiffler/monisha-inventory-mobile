import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useSchoolStore } from '../../../configuration/schoolStore';
import { useInventoryStore } from '../../../configuration/inventoryStore';

const LogUniformModal = ({ visible, onClose, student, uniform, onComplete }) => {
  const [quantityReceived, setQuantityReceived] = useState('1');
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeNotAvailable, setSizeNotAvailable] = useState(false);
  const [sizeWanted, setSizeWanted] = useState('');
  const [availableSizes, setAvailableSizes] = useState([]);
  const [sizeStockInfo, setSizeStockInfo] = useState({}); // Track stock quantity per size
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { updateStudentUniformLog } = useSchoolStore();
  const { uniformVariants, fetchProducts, uniforms, checkProductStock, deductProductInventory } = useInventoryStore();

  useEffect(() => {
    if (visible && uniform) {
      loadAvailableSizes();
      resetForm();
    }
  }, [visible, uniform]);

  const resetForm = () => {
    setQuantityReceived('1');
    setSelectedSize('');
    setSizeNotAvailable(false);
    setSizeWanted('');
  };

  const loadAvailableSizes = async () => {
    if (!uniform) return;
    
    setLoading(true);
    try {
      // Ensure inventory data is loaded
      await fetchProducts();
      
      console.log('=== SIZE LOADING DEBUG ===');
      console.log('Uniform object:', uniform);
      console.log('Uniform ID:', uniform.uniformId);
      console.log('Uniform Name:', uniform.uniformName);
      console.log('All uniformVariants count:', uniformVariants.length);
      
      const availableSizesSet = new Set();
      
      // Approach 1: Try to find by uniformId
      let variants = uniformVariants.filter(variant => 
        variant.uniformId === uniform.uniformId
      );
      console.log('Variants found by uniformId:', variants.length);
      
      // Approach 2: If no variants found, try matching by uniform name
      if (variants.length === 0) {
        console.log('No variants found by ID, trying by name...');
        const matchingUniform = uniforms.find(u => u.id === uniform.uniformId);
        console.log('Matching uniform:', matchingUniform);
        
        if (matchingUniform) {
          variants = uniformVariants.filter(variant => 
            variant.uniformId === matchingUniform.id
          );
          console.log('Variants found by matching uniform:', variants.length);
        }
      }
      
      // Approach 3: If still no variants, check if uniformVariants have the data we need
      if (variants.length === 0) {
        console.log('Still no variants, checking all variants...');
        console.log('Sample variant:', uniformVariants[0]);
      }
      
      // Extract sizes and track stock quantities
      const stockInfo = {};
      
      variants.forEach(variant => {
        console.log('Processing variant:', variant.id);
        console.log('Variant color:', variant.color);
        console.log('Variant sizes:', variant.sizes);
        
        if (variant.sizes && Array.isArray(variant.sizes)) {
          variant.sizes.forEach((sizeObj) => {
            if (sizeObj.size) {
              const quantity = parseInt(sizeObj.quantity) || 0;
              
              // Track the total stock for this size across all variants
              if (!stockInfo[sizeObj.size]) {
                stockInfo[sizeObj.size] = 0;
              }
              stockInfo[sizeObj.size] += quantity;
              
              // Add ALL sizes, regardless of stock
              availableSizesSet.add(sizeObj.size);
              
              if (quantity > 0) {
                console.log('✅ Added size with stock:', sizeObj.size, '(quantity:', quantity, ')');
              } else {
                console.log('⚠️ Added size with NO stock:', sizeObj.size, '(quantity:', quantity, ')');
              }
            }
          });
        }
      });
      
      setSizeStockInfo(stockInfo);
      console.log('Stock info by size:', stockInfo);
      
      const sizes = Array.from(availableSizesSet).sort();
      console.log('Final available sizes (with stock):', sizes);
      console.log('=== END DEBUG ===');
      
      setAvailableSizes(sizes);
      
      if (sizes.length > 0) {
        // Select first size with stock if available, otherwise first size
        const firstSizeWithStock = sizes.find(size => stockInfo[size] > 0);
        setSelectedSize(firstSizeWithStock || sizes[0]);
      }
    } catch (error) {
      console.error('Error loading sizes:', error);
      Alert.alert('Error', 'Failed to load available sizes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!student || !uniform) return;

    // Validation
    const quantity = parseInt(quantityReceived);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid quantity');
      return;
    }

    if (!sizeNotAvailable && !selectedSize) {
      Alert.alert('Size Required', 'Please select a size or mark as unavailable');
      return;
    }

    if (sizeNotAvailable && !sizeWanted.trim()) {
      Alert.alert('Size Wanted Required', 'Please enter the wanted size');
      return;
    }

    // Check if selected size has no stock and warn user
    if (!sizeNotAvailable && selectedSize) {
      const stock = sizeStockInfo[selectedSize] || 0;
      if (stock === 0) {
        Alert.alert(
          'Out of Stock',
          `Size ${selectedSize} currently has no stock. Are you sure you want to log this uniform as received?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue Anyway', onPress: () => saveUniformLog() }
          ]
        );
        return;
      }
    }

    // If validation passed or stock check not needed, save directly
    saveUniformLog();
  };

  const saveUniformLog = async () => {
    setSaving(true);
    try {
      const quantity = parseInt(quantityReceived);
      
      // If size is available, check and deduct from product inventory
      if (!sizeNotAvailable && selectedSize) {
        console.log('Checking product stock...', { uniformId: uniform.uniformId, size: selectedSize, quantity });
        
        const stockCheck = await checkProductStock(uniform.uniformId, selectedSize, quantity);
        console.log('Stock check result:', stockCheck);
        
        if (!stockCheck.available) {
          Alert.alert(
            'Out of Stock!',
            `Only ${stockCheck.currentStock} available. Please reorder from batch inventory.`,
            [{ text: 'OK' }]
          );
          setSaving(false);
          return;
        }
        
        // Deduct from product inventory
        await deductProductInventory(
          stockCheck.variantId,
          selectedSize,
          quantity,
          student.id,
          'mobile-user'
        );
        
        console.log('✅ Product inventory deducted successfully');
      }
      
      const logEntry = {
        uniformId: uniform.uniformId,
        uniformName: uniform.uniformName,
        uniformType: uniform.uniformType,
        quantityReceived: sizeNotAvailable ? 0 : quantity,
        sizeReceived: sizeNotAvailable ? null : selectedSize,
        sizeWanted: sizeNotAvailable ? sizeWanted.trim() : null,
        loggedAt: new Date().toISOString(),
        loggedBy: 'mobile-user'
      };

      console.log('Saving uniform log entry:', logEntry);
      await updateStudentUniformLog(student.id, logEntry);
      
      Alert.alert(
        'Success', 
        sizeNotAvailable ? 
          `Size request for ${sizeWanted} has been logged` :
          `Successfully logged ${quantity} ${uniform.uniformName}(s), Size ${selectedSize}`,
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error) {
      console.error('Error saving uniform log:', error);
      Alert.alert('Error', error.message || 'Failed to save uniform log entry');
    } finally {
      setSaving(false);
    }
  };

  if (!uniform) return null;

  const headerColor = student?.gender === 'Boys' ? ['#ef4444', '#991b1b'] : ['#ec4899', '#be185d'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        {/* Header */}
        <LinearGradient
          colors={headerColor}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 50,
            paddingHorizontal: 20,
            paddingBottom: 20
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 10,
                padding: 8,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
              Log Uniform
            </Text>
            <View style={{ width: 34 }} />
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              padding: 8,
              marginRight: 12
            }}>
              <Ionicons name="cube-outline" size={20} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 2 }}>
                {uniform.uniformName}
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
                For {student?.name}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ padding: 24 }}>
            {/* Quantity Section */}
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
                Quantity Received
              </Text>
              <TextInput
                value={quantityReceived}
                onChangeText={setQuantityReceived}
                placeholder="Enter quantity"
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#f9fafb'
                }}
                editable={!sizeNotAvailable}
              />
              {sizeNotAvailable && (
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                  Quantity set to 0 when size is not available
                </Text>
              )}
            </View>

            {/* Size Section */}
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
                Size Information
              </Text>
              
              {/* Size Not Available Toggle */}
              <TouchableOpacity
                onPress={() => setSizeNotAvailable(!sizeNotAvailable)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                  padding: 12,
                  backgroundColor: sizeNotAvailable ? '#fef3c7' : '#f3f4f6',
                  borderRadius: 12
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: sizeNotAvailable ? '#f59e0b' : '#9ca3af',
                  backgroundColor: sizeNotAvailable ? '#f59e0b' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  {sizeNotAvailable && <Ionicons name="checkmark" size={12} color="white" />}
                </View>
                <Ionicons name="warning-outline" size={16} color={sizeNotAvailable ? '#f59e0b' : '#9ca3af'} style={{ marginRight: 8 }} />
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: sizeNotAvailable ? '#92400e' : '#6b7280' 
                }}>
                  Size not available?
                </Text>
              </TouchableOpacity>

              {!sizeNotAvailable ? (
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Size Received
                  </Text>
                  {loading ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#ef4444" />
                      <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
                        Loading available sizes...
                      </Text>
                    </View>
                  ) : availableSizes.length > 0 ? (
                    <View style={{
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 12,
                      backgroundColor: '#f9fafb'
                    }}>
                      <Picker
                        selectedValue={selectedSize}
                        onValueChange={(itemValue) => {
                          console.log('Size selected:', itemValue);
                          setSelectedSize(itemValue);
                        }}
                        style={{ height: 50 }}
                        enabled={true}
                        mode="dropdown"
                      >
                        {availableSizes.map(size => {
                          const stock = sizeStockInfo[size] || 0;
                          const stockLabel = stock > 0 ? `(${stock} in stock)` : '(OUT OF STOCK)';
                          return (
                            <Picker.Item 
                              key={size} 
                              label={`Size ${size} ${stockLabel}`} 
                              value={size}
                              color={stock > 0 ? "#374151" : "#dc2626"}
                            />
                          );
                        })}
                      </Picker>
                    </View>
                  ) : (
                    <View style={{
                      padding: 16,
                      backgroundColor: '#fef2f2',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#fecaca'
                    }}>
                      <Text style={{ fontSize: 14, color: '#dc2626', textAlign: 'center' }}>
                        No sizes currently available in stock
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Size Wanted
                  </Text>
                  <TextInput
                    value={sizeWanted}
                    onChangeText={setSizeWanted}
                    placeholder="Enter the size the student needs"
                    style={{
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      backgroundColor: '#f9fafb'
                    }}
                  />
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                    This will be logged as a size request for future fulfillment
                  </Text>
                </View>
              )}
            </View>

            {/* Summary */}
            <View style={{
              backgroundColor: '#f0f9ff',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#bae6fd'
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#991b1b', marginBottom: 12 }}>
                Summary
              </Text>
              <Text style={{ fontSize: 14, color: '#991b1b', lineHeight: 20 }}>
                {sizeNotAvailable ? 
                  `Logging a size request for "${sizeWanted}" - no items will be marked as received.` :
                  `Logging ${quantityReceived} ${uniform.uniformName}(s) in size ${selectedSize} for ${student?.name}.`
                }
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={{
          padding: 20,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.08)'
        }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: saving ? '#9ca3af' : '#ef4444',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                  Saving...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                  {sizeNotAvailable ? 'Log Size Request' : 'Log Uniform Received'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LogUniformModal;
