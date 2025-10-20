// Light theme colors
const lightColors = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: '#ffffff',
  cardForeground: '#0a0a0a',
  popover: '#ffffff',
  popoverForeground: '#0a0a0a',
  primary: '#dc2626',
  primaryForeground: '#fef2f2',
  secondary: '#f5f5f5',
  secondaryForeground: '#171717',
  muted: '#f5f5f5',
  mutedForeground: '#737373',
  accent: '#f5f5f5',
  accentForeground: '#171717',
  destructive: '#ef4444',
  destructiveForeground: '#fafafa',
  border: '#e5e5e5',
  input: '#e5e5e5',
  ring: '#dc2626',
  
  // Chart colors
  chart1: '#ea580c',
  chart2: '#059669',
  chart3: '#0f172a',
  chart4: '#eab308',
  chart5: '#dc2626',
};

// Dark theme colors matching the CSS variables
const darkColors = {
  background: '#000000',        // Pure black background
  foreground: '#ffffff',        // Pure white text for maximum brightness
  card: '#1a1a1a',             // Darker gray cards to stand out from background
  cardForeground: '#ffffff',    // Pure white text on cards
  popover: '#1a1a1a',
  popoverForeground: '#ffffff',
  primary: '#dc2626',
  primaryForeground: '#fef2f2',
  secondary: '#2a2a2a',
  secondaryForeground: '#ffffff',
  muted: '#1f1f1f',            // Darker muted backgrounds
  mutedForeground: '#d4d4d4',  // Brighter secondary text
  accent: '#2a2a2a',
  accentForeground: '#ffffff',
  destructive: '#7f1d1d',
  destructiveForeground: '#ffffff',
  border: '#333333',           // More visible borders
  input: '#2a2a2a',
  ring: '#dc2626',
  
  // Chart colors
  chart1: '#ef4444',
  chart2: '#10b981',
  chart3: '#f59e0b',
  chart4: '#8b5cf6',
  chart5: '#f97316',
};

// Function to get colors based on theme
export const getColors = (isDarkMode = false) => {
  return isDarkMode ? darkColors : lightColors;
};

// Default export for backward compatibility
export const colors = lightColors;
