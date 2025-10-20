import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { Animated, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useInventoryStore } from '../../configuration/inventoryStore';
import { useSchoolStore } from '../../configuration/schoolStore';
import AddUniformPolicyModal from '../components/ui/AddUniformPolicyModal';
import StudentManagementSection from '../components/ui/StudentManagementSection';
import { useFocusEffect } from '@react-navigation/native';

export default function SchoolDetailsScreen({ route, navigation }) {
  const { schoolId } = route.params;
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const { schools, getSchoolUniformPolicies, removeSchoolUniformPolicy, getSchoolById } = useSchoolStore();
  const { uniforms, uniformVariants } = useInventoryStore();
  
  const [school, setSchool] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('uniforms');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ level: '', gender: '' });
  const [uniformPolicies, setUniformPolicies] = useState([]);
  const [students, setStudents] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Real-time listener for students (syncs across mobile and web)
  useEffect(() => {
    if (!schoolId) return;

    const studentsQuery = query(
      collection(db, 'students'),
      where('schoolId', '==', schoolId)
    );

    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    }, (error) => {
      console.error('Error listening to students:', error);
    });

    return () => unsubscribe();
  }, [schoolId]);

  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        // Get fresh school data from database
        const schoolData = await getSchoolById(schoolId);
        setSchool(schoolData);
        
        // Load uniform policies for this school
        const policies = await getSchoolUniformPolicies(schoolId);
        setUniformPolicies(policies);
        
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('Error loading school data:', error);
      }
    };

    if (schoolId) {
      loadSchoolData();
    }
  }, [schoolId, getSchoolById, getSchoolUniformPolicies]);

  // Refresh school data when screen comes into focus (e.g., returning from StudentDetails)
  useFocusEffect(
    React.useCallback(() => {
      const refreshSchoolData = async () => {
        if (schoolId) {
          try {
            console.log('SchoolDetailsScreen: Refreshing school data...');
            const schoolData = await getSchoolById(schoolId);
            setSchool(schoolData);
            
            const policies = await getSchoolUniformPolicies(schoolId);
            setUniformPolicies(policies);
            
            // Increment refresh key to force StudentManagementSection to refresh
            setRefreshKey(prev => prev + 1);
            console.log('SchoolDetailsScreen: School data refreshed');
          } catch (error) {
            console.error('Error refreshing school data:', error);
          }
        }
      };
      
      refreshSchoolData();
    }, [schoolId, getSchoolById, getSchoolUniformPolicies])
  );

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const openAddUniformModal = (level, gender) => {
    setModalConfig({ level, gender });
    setModalVisible(true);
  };

  const handleModalClose = async () => {
    setModalVisible(false);
    // Refresh policies after modal closes
    try {
      const policies = await getSchoolUniformPolicies(schoolId);
      setUniformPolicies(policies);
    } catch (error) {
      console.error('Error refreshing policies:', error);
    }
  };

  const getUniformPoliciesForLevel = (level, gender) => {
    return uniformPolicies.filter(policy => 
      policy.level === level && policy.gender === gender
    );
  };

  const handleRemovePolicy = async (policyId) => {
    try {
      await removeSchoolUniformPolicy(schoolId, policyId);
      // Refresh policies
      const policies = await getSchoolUniformPolicies(schoolId);
      setUniformPolicies(policies);
    } catch (error) {
      console.error('Error removing policy:', error);
    }
  };

  const renderUniformSection = (level, gender) => {
    const sectionKey = `${level}-${gender}`;
    const isExpanded = expandedSections[sectionKey];
    const uniformPolicies = getUniformPoliciesForLevel(level, gender);
    
    return (
      <View key={sectionKey} style={{ marginBottom: 20 }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 15,
          elevation: 6,
          overflow: 'hidden'
        }}>
          {/* Header Section */}
          <TouchableOpacity
            onPress={() => toggleSection(sectionKey)}
            style={{
              backgroundColor: gender === 'Boys' ? '#ef4444' : '#ec4899',
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: 12, 
                padding: 8, 
                marginRight: 12 
              }}>
                <Ionicons name="person-circle-outline" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: 'white' }}>
                  {gender} Uniforms
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 }}>
                  {uniformPolicies.length} policies configured
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isExpanded ? (
                <Ionicons name="chevron-up" size={20} color="white" />
              ) : (
                <Ionicons name="chevron-down" size={20} color="white" />
              )}
            </View>
          </TouchableOpacity>
          
          {/* Add Policy Button - Always Visible */}
          <View style={{ padding: 20, borderBottomWidth: isExpanded ? 1 : 0, borderBottomColor: '#f3f4f6' }}>
            <TouchableOpacity
              onPress={() => openAddUniformModal(level, gender)}
              style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                padding: 16,
                borderWidth: 2,
                borderColor: '#e2e8f0',
                borderStyle: 'dashed',
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="add" size={20} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.mutedForeground, fontSize: 14, fontWeight: '600' }}>
                Add New Uniform Policy
              </Text>
            </TouchableOpacity>
          </View>
          
          {isExpanded && (
            <View style={{ padding: 20, paddingTop: 0 }}>
              {uniformPolicies.length > 0 ? (
                uniformPolicies.map((policy, index) => (
                  <View key={policy.id || index} style={{ 
                    backgroundColor: colors.muted, 
                    borderRadius: 12, 
                    padding: 16, 
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: policy.isRequired ? '#10b981' : '#e5e7eb',
                    borderLeftWidth: policy.isRequired ? 4 : 1,
                    borderLeftColor: policy.isRequired ? '#10b981' : '#e5e7eb'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.cardForeground, marginRight: 8 }}>
                            {policy.uniformName}
                          </Text>
                          {policy.isRequired && (
                            <View style={{
                              backgroundColor: '#10b981',
                              borderRadius: 4,
                              paddingHorizontal: 6,
                              paddingVertical: 2
                            }}>
                              <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                                REQUIRED
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 14, color: colors.mutedForeground, marginBottom: 4 }}>
                          {policy.uniformType} • Quantity: {policy.quantityPerStudent} per student
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                          Policy ID: {policy.id}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => console.log('Edit policy', policy)}
                          style={{
                            backgroundColor: '#ef4444',
                            borderRadius: 8,
                            padding: 8
                          }}
                        >
                          <Ionicons name="create-outline" size={16} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemovePolicy(policy.id)}
                          style={{
                            backgroundColor: '#ef4444',
                            borderRadius: 8,
                            padding: 8
                          }}
                        >
                          <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ 
                  alignItems: 'center', 
                  paddingVertical: 32,
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderStyle: 'dashed'
                }}>
                  <View style={{
                    backgroundColor: colors.secondary,
                    borderRadius: 16,
                    padding: 12,
                    marginBottom: 12
                  }}>
                    <Text style={{ 
                      color: colors.mutedForeground,
                      fontSize: 24,
                      fontWeight: '700'
                    }}>
                      U
                    </Text>
                  </View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
                    No uniform policies for {gender}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center' }}>
                    Create your first uniform policy
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderLevelSection = (level) => {
    return (
      <View key={level} style={{ marginBottom: 32 }}>
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
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '800', 
            color: colors.foreground, 
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: -0.5
          }}>
            {level} Level
          </Text>
        </View>
        
        {renderUniformSection(level, 'Boys')}
        {renderUniformSection(level, 'Girls')}
      </View>
    );
  };

  if (!school) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 18, color: colors.mutedForeground }}>Loading school details...</Text>
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
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header Navigation */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 12,
                  padding: 10,
                  marginRight: 12
                }}
              >
                <Ionicons name="arrow-back" size={22} color="white" />
              </TouchableOpacity>
              <Text style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: 15, fontWeight: '600' }}>
                Back to Schools
              </Text>
            </View>

            {/* School Name Card */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.25)', 
                  borderRadius: 12, 
                  padding: 10, 
                  marginRight: 12 
                }}>
                  <Ionicons name="school" size={24} color="white" />
                </View>
                <Text style={{ 
                  fontSize: 26, 
                  fontWeight: '800', 
                  color: 'white',
                  letterSpacing: -0.5
                }}>
                  {school.name}
                </Text>
              </View>
            </View>

            {/* Tab Section with Modern Design */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}>
              <Text style={{ 
                color: 'rgba(255, 255, 255, 0.95)', 
                fontSize: 14, 
                fontWeight: '700',
                marginBottom: 12,
                textAlign: 'center',
                letterSpacing: 0.5,
                textTransform: 'uppercase'
              }}>
                School Management
              </Text>
              
              {/* Modern Tab Buttons */}
              <View style={{ 
                flexDirection: 'row',
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                borderRadius: 14,
                padding: 5,
                gap: 6
              }}>
                <TouchableOpacity
                  onPress={() => setActiveTab('uniforms')}
                  style={{
                    flex: 1,
                    backgroundColor: activeTab === 'uniforms' ? colors.card : 'transparent',
                    borderRadius: 10,
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: activeTab === 'uniforms' ? 0.15 : 0,
                    shadowRadius: 6,
                    elevation: activeTab === 'uniforms' ? 4 : 0
                  }}
                >
                  <Ionicons 
                    name={activeTab === 'uniforms' ? 'shirt' : 'shirt-outline'} 
                    size={18} 
                    color={activeTab === 'uniforms' ? '#ef4444' : 'rgba(255, 255, 255, 0.9)'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ 
                    color: activeTab === 'uniforms' ? '#1f2937' : 'rgba(255, 255, 255, 0.95)', 
                    fontSize: 15, 
                    fontWeight: '700' 
                  }}>
                    Uniforms
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab('students')}
                  style={{
                    flex: 1,
                    backgroundColor: activeTab === 'students' ? colors.card : 'transparent',
                    borderRadius: 10,
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: activeTab === 'students' ? 0.15 : 0,
                    shadowRadius: 6,
                    elevation: activeTab === 'students' ? 4 : 0
                  }}
                >
                  <Ionicons 
                    name={activeTab === 'students' ? 'people' : 'people-outline'} 
                    size={18} 
                    color={activeTab === 'students' ? '#ef4444' : 'rgba(255, 255, 255, 0.9)'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ 
                    color: activeTab === 'students' ? '#1f2937' : 'rgba(255, 255, 255, 0.95)', 
                    fontSize: 15, 
                    fontWeight: '700' 
                  }}>
                    Students
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Content Sections */}
        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20, marginTop: 20 }}>
          {activeTab === 'uniforms' && (
            <View>
              {renderLevelSection('Junior')}
              {renderLevelSection('Senior')}
            </View>
          )}
          
          {activeTab === 'students' && (
            <StudentManagementSection key={refreshKey} school={school} students={students} navigation={navigation} />
          )}
        </Animated.View>

        {/* Delete School Button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => console.log('Delete school')}
            style={{
              backgroundColor: '#ef4444',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#ef4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6
            }}
          >
            <Ionicons name="trash-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
              Delete School
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Add Uniform Policy Modal */}
      <AddUniformPolicyModal
        visible={modalVisible}
        onClose={handleModalClose}
        schoolId={schoolId}
        gender={modalConfig.gender}
        level={modalConfig.level}
      />
    </View>
  );
}
