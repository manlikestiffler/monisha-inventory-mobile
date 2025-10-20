import React from 'react';
import { View, Text } from 'react-native';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-slate-50",
        secondary: "border-transparent bg-slate-100 text-slate-900",
        destructive: "border-transparent bg-red-500 text-slate-50",
        success: "border-transparent bg-green-500 text-slate-50",
        warning: "border-transparent bg-yellow-500 text-slate-50",
        outline: "text-slate-950 border-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ variant = 'default', children, style, ...props }) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: '#f1f5f9', borderColor: 'transparent' };
      case 'destructive':
        return { backgroundColor: '#ef4444', borderColor: 'transparent' };
      case 'success':
        return { backgroundColor: '#10b981', borderColor: 'transparent' };
      case 'warning':
        return { backgroundColor: '#f59e0b', borderColor: 'transparent' };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: '#e2e8f0', borderWidth: 1 };
      default:
        return { backgroundColor: '#0f172a', borderColor: 'transparent' };
    }
  };

  const getTextColor = () => {
    if (variant === 'outline' || variant === 'secondary') {
      return '#0f172a';
    }
    return 'white';
  };

  return (
    <View 
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 2,
          ...getVariantStyles()
        },
        style
      ]} 
      {...props}
    >
      <Text style={{
        fontSize: 12,
        fontWeight: '600',
        color: getTextColor()
      }}>
        {children}
      </Text>
    </View>
  );
}

export { Badge, badgeVariants };
