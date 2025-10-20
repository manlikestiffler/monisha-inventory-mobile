/**
 * Utility functions for date formatting and handling
 */

/**
 * Safely formats a date from various input types
 * @param {Date|string|Object|number} dateInput - Date input (Firebase timestamp, string, Date object, or timestamp)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return 'Not available';

  let date;

  try {
    // Handle Firebase Timestamp objects
    if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
      date = new Date(dateInput.seconds * 1000);
    }
    // Handle millisecond timestamps
    else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    }
    // Handle Date objects
    else if (dateInput instanceof Date) {
      date = dateInput;
    }
    // Handle string dates
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    }
    else {
      return 'Invalid date';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Default formatting options
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };

    return date.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * Formats date for display in lists (shorter format)
 * @param {Date|string|Object|number} dateInput - Date input
 * @returns {string} Short formatted date
 */
export const formatShortDate = (dateInput) => {
  return formatDate(dateInput, { month: 'short', day: 'numeric' });
};

/**
 * Formats date with time
 * @param {Date|string|Object|number} dateInput - Date input
 * @returns {string} Formatted date with time
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return 'Not available';

  let date;

  try {
    // Handle Firebase Timestamp objects
    if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
      date = new Date(dateInput.seconds * 1000);
    }
    // Handle other date formats
    else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('DateTime formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * Gets relative time (e.g., "2 days ago")
 * @param {Date|string|Object|number} dateInput - Date input
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateInput) => {
  if (!dateInput) return 'Unknown time';

  let date;

  try {
    // Handle Firebase Timestamp objects
    if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
      date = new Date(dateInput.seconds * 1000);
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    // For older dates, return formatted date
    return formatDate(date);
  } catch (error) {
    console.warn('Relative time formatting error:', error);
    return 'Unknown time';
  }
};
