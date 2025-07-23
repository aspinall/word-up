// Centralized error handling system for Word Up
// Provides consistent error reporting and user-friendly messages

export class ErrorHandler {
  constructor() {
    this.setupGlobalErrorHandling();
    this.userMessageElement = null;
  }

  // Setup global error handlers
  setupGlobalErrorHandling() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError('JavaScript Error', event.error || new Error(event.message), {
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError('Unhandled Promise Rejection', event.reason, {
        promise: event.promise
      });
    });
  }

  // Central error handling method
  handleError(type, error, context = {}) {
    const errorInfo = {
      type,
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context
    };

    // Log error for debugging
    console.error(`[${type}]`, errorInfo);

    // Show user-friendly message
    this.showUserError(this.getUserFriendlyMessage(type, error));

    // In production, you would send this to your error reporting service
    // this.reportError(errorInfo);

    return errorInfo;
  }

  // Convert technical errors to user-friendly messages
  getUserFriendlyMessage(type, error) {
    const message = error?.message?.toLowerCase() || '';

    // Storage-related errors
    if (message.includes('localstorage') || message.includes('quota')) {
      return {
        title: 'Storage Issue',
        message: 'Unable to save your game progress. Please free up some space on your device.',
        action: 'Your current game will continue to work.'
      };
    }

    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || type.includes('Network')) {
      return {
        title: 'Connection Problem',
        message: 'Having trouble connecting. The game works offline!',
        action: 'Your progress is saved locally.'
      };
    }

    // Service Worker errors
    if (message.includes('service worker') || message.includes('sw')) {
      return {
        title: 'App Update Issue',
        message: 'There was a problem updating the app.',
        action: 'Try refreshing the page.'
      };
    }

    // Dictionary/Game data errors
    if (message.includes('dictionary') || message.includes('words')) {
      return {
        title: 'Game Data Problem',
        message: 'There was an issue loading the word dictionary.',
        action: 'Please refresh the page to try again.'
      };
    }

    // PWA/Installation errors
    if (message.includes('install') || message.includes('pwa')) {
      return {
        title: 'Installation Issue',
        message: 'Unable to install the app right now.',
        action: 'You can still play in your browser.'
      };
    }

    // Generic fallback
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred, but your game progress is safe.',
      action: 'Try refreshing the page if problems continue.'
    };
  }

  // Display user-friendly error message
  showUserError({ title, message, action }) {
    // Remove existing error messages
    this.clearUserMessages();

    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <div class="error-text">
          <h3 class="error-title">${title}</h3>
          <p class="error-description">${message}</p>
          <small class="error-action">${action}</small>
        </div>
        <button class="error-dismiss" aria-label="Dismiss error">&times;</button>
      </div>
    `;

    document.body.appendChild(errorElement);

    // Add dismiss functionality
    const dismissBtn = errorElement.querySelector('.error-dismiss');
    dismissBtn.addEventListener('click', () => {
      errorElement.classList.add('hiding');
      setTimeout(() => errorElement.remove(), 300);
    });

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.classList.add('hiding');
        setTimeout(() => errorElement.remove(), 300);
      }
    }, 8000);

    // Slide in animation
    setTimeout(() => errorElement.classList.add('show'), 100);

    this.userMessageElement = errorElement;
  }

  // Clear all user error messages
  clearUserMessages() {
    const existingMessages = document.querySelectorAll('.error-message');
    existingMessages.forEach(msg => msg.remove());
    this.userMessageElement = null;
  }

  // Wrap async operations with error handling
  async safeAsync(operation, fallback = null, errorContext = {}) {
    try {
      return await operation();
    } catch (error) {
      this.handleError('Async Operation Error', error, errorContext);
      return fallback;
    }
  }

  // Wrap synchronous operations with error handling
  safeSync(operation, fallback = null, errorContext = {}) {
    try {
      return operation();
    } catch (error) {
      this.handleError('Sync Operation Error', error, errorContext);
      return fallback;
    }
  }

  // Safe localStorage operations
  safeStorage = {
    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        this.handleError('Storage Read Error', error, { key });
        return defaultValue;
      }
    },

    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        this.handleError('Storage Write Error', error, { key, value });
        return false;
      }
    },

    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        this.handleError('Storage Remove Error', error, { key });
        return false;
      }
    }
  };

  // Safe DOM operations
  safeDom = {
    querySelector: (selector, fallback = null) => {
      try {
        return document.querySelector(selector) || fallback;
      } catch (error) {
        this.handleError('DOM Query Error', error, { selector });
        return fallback;
      }
    },

    addEventListener: (element, event, handler, options = {}) => {
      try {
        if (element && typeof element.addEventListener === 'function') {
          element.addEventListener(event, handler, options);
          return true;
        }
      } catch (error) {
        this.handleError('Event Listener Error', error, { event, element });
      }
      return false;
    }
  };

  // Report error to external service (placeholder)
  reportError(errorInfo) {
    // In production, send to error reporting service like Sentry
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorInfo)
    // }).catch(() => {
    //   // Silently fail if error reporting fails
    // });
  }

  // Check if localStorage is available and working
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check if we're in a degraded state
  checkSystemHealth() {
    const health = {
      storage: this.isStorageAvailable(),
      serviceWorker: 'serviceWorker' in navigator,
      online: navigator.onLine,
      timestamp: Date.now()
    };

    if (!health.storage) {
      this.showUserError({
        title: 'Storage Unavailable',
        message: 'Unable to save your progress. Playing in temporary mode.',
        action: 'Progress will be lost when you close the browser.'
      });
    }

    return health;
  }
}

// Create global error handler instance
export const errorHandler = new ErrorHandler();