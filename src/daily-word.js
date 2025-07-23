// Daily word system for Word Up game
// Generates consistent daily words using date-based seeding

import { WORDS } from './dictionaries/words.js';

export class DailyWordGenerator {
  constructor() {
    // Game epoch - when Word Up daily words started
    this.GAME_EPOCH = new Date('2024-01-01').getTime();
    
    // Salt for additional randomness (change this to reset all daily words)
    this.SEED_SALT = 'WORDUP_DAILY_2024';
  }

  // Get current day number since game epoch
  getCurrentDayNumber() {
    const now = new Date();
    const daysSinceEpoch = Math.floor((now.getTime() - this.GAME_EPOCH) / (1000 * 60 * 60 * 24));
    return daysSinceEpoch;
  }

  // Get day number for a specific date
  getDayNumberForDate(date) {
    const targetDate = new Date(date);
    const daysSinceEpoch = Math.floor((targetDate.getTime() - this.GAME_EPOCH) / (1000 * 60 * 60 * 24));
    return daysSinceEpoch;
  }

  // Simple seeded random number generator (Linear Congruential Generator)
  seededRandom(seed) {
    // Ensure seed is a positive integer
    const normalizedSeed = Math.abs(Math.floor(seed)) || 1;
    
    // LCG parameters (same as used by glibc)
    const a = 1103515245;
    const c = 12345;
    const m = Math.pow(2, 31);
    
    // Generate next value in sequence
    const next = (a * normalizedSeed + c) % m;
    
    // Return normalized value between 0 and 1
    return next / m;
  }

  // Create a seed from day number and salt
  createSeed(dayNumber) {
    // Combine day number with salt to create unique seed
    const combined = `${this.SEED_SALT}_${dayNumber}`;
    
    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Ensure positive seed
    return Math.abs(hash);
  }

  // Get today's word
  getTodaysWord() {
    const dayNumber = this.getCurrentDayNumber();
    return this.getWordForDay(dayNumber);
  }

  // Get word for a specific day number
  getWordForDay(dayNumber) {
    const seed = this.createSeed(dayNumber);
    const randomValue = this.seededRandom(seed);
    const wordIndex = Math.floor(randomValue * WORDS.length);
    
    return {
      word: WORDS[wordIndex],
      dayNumber: dayNumber,
      date: new Date(this.GAME_EPOCH + dayNumber * 24 * 60 * 60 * 1000).toDateString()
    };
  }

  // Get word for a specific date (YYYY-MM-DD format)
  getWordForDate(dateString) {
    const dayNumber = this.getDayNumberForDate(dateString);
    return this.getWordForDay(dayNumber);
  }

  // Get yesterday's word
  getYesterdaysWord() {
    const dayNumber = this.getCurrentDayNumber() - 1;
    return this.getWordForDay(dayNumber);
  }

  // Get tomorrow's word (for testing/preview)
  getTomorrowsWord() {
    const dayNumber = this.getCurrentDayNumber() + 1;
    return this.getWordForDay(dayNumber);
  }

  // Check if a date is today
  isToday(dateString) {
    const today = new Date();
    const targetDate = new Date(dateString);
    
    return today.getFullYear() === targetDate.getFullYear() &&
           today.getMonth() === targetDate.getMonth() &&
           today.getDate() === targetDate.getDate();
  }

  // Get game statistics for the current day
  getDayStats() {
    const todaysWord = this.getTodaysWord();
    const now = new Date();
    
    // Calculate time until next word (midnight)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilNext = tomorrow.getTime() - now.getTime();
    
    const hours = Math.floor(timeUntilNext / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      ...todaysWord,
      timeUntilNext: {
        hours,
        minutes,
        milliseconds: timeUntilNext
      }
    };
  }

  // Validate that the seed system is working correctly
  validateSystem() {
    const tests = [];
    
    // Test 1: Same day should produce same word
    const word1 = this.getWordForDay(100);
    const word2 = this.getWordForDay(100);
    tests.push({
      name: 'Consistency test',
      passed: word1.word === word2.word,
      details: `Day 100: ${word1.word} === ${word2.word}`
    });
    
    // Test 2: Different days should produce different words (usually)
    const word3 = this.getWordForDay(100);
    const word4 = this.getWordForDay(101);
    tests.push({
      name: 'Variation test',
      passed: word3.word !== word4.word,
      details: `Day 100: ${word3.word} !== Day 101: ${word4.word}`
    });
    
    // Test 3: Words should be from our dictionary
    const word5 = this.getWordForDay(200);
    tests.push({
      name: 'Dictionary test',
      passed: WORDS.includes(word5.word),
      details: `Word ${word5.word} is in dictionary: ${WORDS.includes(word5.word)}`
    });
    
    return {
      allPassed: tests.every(test => test.passed),
      tests
    };
  }

  // Get a preview of upcoming words (for development/testing)
  getWordPreview(days = 7) {
    const preview = [];
    const startDay = this.getCurrentDayNumber();
    
    for (let i = 0; i < days; i++) {
      const dayNumber = startDay + i;
      const wordInfo = this.getWordForDay(dayNumber);
      preview.push({
        ...wordInfo,
        isToday: i === 0
      });
    }
    
    return preview;
  }
}