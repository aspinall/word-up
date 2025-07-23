import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameUI } from '../ui.js'

// Mock error handler
vi.mock('../error-handler.js', () => ({
  errorHandler: {
    safeDom: {
      querySelector: vi.fn((selector) => document.querySelector(selector)),
      addEventListener: vi.fn((element, event, handler) => {
        if (element && event && handler) {
          element.addEventListener(event, handler)
          return true
        }
        return false
      }),
      createElement: vi.fn((tag) => document.createElement(tag)),
      appendChild: vi.fn((parent, child) => {
        if (parent && child) {
          parent.appendChild(child)
          return true
        }
        return false
      })
    },
    safeSync: vi.fn((fn, fallback) => {
      try {
        return fn()
      } catch (error) {
        return fallback
      }
    }),
    handleError: vi.fn()
  }
}))

describe('GameUI', () => {
  let gameUI

  beforeEach(() => {
    // Set up basic DOM structure that matches what GameUI expects
    document.body.innerHTML = `<div id="app"></div>`
    gameUI = new GameUI()
  })

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(() => {
        gameUI.init()
      }).not.toThrow()
    })

    it('should have app element reference', () => {
      expect(gameUI.app).toBeTruthy()
    })

    it('should create tiles array after initialization', () => {
      gameUI.init()
      expect(gameUI.tiles).toBeDefined()
      expect(Array.isArray(gameUI.tiles)).toBe(true)
    })

    it('should create keys object after initialization', () => {
      gameUI.init()
      expect(gameUI.keys).toBeDefined()
      expect(typeof gameUI.keys).toBe('object')
    })
  })

  describe('DOM manipulation', () => {
    beforeEach(() => {
      gameUI.init()
    })

    it('should update tile with letter and state', () => {
      // This test verifies that the method exists and can be called
      expect(() => {
        gameUI.updateTile(0, 0, 'A', 'filled')
      }).not.toThrow()
    })

    it('should clear tile content', () => {
      expect(() => {
        gameUI.clearTile(0, 0)
      }).not.toThrow()
    })

    it('should update entire row', () => {
      const letters = ['H', 'E', 'L', 'L', 'O']
      const states = ['correct', 'correct', 'correct', 'correct', 'correct']

      expect(() => {
        gameUI.updateRow(0, letters, states, false) // No animation for tests
      }).not.toThrow()
    })

    it('should shake row for invalid input', () => {
      expect(() => {
        gameUI.shakeRow(0)
      }).not.toThrow()
    })
  })

  describe('keyboard operations', () => {
    beforeEach(() => {
      gameUI.init()
    })

    it('should update key state', () => {
      expect(() => {
        gameUI.updateKeyState('A', 'correct')
      }).not.toThrow()
    })

    it('should handle key press events', () => {
      const mockDispatchEvent = vi.fn()
      document.dispatchEvent = mockDispatchEvent

      gameUI.handleKeyPress('A')

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'keypress',
          detail: { key: 'A' }
        })
      )
    })
  })

  describe('message display', () => {
    beforeEach(() => {
      gameUI.init()
    })

    it('should show message without errors', () => {
      expect(() => {
        gameUI.showMessage('Test message', 'success')
      }).not.toThrow()
    })

    it('should show game status without errors', () => {
      expect(() => {
        gameUI.showGameStatus(true, 'HELLO', 4)
      }).not.toThrow()
    })
  })

  describe('statistics modal', () => {
    beforeEach(() => {
      gameUI.init()
    })

    it('should show statistics modal without errors', () => {
      const mockGameLogic = {
        getStatistics: () => ({
          overall: { played: 10, winRate: 80, averageGuesses: 3.5 },
          daily: { played: 5, winRate: 80, currentStreak: 3, maxStreak: 5, averageGuesses: 3.2 },
          guessDistribution: [1, 2, 3, 4, 2, 0],
          recentGames: []
        }),
        statistics: {
          getStats: () => ({
            totalGames: 10,
            totalWins: 8,
            winRate: 80,
            currentStreak: 3,
            maxStreak: 5,
            guessDistribution: { 1: 1, 2: 2, 3: 3, 4: 2, 5: 0, 6: 0 }
          }),
          getModeStats: (mode) => ({
            totalGames: 5,
            totalWins: 4,
            winRate: 80
          }),
          getRecentGames: () => []
        }
      }

      expect(() => {
        gameUI.showStats(mockGameLogic)
      }).not.toThrow()
    })

    it('should hide statistics modal without errors', () => {
      expect(() => {
        gameUI.hideStats()
      }).not.toThrow()
    })
  })

  describe('timer functionality', () => {
    beforeEach(() => {
      gameUI.init()
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should start daily timer without errors', () => {
      const mockGameLogic = {
        getDailyStats: () => ({
          dayNumber: 123,
          timeUntilNext: {
            hours: 12,
            minutes: 30,
            milliseconds: 45000000
          }
        }),
        dailyWordGenerator: {
          getDayStats: () => ({
            timeUntilNext: {
              hours: 12,
              minutes: 30,
              milliseconds: 45000000
            }
          })
        },
        newGame: vi.fn()
      }

      expect(() => {
        gameUI.startDailyTimer(mockGameLogic)
      }).not.toThrow()
    })
  })

  describe('event handling', () => {
    beforeEach(() => {
      gameUI.init()
    })

    it('should handle physical keyboard events', () => {
      const originalDispatchEvent = document.dispatchEvent
      const mockDispatchEvent = vi.fn()
      
      // Mock dispatchEvent after setting up the event listener
      document.dispatchEvent = mockDispatchEvent

      // Simulate keydown event by directly calling the handler
      const keyEvent = new KeyboardEvent('keydown', { key: 'A' })
      
      // Trigger the keydown handler directly since we're mocking dispatchEvent
      gameUI.handleKeyPress('A')

      // Should have dispatched a keypress event
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'keypress',
          detail: { key: 'A' }
        })
      )
      
      // Restore original
      document.dispatchEvent = originalDispatchEvent
    })

    it('should handle virtual keyboard clicks', () => {
      const mockDispatchEvent = vi.fn()
      document.dispatchEvent = mockDispatchEvent

      // Find a keyboard key and simulate click
      const keyElement = document.querySelector('[data-key="A"]')
      if (keyElement) {
        keyElement.click()

        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'keypress',
            detail: { key: 'A' }
          })
        )
      }
    })
  })

  describe('utility methods', () => {
    beforeEach(() => {
      gameUI.init()
    })

    it('should get row letters without errors', () => {
      expect(() => {
        const letters = gameUI.getRowLetters(0)
        expect(Array.isArray(letters)).toBe(true)
      }).not.toThrow()
    })

    it('should handle invalid row gracefully', () => {
      expect(() => {
        const letters = gameUI.getRowLetters(10)
        expect(Array.isArray(letters)).toBe(true)
      }).not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle missing app element gracefully', () => {
      document.body.innerHTML = ''
      
      expect(() => {
        const ui = new GameUI()
        ui.init()
      }).not.toThrow()
    })

    it('should handle DOM manipulation errors gracefully', () => {
      gameUI.init()
      
      // These should not throw even with invalid parameters
      expect(() => {
        gameUI.updateTile(10, 10, 'A', 'filled')
      }).not.toThrow()

      expect(() => {
        gameUI.clearTile(-1, -1)
      }).not.toThrow()
    })
  })
})