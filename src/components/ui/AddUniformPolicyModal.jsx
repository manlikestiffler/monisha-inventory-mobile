import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { useInventoryStore } from '../../../configuration/inventoryStore';
import { useSchoolStore } from '../../../configuration/schoolStore';

export default function AddUniformPolicyModal({ 
  visible, 
  onClose, 
  schoolId, 
  gender, 
  level 
}) {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { uniforms, uniformVariants, fetchProducts } = useInventoryStore();
  const { updateSchoolUniformPolicy } = useSchoolStore();
  
  const [availableUniforms, setAvailableUniforms] = useState([]);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchProducts();
      loadAvailableUniforms();
    }
  }, [visible, schoolId, gender]);

  const loadAvailableUniforms = () => {
    // Filter uniforms that match the school, gender, and level criteria
    const filtered = uniforms.filter(uniform => {
      // Check if uniform is for this school (assuming schoolId is stored in uniform)
      const matchesSchool = !uniform.schoolId || uniform.schoolId === schoolId;
      
      // Check gender compatibility - handle case sensitivity
      const uniformGender = uniform.gender?.toLowerCase();
      const targetGender = gender?.toLowerCase();
      const matchesGender = uniformGender === targetGender || 
                           uniformGender === 'unisex' || 
                           uniformGender === 'male' && targetGender === 'boys' ||
                           uniformGender === 'female' && targetGender === 'girls' ||
                           !uniform.gender;
      
      // Check level compatibility - handle case sensitivity
      const uniformLevel = uniform.level?.toUpperCase();
      const targetLevel = level?.toUpperCase();
      const matchesLevel = uniformLevel === targetLevel || !uniform.level;
      
      return matchesSchool && matchesGender && matchesLevel;
    });
    
    console.log('Filtering uniforms:', {
      totalUniforms: uniforms.length,
      filteredCount: filtered.length,
      schoolId,
      gender,
      level,
      sampleUniform: uniforms[0]
    });
    
    setAvailableUniforms(filtered);
  };

  const handleUniformSelect = (uniform) => {
    const existingIndex = selectedPolicies.findIndex(p => p.uniformId === uniform.id);
    
    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedPolicies(prev => prev.filter(p => p.uniformId !== uniform.id));
    } else {
      // Add new policy
      const newPolicy = {
        uniformId: uniform.id,
        uniformName: uniform.name,
        uniformType: uniform.type,
        isRequired: false,
        quantityPerStudent: 1,
        level: level,
        gender: gender
      };
      setSelectedPolicies(prev => [...prev, newPolicy]);
    }
  };

  const updatePolicy = (uniformId, field, value) => {
    setSelectedPolicies(prev => 
      prev.map(policy => 
        policy.uniformId === uniformId 
          ? { ...policy, [field]: value }
          : policy
      )
    );
  };

  const handleSavePolicy = async () => {
    if (selectedPolicies.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one uniform item to create a policy.');
      return;
    }

    setLoading(true);
    try {
      // Save each policy to the school document
      for (const policy of selectedPolicies) {
        await updateSchoolUniformPolicy(schoolId, policy);
      }
      
      Alert.alert(
        'Policy Saved', 
        `Successfully added ${selectedPolicies.length} uniform policy items for ${gender} ${level} level.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save uniform policy. Please try again.');
      console.error('Error saving uniform policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUniformSelected = (uniformId) => {
    return selectedPolicies.some(p => p.uniformId === uniformId);
  };

  const getSelectedPolicy = (uniformId) => {
    return selectedPolicies.find(p => p.uniformId === uniformId);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Compact Header */}
        <LinearGradient
          colors={gender === 'Boys' ? ['#ef4444', '#991b1b'] : ['#ec4899', '#be185d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 50,
            paddingHorizontal: 20,
            paddingBottom: 20
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
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
              Create Policy
            </Text>
            <View style={{ width: 34 }} />
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              padding: 8,
              marginRight: 12
            }}>
              <Text style={{ 
                fontSize: 20,
                fontWeight: '800'
              }}>
                {gender === 'Boys' ? '👦' : '👧'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 2 }}>
                {gender} Uniforms
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
                {level} Level Policy
              </Text>
            </View>
          </View>
          
          {/* Compact Progress Indicator */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 10,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, fontWeight: '600', marginRight: 8 }}>
              STEP 1 OF 2
            </Text>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>
              Select Uniform Items
            </Text>
          </View>
        </LinearGradient>

        {/* Enhanced Content */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ padding: 24 }}>
            {/* Selection Summary */}
            {selectedPolicies.length > 0 && (
              <View style={{
                backgroundColor: colors.secondary,
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: '#ef4444'
              }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#991b1b', marginBottom: 8 }}>
                  Selected Items ({selectedPolicies.length})
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                  {selectedPolicies.filter(p => p.isRequired).length} required • {selectedPolicies.filter(p => !p.isRequired).length} optional
                </Text>
              </View>
            )}
            
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground, marginBottom: 20 }}>
              Available Uniform Items
            </Text>
            
            {availableUniforms.length === 0 ? (
              <View style={{
                backgroundColor: colors.muted,
                borderRadius: 20,
                padding: 40,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderStyle: 'dashed'
              }}>
                <View style={{
                  backgroundColor: colors.secondary,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#9ca3af' }}>📋</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.cardForeground, marginBottom: 8 }}>
                  No Uniforms Available
                </Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 }}>
                  No uniform items found for {gender} students at {level} level.
                </Text>
              </View>
            ) : (
              availableUniforms.map((uniform) => {
                const isSelected = isUniformSelected(uniform.id);
                const policy = getSelectedPolicy(uniform.id);
                
                return (
                  <View
                    key={uniform.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 20,
                      marginBottom: 20,
                      borderWidth: isSelected ? 3 : 1,
                      borderColor: isSelected ? (gender === 'Boys' ? '#ef4444' : '#ec4899') : '#e5e7eb',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 12,
                      elevation: 6,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Uniform Header */}
                    <TouchableOpacity
                      onPress={() => handleUniformSelect(uniform)}
                      activeOpacity={0.9}
                      style={{
                        backgroundColor: isSelected ? (gender === 'Boys' ? '#ef4444' : '#ec4899') : colors.muted,
                        padding: 20,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      <View style={{
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : colors.secondary,
                        borderRadius: 16,
                        padding: 12,
                        marginRight: 16,
                        width: 48,
                        height: 48,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Text style={{ 
                          color: isSelected ? 'white' : colors.mutedForeground,
                          fontSize: 18,
                          fontWeight: '800'
                        }}>
                          {uniform.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          fontSize: 18, 
                          fontWeight: '800', 
                          color: isSelected ? 'white' : colors.foreground,
                          marginBottom: 4
                        }}>
                          {uniform.name}
                        </Text>
                        <Text style={{ 
                          fontSize: 14, 
                          color: isSelected ? 'rgba(255, 255, 255, 0.8)' : colors.mutedForeground,
                          fontWeight: '500'
                        }}>
                          {uniform.type} • {uniform.gender || 'Unisex'}
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : colors.secondary,
                        borderRadius: 12,
                        padding: 8,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isSelected ? (
                          <Ionicons name="checkmark" size={20} color="white" />
                        ) : (
                          <Ionicons name="add" size={20} color={colors.mutedForeground} />
                        )}
                      </View>
                    </TouchableOpacity>
                    
                    {isSelected && policy && (
                      <View style={{
                        backgroundColor: colors.muted,
                        padding: 24
                      }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 20 }}>
                          Policy Configuration
                        </Text>
                        
                        {/* Required Toggle */}
                        <TouchableOpacity
                          onPress={() => updatePolicy(uniform.id, 'isRequired', !policy.isRequired)}
                          style={{
                            backgroundColor: colors.card,
                            borderRadius: 16,
                            padding: 20,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: policy.isRequired ? '#10b981' : '#e5e7eb',
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                        >
                          <View style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            backgroundColor: policy.isRequired ? '#10b981' : colors.card,
                            borderWidth: 2,
                            borderColor: policy.isRequired ? '#10b981' : '#d1d5db',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 16
                          }}>
                            {policy.isRequired && <Ionicons name="checkmark" size={14} color="white" />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.cardForeground, marginBottom: 2 }}>
                              Required Uniform
                            </Text>
                            <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                              Students must have this item
                            </Text>
                          </View>
                        </TouchableOpacity>
                        
                        {/* Quantity Input */}
                        <View style={{
                          backgroundColor: colors.card,
                          borderRadius: 16,
                          padding: 20,
                          borderWidth: 1,
                          borderColor: '#e5e7eb'
                        }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.cardForeground, marginBottom: 12 }}>
                            Quantity per Student
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                              onPress={() => {
                                const newQty = Math.max(1, policy.quantityPerStudent - 1);
                                updatePolicy(uniform.id, 'quantityPerStudent', newQty);
                              }}
                              style={{
                                backgroundColor: colors.secondary,
                                borderRadius: 12,
                                padding: 12,
                                marginRight: 16
                              }}
                            >
                              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>-</Text>
                            </TouchableOpacity>
                            <View style={{
                              backgroundColor: colors.muted,
                              borderRadius: 12,
                              paddingHorizontal: 20,
                              paddingVertical: 12,
                              borderWidth: 2,
                              borderColor: '#e2e8f0',
                              minWidth: 60,
                              alignItems: 'center'
                            }}>
                              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.cardForeground }}>
                                {policy.quantityPerStudent}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                const newQty = policy.quantityPerStudent + 1;
                                updatePolicy(uniform.id, 'quantityPerStudent', newQty);
                              }}
                              style={{
                                backgroundColor: gender === 'Boys' ? '#ef4444' : '#ec4899',
                                borderRadius: 12,
                                padding: 12,
                                marginLeft: 16
                              }}
                            >
                              <Text style={{ fontSize: 18, fontWeight: '700', color: 'white' }}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Enhanced Footer */}
        {selectedPolicies.length > 0 && (
          <View style={{
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            paddingHorizontal: 24,
            paddingVertical: 20,
            paddingBottom: 40
          }}>
            {/* Progress Indicator */}
            <View style={{
              backgroundColor: colors.muted,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20
            }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                STEP 2 OF 2
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
                Ready to Save Policy
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={handleSavePolicy}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <LinearGradient
                colors={gender === 'Boys' ? ['#ef4444', '#991b1b'] : ['#ec4899', '#be185d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: gender === 'Boys' ? '#ef4444' : '#ec4899',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8
                }}
              >
                {loading ? (
                  <>
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      borderTopColor: 'white',
                      marginRight: 12
                    }} />
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>
                      Saving Policy...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={24} color="white" style={{ marginRight: 12 }} />
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>
                      Save {selectedPolicies.length} Policy Items
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}
