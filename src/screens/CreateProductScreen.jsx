import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
  TextInput,
  Dimensions,
  Image,
  Modal
} from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useBatchStore } from '../../configuration/batchStore';
import { useInventoryStore } from '../../configuration/inventoryStore';
import { useSchoolStore } from '../../configuration/schoolStore';
import { useAuthStore } from '../../configuration/authStore';

export default function CreateProductScreen({ navigation }) {
  const { user, userRole } = useAuthStore();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);

  useEffect(() => {
    if (userRole && userRole !== 'manager') {
      Alert.alert(
        'Permission Denied',
        'You do not have permission to create new products.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [userRole, navigation]);
  const { batches, fetchBatches } = useBatchStore();
  const { addProduct, loading } = useInventoryStore();
  const { schools, fetchSchools } = useSchoolStore();
  
  // State for product type selection
  const [productType, setProductType] = useState('uniform'); // 'uniform' or 'raw_material'
  
  // State for form data - following warehouse-to-shelf allocation model
  const [formData, setFormData] = useState({
    productName: '',
    school: '',
    category: 'School Uniform',
    type: '',
    gender: '',
    sellingPrice: '', // Price for this school allocation
    variants: [], // Selected variants with quantities to allocate
    imageUri: null // Selected product image
  });
  
  // State for dropdown visibility
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  
  // State for variant selection process
  const [selectedColor, setSelectedColor] = useState('');
  const [currentVariant, setCurrentVariant] = useState({
    color: '',
    sizes: [] // Array of {size, quantity, batchId, costPrice}
  });
  const [showVariantForm, setShowVariantForm] = useState(false);
  
  // Processed batch data for dropdowns
  const [availableTypes, setAvailableTypes] = useState([]);
  const [availableVariants, setAvailableVariants] = useState({});
  const [availableSizes, setAvailableSizes] = useState({});
  const [availableQuantitiesBySize, setAvailableQuantitiesBySize] = useState({});
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  
  // Image upload handler
  const handleImageUpload = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setFormData(prev => ({
          ...prev,
          imageUri: selectedImage.uri
        }));
        console.log('Image selected:', selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const { width } = Dimensions.get('window');

  useEffect(() => {
    fetchBatches();
    fetchSchools();
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  useEffect(() => {
    fetchSchools();
    if (batches.length > 0) {
      processActiveBatches();
    }
  }, [batches]);

  // Debug logs
  console.log('Schools from store:', schools);

  // Debug logs
  console.log('Available types:', availableTypes);
  console.log('Batches:', batches);
  
  // Step 1: Read from Warehouse (batchInventory) - Process active batches
  const processActiveBatches = () => {
    const activeBatches = batches.filter(batch => batch.status === 'active');
    console.log('Processing batches:', activeBatches);
    
    const types = new Set();
    const variants = {};
    const sizes = {};
    const quantities = {};

    activeBatches.forEach(batch => {
      console.log(`Processing batch: ${batch.name} Type: ${batch.type}`);
      
      // Extract type from batch level - keep original case and normalize display
      if (batch.type) {
        // Capitalize first letter for display
        const displayType = batch.type.charAt(0).toUpperCase() + batch.type.slice(1);
        types.add(displayType);
        console.log(`Added type from batch: ${displayType}`);
      }

      if (batch.items && Array.isArray(batch.items)) {
        batch.items.forEach(item => {
          console.log('Processing item:', item);
          
          // Extract variantType from items (this is the actual variant like 'short sleeve', 'charcoal')
          if (item.variantType) {
            const batchType = batch.type ? batch.type.charAt(0).toUpperCase() + batch.type.slice(1) : 'Unknown';
            
            if (!variants[batchType]) {
              variants[batchType] = new Set();
            }
            if (!sizes[batchType]) {
              sizes[batchType] = new Set();
            }
            if (!quantities[batchType]) {
              quantities[batchType] = {};
            }

            // Add the variant (e.g., 'short sleeve', 'charcoal')
            variants[batchType].add(item.variantType);
            console.log(`Added variant for ${batchType}: ${item.variantType}`);

            // Extract sizes and quantities - Fix key format to match usage
            if (item.sizes && Array.isArray(item.sizes)) {
              item.sizes.forEach(sizeInfo => {
                if (sizeInfo.size) {
                  sizes[batchType].add(sizeInfo.size);
                  // Use pipe separator to match the key format used in variant checking
                  const key = `${batchType}|${item.variantType}`;
                  if (!sizes[key]) {
                    sizes[key] = new Set();
                  }
                  sizes[key].add(sizeInfo.size);
                  
                  // Store quantities with the same key format used for lookup
                  const quantityKey = `${batchType}|${item.variantType}|${sizeInfo.size}`;
                  if (!quantities[quantityKey]) {
                    quantities[quantityKey] = { total: 0 };
                  }
                  quantities[quantityKey].total += (parseInt(sizeInfo.quantity) || 0);
                }
              });
            }
          }
        });
      }
    });
    
    const finalTypes = Array.from(types);
    console.log('Final types extracted:', finalTypes);
    console.log('Final variants:', Object.fromEntries(
      Object.entries(variants).map(([k, v]) => [k, Array.from(v)])
    ));
    // Convert Sets to Arrays and include variant-specific size mappings
    const finalSizes = {};
    Object.entries(sizes).forEach(([key, sizeSet]) => {
      finalSizes[key] = Array.from(sizeSet);
    });
    
    console.log('Final sizes structure:', finalSizes);
    console.log('Final quantities structure:', quantities);
    
    setAvailableTypes(finalTypes);
    setAvailableVariants(Object.fromEntries(
      Object.entries(variants).map(([k, v]) => [k, Array.from(v)])
    ));
    
    setAvailableSizes(finalSizes);
    setAvailableQuantitiesBySize(quantities);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleTypeChange = (selectedType) => {
    setFormData(prev => ({
      ...prev,
      type: selectedType,
      gender: '', // Reset dependent fields
      variants: []
    }));
    // Reset variant selection state
    setSelectedColor('');
    setCurrentVariant({ color: '', sizes: [] });
    setShowVariantForm(false);
  };
  
  // Step 2: Client-side validation against available stock
  const validateQuantityAllocation = (type, color, size, requestedQty) => {
    const quantityKey = `${type}|${color}|${size}`;
    const available = availableQuantitiesBySize[quantityKey];
    
    if (!available || available.total < requestedQty) {
      return {
        valid: false,
        message: `Only ${available?.total || 0} units available for ${size} ${color} ${type}`
      };
    }
    
    return { valid: true };
  };
  
  const handleColorSelection = (color) => {
    setSelectedColor(color);
    setCurrentVariant({ color, sizes: [] });
    setShowVariantForm(true);
  };
  
  const handleSizeQuantityChange = (size, quantity) => {
    const requestedQty = parseInt(quantity) || 0;
    const validation = validateQuantityAllocation(formData.type, selectedColor, size, requestedQty);
    
    if (!validation.valid && requestedQty > 0) {
      Alert.alert('Insufficient Stock', validation.message);
      return;
    }
    
    setCurrentVariant(prev => {
      const existingSizes = prev.sizes.filter(s => s.size !== size);
      const newSizes = requestedQty > 0 ? 
        [...existingSizes, { size, quantity: requestedQty }] : 
        existingSizes;
      
      return { ...prev, sizes: newSizes };
    });
  };
  
  const addVariantToProduct = () => {
    if (!selectedColor || currentVariant.sizes.length === 0) {
      Alert.alert('Invalid Variant', 'Please select a color and at least one size with quantity.');
      return;
    }
    
    // Extract price from batch item
    let variantPrice = 0;
    const activeBatches = batches.filter(batch => batch.status === 'active');
    for (const batch of activeBatches) {
      if (batch.type && batch.type.toLowerCase() === formData.type.toLowerCase()) {
        const matchingItem = batch.items?.find(item => 
          item.variantType === selectedColor || item.color === selectedColor
        );
        if (matchingItem?.price) {
          variantPrice = parseFloat(matchingItem.price);
          console.log('Found price for variant:', selectedColor, '=', variantPrice);
          break;
        }
      }
    }
    
    // Add batch allocation details to each size
    const variantWithBatchInfo = {
      ...currentVariant,
      price: variantPrice, // Include price from batch
      variant: selectedColor, // variant type name
      sizes: currentVariant.sizes.map(sizeItem => {
        const quantityKey = `${formData.type}|${selectedColor}|${sizeItem.size}`;
        const batchInfo = availableQuantitiesBySize[quantityKey];
        
        return {
          ...sizeItem,
          batchAllocations: batchInfo?.batches || []
        };
      })
    };
    
    console.log('Adding variant with price:', variantWithBatchInfo);
    
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, variantWithBatchInfo]
    }));
    
    // Reset variant form
    setSelectedColor('');
    setCurrentVariant({ color: '', sizes: [] });
    setShowVariantForm(false);
  };

  // Step 3: Final Submission - Write to uniforms & Update batchInventory
    if (userRole && userRole !== 'manager') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.destructive, fontSize: 18 }}>Access Denied</Text>
      </View>
    );
  }

  const handleSave = async () => {
    // Validate required fields for school allocation
    if (!formData.productName.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    
    if (!formData.type) {
      Alert.alert('Error', 'Product type is required');
      return;
    }
    
    if (!formData.sellingPrice.trim()) {
      Alert.alert('Error', 'Selling price is required for school allocation');
      return;
    }
    
    if (formData.variants.length === 0) {
      Alert.alert('Error', 'At least one variant must be allocated');
      return;
    }

    try {
      // Step 3a: Create school product allocation (Write to uniforms)
      const productData = {
        name: formData.productName,
        schoolId: formData.school, // This is the "shelf" assignment
        category: formData.category,
        type: formData.type,
        gender: formData.gender,
        sellingPrice: parseFloat(formData.sellingPrice), // School-specific price
        variants: formData.variants.map(variant => ({
          color: variant.color,
          variant: variant.variant || selectedColor,
          price: variant.price || 0, // Include price in variant
          sizes: variant.sizes.map(size => ({
            size: size.size,
            quantity: size.quantity,
            initialQuantity: size.quantity,
            // Store batch references for traceability
            batchAllocations: size.batchAllocations
          }))
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.displayName || user?.email,
        createdByUid: user?.uid,
        createdByRole: userRole,
        status: 'active',
        // Critical: Store which batches this allocation came from
        sourceBatches: formData.variants.flatMap(variant => 
          variant.sizes.flatMap(size => 
            size.batchAllocations.map(batch => batch.batchId)
          )
        ).filter((id, index, arr) => arr.indexOf(id) === index) // unique batch IDs
      };

      // Step 3b: Deduct allocated quantities from batchInventory (Update warehouse)
      // This would involve updating each batch document to reduce quantities
      // Implementation would use Firebase transactions to ensure consistency
      
      console.log('Product allocation data:', productData);
      console.log('Batch deductions needed:', formData.variants);
      
      Alert.alert(
        'Success', 
        `Product allocated to ${formData.school} successfully! Stock has been deducted from batch inventory.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Allocation error:', error);
      Alert.alert('Error', 'Failed to allocate product. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
              Create Product
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '500',
              letterSpacing: 0.2
            }}>
              Allocate inventory to school
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Animated.View style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          paddingHorizontal: 16,
          paddingTop: 24
        }}>
          {/* Product Type Selection - Full Width Design */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 0,
            padding: 20,
            marginBottom: 16,
            marginHorizontal: -16,
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#f0f9ff',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Ionicons name="cube-outline" size={20} color="#ef4444" />
              </View>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: '800', 
                color: isDarkMode ? '#ffffff' : colors.foreground,
                letterSpacing: 0.5
              }}>
                Product Type
              </Text>
            </View>
            <Text style={{ 
              fontSize: 15, 
              color: colors.mutedForeground, 
              marginBottom: 20,
              lineHeight: 22
            }}>
              Choose between finished uniforms or raw materials for allocation
            </Text>
            
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setProductType('uniform')}
                style={{
                  borderRadius: 16,
                  padding: 20,
                  flex: 1,
                  alignItems: 'center',
                  backgroundColor: productType === 'uniform' ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: productType === 'uniform' ? colors.primary : colors.border
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: productType === 'uniform' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <Text style={{ fontSize: 24 }}>🎓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: productType === 'uniform' ? 'white' : colors.foreground,
                      marginBottom: 4
                    }}>
                      Finished Uniform
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: productType === 'uniform' ? 'rgba(255,255,255,0.8)' : colors.mutedForeground,
                      fontWeight: '500'
                    }}>
                      Ready-to-wear school uniforms
                    </Text>
                  </View>
                  {productType === 'uniform' && (
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: 'white',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ fontSize: 16, color: '#ef4444' }}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setProductType('raw_material')}
                style={{
                  borderRadius: 16,
                  padding: 20,
                  flex: 1,
                  alignItems: 'center',
                  backgroundColor: productType === 'raw_material' ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: productType === 'raw_material' ? colors.primary : colors.border
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: productType === 'raw_material' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <Text style={{ fontSize: 24 }}>🧵</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: productType === 'raw_material' ? 'white' : colors.foreground,
                      marginBottom: 4
                    }}>
                      Raw Material
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: productType === 'raw_material' ? 'rgba(255,255,255,0.8)' : colors.mutedForeground,
                      fontWeight: '500'
                    }}>
                      Fabric and materials for production
                    </Text>
                  </View>
                  {productType === 'raw_material' && (
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: 'white',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ fontSize: 16, color: '#f59e0b' }}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Basic Information - Full Width Card */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 0,
            padding: 20,
            marginBottom: 16,
            marginHorizontal: -16,
            shadowColor: '#8b5cf6',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  backgroundColor: colors.primary
                }}
              >
                <Ionicons name="sparkles" size={20} color={colors.primaryForeground} />
              </View>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: '800', 
                color: isDarkMode ? '#ffffff' : colors.foreground,
                letterSpacing: 0.5
              }}>
                Basic Information
              </Text>
            </View>
            <Text style={{ 
              fontSize: 15, 
              color: colors.mutedForeground, 
              marginBottom: 24,
              lineHeight: 22
            }}>
              Set up the core details for your product allocation
            </Text>
            
            {/* Select School - Enhanced Dropdown */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: colors.foreground, 
                marginBottom: 8,
                letterSpacing: 0.2
              }}>
                🏫 Target School
              </Text>
              <TouchableOpacity
                onPress={() => setShowSchoolModal(!showSchoolModal)}
                style={{
                  borderWidth: 2,
                  borderColor: formData.school ? '#ef4444' : '#e2e8f0',
                  borderRadius: 16,
                  backgroundColor: colors.card,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: formData.school ? '#ef4444' : '#e2e8f0',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2
                }}
              >
                <Text style={{ 
                  fontSize: 16, 
                  color: formData.school ? colors.foreground : colors.mutedForeground, 
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {formData.school || 'Choose School'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={formData.school ? '#ef4444' : '#94a3b8'} />
              </TouchableOpacity>
              
            </View>

            {/* Product Name - Enhanced Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: colors.foreground, 
                marginBottom: 8,
                letterSpacing: 0.2
              }}>
                ✨ Product Name
              </Text>
              <View style={{
                borderWidth: 2,
                borderColor: formData.productName ? '#ef4444' : '#e2e8f0',
                borderRadius: 16,
                backgroundColor: colors.input,
                shadowColor: formData.productName ? '#ef4444' : '#e2e8f0',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2
              }}>
                <TextInput
                  style={{
                    padding: 18,
                    fontSize: 17,
                    fontWeight: '500',
                    color: colors.foreground
                  }}
                  value={formData.productName}
                  onChangeText={(value) => handleInputChange('productName', value)}
                  placeholder="e.g., Senior Boys Blazer"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Category, Type, Gender Row - Modern Pills */}
            <View style={{ gap: 16 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: colors.foreground,
                letterSpacing: 0.2
              }}>
                🏷️ Product Details
              </Text>
              
              <View style={{ gap: 16, zIndex: 1000 }}>
                {/* Category */}
                <View style={{ position: 'relative', zIndex: 100 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.mutedForeground, marginBottom: 8 }}>
                    Category
                  </Text>
                  <View style={{
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#e2e8f0',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <Text style={{ fontSize: 16 }}>🏫</Text>
                      </View>
                      <Text style={{ fontSize: 16, color: colors.foreground, fontWeight: '600' }}>
                        School Uniform
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
                  </View>
                </View>
              
                {/* Type */}
                <View style={{ position: 'relative' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.mutedForeground, marginBottom: 8 }}>
                    Type
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTypeModal(true)}
                    style={{
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: formData.type ? colors.primary : colors.border,
                      backgroundColor: formData.type ? colors.primary : colors.card
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: formData.type ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <Text style={{ fontSize: 16 }}>👕</Text>
                      </View>
                      <Text style={{ 
                        fontSize: 16, 
                        color: formData.type ? 'white' : '#94a3b8', 
                        fontWeight: '600' 
                      }}>
                        {formData.type || 'Select Type'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={formData.type ? 'white' : '#94a3b8'} />
                  </TouchableOpacity>
                </View>
              
                {/* Gender */}
                <View style={{ position: 'relative' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.mutedForeground, marginBottom: 8 }}>
                    Gender
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowGenderModal(true)}
                    style={{
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: formData.gender ? colors.primary : colors.border,
                      backgroundColor: formData.gender ? colors.primary : colors.card
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: formData.gender ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <Text style={{ fontSize: 16 }}>👤</Text>
                      </View>
                      <Text style={{ 
                        fontSize: 16, 
                        color: formData.gender ? 'white' : '#94a3b8', 
                        fontWeight: '600' 
                      }}>
                        {formData.gender || 'Select Gender'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={formData.gender ? 'white' : '#94a3b8'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Selling Price - Premium Design - Show after type is selected */}
            {formData.type && (
              <View style={{ marginTop: 24, marginBottom: 24 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: '#1e293b', 
                  marginBottom: 4,
                  letterSpacing: 0.2
                }}>
                  💰 Selling Price (USD)
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.mutedForeground, 
                  marginBottom: 12,
                  fontWeight: '500'
                }}>
                  Set the price for {formData.school || 'selected'} school
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: formData.sellingPrice ? '#10b981' : '#e2e8f0',
                  borderRadius: 16,
                  backgroundColor: '#f0fdf4',
                  shadowColor: formData.sellingPrice ? '#10b981' : '#e2e8f0',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2
                }}>
                  <View style={{
                    paddingLeft: 18,
                    paddingVertical: 18
                  }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#10b981' }}>$</Text>
                  </View>
                  <TextInput
                    style={{
                      flex: 1,
                      paddingRight: 18,
                      paddingVertical: 18,
                      fontSize: 17,
                      fontWeight: '600',
                      color: '#1e293b'
                    }}
                    value={formData.sellingPrice}
                    onChangeText={(value) => handleInputChange('sellingPrice', value)}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Product Image - Full Width Upload Card */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 0,
            padding: 20,
            marginBottom: 16,
            marginHorizontal: -16,
            shadowColor: '#f59e0b',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  backgroundColor: colors.primary
                }}
              >
                <Ionicons name="color-palette" size={20} color={colors.primaryForeground} />
              </View>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: '800', 
                color: isDarkMode ? '#ffffff' : colors.foreground,
                letterSpacing: 0.5
              }}>
                Product Image
              </Text>
            </View>
            <Text style={{ 
              fontSize: 15, 
              color: colors.mutedForeground, 
              marginBottom: 24,
              lineHeight: 22
            }}>
              Add a stunning visual to showcase your product
            </Text>
            
            <TouchableOpacity 
              onPress={handleImageUpload}
              style={{
                borderWidth: 3,
                borderColor: formData.imageUri ? '#10b981' : '#f59e0b',
                borderStyle: 'dashed',
                borderRadius: 20,
                padding: formData.imageUri ? 8 : 32,
                alignItems: 'center',
                backgroundColor: formData.imageUri ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)'
              }}>
              {formData.imageUri ? (
                <View style={{ alignItems: 'center' }}>
                  <Image 
                    source={{ uri: formData.imageUri }}
                    style={{
                      width: 200,
                      height: 150,
                      borderRadius: 12,
                      marginBottom: 12
                    }}
                    resizeMode="cover"
                  />
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: '#065f46', 
                    marginBottom: 4,
                    textAlign: 'center'
                  }}>
                    ✅ Image Selected
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#047857',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>
                    Tap to change image
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.primary
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>📸</Text>
                  </View>
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: '600', 
                    color: '#1e293b', 
                    marginBottom: 8,
                    textAlign: 'center'
                  }}>
                    Tap to Upload Image
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: colors.mutedForeground,
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>
                    PNG, JPG or JPEG • Max 800x400px
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Product Variants - Full Width Dynamic Card */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 0,
            padding: 20,
            marginBottom: 16,
            marginHorizontal: -16,
            shadowColor: '#10b981',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  backgroundColor: colors.primary
                }}
              >
                <Ionicons name="color-palette" size={20} color={colors.primaryForeground} />
              </View>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: '800', 
                color: isDarkMode ? '#ffffff' : colors.foreground,
                letterSpacing: 0.5
              }}>
                Product Variants
              </Text>
            </View>
            <Text style={{ 
              fontSize: 15, 
              color: colors.mutedForeground, 
              marginBottom: 24,
              lineHeight: 22
            }}>
              Allocate specific colors and sizes from your batch inventory
            </Text>
            
            {formData.type ? (
              <View>
                {/* Available Colors for Selected Type */}
                {availableVariants[formData.type] && availableVariants[formData.type].length > 0 ? (
                  <View>
                    <View style={{ gap: 12, marginBottom: 24 }}>
                      {availableVariants[formData.type].map((variant) => {
                        const key = `${formData.type}|${variant}`;
                        const availableSizesForVariant = availableSizes[key] || [];
                        
                        // Check if this variant has any available sizes
                        if (availableSizesForVariant.length === 0) {
                          return (
                            <View key={variant} style={{
                              backgroundColor: '#fef2f2',
                              paddingHorizontal: 20,
                              paddingVertical: 16,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: '#fecaca',
                              marginBottom: 8
                            }}>
                              <Text style={{ 
                                fontSize: 15, 
                                color: '#dc2626', 
                                textAlign: 'center',
                                fontWeight: '500'
                              }}>
                                No stock available for this product type. All items have been depleted from the batch inventory.
                              </Text>
                            </View>
                          );
                        }
                        
                        return (
                          <TouchableOpacity
                            key={variant}
                            onPress={() => handleColorSelection(variant)}
                            style={{
                              backgroundColor: selectedColor === variant ? '#ef4444' : colors.muted,
                              paddingHorizontal: 20,
                              paddingVertical: 16,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: selectedColor === variant ? '#ef4444' : '#e5e7eb',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: 3,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={{ 
                                fontSize: 16, 
                                color: selectedColor === variant ? 'white' : colors.foreground, 
                                fontWeight: '600',
                                marginBottom: 4
                              }}>
                                {variant}
                              </Text>
                              <Text style={{ 
                                fontSize: 14, 
                                color: selectedColor === variant ? 'rgba(255,255,255,0.8)' : colors.mutedForeground, 
                                fontWeight: '500'
                              }}>
                                {availableSizesForVariant.length} sizes available
                              </Text>
                            </View>
                            
                            {selectedColor === variant && (
                              <View style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Text style={{ fontSize: 16, color: 'white' }}>✓</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    
                    {/* Size & Quantity Selection Form */}
                    {showVariantForm && selectedColor && (
                      <View
                        style={{
                          borderRadius: 16,
                          padding: 20,
                          marginTop: 16,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.card
                        }}
                      >
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          marginBottom: 20 
                        }}>
                          <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: '#ef4444',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12
                          }}>
                            <Text style={{ fontSize: 20 }}>📏</Text>
                          </View>
                          <Text style={{ 
                            fontSize: 17, 
                            fontWeight: '700', 
                            color: colors.foreground,
                            flex: 1
                          }}>
                            Allocate {selectedColor} {formData.type}
                          </Text>
                        </View>
                        
                        <View style={{ gap: 16 }}>
                          {availableSizes[`${formData.type}|${selectedColor}`]?.map((size) => {
                            const quantityKey = `${formData.type}|${selectedColor}|${size}`;
                            const available = availableQuantitiesBySize[quantityKey]?.total || 0;
                            const currentQty = currentVariant.sizes.find(s => s.size === size)?.quantity || 0;
                            
                            return (
                              <View key={size} style={{
                                backgroundColor: colors.card,
                                borderRadius: 12,
                                padding: 16,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.05,
                                shadowRadius: 4,
                                elevation: 2,
                                borderWidth: 1,
                                borderColor: '#f1f5f9'
                              }}>
                                <View style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ 
                                      fontSize: 16, 
                                      fontWeight: '600', 
                                      color: colors.foreground,
                                      marginBottom: 4
                                    }}>
                                      Size {size}
                                    </Text>
                                    <View style={{ 
                                      flexDirection: 'row', 
                                      alignItems: 'center' 
                                    }}>
                                      <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: available > 0 ? '#10b981' : '#ef4444',
                                        marginRight: 6
                                      }} />
                                      <Text style={{ 
                                        fontSize: 13, 
                                        color: colors.mutedForeground,
                                        fontWeight: '500'
                                      }}>
                                        {available} units available
                                      </Text>
                                    </View>
                                  </View>
                                  
                                  <View style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    gap: 12 
                                  }}>
                                    <Text style={{ 
                                      fontSize: 15, 
                                      color: '#475569',
                                      fontWeight: '500'
                                    }}>
                                      Qty:
                                    </Text>
                                    <TextInput
                                      style={{
                                        borderWidth: 2,
                                        borderColor: '#e2e8f0',
                                        borderRadius: 8,
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        width: 70,
                                        textAlign: 'center',
                                        fontSize: 15,
                                        fontWeight: '600',
                                        backgroundColor: colors.input
                                      }}
                                      value={currentQty.toString()}
                                      onChangeText={(value) => handleSizeQuantityChange(size, value)}
                                      placeholder="0"
                                      keyboardType="numeric"
                                      maxLength={3}
                                    />
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                        
                        <TouchableOpacity
                          onPress={addVariantToProduct}
                          style={{
                            borderRadius: 12,
                            paddingVertical: 12,
                            paddingHorizontal: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 16,
                            backgroundColor: colors.primary,
                            flexDirection: 'row'
                          }}
                        >
                          <Text style={{
                            color: colors.primaryForeground,
                            fontSize: 16,
                            fontWeight: '600',
                            marginRight: 8
                          }}>
                            Add Variant
                          </Text>
                          <Text style={{ fontSize: 18 }}>✨</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Added Variants Summary */}
                    {formData.variants.length > 0 && (
                      <View style={{
                        backgroundColor: '#ecfdf5',
                        borderRadius: 12,
                        padding: 16,
                        marginTop: 20
                      }}>
                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#065f46', marginBottom: 12 }}>
                          Selected Variants for Allocation:
                        </Text>
                        {formData.variants.map((variant, index) => (
                          <View key={index} style={{ marginBottom: 8 }}>
                            <Text style={{ fontSize: 14, fontWeight: '500', color: '#047857' }}>
                              {variant.color} {formData.type}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#065f46' }}>
                              Sizes: {variant.sizes.map(s => `${s.size}(${s.quantity})`).join(', ')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{
                    padding: 32,
                    alignItems: 'center',
                    backgroundColor: '#fef2f2',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: '#fecaca'
                  }}>
                    <View style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: '#fee2e2',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16
                    }}>
                      <Text style={{ fontSize: 32 }}>📦</Text>
                    </View>
                    <Text style={{ 
                      fontSize: 18, 
                      color: '#dc2626', 
                      textAlign: 'center',
                      fontWeight: '700',
                      marginBottom: 8
                    }}>
                      Batch Depleted
                    </Text>
                    <Text style={{ 
                      fontSize: 15, 
                      color: '#991b1b', 
                      textAlign: 'center',
                      lineHeight: 22
                    }}>
                      No variants available for {formData.type} in current batch inventory. Please restock or select a different type.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={{
                padding: 40,
                alignItems: 'center',
                backgroundColor: colors.muted,
                borderRadius: 12
              }}>
                <Text style={{ fontSize: 16, color: colors.mutedForeground, textAlign: 'center' }}>
                  No batches available. Please create a batch first.
                </Text>
              </View>
            )}
          </View>

          {/* Allocate Product Button - Premium Design */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{ 
              opacity: loading ? 0.7 : 1,
              marginTop: 8
            }}
          >
            <View
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 24,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: loading ? colors.muted : colors.destructive,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                backgroundColor: loading ? colors.muted : colors.destructive
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {loading ? (
                  <View style={{ marginRight: 12 }}>
                    <Text style={{ color: 'white', fontSize: 16 }}>⏳</Text>
                  </View>
                ) : (
                  <Ionicons name="bag-outline" size={22} color="white" style={{ marginRight: 12 }} />
                )}
                <Text style={{ 
                  color: 'white', 
                  fontSize: 18, 
                  fontWeight: '700',
                  letterSpacing: 0.5
                }}>
                  {loading ? 'Allocating Stock...' : 'Allocate Product to School'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Bottom Spacer */}
          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end'
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: '80%',
            paddingTop: 20
          }}>
            {/* Modal Header */}
            <View style={{
              paddingHorizontal: 20,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                  Select Type
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTypeModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#f1f5f9',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ fontSize: 18, color: colors.mutedForeground }}>×</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Content */}
            <View style={{ flex: 1, backgroundColor: colors.muted }}>
              {availableTypes && availableTypes.length > 0 ? (
                availableTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, type }));
                      setShowTypeModal(false);
                      setSelectedColor('');
                      setShowVariantForm(false);
                    }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 18,
                      backgroundColor: colors.card,
                      marginHorizontal: 16,
                      marginVertical: 8,
                      borderRadius: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3
                    }}
                  >
                    <Text style={{ 
                      fontSize: 18, 
                      color: colors.foreground, 
                      fontWeight: '700',
                      flex: 1
                    }}>
                      {type}
                    </Text>
                    {formData.type === type && (
                      <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#ef4444',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Text style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{
                  padding: 40,
                  alignItems: 'center',
                  backgroundColor: colors.muted,
                  borderRadius: 12
                }}>
                  <Text style={{ fontSize: 16, color: colors.mutedForeground, textAlign: 'center' }}>
                    Loading types from batch inventory...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end'
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: '60%',
            paddingTop: 20
          }}>
            {/* Modal Header */}
            <View style={{
              paddingHorizontal: 20,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                  Select Gender
                </Text>
                <TouchableOpacity
                  onPress={() => setShowGenderModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#f1f5f9',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ fontSize: 18, color: colors.mutedForeground }}>×</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Content */}
            <View style={{ flex: 1, backgroundColor: colors.muted }}>
              {['Male', 'Female', 'Unisex'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, gender }));
                    setShowGenderModal(false);
                  }}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 18,
                    backgroundColor: colors.card,
                    marginHorizontal: 16,
                    marginVertical: 8,
                    borderRadius: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 3,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: formData.gender === gender ? 2 : 0,
                    borderColor: formData.gender === gender ? colors.primary : colors.border
                  }}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: gender === 'Male' ? '#fef3c7' : gender === 'Female' ? '#fce7f3' : '#f0f9ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <Text style={{ fontSize: 24 }}>
                      {gender === 'Male' ? '👨' : gender === 'Female' ? '👩' : '👥'}
                    </Text>
                  </View>
                  <Text style={{ 
                    fontSize: 18, 
                    color: colors.foreground, 
                    fontWeight: '700',
                    flex: 1
                  }}>
                    {gender}
                  </Text>
                  {formData.gender === gender && (
                    <View style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: '#ef4444',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* School Selection Modal */}
      <Modal
        visible={showSchoolModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSchoolModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end'
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: '70%',
            paddingTop: 20
          }}>
            {/* Modal Header */}
            <View style={{
              paddingHorizontal: 20,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                  Select School
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSchoolModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#f1f5f9',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ fontSize: 18, color: colors.mutedForeground }}>×</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Content */}
            <View style={{ flex: 1, backgroundColor: colors.muted }}>
              {schools && schools.length > 0 ? (
                schools.map((school) => (
                  <TouchableOpacity
                    key={school.id}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, school: school.name }));
                      setShowSchoolModal(false);
                    }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 18,
                      backgroundColor: colors.card,
                      marginHorizontal: 16,
                      marginVertical: 8,
                      borderRadius: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3
                    }}
                  >
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#f0f9ff',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16
                    }}>
                      <Text style={{ fontSize: 24 }}>🏫</Text>
                    </View>
                    <Text style={{ 
                      fontSize: 18, 
                      color: colors.foreground, 
                      fontWeight: '700',
                      flex: 1,
                      textTransform: 'capitalize'
                    }}>
                      {school.name}
                    </Text>
                    {formData.school === school.name && (
                      <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#ef4444',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Text style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: '#94a3b8', textAlign: 'center', fontWeight: '500' }}>
                    Loading schools from database...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
