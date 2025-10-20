import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchoolStore } from '../../../configuration/schoolStore';

const UniformDeficitReport = ({ school }) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const [loading, setLoading] = useState(false);
  const [deficitData, setDeficitData] = useState({
    uniformDeficits: [],
    sizeRequests: [],
    totalStudents: 0,
    studentsWithDeficits: 0
  });

  const { getStudentsBySchool, getSchoolUniformPolicies } = useSchoolStore();

  useEffect(() => {
    if (school) {
      generateDeficitReport();
    }
  }, [school]);

  const generateDeficitReport = async () => {
    setLoading(true);
    try {
      // Get all students for this school
      const students = await getStudentsBySchool(school.id);
      
      // Get school uniform policies
      const allPolicies = school.uniformPolicy || [];
      
      const uniformDeficits = [];
      const sizeRequests = [];
      let studentsWithDeficits = 0;

      // Group policies by uniform for easier processing
      const uniformGroups = {};
      allPolicies.forEach(policy => {
        const key = `${policy.uniformId}-${policy.level}-${policy.gender}`;
        if (!uniformGroups[key]) {
          uniformGroups[key] = policy;
        }
      });

      // Process each student
      students.forEach(student => {
        const studentLog = student.uniformLog || [];
        let studentHasDeficit = false;

        // Check each uniform requirement for this student
        Object.values(uniformGroups).forEach(policy => {
          // Skip if policy doesn't apply to this student
          if (policy.level !== student.level || policy.gender !== student.gender) {
            return;
          }

          // Calculate received vs required
          const receivedEntries = studentLog.filter(log => log.uniformId === policy.uniformId);
          const receivedQuantity = receivedEntries.reduce((sum, log) => sum + (log.quantityReceived || 0), 0);
          const deficit = Math.max(0, policy.quantityPerStudent - receivedQuantity);

          if (deficit > 0) {
            studentHasDeficit = true;
            
            // Find or create uniform deficit entry
            let uniformDeficit = uniformDeficits.find(ud => 
              ud.uniformId === policy.uniformId && 
              ud.level === policy.level && 
              ud.gender === policy.gender
            );
            
            if (!uniformDeficit) {
              uniformDeficit = {
                uniformId: policy.uniformId,
                uniformName: policy.uniformName,
                uniformType: policy.uniformType,
                level: policy.level,
                gender: policy.gender,
                totalDeficit: 0,
                studentsAffected: []
              };
              uniformDeficits.push(uniformDeficit);
            }
            
            uniformDeficit.totalDeficit += deficit;
            uniformDeficit.studentsAffected.push({
              id: student.id,
              name: student.name,
              deficit: deficit
            });
          }

          // Check for size requests
          receivedEntries.forEach(log => {
            if (log.sizeWanted && !log.sizeReceived) {
              let sizeRequest = sizeRequests.find(sr => 
                sr.uniformId === policy.uniformId && 
                sr.sizeWanted === log.sizeWanted
              );
              
              if (!sizeRequest) {
                sizeRequest = {
                  uniformId: policy.uniformId,
                  uniformName: policy.uniformName,
                  sizeWanted: log.sizeWanted,
                  students: []
                };
                sizeRequests.push(sizeRequest);
              }
              
              if (!sizeRequest.students.find(s => s.id === student.id)) {
                sizeRequest.students.push({
                  id: student.id,
                  name: student.name,
                  requestedAt: log.loggedAt
                });
              }
            }
          });
        });

        if (studentHasDeficit) {
          studentsWithDeficits++;
        }
      });

      setDeficitData({
        uniformDeficits: uniformDeficits.sort((a, b) => b.totalDeficit - a.totalDeficit),
        sizeRequests: sizeRequests.sort((a, b) => a.uniformName.localeCompare(b.uniformName)),
        totalStudents: students.length,
        studentsWithDeficits
      });

    } catch (error) {
      console.error('Error generating deficit report:', error);
      Alert.alert('Error', 'Failed to generate deficit report');
    } finally {
      setLoading(false);
    }
  };

  const renderUniformDeficit = (deficit) => (
    <View key={`${deficit.uniformId}-${deficit.level}-${deficit.gender}`} style={{
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          backgroundColor: colors.secondary,
          borderRadius: 8,
          padding: 8,
          marginRight: 12
        }}>
          <Ionicons name="cube-outline" size={18} color="#ef4444" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.cardForeground, marginBottom: 2 }}>
            {deficit.uniformName}
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
            {deficit.level} • {deficit.gender} • {deficit.uniformType}
          </Text>
        </View>
        <View style={{
          backgroundColor: '#ef4444',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 6
        }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>
            {deficit.totalDeficit}
          </Text>
        </View>
      </View>

      <View style={{
        backgroundColor: colors.muted,
        borderRadius: 8,
        padding: 12
      }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#dc2626', marginBottom: 8 }}>
          {deficit.studentsAffected.length} Student{deficit.studentsAffected.length !== 1 ? 's' : ''} Affected:
        </Text>
        
        {deficit.studentsAffected.slice(0, 3).map(student => (
          <View key={student.id} style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 2
          }}>
            <Text style={{ fontSize: 13, color: '#7f1d1d' }}>
              • {student.name}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#dc2626' }}>
              Needs {student.deficit}
            </Text>
          </View>
        ))}
        
        {deficit.studentsAffected.length > 3 && (
          <Text style={{ fontSize: 12, color: '#991b1b', marginTop: 4 }}>
            +{deficit.studentsAffected.length - 3} more students
          </Text>
        )}
      </View>
    </View>
  );

  const renderSizeRequest = (request) => (
    <View key={`${request.uniformId}-${request.sizeWanted}`} style={{
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#f59e0b',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          backgroundColor: colors.secondary,
          borderRadius: 8,
          padding: 8,
          marginRight: 12
        }}>
          <Ionicons name="time-outline" size={18} color="#f59e0b" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.cardForeground, marginBottom: 2 }}>
            {request.uniformName} - Size {request.sizeWanted}
          </Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
            {request.students.length} student{request.students.length !== 1 ? 's' : ''} waiting
          </Text>
        </View>
        <View style={{
          backgroundColor: '#f59e0b',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 6
        }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>
            {request.students.length}
          </Text>
        </View>
      </View>

      <View style={{
        backgroundColor: colors.muted,
        borderRadius: 8,
        padding: 12
      }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#d97706', marginBottom: 8 }}>
          Students Waiting:
        </Text>
        
        {request.students.slice(0, 3).map(student => (
          <View key={student.id} style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 2
          }}>
            <Text style={{ fontSize: 13, color: '#92400e' }}>
              • {student.name}
            </Text>
            <Text style={{ fontSize: 12, color: '#a16207' }}>
              {new Date(student.requestDate).toLocaleDateString()}
            </Text>
          </View>
        ))}
        
        {request.students.length > 3 && (
          <Text style={{ fontSize: 12, color: '#a16207', marginTop: 4 }}>
            +{request.students.length - 3} more students
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 16 }}>
          Generating deficit report...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Summary Cards */}
      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        <View style={{
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          marginRight: 8,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <Ionicons name="person-outline" size={24} color="#ef4444" style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>
            {deficitData.studentsWithDeficits}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: 'center' }}>
            Students with Deficits
          </Text>
        </View>
        
        <View style={{
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          marginLeft: 8,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <Ionicons name="warning-outline" size={24} color="#ef4444" style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>
            {deficitData.uniformDeficits.length}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: 'center' }}>
            Uniform Types with Deficits
          </Text>
        </View>
      </View>

      {/* Uniform Deficits */}
      {deficitData.uniformDeficits.length > 0 && (
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground, marginBottom: 16 }}>
            Uniform Deficits
          </Text>
          {deficitData.uniformDeficits.map(renderUniformDeficit)}
        </View>
      )}

      {/* Size Requests */}
      {deficitData.sizeRequests.length > 0 && (
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground, marginBottom: 16 }}>
            Unfulfilled Size Requests
          </Text>
          {deficitData.sizeRequests.map(renderSizeRequest)}
        </View>
      )}

      {/* No Deficits Message */}
      {deficitData.uniformDeficits.length === 0 && deficitData.sizeRequests.length === 0 && (
        <View style={{
          backgroundColor: colors.secondary,
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#bbf7d0'
        }}>
          <Ionicons name="cube-outline" size={48} color="#16a34a" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#15803d', marginBottom: 8 }}>
            All Caught Up!
          </Text>
          <Text style={{ fontSize: 14, color: '#16a34a', textAlign: 'center' }}>
            No uniform deficits or pending size requests found for this school.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default UniformDeficitReport;
