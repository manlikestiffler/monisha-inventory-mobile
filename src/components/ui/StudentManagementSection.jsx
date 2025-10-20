import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchoolStore } from '../../../configuration/schoolStore';
import UniformDeficitReport from './UniformDeficitReport';
import AddStudentModal from './AddStudentModal';

const StudentManagementSection = ({ school, students: studentsProp, navigation }) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const [students, setStudents] = useState(studentsProp || []);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list' or 'deficits'
  const [studentStats, setStudentStats] = useState({});
  const [addStudentModalVisible, setAddStudentModalVisible] = useState(false);

  const { getSchoolById, getSchoolUniformPolicies, deleteStudent } = useSchoolStore();

  // Update students when prop changes (real-time updates from Firebase)
  useEffect(() => {
    if (studentsProp) {
      setStudents(studentsProp);
      calculateStudentStats(studentsProp);
    }
  }, [studentsProp]);

  const calculateStudentStats = (studentData) => {
    const stats = {};
    const allPolicies = school.uniformPolicy || [];

    studentData.forEach(student => {
      const studentLog = student.uniformLog || [];
      const applicablePolicies = allPolicies.filter(policy => 
        policy.level === student.level && policy.gender === student.gender
      );

      let totalRequired = 0;
      let totalReceived = 0;
      let hasDeficit = false;

      applicablePolicies.forEach(policy => {
        totalRequired += policy.quantityPerStudent;
        const receivedEntries = studentLog.filter(log => log.uniformId === policy.uniformId);
        const received = receivedEntries.reduce((sum, log) => sum + (log.quantityReceived || 0), 0);
        totalReceived += received;
        
        if (received < policy.quantityPerStudent) {
          hasDeficit = true;
        }
      });

      // Fix: If no policies exist, student should show as "No Policy" not "Complete"
      let completionRate = 0;
      let status = 'pending';
      
      if (totalRequired === 0) {
        // No uniform policies for this student
        completionRate = 0;
        status = 'no-policy';
      } else {
        completionRate = Math.round((totalReceived / totalRequired) * 100);
        status = completionRate === 100 ? 'complete' : completionRate > 0 ? 'partial' : 'pending';
      }
      
      stats[student.id] = {
        totalRequired,
        totalReceived,
        completionRate,
        hasDeficit: totalRequired > 0 ? hasDeficit : false,
        status
      };
    });

    setStudentStats(stats);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'no-policy': return '#6b7280';
      default: return '#ef4444';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete': return 'checkmark-circle-outline';
      case 'partial': return 'time-outline';
      case 'no-policy': return 'person-outline';
      default: return 'alert-circle-outline';
    }
  };

  const handleDeleteStudent = (student) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}? This action cannot be undone and will remove all uniform logs for this student.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting student:', student.name, 'ID:', student.id);
              await deleteStudent(school.id, student.id);
              console.log('Student deleted successfully');
              
              Alert.alert('Success', `${student.name} has been deleted`);
              // Real-time listener will automatically update the list
            } catch (error) {
              console.error('Error deleting student:', error);
              Alert.alert('Error', 'Failed to delete student. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderStudent = (student) => {
    const stats = studentStats[student.id] || {};
    const statusIconName = getStatusIcon(stats.status);
    const statusColor = getStatusColor(stats.status);

    return (
      <TouchableOpacity
        key={student.id}
        onPress={() => navigation.navigate('StudentDetails', { 
          studentId: student.id, 
          schoolId: school.id 
        })}
        style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: statusColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            backgroundColor: `${statusColor}20`,
            borderRadius: 8,
            padding: 8,
            marginRight: 12
          }}>
            <Ionicons name={statusIconName} size={18} color={statusColor} />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '700', 
              color: colors.cardForeground, 
              marginBottom: 4
            }}>
              {student.name}
            </Text>
            
            <Text style={{ 
              fontSize: 14, 
              color: colors.mutedForeground, 
              marginBottom: 6
            }}>
              {student.level} • {student.gender} • Form {student.form || student.grade || 'N/A'}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                {stats.status === 'no-policy' ? 'No uniform policy' : 
                 `${stats.totalReceived || 0} of ${stats.totalRequired || 0} items`}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: statusColor,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  marginRight: 8
                }}>
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: '600', 
                    color: 'white',
                    textTransform: 'uppercase'
                  }}>
                    {stats.status === 'no-policy' ? 'No Policy' : 
                     stats.status === 'complete' ? 'Complete' :
                     stats.status === 'partial' ? 'Partial' : 'Pending'}
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteStudent(student);
                  }}
                  style={{
                    backgroundColor: '#fef2f2',
                    borderRadius: 6,
                    padding: 6
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 16 }}>
          Loading students...
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Summary Card */}
      <View style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 6
      }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Ionicons name="person-outline" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 8 }}>
            {students.length.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 16, color: colors.mutedForeground, marginBottom: 16 }}>
            Total Students Enrolled
          </Text>
        </View>

        {/* View Toggle */}
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: colors.muted,
          borderRadius: 12,
          padding: 4,
          marginBottom: 16
        }}>
          <TouchableOpacity
            onPress={() => setActiveView('list')}
            style={{
              flex: 1,
              backgroundColor: activeView === 'list' ? colors.card : 'transparent',
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="person-outline" size={16} color={activeView === 'list' ? '#ef4444' : '#6b7280'} style={{ marginRight: 8 }} />
            <Text style={{ 
              color: activeView === 'list' ? '#ef4444' : '#6b7280', 
              fontSize: 14, 
              fontWeight: '600' 
            }}>
              Student List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveView('deficits')}
            style={{
              flex: 1,
              backgroundColor: activeView === 'deficits' ? colors.card : 'transparent',
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="bar-chart-outline" size={16} color={activeView === 'deficits' ? '#ef4444' : '#6b7280'} style={{ marginRight: 8 }} />
            <Text style={{ 
              color: activeView === 'deficits' ? '#ef4444' : '#6b7280', 
              fontSize: 14, 
              fontWeight: '600' 
            }}>
              Deficit Report
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Student Button */}
        <TouchableOpacity
          onPress={() => setAddStudentModalVisible(true)}
          style={{
            backgroundColor: '#ef4444',
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="add" size={18} color="white" style={{ marginRight: 8 }} />
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
            Add New Student
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeView === 'list' ? (
        <View>
          {students.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {students.map(renderStudent)}
            </ScrollView>
          ) : (
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 32,
              alignItems: 'center'
            }}>
              <Ionicons name="person-outline" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.cardForeground, marginBottom: 8 }}>
                No Students Found
              </Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                No students have been enrolled in this school yet.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <UniformDeficitReport school={school} />
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        visible={addStudentModalVisible}
        onClose={() => setAddStudentModalVisible(false)}
        school={school}
        onComplete={async () => {
          // Real-time listener will automatically update the students list
          setAddStudentModalVisible(false);
        }}
      />
    </View>
  );
};

export default StudentManagementSection;
