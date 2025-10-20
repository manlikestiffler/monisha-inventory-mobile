import React from 'react';
import { View, Animated } from 'react-native';
import { cn } from '../../utils/cn';

const LoadingSpinner = ({ size = 40, color = '#ef4444', style }) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 16, height: 16 };
      case 'large':
        return { width: 48, height: 48 };
      default:
        return { width: 32, height: 32 };
    }
  };

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        style={[
          {
            borderWidth: 2,
            borderColor: '#e5e7eb',
            borderTopColor: '#ef4444',
            borderRadius: 50,
            ...getSizeStyles()
          },
          { transform: [{ rotate: spin }] }
        ]}
      />
    </View>
  );
};

export { LoadingSpinner };
export default LoadingSpinner;
