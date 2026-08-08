// Simple email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 24-hour time regex pattern (HH:mm)
const TIME_REGEX = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

// YYYY-MM-DD format regex
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Checks if value is a string and is not empty when trimmed.
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks if the email is a valid format.
 */
function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

/**
 * Checks if time is in HH:mm 24-hour format.
 */
function isValidTime(time) {
  return typeof time === 'string' && TIME_REGEX.test(time.trim());
}

/**
 * Checks if date string is YYYY-MM-DD and represents a real calendar date.
 */
function isValidDate(date) {
  if (typeof date !== 'string' || !DATE_REGEX.test(date.trim())) {
    return false;
  }
  
  const trimmed = date.trim();
  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Month ranges 1-12, Day ranges 1-31
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Create date and verify JS date object components match input (avoids auto-wrapping/overflowing invalid dates)
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isValidTime,
  isValidDate
};
