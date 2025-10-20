# Mobile Text Color Guide for Dark Mode

## Color Mapping - Hardcoded to Theme-Aware

Replace all hardcoded dark text colors with theme-aware colors from `getColors(isDarkMode)`:

### Primary Text (Headings, Important Text)
```javascript
// ❌ OLD - Hardcoded dark colors
color: '#0a0a0a'
color: '#111827'
color: '#1f2937'
color: '#171717'

// ✅ NEW - Theme-aware
color: colors.foreground  // White in dark mode, dark in light mode
```

### Card/Section Text
```javascript
// ❌ OLD
color: '#0a0a0a'
color: '#1f2937'

// ✅ NEW
color: colors.cardForeground  // White text on cards in dark mode
```

### Secondary Text (Descriptions, Subtitles)
```javascript
// ❌ OLD
color: '#374151'
color: '#4b5563'
color: '#6b7280'

// ✅ NEW
color: colors.mutedForeground  // Bright gray (#d4d4d4) in dark mode
```

### Tertiary Text (Very Light/Placeholder)
```javascript
// ❌ OLD
color: '#9ca3af'
color: '#d1d5db'

// ✅ NEW
color: colors.mutedForeground  // Consistent secondary text
// OR keep slightly darker if needed: '#a1a1a1'
```

## Complete Color Palette Reference

### Light Mode
```javascript
foreground: '#0a0a0a'          // Nearly black
cardForeground: '#0a0a0a'      // Nearly black
mutedForeground: '#737373'     // Medium gray
```

### Dark Mode
```javascript
foreground: '#ffffff'          // Pure white ⭐
cardForeground: '#ffffff'      // Pure white ⭐
mutedForeground: '#d4d4d4'     // Bright gray ⭐
secondaryForeground: '#ffffff' // Pure white
accentForeground: '#ffffff'    // Pure white
```

## Usage Pattern

```javascript
// 1. Import theme utilities
import { getColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';

// 2. Get colors in component
const { isDarkMode } = useTheme();
const colors = getColors(isDarkMode);

// 3. Use in styles
<Text style={{ color: colors.foreground }}>Main Heading</Text>
<Text style={{ color: colors.cardForeground }}>Card Content</Text>
<Text style={{ color: colors.mutedForeground }}>Subtitle</Text>
```

## Common Patterns to Replace

### Headers/Titles
```javascript
// Before
fontSize: 24, fontWeight: '700', color: '#1f2937'

// After
fontSize: 24, fontWeight: '700', color: colors.foreground
```

### Body Text on Cards
```javascript
// Before
fontSize: 14, color: '#374151'

// After
fontSize: 14, color: colors.cardForeground
```

### Labels/Captions
```javascript
// Before
fontSize: 12, color: '#6b7280'

// After
fontSize: 12, color: colors.mutedForeground
```

## Status-Based Colors (Keep as-is)

Some colors are semantic and should remain hardcoded:

```javascript
// Success - Green
color: '#10b981'
color: '#059669'

// Warning - Yellow/Orange
color: '#f59e0b'
color: '#eab308'

// Error/Destructive - Red
color: '#ef4444'
color: '#dc2626'

// Info - Blue
color: '#3b82f6'
color: '#2563eb'
```

## Quick Replace Commands

Search for these patterns and replace:
- `color: '#1f2937'` → `color: colors.foreground`
- `color: '#374151'` → `color: colors.cardForeground`
- `color: '#6b7280'` → `color: colors.mutedForeground`
- `color: '#9ca3af'` → `color: colors.mutedForeground`
- `color: '#111827'` → `color: colors.foreground`

## Priority Files (Most Text)

1. **DashboardScreen.jsx** - 6 matches
2. **BatchScreen.jsx** - 7 matches
3. **CreateBatchScreen.jsx** - 9 matches
4. **StudentDetailsScreen.jsx** - 12 matches
5. **SchoolDetailsScreen.jsx** - 13 matches
6. **OrderScreen.jsx** - 13 matches
7. **ProductScreen.jsx** - 30 matches
8. **ProductDetailsScreen.jsx** - 34 matches
9. **BatchDetailsScreen.jsx** - 40 matches
10. **ReportsScreen.jsx** - 48 matches
11. **CreateProductScreen.jsx** - 62 matches

## Implementation Strategy

1. Fix backgrounds first (DONE ✅)
2. Update text colors in components (StudentManagementSection DONE ✅)
3. Update text colors in high-priority screens
4. Test each screen in dark mode
5. Verify text is readable

## Notes

- White text (#ffffff) in dark mode is readable on dark backgrounds
- Avoid pure black text (#000000) in dark mode - use colors.foreground
- Icons should also use theme-aware colors
- Maintain semantic colors (red for errors, green for success)
