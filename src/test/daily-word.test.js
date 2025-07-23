import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DailyWordGenerator } from '../daily-word.js'

// Mock the words dictionary
vi.mock('../dictionaries/words.js', () => ({
  WORDS: [
    'HELLO', 'WORLD', 'GAMES', 'LIGHT', 'BRAVE', 'QUICK', 'BROWN', 'FOXES',
    'PARTY', 'MUSIC', 'DANCE', 'SMILE', 'LAUGH', 'HAPPY', 'SWEET', 'DREAM'
  ]
}))

describe('DailyWordGenerator', () => {
  let generator

  beforeEach(() => {
    generator = new DailyWordGenerator()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with correct epoch date', () => {
      expect(generator.GAME_EPOCH).toEqual(new Date('2024-01-01').getTime())
    })

    it('should have a salt value', () => {
      expect(generator.SEED_SALT).toBeDefined()
      expect(typeof generator.SEED_SALT).toBe('string')
    })
  })

  describe('getCurrentDayNumber', () => {
    it('should calculate days correctly from epoch', () => {
      vi.setSystemTime(new Date('2024-01-02T12:00:00Z'))
      
      const days = generator.getCurrentDayNumber()
      expect(days).toBe(1)
    })

    it('should calculate days correctly for future dates', () => {
      vi.setSystemTime(new Date('2024-01-31T12:00:00Z'))
      
      const days = generator.getCurrentDayNumber()
      expect(days).toBe(30)
    })

    it('should return 0 for epoch date', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
      
      const days = generator.getCurrentDayNumber()
      expect(days).toBe(0)
    })
  })

  describe('seededRandom', () => {
    it('should generate consistent values for same seed', () => {
      const value1 = generator.seededRandom(100)
      const value2 = generator.seededRandom(100)
      
      expect(value1).toBe(value2)
    })

    it('should generate different values for different seeds', () => {
      const value1 = generator.seededRandom(100)
      const value2 = generator.seededRandom(101)
      
      expect(value1).not.toBe(value2)
    })

    it('should generate values within expected range', () => {
      for (let i = 0; i < 10; i++) {
        const value = generator.seededRandom(i + 1)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
      }
    })
  })

  describe('getTodaysWord', () => {
    it('should return a valid word from the dictionary', () => {
      vi.setSystemTime(new Date('2024-01-02T12:00:00Z'))
      
      const result = generator.getTodaysWord()
      
      expect(typeof result.word).toBe('string')
      expect(result.word.length).toBe(5)
      expect(result.word).toMatch(/^[A-Z]+$/)
      expect(result.dayNumber).toBe(1)
      expect(result.date).toBeDefined()
    })

    it('should return the same word for the same date', () => {
      vi.setSystemTime(new Date('2024-01-02T08:00:00Z'))
      const result1 = generator.getTodaysWord()
      
      vi.setSystemTime(new Date('2024-01-02T20:00:00Z'))
      const result2 = generator.getTodaysWord()
      
      expect(result1.word).toBe(result2.word)
    })

    it('should return different words for different dates', () => {
      vi.setSystemTime(new Date('2024-01-02T12:00:00Z'))
      const result1 = generator.getTodaysWord()
      
      vi.setSystemTime(new Date('2024-01-03T12:00:00Z'))
      const result2 = generator.getTodaysWord()
      
      expect(result1.word).not.toBe(result2.word)
    })
  })

  describe('getWordForDay', () => {
    it('should return consistent word for same day number', () => {
      const result1 = generator.getWordForDay(100)
      const result2 = generator.getWordForDay(100)
      
      expect(result1.word).toBe(result2.word)
      expect(result1.dayNumber).toBe(100)
    })

    it('should return different words for different day numbers', () => {
      const result1 = generator.getWordForDay(100)
      const result2 = generator.getWordForDay(101)
      
      expect(result1.word).not.toBe(result2.word)
    })
  })

  describe('createSeed', () => {
    it('should create consistent seed for same day', () => {
      const seed1 = generator.createSeed(100)
      const seed2 = generator.createSeed(100)
      
      expect(seed1).toBe(seed2)
      expect(typeof seed1).toBe('number')
    })

    it('should create different seeds for different days', () => {
      const seed1 = generator.createSeed(100)
      const seed2 = generator.createSeed(101)
      
      expect(seed1).not.toBe(seed2)
    })
  })

  describe('system validation', () => {
    it('should validate system correctly', () => {
      const validation = generator.validateSystem()
      
      expect(validation.allPassed).toBeDefined()
      expect(validation.tests).toBeDefined()
      expect(Array.isArray(validation.tests)).toBe(true)
      expect(validation.tests.length).toBeGreaterThan(0)
    })
  })

  describe('utility methods', () => {
    it('should get yesterdays word', () => {
      vi.setSystemTime(new Date('2024-01-02T12:00:00Z'))
      
      const result = generator.getYesterdaysWord()
      
      expect(result.word).toBeDefined()
      expect(result.dayNumber).toBe(0)
    })

    it('should get tomorrows word', () => {
      vi.setSystemTime(new Date('2024-01-02T12:00:00Z'))
      
      const result = generator.getTomorrowsWord()
      
      expect(result.word).toBeDefined()
      expect(result.dayNumber).toBe(2)
    })

    it('should check if date is today', () => {
      vi.setSystemTime(new Date('2024-01-02T12:00:00Z'))
      
      expect(generator.isToday('2024-01-02')).toBe(true)
      expect(generator.isToday('2024-01-01')).toBe(false)
    })

    it('should get day stats', () => {
      vi.setSystemTime(new Date('2024-01-02T12:00:00Z'))
      
      const stats = generator.getDayStats()
      
      expect(stats.word).toBeDefined()
      expect(stats.timeUntilNext).toBeDefined()
      expect(stats.timeUntilNext.hours).toBeGreaterThanOrEqual(0)
      expect(stats.timeUntilNext.minutes).toBeGreaterThanOrEqual(0)
    })
  })
})