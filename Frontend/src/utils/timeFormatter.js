/**
 * Time Formatting Utilities
 * Converts 24-hour format to 12-hour AM/PM format
 */

/**
 * Convert 24-hour time to 12-hour AM/PM format
 * @param {string} time24 - Time in 24-hour format (e.g., "13:00", "09:30")
 * @returns {string} Time in 12-hour AM/PM format (e.g., "1:00 PM", "9:30 AM")
 */
export const format12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Format time range with AM/PM
 * @param {string} startTime - Start time in 24-hour format
 * @param {string} endTime - End time in 24-hour format
 * @returns {string} Formatted range (e.g., "9:00 AM - 12:00 PM")
 */
export const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  
  return `${format12Hour(startTime)} - ${format12Hour(endTime)}`;
};

/**
 * Format date and time range
 * @param {Date|string} date - Date object or string
 * @param {string} startTime - Start time in 24-hour format
 * @param {string} endTime - End time in 24-hour format
 * @returns {string} Formatted string (e.g., "October 23, 2025 • 9:00 AM - 12:00 PM")
 */
export const formatDateTime = (date, startTime, endTime) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const dateStr = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const timeStr = formatTimeRange(startTime, endTime);
  
  return `${dateStr} • ${timeStr}`;
};

/**
 * Convert 12-hour time to 24-hour format (for input)
 * @param {string} time12 - Time in 12-hour format (e.g., "1:00 PM")
 * @returns {string} Time in 24-hour format (e.g., "13:00")
 */
export const format24Hour = (time12) => {
  if (!time12) return '';
  
  const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = time12.match(timeRegex);
  
  if (!match) return time12;
  
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Get duration in hours and minutes
 * @param {string} startTime - Start time in 24-hour format
 * @param {string} endTime - End time in 24-hour format
 * @returns {string} Duration (e.g., "3 hours", "2.5 hours")
 */
export const getDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  return `${hours}h ${minutes}m`;
};

/**
 * Check if time is in valid 24-hour format
 * @param {string} time - Time string
 * @returns {boolean} True if valid
 */
export const isValid24HourTime = (time) => {
  if (!time) return false;
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
};

/**
 * Format time for display with contextual AM/PM
 * @param {string} time - Time in 24-hour format
 * @param {boolean} showPeriod - Always show AM/PM (default: true)
 * @returns {string} Formatted time
 */
export const formatTime = (time, showPeriod = true) => {
  return format12Hour(time);
};

export default {
  format12Hour,
  format24Hour,
  formatTimeRange,
  formatDateTime,
  getDuration,
  isValid24HourTime,
  formatTime
};

