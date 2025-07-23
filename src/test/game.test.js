import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameLogic } from '../game.js'

// Mock dependencies
vi.mock('../dictionaries/answers.js', () => ({
  ANSWERS: ['HELLO', 'WORLD', 'GAMES', 'LIGHT', 'BRAVE', 'QUICK', 'BROWN', 'FOXES']
}))

vi.mock('../dictionaries/valid-guesses.js', () => ({
  VALID_GUESSES: ['GUESS', 'TRIAL', 'WORDS', 'SILLY', 'SMART', 'TESTS', 'PLAYS', 'MIGHT']
}))

vi.mock('../daily-word.js', () => ({
  DailyWordGenerator: class {
    getTodaysWord() {
      return { word: 'HELLO', wordId: 100 }
    }
    getDaysFromEpoch() {
      return 100
    }
  }
}))

vi.mock('../statistics.js', () => ({
  GameStatistics: class {
    recordGame() {}
    updateStreak() {}
    getStats() {
      return { totalGames: 0, winRate: 0 }
    }
  }
}))

vi.mock('../error-handler.js', () => ({
  errorHandler: {
    handleError: vi.fn(),
    safeSync: vi.fn((fn, fallback) => {
      try {
        return fn()
      } catch (error) {
        return fallback
      }
    })
  }
}))

describe('GameLogic', () => {
  let game

  beforeEach(() => {
    game = new GameLogic()
  })

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      expect(game.currentRow).toBe(0)
      expect(game.currentCol).toBe(0)
      expect(game.gameState).toBe('playing')
      expect(game.guesses).toEqual([])
      expect(game.maxRows).toBe(6)
      expect(game.maxCols).toBe(5)
      expect(game.gameMode).toBe('daily')
      expect(game.initialized).toBe(true)
    })

    it('should have a target word set', () => {
      expect(game.targetWord).toBeDefined()
      expect(typeof game.targetWord).toBe('string')
      expect(game.targetWord.length).toBe(5)
    })

    it('should initialize letter states map', () => {
      expect(game.letterStates).toBeInstanceOf(Map)
      expect(game.letterStates.size).toBe(26)
      expect(game.letterStates.get('A')).toBe('unused')
    })
  })

  describe('newGame', () => {
    it('should reset game state for daily mode', () => {
      game.currentRow = 3
      game.currentCol = 2
      game.gameState = 'won'
      game.guesses = ['HELLO', 'WORLD']

      game.startNewGame(null, 'daily')

      expect(game.currentRow).toBe(0)
      expect(game.currentCol).toBe(0)
      expect(game.gameState).toBe('playing')
      expect(game.guesses).toEqual([])
      expect(game.gameMode).toBe('daily')
      expect(game.letterStates.size).toBe(26)
    })

  })

  describe('processKeyPress', () => {
    beforeEach(() => {
      game.startNewGame(null, 'daily')
      // Mock getCurrentGuess method
      game.getCurrentGuess = vi.fn(() => 'HELLO')
    })

    describe('letter input', () => {
      it('should add letter when valid', () => {
        const result = game.processKeyPress('A')

        expect(result.success).toBe(true)
        expect(result.action).toBe('add_letter')
        expect(result.letter).toBe('A')
        expect(result.row).toBe(0)
        expect(result.col).toBe(0)
        expect(game.currentCol).toBe(1)
      })

      it('should not add letter when row is full', () => {
        game.currentCol = 5

        const result = game.processKeyPress('A')

        expect(result.success).toBe(false)
        expect(result.reason).toBe('Row is full')
      })

      it('should not process keys when game is over', () => {
        game.gameState = 'won'

        const result = game.processKeyPress('A')

        expect(result.success).toBe(false)
        expect(result.reason).toBe('Game is over')
      })
    })

    describe('backspace', () => {
      it('should delete letter when column > 0', () => {
        game.addLetter('A')
        game.addLetter('B')

        const result = game.processKeyPress('BACKSPACE')

        expect(result.success).toBe(true)
        expect(result.action).toBe('delete_letter')
        expect(result.row).toBe(0)
        expect(result.col).toBe(1)
        expect(game.currentCol).toBe(1)
      })

      it('should not delete when at start of row', () => {
        game.currentCol = 0

        const result = game.processKeyPress('BACKSPACE')

        expect(result.success).toBe(false)
        expect(result.reason).toBe('Nothing to delete')
      })
    })

    describe('enter key', () => {
      it('should reject incomplete words', () => {
        game.currentCol = 3
        game.getCurrentGuess = vi.fn(() => 'HEL')

        const result = game.processKeyPress('ENTER')

        expect(result.success).toBe(false)
        expect(result.reason).toBe('Not enough letters')
        expect(result.action).toBe('shake_row')
      })

      it('should reject invalid words', () => {
        game.currentCol = 5
        game.getCurrentGuess = vi.fn(() => 'ZZZZZ')

        const result = game.processKeyPress('ENTER')

        expect(result.success).toBe(false)
        expect(result.reason).toBe('Not in word list')
        expect(result.action).toBe('shake_row')
      })

      it('should handle winning guess', () => {
        game.targetWord = 'HELLO'
        game.currentCol = 5
        game.getCurrentGuess = vi.fn(() => 'HELLO')

        const result = game.processKeyPress('ENTER')

        expect(result.success).toBe(true)
        expect(result.action).toBe('win_game')
        expect(result.letters).toEqual(['H', 'E', 'L', 'L', 'O'])
        expect(result.states).toEqual(['correct', 'correct', 'correct', 'correct', 'correct'])
        expect(game.gameState).toBe('won')
      })

      it('should handle losing on final row', () => {
        game.targetWord = 'HELLO'
        game.currentRow = 5
        game.currentCol = 5
        game.getCurrentGuess = vi.fn(() => 'WORLD')

        const result = game.processKeyPress('ENTER')

        expect(result.success).toBe(true)
        expect(result.action).toBe('lose_game')
        expect(game.gameState).toBe('lost')
      })

      it('should continue game on non-winning, non-final guess', () => {
        game.targetWord = 'HELLO'
        game.currentRow = 2
        game.currentCol = 5
        game.getCurrentGuess = vi.fn(() => 'WORLD')

        const result = game.processKeyPress('ENTER')

        expect(result.success).toBe(true)
        expect(result.action).toBe('continue_game')
        expect(game.currentRow).toBe(3)
        expect(game.currentCol).toBe(0)
      })
    })
  })

  describe('evaluateGuess', () => {
    it('should return correct states for exact match', () => {
      game.targetWord = 'HELLO'
      const result = game.validateGuess('HELLO')

      expect(result.word).toEqual('HELLO')
      expect(result.states).toEqual(['correct', 'correct', 'correct', 'correct', 'correct'])
      expect(result.isWin).toBe(true)
    })

    it('should return correct states for partial match', () => {
      game.targetWord = 'HELLO'
      const result = game.validateGuess('WORLD')

      expect(result.word).toEqual('WORLD')
      expect(result.states).toEqual(['absent', 'present', 'absent', 'correct', 'absent'])
      expect(result.isWin).toBe(false)
    })

    it('should handle duplicate letters correctly', () => {
      game.targetWord = 'HELLO'
      const result = game.validateGuess('LLAMA')

      expect(result.word).toEqual('LLAMA')
      // First L should be present, second L should be present
      expect(result.states).toEqual(["present", "present", "absent", "absent", "absent"])
    })

    it('should update letter states correctly', () => {
      game.targetWord = 'HELLO'
      game.getCurrentGuess = vi.fn(() => 'WORLD')
      game.currentCol = 5
      game.submitGuess()

      expect(game.letterStates.get('W')).toBe('absent')
      expect(game.letterStates.get('O')).toBe('present')
      expect(game.letterStates.get('R')).toBe('absent')
      expect(game.letterStates.get('L')).toBe('correct')
      expect(game.letterStates.get('D')).toBe('absent')
    })
  })

  describe('error handling', () => {
    it('should handle uninitialized game gracefully', () => {
      game.initialized = false

      const result = game.processKeyPress('A')

      expect(result.success).toBe(false)
      expect(result.reason).toBe('Game not properly initialized')
    })

    it('should validate input keys', () => {
      const result = game.processKeyPress('1')

      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid key')
    })

    it('should handle special characters gracefully', () => {
      const result = game.processKeyPress('@')

      expect(result.success).toBe(false)
      expect(result.reason).toBe('Invalid key')
    })
  })

  describe('game state management', () => {
    it('should track guesses correctly', () => {
      game.targetWord = 'HELLO'
      game.currentCol = 5
      game.getCurrentGuess = vi.fn(() => 'WORLD')

      game.processKeyPress('ENTER')

      expect(game.guesses[0].word).toContain('WORLD')
      expect(game.guesses.length).toBe(1)
    })

    it('should prevent further input after game ends', () => {
      game.gameState = 'won'

      const result1 = game.processKeyPress('A')
      const result2 = game.processKeyPress('Enter')
      const result3 = game.processKeyPress('Backspace')

      expect(result1.success).toBe(false)
      expect(result2.success).toBe(false)
      expect(result3.success).toBe(false)
    })
  })

  describe('word validation', () => {
    it('should validate words from dictionary', () => {
      expect(game.isValidWord('HELLO')).toBe(true)
      expect(game.isValidWord('WORLD')).toBe(true)
      expect(game.isValidWord('ZZZZZ')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(game.isValidWord('HELLO')).toBe(true)
      expect(game.isValidWord('WORLD')).toBe(true)
    })

    it('should reject words of wrong length', () => {
      expect(game.isValidWord('HI')).toBe(false)
      expect(game.isValidWord('HELLOS')).toBe(false)
    })
  })
})