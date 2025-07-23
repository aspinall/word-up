// PWA Manager for Word Up
// Handles PWA installation, offline status, and service worker communication

import { errorHandler } from './error-handler.js';

export class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.swRegistration = null;
    this.initializationFailed = false;
    this.init();
  }

  // Initialize PWA functionality
  async init() {
    try {
      this.setupOnlineOfflineHandlers();
      this.setupInstallPrompt();
      await this.registerServiceWorker();
      this.setupServiceWorkerMessages();
      this.checkForUpdates();
      this.updateOnlineStatus();
    } catch (error) {
      this.initializationFailed = true;
      errorHandler.handleError('PWA Initialization Failed', error, {
        operation: 'init',
        hasServiceWorker: 'serviceWorker' in navigator,
        isOnline: navigator.onLine
      });
    }
  }

  // Register the service worker (handled by VitePWA)
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      return errorHandler.safeAsync(async () => {
        this.swRegistration = await navigator.serviceWorker.ready;
        
        // Listen for updates
        errorHandler.safeDom.addEventListener(this.swRegistration, 'updatefound', () => {
          this.handleServiceWorkerUpdate();
        });
        
        return this.swRegistration;
      }, null, { operation: 'registerServiceWorker' });
    }
    return null;
  }

  // Handle service worker updates
  handleServiceWorkerUpdate() {
    const newWorker = this.swRegistration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker installed, prompt user to update
        this.showUpdatePrompt();
      }
    });
  }

  // Show update prompt to user
  showUpdatePrompt() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
      <div class="update-content">
        <span>🎮 A new version of Word Up is available!</span>
        <button class="btn-update" id="update-btn">Update Now</button>
        <button class="btn-dismiss" id="dismiss-update">Later</button>
      </div>
    `;
    
    document.body.appendChild(updateBanner);
    
    // Add event listeners
    document.getElementById('update-btn').addEventListener('click', () => {
      this.updateApp();
      updateBanner.remove();
    });
    
    document.getElementById('dismiss-update').addEventListener('click', () => {
      updateBanner.remove();
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (updateBanner.parentNode) {
        updateBanner.remove();
      }
    }, 10000);
  }

  // Update the app
  updateApp() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Setup online/offline status handlers
  setupOnlineOfflineHandlers() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOnlineStatus();
      this.showMessage('🌐 Back online! Your progress is safe.', 'success');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOnlineStatus();
      this.showMessage('📱 You\'re offline. Game continues to work!', 'info');
    });
  }

  // Update online status indicator
  updateOnlineStatus() {
    const statusIndicator = document.getElementById('online-status');
    if (statusIndicator) {
      statusIndicator.className = `online-status ${this.isOnline ? 'online' : 'offline'}`;
      statusIndicator.textContent = this.isOnline ? '🌐' : '📱';
      statusIndicator.title = this.isOnline ? 'Online' : 'Offline - Game still works!';
    }
  }

  // Setup install prompt handling
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });
    
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.hideInstallButton();
      this.showMessage('🎉 Word Up installed successfully!', 'success');
    });
  }

  // Show install button
  showInstallButton() {
    const installButton = document.getElementById('install-btn');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', this.promptInstall.bind(this));
    } else {
      // Create install button if it doesn't exist
      this.createInstallButton();
    }
  }

  // Create install button
  createInstallButton() {
    const installButton = document.createElement('button');
    installButton.id = 'install-btn';
    installButton.className = 'install-button';
    installButton.innerHTML = '📱 Install App';
    installButton.title = 'Install Word Up as an app';
    
    // Add to header
    const header = document.querySelector('.header');
    if (header) {
      header.appendChild(installButton);
      installButton.addEventListener('click', this.promptInstall.bind(this));
    }
  }

  // Hide install button
  hideInstallButton() {
    const installButton = document.getElementById('install-btn');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  // Prompt user to install
  async promptInstall() {
    if (!this.deferredPrompt) {
      return;
    }
    
    try {
      const result = await this.deferredPrompt.prompt();
      this.deferredPrompt = null;
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
    }
  }

  // Setup service worker message handling
  setupServiceWorkerMessages() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        
        const { type, message, online } = event.data;
        
        switch (type) {
          case 'ONLINE_STATUS':
            this.isOnline = online;
            this.updateOnlineStatus();
            break;
            
          case 'SYNC_STATISTICS':
            break;
        }
      });
    }
  }

  // Check for updates periodically
  checkForUpdates() {
    if (this.swRegistration) {
      // Check for updates every 30 minutes
      setInterval(() => {
        this.swRegistration.update();
      }, 30 * 60 * 1000);
    }
  }

  // Show message to user
  showMessage(text, type = 'info') {
    // Create message element
    const message = document.createElement('div');
    message.className = `pwa-message ${type}`;
    message.textContent = text;
    
    // Add to page
    document.body.appendChild(message);
    
    // Fade in
    setTimeout(() => message.classList.add('show'), 100);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      message.classList.remove('show');
      setTimeout(() => {
        if (message.parentNode) {
          message.remove();
        }
      }, 300);
    }, 4000);
  }

  // Check if app is installed
  isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Get installation status
  getInstallationStatus() {
    return {
      canInstall: !!this.deferredPrompt,
      isInstalled: this.isAppInstalled(),
      isOnline: this.isOnline,
      hasServiceWorker: !!this.swRegistration
    };
  }

  // Request persistent storage
  async requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        return persistent;
      } catch (error) {
        console.error('[PWA] Error requesting persistent storage:', error);
        return false;
      }
    }
    return false;
  }

  // Get storage usage
  async getStorageUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage,
          available: estimate.quota,
          usedMB: Math.round(estimate.usage / 1024 / 1024 * 100) / 100,
          availableMB: Math.round(estimate.quota / 1024 / 1024)
        };
      } catch (error) {
        console.error('[PWA] Error getting storage usage:', error);
        return null;
      }
    }
    return null;
  }
}