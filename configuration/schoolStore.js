import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from './authStore';

const useSchoolStore = create((set, get) => ({
  schools: [],
  uniforms: [],
  loading: false,
  error: null,

  fetchSchools: async () => {
    set({ loading: true, error: null });
    try {
      const querySnapshot = await getDocs(collection(db, 'schools'));
      const schools = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      set({ schools, loading: false });
      return schools;
    } catch (error) {
      console.error('Error fetching schools:', error);
      const errorMessage = error.code === 'unavailable' 
        ? 'Network error. Please check your connection.'
        : error.message;
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  fetchUniforms: async () => {
    try {
      const uniformsRef = collection(db, 'uniforms');
      const snapshot = await getDocs(uniformsRef);
      const uniforms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched uniforms:', uniforms);
      set({ uniforms });
      return uniforms;
    } catch (error) {
      console.error('Error fetching uniforms:', error);
      throw error;
    }
  },

  getAvailableUniforms: async () => {
    return await get().fetchUniforms();
  },

  getSchoolById: async (id) => {
    try {
      console.log('getSchoolById called with ID:', id);
      
      if (!id) {
        console.error('No school ID provided');
        return null;
      }

      console.log('Fetching school from server (force fresh data)...');
      const docRef = doc(db, 'schools', id.toString());
      
      // Force fetch from server to get latest data (including web app changes)
      try {
        const docSnap = await getDoc(docRef, { source: 'server' });
        
        if (docSnap.exists()) {
          const schoolData = { id: docSnap.id, ...docSnap.data() };
          console.log('School data fetched from server:', schoolData.name, 'Policies:', schoolData.uniformPolicy?.length || 0);
          return schoolData;
        } else {
          console.error('School document does not exist for ID:', id);
          return null;
        }
      } catch (serverError) {
        // If server fetch fails, try cache as fallback
        console.warn('Server fetch failed, trying cache:', serverError);
        const docSnap = await getDoc(docRef, { source: 'cache' });
        
        if (docSnap.exists()) {
          const schoolData = { id: docSnap.id, ...docSnap.data() };
          console.log('School data fetched from cache:', schoolData.name);
          return schoolData;
        } else {
          console.error('School document does not exist in cache either');
          return null;
        }
      }
    } catch (error) {
      console.error('Error getting school:', error);
      throw error;
    }
  },

  addSchool: async (schoolData) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'schools'), {
        ...schoolData,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newSchool = {
        id: docRef.id,
        ...schoolData,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        schools: [...state.schools, newSchool],
        loading: false
      }));
      return newSchool;
    } catch (error) {
      console.error('Error adding school:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSchool: async (schoolId, schoolData) => {
    set({ loading: true, error: null });
    try {
      if (!schoolId || typeof schoolId !== 'string') {
        throw new Error('Invalid school ID');
      }

      const docRef = doc(db, 'schools', schoolId.toString());
      
      const updatedData = {
        ...schoolData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updatedData);
      set({ loading: false });
      
      // Return fresh data from database
      const updatedSchool = await get().getSchoolById(schoolId);
      return updatedSchool;
    } catch (error) {
      console.error('Error updating school:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteSchool: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'schools', id));
      set({ loading: false });
    } catch (error) {
      console.error('Error deleting school:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addStudent: async (studentData) => {
    set({ loading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const userId = user ? user.uid : 'unknown';
      
      // Add student to the students collection (Firestore will create collection if it doesn't exist)
      const docRef = await addDoc(collection(db, 'students'), {
        ...studentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId,
        uniformLog: [] // Initialize empty uniform log
      });
      
      console.log('Student added to students collection with ID:', docRef.id);
      
      // Also add student to the school's students array for quick access
      const newStudentForSchool = {
        id: docRef.id,
        ...studentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
        updatedBy: userId,
        uniformLog: [],
        uniformQuantities: {},
        uniformSizes: {},
        uniformStatus: {}
      };

      await updateDoc(doc(db, 'schools', studentData.schoolId), {
        students: arrayUnion(newStudentForSchool),
        updatedAt: serverTimestamp()
      });

      console.log('Student added to school document');
      set({ loading: false });

      console.log('Student added successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding student:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateStudent: async (schoolId, studentData) => {
    set({ loading: true, error: null });
    try {
      const school = await get().getSchoolById(schoolId);
      if (!school) throw new Error('School not found');

      const { user } = useAuthStore.getState();
      const userId = user ? user.uid : 'unknown';

      const studentId = studentData.id;
      if (!studentId) throw new Error('Student ID is required');

      const studentIndex = school.students.findIndex(s => s.id === studentId);
      if (studentIndex === -1) throw new Error('Student not found');

      const updatedStudent = {
        ...school.students[studentIndex],
        ...studentData,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      };

      const updatedStudents = [...school.students];
      updatedStudents[studentIndex] = updatedStudent;

      await updateDoc(doc(db, 'schools', schoolId), {
        students: updatedStudents
      });

      set(state => ({
        schools: state.schools.map(s =>
          s.id === schoolId
            ? {
                ...s,
                students: updatedStudents
              }
            : s
        ),
        loading: false
      }));

      return updatedStudent;
    } catch (error) {
      console.error('Error updating student:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteStudent: async (schoolId, studentId) => {
    set({ loading: true, error: null });
    try {
      console.log('Starting student deletion process...');
      
      // Delete from students collection
      try {
        await deleteDoc(doc(db, 'students', studentId));
        console.log('Student deleted from students collection');
      } catch (error) {
        console.log('Student not found in students collection or already deleted');
      }
      
      // Get current school data
      const school = await get().getSchoolById(schoolId);
      if (!school) throw new Error('School not found');

      // Filter out the student and update school document
      const updatedStudents = (school.students || []).filter(student => student.id !== studentId);
      
      await updateDoc(doc(db, 'schools', schoolId), {
        students: updatedStudents,
        updatedAt: serverTimestamp()
      });
      
      console.log('Student removed from school document');
      set({ loading: false });
      
    } catch (error) {
      console.error('Error deleting student:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUniformRequirements: async (schoolId, requirements) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'schools', schoolId.toString()), {
        uniformRequirements: requirements,
        updatedAt: serverTimestamp()
      });
      set({ loading: false });
    } catch (error) {
      console.error('Error updating uniform requirements:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateStudentUniform: async (schoolId, studentId, uniformInventory) => {
    try {
      // Get current school data
      const school = await get().getSchoolById(schoolId);
      if (!school) throw new Error('School not found');

      // Update the specific student's uniform inventory
      const updatedStudents = school.students.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            uniformInventory: {
              ...student.uniformInventory,
              ...uniformInventory
            },
            updatedAt: new Date().toISOString()
          };
        }
        return student;
      });

      // Update school document
      await updateDoc(doc(db, 'schools', schoolId), {
        students: updatedStudents,
        updatedAt: serverTimestamp()
      });

      console.log('Student uniform inventory updated successfully');
    } catch (error) {
      console.error('Error updating student uniform:', error);
      throw error;
    }
  },

  updateSchoolUniformPolicy: async (schoolId, policyData) => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'schools', schoolId.toString());
      
      // Get current school data
      const currentSchool = await getDoc(docRef);
      const currentData = currentSchool.data();
      
      // Initialize uniformPolicy array if it doesn't exist
      const currentPolicies = currentData?.uniformPolicy || [];
      
      // Create new policy object
      const newPolicy = {
        id: Date.now().toString(),
        uniformId: policyData.uniformId,
        uniformName: policyData.uniformName,
        uniformType: policyData.uniformType,
        level: policyData.level,
        gender: policyData.gender,
        isRequired: policyData.isRequired,
        quantityPerStudent: policyData.quantityPerStudent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to policies array
      const updatedPolicies = [...currentPolicies, newPolicy];
      
      // Update the document
      await updateDoc(docRef, {
        uniformPolicy: updatedPolicies,
        updatedAt: serverTimestamp()
      });
      
      set({ loading: false });
      return newPolicy;
    } catch (error) {
      console.error('Error updating school uniform policy:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  removeSchoolUniformPolicy: async (schoolId, policyToRemove) => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'schools', schoolId.toString());
      
      // Get current school data
      const currentSchool = await getDoc(docRef);
      const currentData = currentSchool.data();
      
      // Filter out the policy to remove
      // Handle both old policies (without id) and new policies (with id)
      const updatedPolicies = (currentData?.uniformPolicy || []).filter(policy => {
        // If both have id fields, match by id
        if (policy.id && policyToRemove.id) {
          return policy.id !== policyToRemove.id;
        }
        
        // For old policies without id, match by all key fields
        return !(
          policy.uniformId === policyToRemove.uniformId &&
          policy.level === policyToRemove.level &&
          policy.gender === policyToRemove.gender
        );
      });
      
      console.log('Policies before removal:', currentData?.uniformPolicy?.length);
      console.log('Policies after removal:', updatedPolicies.length);
      
      // Update the document
      await updateDoc(docRef, {
        uniformPolicy: updatedPolicies,
        updatedAt: serverTimestamp()
      });
      
      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Error removing school uniform policy:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getSchoolUniformPolicies: async (schoolId, level = null, gender = null) => {
    try {
      const school = await get().getSchoolById(schoolId);
      if (!school || !school.uniformPolicy) return [];
      
      let policies = school.uniformPolicy;
      
      if (level) {
        policies = policies.filter(p => p.level === level);
      }
      
      if (gender) {
        policies = policies.filter(p => p.gender === gender);
      }
      
      return policies;
    } catch (error) {
      console.error('Error getting school uniform policies:', error);
      return [];
    }
  },

  // Student uniform logging functions
  updateStudentUniformLog: async (studentId, logEntry) => {
    try {
      console.log('Updating uniform log for student:', studentId);
      console.log('Log entry:', logEntry);
      
      // 1. Update the students collection document
      const studentDocRef = doc(db, 'students', studentId.toString());
      await updateDoc(studentDocRef, {
        uniformLog: arrayUnion(logEntry),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Students collection updated');
      
      // 2. Get the student's school ID to update the school document
      const studentDoc = await getDoc(studentDocRef);
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        const schoolId = studentData.schoolId;
        
        if (schoolId) {
          console.log('Updating school document for schoolId:', schoolId);
          
          // Get current school data
          const school = await get().getSchoolById(schoolId);
          if (school && school.students) {
            // Find and update the student in the school's students array
            const updatedStudents = school.students.map(student => {
              if (student.id === studentId) {
                const currentLog = student.uniformLog || [];
                return {
                  ...student,
                  uniformLog: [...currentLog, logEntry],
                  updatedAt: new Date().toISOString()
                };
              }
              return student;
            });
            
            // Update school document with updated students array
            await updateDoc(doc(db, 'schools', schoolId), {
              students: updatedStudents,
              updatedAt: serverTimestamp()
            });
            
            console.log('✅ School document students array updated');
          }
        }
      }
      
      console.log('✅ Student uniform log updated successfully in both locations');
    } catch (error) {
      console.error('Error updating student uniform log:', error);
      throw error;
    }
  },

  getStudentById: async (studentId) => {
    try {
      const docRef = doc(db, 'students', studentId.toString());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Student not found');
      }
    } catch (error) {
      console.error('Error getting student:', error);
      throw error;
    }
  },

  // Get all students for a specific school
  getStudentsForSchool: async (schoolId) => {
    try {
      const q = query(
        collection(db, 'students'),
        where('schoolId', '==', schoolId)
      );
      const querySnapshot = await getDocs(q);
      
      const students = [];
      querySnapshot.forEach((doc) => {
        students.push({ id: doc.id, ...doc.data() });
      });
      
      return students;
    } catch (error) {
      console.error('Error fetching students for school:', error);
      throw error;
    }
  },

  // Get student count for a specific school
  getStudentCountForSchool: async (schoolId) => {
    try {
      const q = query(
        collection(db, 'students'),
        where('schoolId', '==', schoolId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting student count for school:', error);
      return 0;
    }
  },

  // Get total student count across all schools
  getTotalStudentCount: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting total student count:', error);
      return 0;
    }
  },

  // Get students by school for deficit reporting
  getStudentsBySchool: async (schoolId) => {
    try {
      const q = query(
        collection(db, 'students'),
        where('schoolId', '==', schoolId.toString())
      );
      const querySnapshot = await getDocs(q);
      
      const students = [];
      querySnapshot.forEach((doc) => {
        students.push({ id: doc.id, ...doc.data() });
      });
      
      return students;
    } catch (error) {
      console.error('Error getting students by school:', error);
      throw error;
    }
  },

  // Real-time listener for schools
  subscribeToSchools: (callback) => {
    const unsubscribe = onSnapshot(
      collection(db, 'schools'),
      (snapshot) => {
        const schools = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(schools);
      },
      (error) => {
        console.error('Error in schools subscription:', error);
      }
    );
    return unsubscribe;
  },

  // Real-time listener for a specific school
  subscribeToSchool: (schoolId, callback) => {
    const unsubscribe = onSnapshot(
      doc(db, 'schools', schoolId),
      (doc) => {
        if (doc.exists()) {
          const schoolData = { id: doc.id, ...doc.data() };
          callback(schoolData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in school subscription:', error);
      }
    );
    return unsubscribe;
  },

  // Add student to students collection only
  addStudentToCollection: async (studentData) => {
    try {
      const docRef = await addDoc(collection(db, 'students'), {
        ...studentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Student added to students collection with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding student to collection:', error);
      throw error;
    }
  },

  // Delete student from students collection only
  deleteStudentFromCollection: async (studentId) => {
    try {
      const docRef = doc(db, 'students', studentId.toString());
      await deleteDoc(docRef);
      
      console.log('Student deleted from students collection successfully');
    } catch (error) {
      console.error('Error deleting student from collection:', error);
      throw error;
    }
  }
}));

export { useSchoolStore }; 