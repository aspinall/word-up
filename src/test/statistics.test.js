import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameStatistics } from '../statistics.js'
import { errorHandler } from '../error-handler.js'

// Mock error handler
vi.mock('../error-handler.js', () => ({
  errorHandler: {
    handleError: vi.fn(),
    safeSync: vi.fn((fn, fallback) => {
      try {
        return fn()
      } catch (error) {
        return fallback
      }
    }),
    safeStorage: {
      get: vi.fn((key) => {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      }),
      set: vi.fn((key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value))
          return true
        } catch {
          return false
        }
      })
    },
    safeAsync: vi.fn(async (fn, fallback) => {
      try {
        return await fn()
      } catch (error) {
        return fallback
      }
    }),
    isStorageAvailable: vi.fn(() => true)
  }
}))

describe('GameStatistics', () => {
  let stats

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    stats = new GameStatistics()
  })

  describe('initialization', () => {
    it('should initialize with default statistics', () => {
      const defaultStats = stats.getRawStats()

      expect(defaultStats.totalGames).toBe(0)
      expect(defaultStats.totalWins).toBe(0)
      expect(defaultStats.winRate).toBe(0)
      expect(defaultStats.currentStreak).toBe(0)
      expect(defaultStats.maxStreak).toBe(0)
      expect(defaultStats.guessDistribution).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
      })
      expect(defaultStats.dailyStats).toBeDefined()
      expect(defaultStats.practiceStats).toBeDefined()
      expect(defaultStats.recentGames).toEqual([])
      expect(defaultStats.version).toBe('1.0.0')
    })

    it('should load existing statistics from localStorage', () => {
      const existingStats = {
        totalGames: 10,
        totalWins: 7,
        winRate: 70,
        currentStreak: 3,
        maxStreak: 5,
        guessDistribution: { 1: 1, 2: 2, 3: 2, 4: 2, 5: 0, 6: 0 },
        dailyStats: { totalGames: 5, totalWins: 4 },
        practiceStats: { totalGames: 5, totalWins: 3 },
        recentGames: [],
        version: '1.0.0'
      }

      localStorage.setItem('wordUp_statistics', JSON.stringify(existingStats))
      const newStats = new GameStatistics()
      const loaded = newStats.getRawStats()

      expect(loaded.totalGames).toBe(10)
      expect(loaded.totalWins).toBe(7)
      expect(loaded.winRate).toBe(70)
      expect(loaded.currentStreak).toBe(3)
      expect(loaded.maxStreak).toBe(5)
    })
  })

  describe('recordGame', () => {
    it('should record a winning game correctly', () => {
      const gameData = {
        won: true,
        guessCount: 4,
        targetWord: 'HELLO',
        gameMode: 'daily',
        date: '2024-01-15'
      }

      stats.recordGame(gameData)
      const result = stats.getRawStats()

      expect(result.totalGames).toBe(1)
      expect(result.totalWins).toBe(1)
      expect(result.winRate).toBe(100)
      expect(result.guessDistribution[4]).toBe(1)
      expect(result.dailyStats.totalGames).toBe(1)
      expect(result.dailyStats.totalWins).toBe(1)
      expect(result.recentGames).toHaveLength(1)
    })

    it('should record a losing game correctly', () => {
      const gameData = {
        won: false,
        guessCount: 6,
        targetWord: 'WORLD',
        gameMode: 'practice',
        date: '2024-01-15'
      }

      stats.recordGame(gameData)
      const result = stats.getRawStats()

      expect(result.totalGames).toBe(1)
      expect(result.totalWins).toBe(0)
      expect(result.winRate).toBe(0)
      expect(result.guessDistribution[6]).toBe(0) // Losses don't count in distribution
      expect(result.practiceStats.totalGames).toBe(1)
      expect(result.practiceStats.totalWins).toBe(0)
    })

    it('should update streaks correctly for wins', () => {
      const winData = {
        won: true,
        guessCount: 3,
        targetWord: 'HELLO',
        gameMode: 'daily',
        date: '2024-01-15'
      }

      stats.recordGame(winData)
      stats.recordGame({ ...winData, date: '2024-01-16' })
      stats.recordGame({ ...winData, date: '2024-01-17' })

      const result = stats.getRawStats()
      expect(result.currentStreak).toBe(3)
      expect(result.maxStreak).toBe(3)
    })

    it('should reset current streak on loss', () => {
      const winData = {
        won: true,
        guessCount: 3,
        targetWord: 'HELLO',
        gameMode: 'daily',
        date: '2024-01-15'
      }
      const lossData = {
        won: false,
        guessCount: 6,
        targetWord: 'WORLD',
        gameMode: 'daily',
        date: '2024-01-16'
      }

      stats.recordGame(winData)
      stats.recordGame(winData)
      stats.recordGame(lossData)

      const result = stats.getRawStats()
      expect(result.currentStreak).toBe(0)
      expect(result.maxStreak).toBe(2)
    })

    it('should maintain recent games list with max 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        stats.recordGame({
          won: true,
          guessCount: 3,
          targetWord: 'HELLO',
          gameMode: 'daily',
          date: `2024-01-${String(i + 1).padStart(2, '0')}`
        })
      }

      const result = stats.getRawStats()
      expect(result.recentGames).toHaveLength(10)
      // Should keep the most recent games
      expect(result.recentGames[0].date).toBe('2024-01-15')
    })
  })

  describe('statistics calculations', () => {
    beforeEach(() => {
      // Set up some test data
      const games = [
        { won: true, guessCount: 3, gameMode: 'daily' },
        { won: true, guessCount: 4, gameMode: 'daily' },
        { won: false, guessCount: 6, gameMode: 'daily' },
        { won: true, guessCount: 2, gameMode: 'practice' },
        { won: true, guessCount: 5, gameMode: 'practice' }
      ]

      games.forEach((game, i) => {
        stats.recordGame({
          ...game,
          targetWord: 'HELLO',
          date: `2024-01-${String(i + 1).padStart(2, '0')}`
        })
      })
    })

    it('should calculate overall statistics correctly', () => {
      const result = stats.getStats()

      expect(result.totalGames).toBe(5)
      expect(result.totalWins).toBe(4)
      expect(result.winRate).toBe(80)
      expect(result.averageGuesses).toBe(3.5) // (3+4+2+5)/4 wins
    })

    it('should calculate mode-specific statistics', () => {
      const dailyStats = stats.getModeStats('daily')
      const practiceStats = stats.getModeStats('practice')

      expect(dailyStats.totalGames).toBe(3)
      expect(dailyStats.totalWins).toBe(2)
      expect(dailyStats.winRate).toBe(67)

      expect(practiceStats.totalGames).toBe(2)
      expect(practiceStats.totalWins).toBe(2)
      expect(practiceStats.winRate).toBe(100)
    })

    it('should calculate guess distribution correctly', () => {
      const result = stats.getStats()

      expect(result.guessDistribution[2]).toBe(1)
      expect(result.guessDistribution[3]).toBe(1)
      expect(result.guessDistribution[4]).toBe(1)
      expect(result.guessDistribution[5]).toBe(1)
      expect(result.guessDistribution[6]).toBe(0)
    })
  })

  describe('data persistence', () => {
    it('should save statistics to localStorage', () => {
      stats.recordGame({
        won: true,
        guessCount: 3,
        targetWord: 'HELLO',
        gameMode: 'daily',
        date: '2024-01-15'
      })

      expect(localStorage.getItem('wordUp_statistics')).toBeTruthy()
      const saved = JSON.parse(localStorage.getItem('wordUp_statistics'))
      expect(saved.totalGames).toBe(1)
    })

    it('should handle localStorage failures gracefully', () => {
      // Mock storage failure by simulating a storage quota exceeded error
      const originalSet = errorHandler.safeStorage.set
      errorHandler.safeStorage.set = vi.fn(() => false)

      const result = stats.saveStats()
      expect(result).toBe(false)
      expect(stats.isInFallbackMode()).toBe(true)
      
      // Restore original
      errorHandler.safeStorage.set = originalSet
    })
  })

  describe('data import/export', () => {
    beforeEach(() => {
      stats.recordGame({
        won: true,
        guessCount: 3,
        targetWord: 'HELLO',
        gameMode: 'daily',
        date: '2024-01-15'
      })
    })

    it('should export statistics correctly', () => {
      const exported = stats.exportStats()

      expect(exported.version).toBe('1.0.0')
      expect(exported.exportDate).toBeDefined()
      expect(exported.statistics).toBeDefined()
      expect(exported.statistics.totalGames).toBe(1)
    })

    it('should import statistics correctly', () => {
      const importData = {
        version: '1.0.0',
        exportDate: '2024-01-15T12:00:00.000Z',
        statistics: {
          totalGames: 10,
          totalWins: 8,
          winRate: 80,
          currentStreak: 5,
          maxStreak: 7,
          guessDistribution: { 1: 1, 2: 2, 3: 2, 4: 2, 5: 1, 6: 0 },
          dailyStats: { totalGames: 5, totalWins: 4 },
          practiceStats: { totalGames: 5, totalWins: 4 },
          recentGames: [],
          version: '1.0.0'
        }
      }

      const result = stats.importStats(importData)
      expect(result).toBe(true)

      const imported = stats.getRawStats()
      expect(imported.totalGames).toBe(10)
      expect(imported.totalWins).toBe(8)
    })

    it('should reject invalid import data', () => {
      const result1 = stats.importStats(null)
      const result2 = stats.importStats({})
      const result3 = stats.importStats({ invalid: 'data' })

      expect(result1).toBe(false)
      expect(result2).toBe(false)
      expect(result3).toBe(false)
    })
  })

  describe('statistics reset', () => {
    beforeEach(() => {
      stats.recordGame({
        won: true,
        guessCount: 3,
        targetWord: 'HELLO',
        gameMode: 'daily',
        date: '2024-01-15'
      })
    })

    it('should reset all statistics', () => {
      expect(stats.getRawStats().totalGames).toBe(1)

      stats.resetStats()

      const result = stats.getRawStats()
      expect(result.totalGames).toBe(0)
      expect(result.totalWins).toBe(0)
      expect(result.currentStreak).toBe(0)
      expect(result.maxStreak).toBe(0)
      expect(result.recentGames).toEqual([])
    })
  })

  describe('system health', () => {
    it('should report system health correctly', () => {
      const health = stats.getSystemHealth()

      expect(health.storageWorking).toBe(true)
      expect(health.storageAvailable).toBe(true)
      expect(health.lastSaveSuccess).toBe(true)
      expect(health.statsCount).toBe(0)
    })

    it('should report fallback mode when storage fails', () => {
      stats.fallbackMode = true

      const health = stats.getSystemHealth()
      expect(health.storageWorking).toBe(false)
      expect(health.lastSaveSuccess).toBe(false)
    })
  })

  describe('data validation and migration', () => {
    it('should validate and migrate old data formats', () => {
      const oldFormat = {
        games: 5,
        wins: 3,
        // Missing newer fields
      }

      const migrated = stats.validateAndMigrateStats(oldFormat)

      expect(migrated.totalGames).toBeDefined()
      expect(migrated.totalWins).toBeDefined()
      expect(migrated.dailyStats).toBeDefined()
      expect(migrated.practiceStats).toBeDefined()
      expect(migrated.version).toBe('1.0.0')
    })

    it('should handle corrupt data gracefully', () => {
      const corruptData = {
        totalGames: 'invalid',
        winRate: null,
        guessDistribution: 'not an object'
      }

      const migrated = stats.validateAndMigrateStats(corruptData)

      // Should return valid default structure
      expect(typeof migrated.totalGames).toBe('number')
      expect(typeof migrated.version).toBe('string')
      expect(Array.isArray(migrated.guessDistribution)).toBe(true)
    })
  })
})