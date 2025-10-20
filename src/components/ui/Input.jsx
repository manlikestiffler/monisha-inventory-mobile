import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({ type, error, style, ...props }, ref) => {
  return (
    <View style={{ width: '100%' }}>
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        style={[
          {
            height: 40,
            width: '100%',
            borderRadius: 6,
            borderWidth: 1,
            borderColor: error ? '#ef4444' : '#d1d5db',
            backgroundColor: 'white',
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 14,
            color: '#111827'
          },
          style
        ]}
        placeholderTextColor="#6b7280"
        {...props}
      />
      {error && (
        <Text style={{ fontSize: 14, color: '#dc2626', marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
});

Input.displayName = "Input";

export { Input };
