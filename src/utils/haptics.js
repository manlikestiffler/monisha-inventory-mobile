// Temporarily disable haptics to debug displayName error
// import * as Haptics from 'expo-haptics';

// Haptic feedback utility functions
export const hapticFeedback = {
  // Light impact for subtle interactions
  light: () => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Medium impact for standard button presses
  medium: () => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Heavy impact for important actions
  heavy: () => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  // Success feedback for completed actions
  success: () => {
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Warning feedback for caution actions
  warning: () => {
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  // Error feedback for failed actions
  error: () => {
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  // Selection feedback for picker/selector changes
  selection: () => {
    // Haptics.selectionAsync();
  },

  // Custom feedback combinations
  buttonPress: () => {
    hapticFeedback.medium();
  },

  cardTap: () => {
    hapticFeedback.light();
  },

  fabPress: () => {
    hapticFeedback.heavy();
  },

  swipeAction: () => {
    hapticFeedback.light();
  },

  longPress: () => {
    hapticFeedback.heavy();
  },

  orderComplete: () => {
    hapticFeedback.success();
  },

  lowStock: () => {
    hapticFeedback.warning();
  },

  deleteAction: () => {
    hapticFeedback.error();
  }
};

export default hapticFeedback;
