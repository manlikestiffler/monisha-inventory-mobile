import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deficitReportStore } from '../../configuration/deficitReportStore';

const StudentDeficitReport = ({ student, school, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [deficitReport, setDeficitReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeficitReport();
  }, [student, school]);

  const loadDeficitReport = async () => {
    try {
      setLoading(true);
      
      // Try to get stored report first
      const storedReport = await deficitReportStore.getStudentDeficitReport(school.id, student.id);
      
      if (storedReport) {
        setDeficitReport(storedReport);
      } else {
        // No stored report found - this means no deficits
        setDeficitReport({
          studentId: student.id,
          studentName: student.name,
          totalDeficit: 0,
          deficitDetails: []
        });
      }
    } catch (error) {
      console.error('Error loading deficit report:', error);
      Alert.alert('Error', 'Failed to load deficit report');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // This would typically regenerate the report, but for now just reload
      await loadDeficitReport();
    } catch (error) {
      console.error('Error refreshing deficit report:', error);
      Alert.alert('Error', 'Failed to refresh deficit report');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Deficit Report
          </Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EF4444" />
          <Text className="mt-4 text-gray-600 dark:text-gray-400">
            Loading deficit report...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Deficit Report
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {student.name} • Form {student.form}
          </Text>
        </View>
        
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity 
            onPress={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color="#EF4444" 
              style={{ 
                transform: [{ rotate: refreshing ? '180deg' : '0deg' }] 
              }} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Summary Card */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center mr-4">
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  {deficitReport?.totalDeficit || 0}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  Total Deficit Items
                </Text>
              </View>
            </View>
            
            {deficitReport?.totalDeficit > 0 && (
              <View className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
                <Text className="text-red-600 dark:text-red-400 text-xs font-medium">
                  NEEDS ATTENTION
                </Text>
              </View>
            )}
          </View>
          
          {deficitReport?.totalDeficit === 0 && (
            <View className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="ml-2 text-green-700 dark:text-green-400 font-medium">
                  No uniform deficits found
                </Text>
              </View>
              <Text className="text-green-600 dark:text-green-500 text-sm mt-1">
                This student has received all required uniforms
              </Text>
            </View>
          )}
        </View>

        {/* Deficit Details */}
        {deficitReport?.deficitDetails && deficitReport.deficitDetails.length > 0 && (
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Deficit Details
            </Text>
            
            {deficitReport.deficitDetails.map((deficit, index) => (
              <View 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 dark:text-white">
                      {deficit.uniformName}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {deficit.uniformType}
                    </Text>
                  </View>
                  
                  <View className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
                    <Text className="text-red-600 dark:text-red-400 text-sm font-bold">
                      -{deficit.deficit}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Required
                    </Text>
                    <Text className="text-sm font-medium text-gray-900 dark:text-white">
                      {deficit.required}
                    </Text>
                  </View>
                  
                  <View className="flex-1 items-center">
                    <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Received
                    </Text>
                    <Text className="text-sm font-medium text-gray-900 dark:text-white">
                      {deficit.received}
                    </Text>
                  </View>
                  
                  <View className="flex-1 items-end">
                    <Text className="text-xs text-red-500 dark:text-red-400 uppercase tracking-wide">
                      Deficit
                    </Text>
                    <Text className="text-sm font-bold text-red-600 dark:text-red-400">
                      {deficit.deficit}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Student Info */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mt-6 border border-gray-200 dark:border-gray-700">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Student Information
          </Text>
          
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-400">Name:</Text>
              <Text className="text-gray-900 dark:text-white font-medium">
                {student.name}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-400">Form:</Text>
              <Text className="text-gray-900 dark:text-white font-medium">
                {student.form}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-400">Level:</Text>
              <Text className="text-gray-900 dark:text-white font-medium">
                {student.level}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-gray-400">Gender:</Text>
              <Text className="text-gray-900 dark:text-white font-medium">
                {student.gender}
              </Text>
            </View>
          </View>
        </View>

        {/* Report Info */}
        {deficitReport?.generatedAt && (
          <View className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 mt-4 border border-gray-200 dark:border-gray-700">
            <Text className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Report generated: {new Date(deficitReport.generatedAt.seconds * 1000).toLocaleDateString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default StudentDeficitReport;
