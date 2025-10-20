import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SkeletonLoader = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: '#f0f0f0',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          flex: 1,
          opacity,
        }}
      >
        <LinearGradient
          colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton Card Component
export const SkeletonCard = ({ style }) => (
  <View
    style={[
      {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      style,
    ]}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <SkeletonLoader width="70%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="50%" height={12} />
      </View>
    </View>
    <SkeletonLoader width="100%" height={12} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="80%" height={12} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="60%" height={12} />
  </View>
);

// Skeleton Metric Card Component
export const SkeletonMetricCard = ({ style }) => (
  <View
    style={[
      {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      },
      style,
    ]}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <SkeletonLoader width={32} height={32} borderRadius={16} style={{ marginRight: 12 }} />
      <SkeletonLoader width="40%" height={14} />
    </View>
    <SkeletonLoader width="60%" height={24} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="30%" height={12} />
  </View>
);

// Skeleton List Component
export const SkeletonList = ({ count = 5, renderItem = () => <SkeletonCard /> }) => (
  <View>
    {Array.from({ length: count }, (_, index) => (
      <View key={index}>
        {renderItem()}
      </View>
    ))}
  </View>
);

export default SkeletonLoader;
