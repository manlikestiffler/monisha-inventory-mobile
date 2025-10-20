# Monisha Inventory Management - Mobile Application

A comprehensive React Native mobile application for managing school uniform inventory, built with Expo and Firebase backend integration.

## 📱 System Architecture

### Technology Stack
- **Framework:** React Native with Expo SDK 51
- **State Management:** Zustand
- **Styling:** NativeWind v2 (Tailwind CSS for React Native)
- **Backend:** Firebase (Firestore, Authentication)
- **Navigation:** React Navigation v6
- **Charts:** react-native-chart-kit
- **Icons:** Expo Vector Icons

### Project Structure
```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Card, Modal, etc.)
│   │   └── dashboard/      # Dashboard-specific components
│   ├── screens/            # Screen components
│   ├── configuration/      # Zustand stores (renamed from stores)
│   ├── constants/          # App constants and colors
│   ├── config/             # Firebase configuration
│   └── utils/              # Utility functions
├── assets/                 # Images, fonts, and other assets
├── app.json               # Expo configuration
└── package.json           # Dependencies and scripts
```

## 🔄 Data Flow Architecture

### Store Pattern
The mobile app uses Zustand for state management with stores located in `configuration/`:

#### 1. School Store (`configuration/schoolStore.js`)
```javascript
// Manages schools and students
- fetchSchools() → Firebase schools collection
- addSchool() → Creates new school document  
- updateSchool() → Updates school data
- addUniformPolicy() → Manages school uniform requirements
- getTotalStudentCount() → Aggregates student data
- getStudentCountForSchool() → Per-school student counts
```

#### 2. Inventory Store (`configuration/inventoryStore.js`)
```javascript
// Manages products and batches
- fetchUniforms() → Firebase uniforms collection
- fetchUniformVariants() → Firebase uniform_variants collection
- fetchBatches() → Firebase batchInventory collection
- deductProductInventory() → Handles stock allocation
- reorderFromBatch() → Manages inventory replenishment
- checkProductStock() → Validates stock availability
```

#### 3. Batch Store (`configuration/batchStore.js`)
```javascript
// Manages batch inventory
- fetchBatches() → Firebase batchInventory collection
- addBatch() → Creates new batch documents
- updateBatch() → Updates batch data
- getBatchById() → Retrieves specific batch data
```

#### 4. Order Store (`configuration/orderStore.js`)
```javascript
// Manages order processing
- fetchOrders() → Firebase orders collection
- createOrder() → Creates new order documents
- updateOrderStatus() → Manages order lifecycle
```

### Data Synchronization Pattern
```
Screen Component → Zustand Store → Firebase SDK → Firestore
       ↓               ↓              ↓           ↓
User Interaction → State Update → API Call → Database Write
       ↓               ↓              ↓           ↓
Re-render ← State Sync ← Response ← Server Response
```

## 🎯 Key Features & Implementation

### 1. Dashboard Analytics
- **Real-time metrics:** Total inventory, active schools, revenue tracking
- **Mobile analytics hub:** Interactive charts optimized for mobile viewing
- **Recent activity feed:** Live updates of system activities
- **Implementation:** react-native-chart-kit with horizontal scrolling charts

### 2. School Management
- **Simplified school creation:** Modal with name-only input
- **Student management:** Comprehensive profiles with uniform tracking
- **Uniform policies:** Touch-friendly policy configuration
- **Deficit reporting:** Mobile-optimized deficit analysis

### 3. Inventory Management
- **Batch-first approach:** Mobile-optimized batch creation workflow
- **Touch-friendly interfaces:** Large buttons and easy navigation
- **Stock tracking:** Real-time inventory with mobile alerts
- **Barcode scanning:** Future enhancement for inventory tracking

### 4. Mobile-Specific Features
- **Offline capability:** Local storage with sync when online
- **Touch gestures:** Swipe actions and pull-to-refresh
- **Native performance:** Optimized for mobile hardware
- **Cross-platform sync:** Real-time data sharing with web app

## 🔧 Technical Challenges & Solutions

### Challenge 1: React Native Firebase Integration
**Problem:** Firebase v10+ compatibility issues with React Native.

**Solution:**
```javascript
// Use React Native specific imports
import { getAuth } from 'firebase/auth/react-native';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

### Challenge 2: NativeWind v2 Configuration
**Problem:** Tailwind CSS classes not working in React Native environment.

**Solution:**
```javascript
// metro.config.js configuration
const { withNativeWind } = require('nativewind/metro');
module.exports = withNativeWind(config, { input: './src/global.css' });

// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: []
};
```

### Challenge 3: Cross-Platform Data Consistency
**Problem:** Ensuring mobile data syncs perfectly with web application.

**Solution:**
- Identical data structures across platforms
- Server-first fetching for critical operations
- Consistent field naming conventions
- Real-time synchronization patterns

### Challenge 4: Mobile Performance Optimization
**Problem:** Large datasets causing performance issues on mobile devices.

**Solution:**
- FlatList for efficient list rendering
- Image optimization and lazy loading
- Pagination for large data sets
- Memory management with proper cleanup

### Challenge 5: Navigation & State Management
**Problem:** Complex navigation with persistent state across screens.

**Solution:**
```javascript
// React Navigation v6 with Zustand persistence
const navigationRef = useNavigationContainerRef();
const routeNameRef = useRef();

// Zustand with AsyncStorage persistence
const useStore = create(
  persist(
    (set, get) => ({ /* store logic */ }),
    { name: 'inventory-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator
- Firebase project with Firestore enabled

### Installation
```

### Environment Setup
Create `.env` file in mobile directory:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Development
```bash
npx expo start
```

### Build for Production
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## 📊 Data Flow Patterns

### 1. School → Student Relationship
```
School Creation → Student Addition → Uniform Allocation → Deficit Analysis
     ↓                 ↓                  ↓                 ↓
schools collection → students collection → uniformLog array → Reports
```

### 2. Inventory Flow
```
Batch → Product Variants → Student Allocation → Reorder
  ↓          ↓                  ↓              ↓
batchInventory → uniform_variants → allocation → reorderHistory
```

### 3. Mobile-Specific Navigation Flow
```
Tab Navigation → Screen Stack → Modal Overlays → Action Sheets
      ↓              ↓              ↓              ↓
Bottom Tabs → Screen Components → Form Modals → Native Alerts
```

## 🎨 UI/UX Design Patterns

### Color Scheme
```javascript
// constants/colors.js
export const colors = {
  primary: '#3b82f6',
  secondary: '#64748b',
  accent: '#f59e0b',
  background: '#ffffff',
  card: '#f8fafc',
  border: '#e2e8f0',
  foreground: '#0f172a',
  mutedForeground: '#64748b'
};
```

### Component Architecture
- **Base Components:** Button, Card, Input, Modal
- **Composite Components:** MetricCard, StudentCard, BatchCard
- **Screen Components:** Dashboard, Schools, Inventory, etc.
- **Navigation Components:** TabBar, Header, FloatingActionButton

### Animation Patterns
```javascript
// Entrance animations
const fadeIn = {
  opacity: fadeAnim,
  transform: [{ translateY: slideAnim }]
};

// Touch feedback
const handlePress = () => {
  Animated.sequence([
    Animated.timing(scaleAnim, { toValue: 0.95, duration: 100 }),
    Animated.timing(scaleAnim, { toValue: 1, duration: 100 })
  ]).start();
};
```

## 🔐 Security Implementation

### Authentication Flow
```javascript
// Firebase Auth with React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Role-based access
const checkUserRole = async (user) => {
  const managerDoc = await getDoc(doc(db, 'inventory_managers', user.uid));
  const staffDoc = await getDoc(doc(db, 'inventory_staff', user.uid));
  return managerDoc.exists() ? 'manager' : staffDoc.exists() ? 'staff' : null;
};
```

### Data Validation
```javascript
// Input validation patterns
const validateSchoolName = (name) => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

const validateStudentData = (student) => {
  return {
    name: student.name?.trim() || '',
    form: student.form?.trim() || '',
    level: ['Junior', 'Senior'].includes(student.level) ? student.level : 'Junior',
    gender: ['Boys', 'Girls'].includes(student.gender) ? student.gender : 'Boys'
  };
};
```

## 📈 Performance Optimizations

### React Native Optimizations
```javascript
// FlatList optimization
<FlatList
  data={schools}
  renderItem={renderSchoolItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={5}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index
  })}
/>

// Image optimization
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  loadingIndicatorSource={require('../assets/placeholder.png')}
/>
```

### Memory Management
```javascript
// Cleanup on unmount
useEffect(() => {
  return () => {
    // Cancel any pending operations
    abortController.abort();
    // Clear timers
    clearTimeout(timeoutId);
    // Remove listeners
    unsubscribe();
  };
}, []);
```

## 🧪 Testing Strategy

### Unit Testing
```javascript
// Component testing with React Native Testing Library
import { render, fireEvent } from '@testing-library/react-native';

test('renders school card correctly', () => {
  const school = { id: '1', name: 'Test School', status: 'active' };
  const { getByText } = render(<SchoolCard school={school} />);
  expect(getByText('Test School')).toBeTruthy();
});
```

### Integration Testing
```javascript
// Store testing
import { useSchoolStore } from '../configuration/schoolStore';

test('adds school successfully', async () => {
  const { addSchool, schools } = useSchoolStore.getState();
  await addSchool({ name: 'New School' });
  expect(schools).toHaveLength(1);
  expect(schools[0].name).toBe('New School');
});
```

## 📱 Platform-Specific Considerations

### iOS Specific
```javascript
// Safe area handling
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Screen = () => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Content */}
    </View>
  );
};
```

### Android Specific
```javascript
// Status bar configuration
import { StatusBar } from 'expo-status-bar';

<StatusBar 
  style="light" 
  backgroundColor="transparent" 
  translucent={true} 
/>
```

## 🚀 Deployment

### Expo Application Services (EAS)
```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### Build Commands
```bash
# Development build
eas build --profile development --platform all

# Production build
eas build --profile production --platform all

# Submit to app stores
eas submit --platform all
```

## 🔮 Future Enhancements

### Planned Mobile Features
- **Offline-first architecture:** Complete offline functionality with sync
- **Push notifications:** Real-time alerts for low stock and orders
- **Barcode scanning:** Camera integration for inventory tracking
- **Biometric authentication:** Face ID / Fingerprint login
- **Voice commands:** Accessibility improvements
- **AR features:** Augmented reality for inventory visualization

### Technical Improvements
- **Code splitting:** Lazy loading of screens and components
- **Background sync:** Periodic data synchronization
- **Advanced caching:** Intelligent cache management
- **Performance monitoring:** Crash reporting and analytics
- **Automated testing:** E2E testing with Detox

## 🔄 Cross-Platform Synchronization

### Data Consistency Patterns
```javascript
// Server-first approach for critical data
const fetchSchoolData = async (schoolId) => {
  try {
    // Always fetch from server for latest data
    const docRef = doc(db, 'schools', schoolId);
    const docSnap = await getDoc(docRef, { source: 'server' });
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (error) {
    // Fallback to cache if server fails
    const cachedDoc = await getDoc(docRef, { source: 'cache' });
    if (cachedDoc.exists()) {
      return { id: cachedDoc.id, ...cachedDoc.data() };
    }
    throw error;
  }
};
```

### Real-time Updates
```javascript
// Firestore real-time listeners
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'schools'),
    (snapshot) => {
      const schools = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchools(schools);
    },
    (error) => {
      console.error('Real-time update error:', error);
    }
  );

  return () => unsubscribe();
}, []);
```

## 📱 Screen-by-Screen Purpose Guide

### What Each Screen Does and Why You Need It

#### 🏠 Dashboard Screen
**What It Does:** Your mobile command center - gives you instant access to key business metrics while you're on the go.

**Why You Need It:**
- Quick overview of total inventory and revenue while away from office
- See which schools need attention (low stock alerts, pending orders)
- Monitor daily activity feed (recent allocations, new orders)
- View mobile-optimized charts that you can scroll through horizontally
- Get instant notifications about urgent issues

**Who Uses It:** Field staff checking status between school visits, managers monitoring business remotely

**Real-World Example:** "I'm driving between schools and can quickly see that we're running low on Size 32 shirts - I'll prioritize visiting schools that need those sizes."

---

#### 🏫 Schools Screen
**What It Does:** Manages your school relationships and student information while you're in the field.

**Why You Need It:**
- Add new schools instantly when you visit them (just tap and enter name)
- View student lists for the school you're currently visiting
- Check uniform requirements specific to each school
- See which students still need uniforms (deficit tracking)
- Access school contact information and notes

**Who Uses It:** Field staff visiting schools, managers meeting with school administrators

**Real-World Example:** "I'm at Pamushana High School and can see that 12 Form 1 boys still need their second shirt - I have enough stock in my vehicle to fulfill this."

---

#### 📦 Inventory Screen
**What It Does:** Real-time inventory management optimized for mobile use in the field.

**Why You Need It:**
- Check current stock levels while loading your vehicle
- Allocate uniforms to students directly from your phone
- Update inventory as you distribute items at schools
- Scan or manually enter uniform distributions
- See what's running low and needs restocking

**Who Uses It:** Field staff distributing uniforms, warehouse staff checking stock

**Real-World Example:** "I just gave 5 blue shirts to students at this school - I'll update the inventory right now so the office knows our current stock levels."

---

#### 📊 Reports Screen
**What It Does:** Mobile-friendly analytics to help make decisions while you're away from the office.

**Why You Need It:**
- View which uniform types are most in demand
- See performance by school while visiting them
- Check trends to plan your next school visits
- Generate quick reports for school administrators
- Identify which schools need priority attention

**Who Uses It:** Field managers analyzing performance, staff planning efficient routes

**Real-World Example:** "The mobile chart shows that this region's schools prefer blue over white shirts 3:1 - I'll adjust my vehicle inventory accordingly."

---

#### 📋 Batch Management Screen
**What It Does:** Manages supplier deliveries and bulk inventory while you're receiving goods.

**Why You Need It:**
- Record new deliveries directly when they arrive
- Check batch details while inspecting received goods
- Convert bulk items to sellable inventory on-site
- Track which batches are allocated to which locations
- Manage quality control and supplier issues

**Who Uses It:** Warehouse staff receiving deliveries, managers overseeing inventory

**Real-World Example:** "The supplier just delivered 500 shirts - I can record this batch immediately and start converting them to sellable inventory while I inspect the quality."

---

#### 👤 Profile Screen
**What It Does:** Manages your account and app settings for mobile use.

**Why You Need It:**
- Update your contact information for school communications
- Change password for security
- View your access permissions and role
- Manage notification preferences for field work
- Access help and support information

**Who Uses It:** All mobile users for account management

**Real-World Example:** "I want to enable push notifications so I get alerts about urgent stock issues while I'm visiting schools."

---

### Mobile-Specific Advantages

**Real-Time Field Updates:**
- Update inventory immediately when distributing uniforms
- Add schools on-the-spot during visits
- Sync data instantly with office staff

**Offline Capability:**
- Continue working when internet is poor at remote schools
- Data syncs automatically when connection returns
- Critical information cached locally

**Touch-Optimized Interface:**
- Large buttons for easy use while standing/walking
- Swipe gestures for quick navigation
- Voice input for hands-free data entry

**Location-Aware Features:**
- GPS integration for school visit tracking
- Route optimization for efficient school visits
- Location-based inventory suggestions

### How Mobile and Web Work Together

**Seamless Synchronization:**
"When I allocate uniforms using my phone at a school, the office staff immediately see the updated stock levels on their computer. When they add a new school on the web app, I can see it instantly on my phone."

**Complementary Workflows:**
- **Office (Web):** Strategic planning, detailed reports, bulk operations
- **Field (Mobile):** Real-time updates, student interactions, immediate problem-solving

**Real-World Integration:**
"The office manager plans the day's deliveries on the web app, I receive the list on my mobile app, update inventory as I visit schools, and the office tracks my progress in real-time."

## 📚 Related Documentation

- [Firebase Data Architecture](../FIREBASE_DATA_ARCHITECTURE.md)
- [Web App README](../web/README.md)
- [Inventory Flow Design](../INVENTORY_FLOW_DESIGN.md)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [NativeWind](https://www.nativewind.dev/)

## 🤝 Contributing

### Development Guidelines
1. **Follow React Native best practices**
2. **Maintain cross-platform compatibility**
3. **Use TypeScript for type safety** (future enhancement)
4. **Follow the established component patterns**
5. **Test on both iOS and Android**
6. **Maintain data structure consistency with web app**

### Code Style
```javascript
// Use functional components with hooks
const SchoolScreen = ({ navigation }) => {
  const [schools, setSchools] = useState([]);
  
  useEffect(() => {
    fetchSchools();
  }, []);
  
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};

// Use StyleSheet for performance
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  }
});
```

## 📞 Support

For technical issues or questions about the mobile application:

1. **Architecture questions:** Refer to FIREBASE_DATA_ARCHITECTURE.md
2. **Cross-platform sync issues:** Check data structure consistency
3. **Performance issues:** Review optimization guidelines
4. **Build issues:** Check Expo and EAS configuration
5. **Firebase issues:** Verify configuration and permissions

## 🏆 Key Achievements

- **Successful Firebase Integration:** Resolved React Native v10+ compatibility
- **Cross-Platform Data Sync:** Achieved real-time synchronization with web app
- **Mobile-Optimized UI:** Created touch-friendly interfaces with smooth animations
- **Performance Optimization:** Implemented efficient rendering and memory management
- **Comprehensive State Management:** Built robust Zustand stores with persistence
- **Modern Development Stack:** Leveraged latest React Native and Expo features

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
