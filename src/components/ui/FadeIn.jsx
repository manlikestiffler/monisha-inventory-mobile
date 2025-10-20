import React from 'react';
import { Animated } from 'react-native';

/**
 * FadeIn - A component that provides smooth fade-in animations
 * Makes screens and elements appear smoothly
 */
const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 500,
  style,
  ...props 
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY }]
        },
        style
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export default FadeIn;
