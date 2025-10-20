import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, Modal } from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { formatDate } from '../utils/dateUtils';
import { useSchoolStore } from '../../configuration/schoolStore';
import { useInventoryStore } from '../../configuration/inventoryStore';
import LogUniformModal from '../components/ui/LogUniformModal';
import StudentDeficitReport from '../components/StudentDeficitReport';

const StudentDetailsScreen = ({ route, navigation }) => {
  const { studentId, schoolId } = route.params;
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [uniformRequirements, setUniformRequirements] = useState([]);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedUniform, setSelectedUniform] = useState(null);
  const [deficitReportVisible, setDeficitReportVisible] = useState(false);
  
  const { getStudentById, getSchoolById, getSchoolUniformPolicies } = useSchoolStore();
  const { uniforms } = useInventoryStore();

  useEffect(() => {
    loadStudentData();
  }, [studentId, schoolId]);

  const loadStudentData = async () => {
    try {
      // Get student data from students collection
      const studentData = await getStudentById(studentId);
      const schoolData = await getSchoolById(schoolId);
      
      setStudent(studentData);
      setSchool(schoolData);
      
      if (studentData && schoolData) {
        await calculateUniformRequirements(studentData, schoolData);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      Alert.alert('Error', 'Failed to load student information');
    }
  };

  const calculateUniformRequirements = async (studentData, schoolData) => {
    const policies = await getSchoolUniformPolicies(schoolData.id, studentData.level, studentData.gender);
    const studentLog = studentData.uniformLog || [];
    
    const requirements = policies.map(policy => {
      // Calculate received quantity for this uniform
      const receivedEntries = studentLog.filter(log => log.uniformId === policy.uniformId);
      const receivedQuantity = receivedEntries.reduce((sum, log) => sum + (log.quantityReceived || 0), 0);
      
      // Get pending requests (size not available)
      const pendingRequests = receivedEntries.filter(log => log.sizeWanted && !log.sizeReceived);
      
      return {
        ...policy,
        receivedQuantity,
        remainingQuantity: Math.max(0, policy.quantityPerStudent - receivedQuantity),
        status: receivedQuantity >= policy.quantityPerStudent ? 'complete' : 
                receivedQuantity > 0 ? 'partial' : 'pending',
        logEntries: receivedEntries,
        pendingRequests
      };
    });
    
    setUniformRequirements(requirements);
  };

  const handleLogUniform = (requirement) => {
    setSelectedUniform(requirement);
    setLogModalVisible(true);
  };

  const handleLogComplete = () => {
    setLogModalVisible(false);
    setSelectedUniform(null);
    loadStudentData(); // Refresh data
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return '#10b981';
      case 'partial': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete': return 'checkmark-circle-outline';
      case 'partial': return 'time-outline';
      default: return 'alert-circle-outline';
    }
  };

  const renderUniformRequirement = (requirement) => {
    const statusIconName = getStatusIcon(requirement.status);
    const statusColor = getStatusColor(requirement.status);
    
    return (
      <View key={requirement.id} style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: requirement.status === 'complete' ? '#d1fae5' : 
                     requirement.status === 'partial' ? '#fef3c7' : '#fee2e2',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            backgroundColor: statusColor,
            borderRadius: 12,
            padding: 8,
            marginRight: 12
          }}>
            <Ionicons name={statusIconName} size={20} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.cardForeground, marginBottom: 2 }}>
              {requirement.uniformName}
            </Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
              {requirement.isRequired ? 'Required' : 'Optional'} • {requirement.uniformType}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: statusColor }}>
              {requirement.receivedQuantity} of {requirement.quantityPerStudent}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, textTransform: 'capitalize' }}>
              {requirement.status}
            </Text>
          </View>
        </View>

        {/* Log Entries */}
        {requirement.logEntries.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.cardForeground, marginBottom: 8 }}>
              Uniform History:
            </Text>
            {requirement.logEntries.map((log, index) => (
              <View key={index} style={{
                backgroundColor: colors.muted,
                borderRadius: 8,
                padding: 12,
                marginBottom: 4,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                  {log.sizeReceived ? 
                    `Received ${log.quantityReceived}, Size ${log.sizeReceived}` :
                    `Requested Size ${log.sizeWanted} (Not Available)`
                  }
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                  {formatDate(log.loggedAt)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Pending Requests */}
        {requirement.pendingRequests.length > 0 && (
          <View style={{
            backgroundColor: colors.accent,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12
          }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 4 }}>
              Pending Size Requests:
            </Text>
            {requirement.pendingRequests.map((request, index) => (
              <Text key={index} style={{ fontSize: 13, color: '#92400e' }}>
                • Size {request.sizeWanted}
              </Text>
            ))}
          </View>
        )}

        {/* Action Button */}
        {requirement.remainingQuantity > 0 && (
          <TouchableOpacity
            onPress={() => handleLogUniform(requirement)}
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
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginRight: 8 }}>
              Log Received Uniform
            </Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!student || !school) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 18, color: colors.mutedForeground }}>Loading student details...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{ 
            paddingHorizontal: 20, 
            paddingTop: 50, 
            paddingBottom: 20,
            backgroundColor: colors.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: 12,
                  padding: 10,
                  marginRight: 12
                }}
              >
                <Ionicons name="arrow-back" size={22} color="white" />
              </TouchableOpacity>
              <Text style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: 15, fontWeight: '600' }}>
                Back to Students
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => setDeficitReportVisible(true)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: 12,
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Ionicons name="alert-circle-outline" size={20} color="white" />
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>
                Deficit Report
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: 16,
              padding: 14,
              marginRight: 16
            }}>
              <Ionicons name="person" size={36} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 4, letterSpacing: 0.3 }}>
                {student.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Ionicons name="location-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, marginLeft: 4 }}>
                  {school.name} • {student.level} Level
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, marginLeft: 4 }}>
                  {student.gender} • Form {student.form || student.grade || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Uniform Requirements */}
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ 
              backgroundColor: '#ec4899', 
              borderRadius: 10, 
              padding: 8, 
              marginRight: 12 
            }}>
              <Ionicons name="shirt" size={20} color="white" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
              👕 Uniform Requirements
            </Text>
          </View>
          
          {uniformRequirements.length > 0 ? (
            uniformRequirements.map(renderUniformRequirement)
          ) : (
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 32,
              alignItems: 'center'
            }}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.cardForeground, marginBottom: 8 }}>
                No Uniform Policy
              </Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                No uniform requirements have been set for {student.level} level {student.gender} students.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Log Uniform Modal */}
      <LogUniformModal
        visible={logModalVisible}
        onClose={() => setLogModalVisible(false)}
        student={student}
        uniform={selectedUniform}
        onComplete={handleLogComplete}
      />

      {/* Deficit Report Modal */}
      <Modal
        visible={deficitReportVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <StudentDeficitReport
          student={student}
          school={school}
          onClose={() => setDeficitReportVisible(false)}
        />
      </Modal>
    </View>
  );
};

export default StudentDetailsScreen;
