import React, { useRef, useState } from 'react';
import { TouchableOpacity, Animated, View } from 'react-native';
import { cn } from '../../utils/cn';
import { hapticFeedback } from '../../utils/haptics';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';

const FloatingActionButton = ({ 
  icon: Icon, 
  onPress, 
  size = 56, 
  backgroundColor,
  style,
  children,
  ...props 
}) => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const bgColor = backgroundColor || colors.primary;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;
  const [ripples, setRipples] = useState([]);

  const handlePressIn = () => {
    // Haptic feedback on press
    hapticFeedback.fabPress();
    
    // Scale down animation
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

    // Enhanced shadow animation
    Animated.timing(shadowAnim, {
      toValue: 1.5,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    // Create ripple effect
    const newRipple = {
      id: Date.now(),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0.6),
    };
    
    setRipples(prev => [...prev, newRipple]);

    // Ripple animation
    Animated.parallel([
      Animated.timing(newRipple.scale, {
        toValue: 4,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(newRipple.opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    });

    // Scale back and rotate animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  const shadowScale = shadowAnim.interpolate({
    inputRange: [1, 1.5],
    outputRange: [8, 16],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }, { rotate }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{ position: 'relative' }}
      >
        <View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              backgroundColor: bgColor,
            },
            style
          ]}
        >
          {/* Ripple Effects */}
          {ripples.map((ripple) => (
            <Animated.View
              key={ripple.id}
              style={{
                position: 'absolute',
                width: size / 4,
                height: size / 4,
                borderRadius: size / 8,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                transform: [{ scale: ripple.scale }],
                opacity: ripple.opacity,
              }}
            />
          ))}
          
          {/* Content */}
          <View style={{ zIndex: 1 }}>
            {Icon ? <Icon size={size * 0.4} color="white" /> : children}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export { FloatingActionButton };
export default FloatingActionButton;
