import React from 'react';
import { View, Animated, TouchableOpacity } from 'react-native';

const GlassCard = ({ 
  children, 
  onPress,
  delay = 0,
  style,
  ...props 
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper onPress={onPress} activeOpacity={0.9}>
      <Animated.View style={[animatedStyle, style]}>
        <View
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 10,
          }}
          {...props}
        >
          {children}
        </View>
      </Animated.View>
    </CardWrapper>
  );
};

export { GlassCard };
export default GlassCard;
