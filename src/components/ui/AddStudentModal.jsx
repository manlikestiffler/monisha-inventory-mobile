import React, { useState } from 'react';
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
import { useSchoolStore } from '../../../configuration/schoolStore';

const AddStudentModal = ({ visible, onClose, school, onComplete }) => {
  const [studentData, setStudentData] = useState({
    name: '',
    form: '',
    level: 'Junior',
    gender: 'Boys'
  });
  const [saving, setSaving] = useState(false);

  const { addStudent } = useSchoolStore();

  const resetForm = () => {
    setStudentData({
      name: '',
      form: '',
      level: 'Junior',
      gender: 'Boys'
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    // Validation
    if (!studentData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter the student name');
      return;
    }

    if (!studentData.form.trim()) {
      Alert.alert('Validation Error', 'Please enter the student form');
      return;
    }

    setSaving(true);
    try {
      const newStudent = {
        name: studentData.name.trim(),
        form: studentData.form.trim(),
        level: studentData.level,
        gender: studentData.gender,
        schoolId: school.id,
        uniformLog: [], // Initialize empty uniform log
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addStudent(newStudent);
      
      // Force refresh the parent component
      if (onComplete) {
        onComplete();
      }
      
      Alert.alert(
        'Success', 
        `${studentData.name} has been added to ${school.name}`,
        [{ text: 'OK', onPress: () => {
          handleClose();
        }}]
      );
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', 'Failed to add student. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderLevelSelector = () => (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
        Level
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {['Junior', 'Senior'].map(level => (
          <TouchableOpacity
            key={level}
            onPress={() => setStudentData(prev => ({ ...prev, level }))}
            style={{
              flex: 1,
              backgroundColor: studentData.level === level ? '#ef4444' : '#f3f4f6',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              marginRight: level === 'Junior' ? 8 : 0,
              marginLeft: level === 'Senior' ? 8 : 0
            }}
          >
            <Text style={{
              color: studentData.level === level ? 'white' : '#6b7280',
              fontSize: 14,
              fontWeight: '600'
            }}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGenderSelector = () => (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
        Gender
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {['Boys', 'Girls'].map(gender => (
          <TouchableOpacity
            key={gender}
            onPress={() => setStudentData(prev => ({ ...prev, gender }))}
            style={{
              flex: 1,
              backgroundColor: studentData.gender === gender ? 
                (gender === 'Boys' ? '#ef4444' : '#ec4899') : '#f3f4f6',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              marginRight: gender === 'Boys' ? 8 : 0,
              marginLeft: gender === 'Girls' ? 8 : 0
            }}
          >
            <Text style={{
              color: studentData.gender === gender ? 'white' : '#6b7280',
              fontSize: 14,
              fontWeight: '600'
            }}>
              {gender === 'Boys' ? '👦 Boys' : '👧 Girls'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        {/* Header */}
        <LinearGradient
          colors={['#ef4444', '#991b1b']}
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
              onPress={handleClose}
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
              Add Student
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
              <Ionicons name="person-outline" size={20} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 2 }}>
                New Student
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
                Add to {school?.name}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ padding: 24 }}>
            {/* Student Name */}
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
                Student Name
              </Text>
              <TextInput
                value={studentData.name}
                onChangeText={(text) => setStudentData(prev => ({ ...prev, name: text }))}
                placeholder="Enter full name"
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#f9fafb'
                }}
              />
            </View>

            {/* Form */}
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
                Form
              </Text>
              <TextInput
                value={studentData.form}
                onChangeText={(text) => setStudentData(prev => ({ ...prev, form: text }))}
                placeholder="Enter form (e.g., 1A, 2B, 3C, 4A, 5B, 6C)"
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#f9fafb'
                }}
              />
            </View>

            {/* Level and Gender Selectors */}
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
              {renderLevelSelector()}
              {renderGenderSelector()}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="school-outline" size={16} color="#991b1b" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, color: '#991b1b' }}>
                  {studentData.name || 'Student Name'} - Form {studentData.form || 'N/A'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="person-outline" size={16} color="#991b1b" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, color: '#991b1b' }}>
                  {studentData.level} Level • {studentData.gender}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: '#991b1b', marginTop: 8 }}>
                Will be enrolled at {school?.name}
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
                  Adding Student...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
                  Add Student
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AddStudentModal;
