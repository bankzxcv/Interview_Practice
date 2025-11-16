/**
 * String utility functions
 */

class StringUtils {
  /**
   * Capitalize the first letter of a string
   * @param {string} str - Input string
   * @returns {string} Capitalized string
   */
  capitalize(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Reverse a string
   * @param {string} str - Input string
   * @returns {string} Reversed string
   */
  reverse(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str.split('').reverse().join('');
  }

  /**
   * Check if a string is a palindrome
   * @param {string} str - Input string
   * @returns {boolean} True if palindrome
   */
  isPalindrome(str) {
    if (!str || typeof str !== 'string') {
      return false;
    }
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
  }

  /**
   * Count words in a string
   * @param {string} str - Input string
   * @returns {number} Word count
   */
  wordCount(str) {
    if (!str || typeof str !== 'string') {
      return 0;
    }
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Convert string to title case
   * @param {string} str - Input string
   * @returns {string} Title case string
   */
  toTitleCase(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str.toLowerCase().split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Truncate string to specified length
   * @param {string} str - Input string
   * @param {number} length - Maximum length
   * @param {string} suffix - Suffix to add (default: '...')
   * @returns {string} Truncated string
   */
  truncate(str, length, suffix = '...') {
    if (!str || typeof str !== 'string') {
      return '';
    }
    if (str.length <= length) {
      return str;
    }
    return str.substring(0, length - suffix.length) + suffix;
  }
}

module.exports = StringUtils;
