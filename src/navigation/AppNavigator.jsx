import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthWrapper from '../components/AuthWrapper';
import { useTheme } from '../contexts/ThemeContext';
import { getColors } from '../constants/colors';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import BatchScreen from '../screens/BatchScreen';
import CreateBatchScreen from '../screens/CreateBatchScreen';
import BatchDetailsScreen from '../screens/BatchDetailsScreen';
import ProductScreen from '../screens/ProductScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CreateProductScreen from '../screens/CreateProductScreen';
import OrderScreen from '../screens/OrderScreen';
import SchoolScreen from '../screens/SchoolScreen';
import SchoolDetailsScreen from '../screens/SchoolDetailsScreen';
import StudentDetailsScreen from '../screens/StudentDetailsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminSuperAdminScreen from '../screens/AdminSuperAdminScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ name, color, size }) {
  const icons = {
    Dashboard: 'home-outline',
    Batches: 'cube-outline',
    Products: 'bag-outline',
    Orders: 'clipboard-outline',
    Schools: 'school-outline',
    Reports: 'bar-chart-outline',
    Settings: 'settings-outline',
  };
  
  const iconName = icons[name];
  if (!iconName) {
    return null;
  }
  return <Ionicons name={iconName} color={color} size={size} />;
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => (
          <View style={{
            padding: 4,
            borderRadius: 12,
            backgroundColor: focused ? `${colors.primary}20` : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 32,
            minWidth: 32
          }}>
            <TabIcon name={route.name} color={focused ? colors.primary : color} size={20} />
          </View>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 20),
          paddingTop: 15,
          height: 75 + Math.max(insets.bottom, 20),
          borderRadius: 0,
          marginHorizontal: 0,
          marginBottom: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDarkMode ? 0.3 : 0.15,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          color: colors.foreground,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarShowLabel: false }}
      />
      <Tab.Screen 
        name="Batches" 
        component={BatchScreen}
        options={{ title: 'Batch Inventory', tabBarShowLabel: false }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductScreen}
        options={{ title: 'Product Inventory', tabBarShowLabel: false }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrderScreen}
        options={{ title: 'Order Management', tabBarShowLabel: false }}
      />
      <Tab.Screen 
        name="Schools" 
        component={SchoolScreen}
        options={{ title: 'School Management', tabBarShowLabel: false }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reports & Analytics', tabBarShowLabel: false }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings', tabBarShowLabel: false }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="CreateBatch" component={CreateBatchScreen} />
      <Stack.Screen name="BatchDetails" component={BatchDetailsScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
      <Stack.Screen name="SchoolDetails" component={SchoolDetailsScreen} />
      <Stack.Screen name="StudentDetails" component={StudentDetailsScreen} />
      <Stack.Screen name="AdminSuperAdmin" component={AdminSuperAdminScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <AuthWrapper>
      <MainNavigator />
    </AuthWrapper>
  );
}
