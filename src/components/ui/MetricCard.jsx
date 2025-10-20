import React from 'react';
import { View, Text, Animated } from 'react-native';
import { cn } from '../../utils/cn';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  backgroundColor, 
  textColor = 'text-white',
  delay = 0 
}) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const bgColor = backgroundColor || colors.card;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        flex: 1,
        marginHorizontal: 8,
        marginBottom: 16
      }}
    >
      <View
        style={{
          backgroundColor: bgColor,
          borderRadius: 16,
          padding: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 20, padding: 8 }}>
            <Icon size={24} color="white" />
          </View>
        </View>
        
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4, color: 'white' }}>
          {value}
        </Text>
        
        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4, color: 'white', opacity: 0.9 }}>
          {title}
        </Text>
        
        {subtitle && (
          <Text style={{ fontSize: 12, color: 'white', opacity: 0.7 }}>
            {subtitle}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

export { MetricCard };
export default MetricCard;
