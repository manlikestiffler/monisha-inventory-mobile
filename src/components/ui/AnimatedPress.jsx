import React from 'react';
import { TouchableOpacity, Animated } from 'react-native';

/**
 * AnimatedPress - A wrapper component that adds scale animation to TouchableOpacity
 * Makes the app feel more alive with subtle press feedback
 */
const AnimatedPress = ({ 
  children, 
  onPress, 
  style, 
  scale = 0.96,
  disabled = false,
  ...props 
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.9}
      {...props}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }]
          },
          style
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedPress;
