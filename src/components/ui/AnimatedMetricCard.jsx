import React from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../utils/cn';

const AnimatedMetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient = ['#ef4444', '#764ba2'],
  textColor = 'text-white',
  delay = 0,
  onPress
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const iconRotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          delay: delay + 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 600,
        delay: delay + 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const iconRotate = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim }
        ],
        flex: 1,
        marginHorizontal: 8,
        marginBottom: 16
      }}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 24,
          shadowColor: gradient[0],
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 15,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Animated.View
            style={{
              transform: [{ rotate: iconRotate }],
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 16,
              padding: 12
            }}
          >
            <Icon size={28} color="white" />
          </Animated.View>
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, fontWeight: '500' }}>Live</Text>
          </View>
        </View>
        
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: 'white' }}>
          {value}
        </Text>
        
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: 'white', opacity: 0.95 }}>
          {title}
        </Text>
        
        {subtitle && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 10, width: 8, height: 8, marginRight: 8 }} />
            <Text style={{ fontSize: 14, color: 'white', opacity: 0.8 }}>
              {subtitle}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

export { AnimatedMetricCard };
export default AnimatedMetricCard;
