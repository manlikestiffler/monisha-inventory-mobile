import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSchoolStore } from '../../../configuration/schoolStore';

const AddSchoolModal = ({ visible, onClose }) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { addSchool } = useSchoolStore();
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!schoolName.trim()) {
      Alert.alert('Error', 'Please enter a school name');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create school with minimal data structure
      const schoolData = {
        name: schoolName.trim(),
        status: 'active',
        uniformPolicy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addSchool(schoolData);
      
      // Reset form and close modal
      setSchoolName('');
      onClose();
      Alert.alert('Success', 'School added successfully!');
    } catch (error) {
      console.error('Error adding school:', error);
      Alert.alert('Error', 'Failed to add school. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSchoolName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
      }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.foreground
            }}>
              Add New School
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                padding: 4,
                borderRadius: 8
              }}
            >
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* School Name Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 8
            }}>
              School Name
            </Text>
            <TextInput
              value={schoolName}
              onChangeText={setSchoolName}
              placeholder="Enter school name"
              placeholderTextColor={colors.mutedForeground}
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: colors.foreground
              }}
              autoFocus={true}
              editable={!loading}
            />
          </View>

          {/* Action Buttons */}
          <View style={{
            flexDirection: 'row',
            gap: 12,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border
          }}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={loading}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                opacity: loading ? 0.5 : 1
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground
              }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={loading || !schoolName.trim()}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: colors.primary,
                alignItems: 'center',
                opacity: (loading || !schoolName.trim()) ? 0.5 : 1
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.primaryForeground
              }}>
                {loading ? 'Adding...' : 'Add School'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddSchoolModal;
