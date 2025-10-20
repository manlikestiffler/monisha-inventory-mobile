import React from 'react';
import { TouchableOpacity, Text, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../utils/cn';
import { hapticFeedback } from '../../utils/haptics';
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-700",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "bg-transparent border border-slate-200 text-slate-900 hover:bg-slate-100",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
        link: "bg-transparent text-slate-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ 
  variant = 'default', 
  size = 'default', 
  children, 
  disabled = false,
  loading = false,
  onPress,
  style,
  gradient = false,
  ...props 
}, ref) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    hapticFeedback.buttonPress();
    onPress?.();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return { 
          backgroundColor: '#ef4444',
          shadowColor: '#ef4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4
        };
      case 'outline':
        return { 
          backgroundColor: 'transparent', 
          borderWidth: 2, 
          borderColor: '#6366f1' 
        };
      case 'secondary':
        return { 
          backgroundColor: '#f1f5f9',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'link':
        return { backgroundColor: 'transparent' };
      default:
        return { 
          backgroundColor: '#6366f1',
          shadowColor: '#6366f1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { height: 38, paddingHorizontal: 16, borderRadius: 10 };
      case 'lg':
        return { height: 52, paddingHorizontal: 32, borderRadius: 12 };
      case 'icon':
        return { height: 44, width: 44, borderRadius: 10 };
      default:
        return { height: 44, paddingHorizontal: 20, borderRadius: 10 };
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return '#6366f1';
    }
    if (variant === 'ghost' || variant === 'secondary' || variant === 'link') {
      return '#1f2937';
    }
    return 'white';
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 17;
      default:
        return 15;
    }
  };

  const getGradientColors = () => {
    switch (variant) {
      case 'destructive':
        return ['#ef4444', '#dc2626'];
      default:
        return ['#6366f1', '#4f46e5'];
    }
  };

  const buttonContent = (
    <>
      {loading ? (
        <Text style={{ color: getTextColor(), fontSize: 18 }}>⟳</Text>
      ) : (
        <Text style={{
          textAlign: 'center',
          fontWeight: '700',
          color: getTextColor(),
          fontSize: getFontSize(),
          letterSpacing: 0.5
        }}>
          {children}
        </Text>
      )}
    </>
  );

  if (gradient && variant !== 'outline' && variant !== 'ghost' && variant !== 'link') {
    return (
      <Animated.View
        style={[{
          transform: [{ scale: scaleAnim }]
        }]}
      >
        <TouchableOpacity
          ref={ref}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.9}
          {...props}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                ...getSizeStyles(),
                opacity: disabled || loading ? 0.6 : 1,
                shadowColor: getGradientColors()[0],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4
              },
              style
            ]}
          >
            {buttonContent}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[{
        transform: [{ scale: scaleAnim }]
      }]}
    >
      <TouchableOpacity
        ref={ref}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            ...getVariantStyles(),
            ...getSizeStyles(),
            opacity: disabled || loading ? 0.6 : 1
          },
          style
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
