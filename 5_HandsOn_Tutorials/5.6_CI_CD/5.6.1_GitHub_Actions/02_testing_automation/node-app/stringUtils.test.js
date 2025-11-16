const StringUtils = require('./stringUtils');

describe('StringUtils', () => {
  let utils;

  beforeEach(() => {
    utils = new StringUtils();
  });

  describe('capitalize', () => {
    test('should capitalize first letter', () => {
      expect(utils.capitalize('hello')).toBe('Hello');
      expect(utils.capitalize('world')).toBe('World');
    });

    test('should handle empty string', () => {
      expect(utils.capitalize('')).toBe('');
    });

    test('should handle non-string input', () => {
      expect(utils.capitalize(null)).toBe('');
      expect(utils.capitalize(undefined)).toBe('');
      expect(utils.capitalize(123)).toBe('');
    });

    test('should not change already capitalized string', () => {
      expect(utils.capitalize('Hello')).toBe('Hello');
    });

    test('should handle single character', () => {
      expect(utils.capitalize('a')).toBe('A');
    });
  });

  describe('reverse', () => {
    test('should reverse string', () => {
      expect(utils.reverse('hello')).toBe('olleh');
      expect(utils.reverse('world')).toBe('dlrow');
    });

    test('should handle empty string', () => {
      expect(utils.reverse('')).toBe('');
    });

    test('should handle palindrome', () => {
      expect(utils.reverse('racecar')).toBe('racecar');
    });

    test('should handle single character', () => {
      expect(utils.reverse('a')).toBe('a');
    });

    test('should handle non-string input', () => {
      expect(utils.reverse(null)).toBe('');
      expect(utils.reverse(undefined)).toBe('');
    });
  });

  describe('isPalindrome', () => {
    test('should identify palindrome', () => {
      expect(utils.isPalindrome('racecar')).toBe(true);
      expect(utils.isPalindrome('A man a plan a canal Panama')).toBe(true);
      expect(utils.isPalindrome('Was it a car or a cat I saw')).toBe(true);
    });

    test('should identify non-palindrome', () => {
      expect(utils.isPalindrome('hello')).toBe(false);
      expect(utils.isPalindrome('world')).toBe(false);
    });

    test('should handle empty string', () => {
      expect(utils.isPalindrome('')).toBe(false);
    });

    test('should handle single character', () => {
      expect(utils.isPalindrome('a')).toBe(true);
    });

    test('should ignore case and special characters', () => {
      expect(utils.isPalindrome('A Man, A Plan, A Canal: Panama!')).toBe(true);
    });
  });

  describe('wordCount', () => {
    test('should count words', () => {
      expect(utils.wordCount('hello world')).toBe(2);
      expect(utils.wordCount('one two three four')).toBe(4);
    });

    test('should handle extra spaces', () => {
      expect(utils.wordCount('  hello   world  ')).toBe(2);
    });

    test('should handle empty string', () => {
      expect(utils.wordCount('')).toBe(0);
    });

    test('should handle single word', () => {
      expect(utils.wordCount('hello')).toBe(1);
    });

    test('should handle non-string input', () => {
      expect(utils.wordCount(null)).toBe(0);
      expect(utils.wordCount(undefined)).toBe(0);
    });
  });

  describe('toTitleCase', () => {
    test('should convert to title case', () => {
      expect(utils.toTitleCase('hello world')).toBe('Hello World');
      expect(utils.toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    });

    test('should handle already title case', () => {
      expect(utils.toTitleCase('Hello World')).toBe('Hello World');
    });

    test('should handle empty string', () => {
      expect(utils.toTitleCase('')).toBe('');
    });

    test('should handle single word', () => {
      expect(utils.toTitleCase('hello')).toBe('Hello');
    });
  });

  describe('truncate', () => {
    test('should truncate long string', () => {
      expect(utils.truncate('Hello World', 8)).toBe('Hello...');
      expect(utils.truncate('This is a long string', 10)).toBe('This is...');
    });

    test('should not truncate short string', () => {
      expect(utils.truncate('Hello', 10)).toBe('Hello');
    });

    test('should use custom suffix', () => {
      expect(utils.truncate('Hello World', 8, '…')).toBe('Hello W…');
    });

    test('should handle empty string', () => {
      expect(utils.truncate('', 10)).toBe('');
    });

    test('should handle exact length', () => {
      expect(utils.truncate('Hello', 5)).toBe('Hello');
    });
  });
});
