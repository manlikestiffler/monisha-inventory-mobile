import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration (using correct config from your app)
const firebaseConfig = {
  apiKey: "AIzaSyDHkE3k09XUzW1ONjN914fWgAHRPDTtsms",
  authDomain: "monisha-databse.firebaseapp.com",
  projectId: "monisha-databse",
  storageBucket: "monisha-databse.firebasestorage.app",
  messagingSenderId: "10224835048",
  appId: "1:10224835048:web:41ebdf9453a559c97fec5d",
  measurementId: "G-J8J31DHXBZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifySchoolStudentLinking() {
  try {
    console.log('🔍 VERIFYING SCHOOL-STUDENT COLLECTION STRUCTURE\n');
    console.log('=' .repeat(60));
    
    // First, check schools collection
    console.log('📁 SCHOOLS COLLECTION');
    console.log('-' .repeat(30));
    
    const schoolsRef = collection(db, 'schools');
    const schoolsSnapshot = await getDocs(schoolsRef);
    
    if (schoolsSnapshot.empty) {
      console.log('❌ No schools found');
      return;
    }
    
    const schools = [];
    schoolsSnapshot.forEach((doc) => {
      const data = doc.data();
      schools.push({
        id: doc.id,
        name: data.name,
        studentsInArray: data.students?.length || 0
      });
      console.log(`✅ School: ${data.name} (ID: ${doc.id})`);
      console.log(`   - Students in school array: ${data.students?.length || 0}`);
    });
    
    console.log('\n📁 STUDENTS COLLECTION');
    console.log('-' .repeat(30));
    
    // Check students collection
    const studentsRef = collection(db, 'students');
    const studentsSnapshot = await getDocs(studentsRef);
    
    if (studentsSnapshot.empty) {
      console.log('❌ No students found in students collection');
      return;
    }
    
    const studentsBySchool = {};
    studentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const schoolId = data.schoolId;
      
      if (!studentsBySchool[schoolId]) {
        studentsBySchool[schoolId] = [];
      }
      studentsBySchool[schoolId].push({
        id: doc.id,
        name: data.name,
        level: data.level,
        gender: data.gender
      });
    });
    
    console.log(`✅ Total students in collection: ${studentsSnapshot.size}`);
    
    // Show linking verification
    console.log('\n🔗 LINKING VERIFICATION');
    console.log('-' .repeat(30));
    
    schools.forEach(school => {
      const studentsInCollection = studentsBySchool[school.id] || [];
      console.log(`\n🏫 ${school.name} (${school.id}):`);
      console.log(`   📊 Students in school array: ${school.studentsInArray}`);
      console.log(`   📊 Students in students collection: ${studentsInCollection.length}`);
      
      if (studentsInCollection.length > 0) {
        console.log(`   👥 Students linked to this school:`);
        studentsInCollection.forEach((student, index) => {
          console.log(`      ${index + 1}. ${student.name} (${student.level}, ${student.gender})`);
        });
      } else {
        console.log(`   ⚠️  No students found in students collection for this school`);
      }
      
      // Check if linking is working
      if (school.studentsInArray === studentsInCollection.length) {
        console.log(`   ✅ LINKING VERIFIED: Counts match!`);
      } else {
        console.log(`   ⚠️  MISMATCH: School array has ${school.studentsInArray}, collection has ${studentsInCollection.length}`);
      }
    });
    
    console.log('\n🎯 SUMMARY');
    console.log('-' .repeat(30));
    console.log(`📁 Schools collection: ${schools.length} schools`);
    console.log(`📁 Students collection: ${studentsSnapshot.size} students`);
    console.log(`🔗 Schools with linked students: ${Object.keys(studentsBySchool).length}`);
    
    // Check for orphaned students
    const schoolIds = schools.map(s => s.id);
    const orphanedStudents = Object.keys(studentsBySchool).filter(schoolId => !schoolIds.includes(schoolId));
    
    if (orphanedStudents.length > 0) {
      console.log(`⚠️  Orphaned students (linked to non-existent schools): ${orphanedStudents.length}`);
      orphanedStudents.forEach(schoolId => {
        console.log(`   - Students linked to missing school ${schoolId}: ${studentsBySchool[schoolId].length}`);
      });
    } else {
      console.log(`✅ No orphaned students found`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying collections:', error);
  }
}

async function listAllCollections() {
  try {
    console.log('🔍 Listing all Firestore collections and documents...\n');
    
    // List of known collections in your app
    const collections = [
      'schools',
      'students', 
      'products',
      'uniforms',
      'batchInventory',
      'inventory_managers',
      'inventory_staff',
      'ecom_users',
      'uniform_variants',
      'verification_codes'
    ];

    for (const collectionName of collections) {
      console.log(`📁 Collection: ${collectionName}`);
      console.log('=' .repeat(50));
      
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        if (snapshot.empty) {
          console.log('   📭 No documents found');
        } else {
          console.log(`   📊 Found ${snapshot.size} documents:`);
          
          snapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`   ${index + 1}. Document ID: ${doc.id}`);
            
            // Show key fields for different collection types
            if (collectionName === 'schools') {
              console.log(`      - Name: ${data.name || 'N/A'}`);
              console.log(`      - Students: ${data.students?.length || 0} students`);
              console.log(`      - Uniform Policies: ${data.uniformPolicy?.length || 0} policies`);
            } else if (collectionName === 'students') {
              console.log(`      - Name: ${data.name || 'N/A'}`);
              console.log(`      - School ID: ${data.schoolId || 'N/A'}`);
              console.log(`      - Level: ${data.level || 'N/A'}`);
              console.log(`      - Gender: ${data.gender || 'N/A'}`);
            } else if (collectionName === 'products') {
              console.log(`      - Name: ${data.name || 'N/A'}`);
              console.log(`      - Type: ${data.type || 'N/A'}`);
              console.log(`      - School: ${data.school || 'N/A'}`);
            } else {
              // Show first few fields for other collections
              const keys = Object.keys(data).slice(0, 3);
              keys.forEach(key => {
                const value = data[key];
                if (typeof value === 'string' || typeof value === 'number') {
                  console.log(`      - ${key}: ${value}`);
                } else if (Array.isArray(value)) {
                  console.log(`      - ${key}: [${value.length} items]`);
                } else if (typeof value === 'object' && value !== null) {
                  console.log(`      - ${key}: [object]`);
                }
              });
            }
            
            console.log(`      - Created: ${data.createdAt?.toDate?.()?.toLocaleString() || data.createdAt || 'N/A'}`);
            console.log('');
          });
        }
      } catch (error) {
        console.log(`   ❌ Error accessing collection: ${error.message}`);
      }
      
      console.log('\n');
    }
    
    console.log('✅ Database listing completed!');
    
  } catch (error) {
    console.error('❌ Error listing database:', error);
  }
}

// Run the verification script
console.log('🚀 Starting School-Student Collection Verification...\n');
verifySchoolStudentLinking();
