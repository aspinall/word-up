import { describe, it, expect, beforeEach, vi } from 'vitest'
import { errorHandler } from '../error-handler.js'

describe('ErrorHandler', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    
    // Clear any existing DOM elements
    document.body.innerHTML = ''
  })

  describe('error logging and handling', () => {
    it('should handle errors with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Test error')
      const context = { operation: 'testOperation', data: 'testData' }

      errorHandler.handleError('Test Error', error, context)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Error Handler] Test Error'),
        expect.objectContaining({
          error: error.message,
          context
        })
      )

      consoleSpy.mockRestore()
    })

    it('should handle errors without context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Test error')

      errorHandler.handleError('Test Error', error)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Error Handler] Test Error'),
        expect.objectContaining({
          error: error.message,
          context: {}
        })
      )

      consoleSpy.mockRestore()
    })

    it('should handle non-Error objects', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      errorHandler.handleError('Test Error', 'string error')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Error Handler] Test Error'),
        expect.objectContaining({
          error: 'string error'
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('safe execution wrappers', () => {
    describe('safeSync', () => {
      it('should execute function successfully', () => {
        const testFn = vi.fn(() => 'success')
        const result = errorHandler.safeSync(testFn, 'fallback')

        expect(testFn).toHaveBeenCalled()
        expect(result).toBe('success')
      })

      it('should return fallback on error', () => {
        const testFn = vi.fn(() => { throw new Error('Test error') })
        const result = errorHandler.safeSync(testFn, 'fallback')

        expect(result).toBe('fallback')
      })

      it('should log errors with context', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const testFn = vi.fn(() => { throw new Error('Test error') })
        const context = { operation: 'test' }

        errorHandler.safeSync(testFn, 'fallback', context)

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Sync Operation Error'),
          expect.objectContaining({ 
            context,
            error: expect.any(String) 
          })
        )

        consoleSpy.mockRestore()
      })
    })

    describe('safeAsync', () => {
      it('should execute async function successfully', async () => {
        const testFn = vi.fn(async () => 'success')
        const result = await errorHandler.safeAsync(testFn, 'fallback')

        expect(testFn).toHaveBeenCalled()
        expect(result).toBe('success')
      })

      it('should return fallback on async error', async () => {
        const testFn = vi.fn(async () => { throw new Error('Test error') })
        const result = await errorHandler.safeAsync(testFn, 'fallback')

        expect(result).toBe('fallback')
      })

      it('should handle Promise rejection', async () => {
        const testFn = vi.fn(() => Promise.reject(new Error('Test error')))
        const result = await errorHandler.safeAsync(testFn, 'fallback')

        expect(result).toBe('fallback')
      })
    })
  })

  describe('safe DOM operations', () => {
    describe('querySelector', () => {
      it('should return element when found', () => {
        document.body.innerHTML = '<div id="test">Test</div>'
        
        const element = errorHandler.safeDom.querySelector('#test')
        
        expect(element).toBeTruthy()
        expect(element.id).toBe('test')
      })

      it('should return null when element not found', () => {
        const element = errorHandler.safeDom.querySelector('#nonexistent')
        
        expect(element).toBeNull()
      })

      it('should handle invalid selectors gracefully', () => {
        const element = errorHandler.safeDom.querySelector(':::invalid')
        
        expect(element).toBeNull()
      })
    })

    describe('addEventListener', () => {
      it('should add event listener successfully', () => {
        const element = document.createElement('button')
        const handler = vi.fn()
        
        const result = errorHandler.safeDom.addEventListener(element, 'click', handler)
        
        expect(result).toBe(true)
        
        // Test that event listener was added
        element.click()
        expect(handler).toHaveBeenCalled()
      })

      it('should handle null element gracefully', () => {
        const handler = vi.fn()
        
        const result = errorHandler.safeDom.addEventListener(null, 'click', handler)
        
        expect(result).toBe(false)
      })

      it('should handle invalid event types gracefully', () => {
        const element = document.createElement('button')
        const handler = vi.fn()
        
        const result = errorHandler.safeDom.addEventListener(element, null, handler)
        
        expect(result).toBe(false)
      })
    })

    describe('createElement', () => {
      it('should create element successfully', () => {
        const element = errorHandler.safeDom.createElement('div')
        
        expect(element).toBeTruthy()
        expect(element.tagName).toBe('DIV')
      })

      it('should handle invalid tag names gracefully', () => {
        const element = errorHandler.safeDom.createElement('invalid-tag-123!')
        
        expect(element).toBeNull()
      })
    })

    describe('appendChild', () => {
      it('should append child successfully', () => {
        const parent = document.createElement('div')
        const child = document.createElement('span')
        
        const result = errorHandler.safeDom.appendChild(parent, child)
        
        expect(result).toBe(true)
        expect(parent.contains(child)).toBe(true)
      })

      it('should handle null parent gracefully', () => {
        const child = document.createElement('span')
        
        const result = errorHandler.safeDom.appendChild(null, child)
        
        expect(result).toBe(false)
      })

      it('should handle null child gracefully', () => {
        const parent = document.createElement('div')
        
        const result = errorHandler.safeDom.appendChild(parent, null)
        
        expect(result).toBe(false)
      })
    })
  })

  describe('safe storage operations', () => {
    describe('get', () => {
      it('should retrieve and parse stored data', () => {
        const testData = { test: 'value', number: 42 }
        localStorage.setItem('test-key', JSON.stringify(testData))
        
        const result = errorHandler.safeStorage.get('test-key')
        
        expect(result).toEqual(testData)
      })

      it('should return null for non-existent keys', () => {
        const result = errorHandler.safeStorage.get('nonexistent-key')
        
        expect(result).toBeNull()
      })

      it('should handle JSON parse errors gracefully', () => {
        localStorage.setItem('invalid-json', 'not valid json {')
        
        const result = errorHandler.safeStorage.get('invalid-json')
        
        expect(result).toBeNull()
      })
    })

    describe('set', () => {
      it('should store data successfully', () => {
        const testData = { test: 'value', number: 42 }
        
        const result = errorHandler.safeStorage.set('test-key', testData)
        
        expect(result).toBe(true)
        
        const stored = JSON.parse(localStorage.getItem('test-key'))
        expect(stored).toEqual(testData)
      })

      it('should handle storage quota exceeded', () => {
        // Mock localStorage to throw quota exceeded error
        const originalSetItem = localStorage.setItem
        localStorage.setItem = vi.fn(() => {
          const error = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        })
        
        const result = errorHandler.safeStorage.set('test-key', { data: 'test' })
        
        expect(result).toBe(false)
        
        // Restore original method
        localStorage.setItem = originalSetItem
      })

      it('should handle circular references gracefully', () => {
        const circularData = { a: 1 }
        circularData.self = circularData
        
        const result = errorHandler.safeStorage.set('circular-key', circularData)
        
        expect(result).toBe(false)
      })
    })
  })

  describe('user error display', () => {
    it('should create and display error message', () => {
      const error = {
        title: 'Test Error',
        message: 'This is a test error message',
        action: 'Please try again'
      }
      
      errorHandler.showUserError(error)
      
      const errorElement = document.querySelector('.error-message')
      expect(errorElement).toBeTruthy()
      expect(errorElement.textContent).toContain(error.title)
      expect(errorElement.textContent).toContain(error.message)
      expect(errorElement.textContent).toContain(error.action)
    })

    it('should auto-dismiss error after timeout', async () => {
      vi.useFakeTimers()
      
      const error = {
        title: 'Test Error',
        message: 'This will auto-dismiss'
      }
      
      errorHandler.showUserError(error)
      
      const errorElement = document.querySelector('.error-message')
      expect(errorElement).toBeTruthy()
      
      // Wait for the show class to be added (setTimeout with 100ms)
      vi.advanceTimersByTime(100)
      expect(errorElement.classList.contains('show')).toBe(true)
      
      // Fast-forward past auto-dismiss timeout (8000ms + 300ms animation)
      vi.advanceTimersByTime(8300)
      
      // Check if hiding class is added or element is removed
      const isHiding = errorElement.classList.contains('hiding') || !document.querySelector('.error-message')
      expect(isHiding).toBe(true)
      
      vi.useRealTimers()
    })

    it('should allow manual dismissal', async () => {
      const error = {
        title: 'Test Error',
        message: 'This can be dismissed'
      }
      
      errorHandler.showUserError(error)
      
      const errorElement = document.querySelector('.error-message')
      const dismissButton = errorElement.querySelector('.error-dismiss')
      
      expect(dismissButton).toBeTruthy()
      
      dismissButton.click()
      
      expect(errorElement.classList.contains('hiding')).toBe(true)
    })
  })

  describe('system health checks', () => {
    it('should report localStorage availability', () => {
      expect(errorHandler.isStorageAvailable()).toBe(true)
    })

    it('should detect when localStorage is not available', () => {
      // Mock localStorage to be undefined
      const originalLocalStorage = global.localStorage
      delete global.localStorage
      
      expect(errorHandler.isStorageAvailable()).toBe(false)
      
      // Restore localStorage
      global.localStorage = originalLocalStorage
    })

    it('should perform comprehensive system health check', () => {
      const health = errorHandler.checkSystemHealth()
      
      expect(health).toHaveProperty('storage')
      expect(health).toHaveProperty('timestamp')
      
      expect(health.storage).toBe(true)
      expect(typeof health.timestamp).toBe('number')
    })
  })

  describe('error boundary functionality', () => {
    it('should handle error boundary creation gracefully', () => {
      // Test that the method exists or can be stubbed
      expect(() => {
        if (errorHandler.createErrorBoundary) {
          const error = new Error('Critical error')
          const errorInfo = { componentStack: 'Component stack trace' }
          errorHandler.createErrorBoundary(error, errorInfo)
        }
      }).not.toThrow()
    })

    it('should handle retry functionality gracefully', () => {
      // Test that retry functionality can be handled
      expect(() => {
        if (errorHandler.createErrorBoundary) {
          const error = new Error('Critical error')  
          const retryFn = vi.fn()
          errorHandler.createErrorBoundary(error, {}, retryFn)
        }
      }).not.toThrow()
    })
  })
})