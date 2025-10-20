import React from 'react';
import { View, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedCard = ({ 
  children, 
  gradient = null,
  onPress,
  delay = 0,
  style,
  ...props 
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: scaleAnim }
    ],
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  const cardContent = (
    <Animated.View
      style={[
        animatedStyle, 
        {
          borderRadius: 16,
          backgroundColor: gradient ? 'transparent' : 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        },
        style
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );

  if (gradient) {
    return (
      <CardWrapper onPress={onPress} activeOpacity={0.95}>
        <Animated.View style={[animatedStyle, style]}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}
            {...props}
          >
            {children}
          </LinearGradient>
        </Animated.View>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper onPress={onPress} activeOpacity={0.95}>
      {cardContent}
    </CardWrapper>
  );
};

export { AnimatedCard };
export default AnimatedCard;
