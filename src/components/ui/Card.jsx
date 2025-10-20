import React from 'react';
import { View, Text, Animated } from 'react-native';
import { cn } from '../../utils/cn';

const Card = React.forwardRef(({ style, animated = false, delay = 0, ...props }, ref) => {
  const fadeAnim = React.useRef(new Animated.Value(animated ? 0 : 1)).current;
  const scaleAnim = React.useRef(new Animated.Value(animated ? 0.95 : 1)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          delay: delay,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [animated, delay]);

  const CardComponent = animated ? Animated.View : View;

  return (
    <CardComponent
      ref={ref}
      style={[
        {
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
          ...(animated && {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          })
        },
        style
      ]}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ style, ...props }, ref) => (
  <View
    ref={ref}
    style={[
      {
        flexDirection: 'column',
        gap: 6,
        padding: 24
      },
      style
    ]}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ children, style, ...props }, ref) => (
  <Text
    ref={ref}
    style={[
      {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: -0.5,
        color: '#0f172a'
      },
      style
    ]}
    {...props}
  >
    {children}
  </Text>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ children, style, ...props }, ref) => (
  <Text
    ref={ref}
    style={[
      {
        fontSize: 14,
        color: '#64748b'
      },
      style
    ]}
    {...props}
  >
    {children}
  </Text>
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ style, ...props }, ref) => (
  <View 
    ref={ref} 
    style={[
      {
        padding: 24,
        paddingTop: 0
      },
      style
    ]} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ style, ...props }, ref) => (
  <View
    ref={ref}
    style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingTop: 0
      },
      style
    ]}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
