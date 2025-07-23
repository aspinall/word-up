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
      statusIndicator.textContent = this.isOnline ? 'Online' : 'Offline';
      statusIndicator.title = this.isOnline ? 'Online' : 'Offline - Game still works!';
    }
  }

  // Setup install prompt handling
  setupInstallPrompt() {
    console.log('[PWA] Setting up install prompt listeners');
    
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });
    
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.deferredPrompt = null;
      this.hideInstallButton();
      this.showMessage('🎉 Word Up installed successfully!', 'success');
    });

    // Check if already installed or installable after a delay
    setTimeout(() => {
      if (!this.deferredPrompt && !this.isAppInstalled()) {
        console.log('[PWA] No install prompt available yet, checking PWA criteria');
        this.checkInstallability();
      }
    }, 3000);
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
      return false;
    }
    
    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return choiceResult.outcome;
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
      return 'error';
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
    try {
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
             window.navigator.standalone === true;
    } catch (error) {
      return false;
    }
  }

  // Check PWA installability criteria
  checkInstallability() {
    console.log('[PWA] Checking installability criteria:');
    console.log('- Service Worker registered:', !!this.swRegistration);
    console.log('- HTTPS:', location.protocol === 'https:');
    console.log('- Is installed:', this.isAppInstalled());
    console.log('- Has beforeinstallprompt:', !!this.deferredPrompt);
    
    // Check if manifest is accessible
    fetch('./manifest.webmanifest')
      .then(response => {
        console.log('- Manifest accessible:', response.ok);
        return response.json();
      })
      .then(manifest => {
        console.log('- Manifest loaded:', !!manifest);
        console.log('- Manifest name:', manifest.name);
        console.log('- Manifest icons:', manifest.icons?.length || 0);
      })
      .catch(error => {
        console.log('- Manifest error:', error.message);
      });
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

  // Show install prompt (alias for promptInstall)
  async showInstallPrompt() {
    return await this.promptInstall();
  }

  // Create install banner (for tests)
  createInstallBanner() {
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML = 'Install Word Up as an app';
    
    const app = document.getElementById('app');
    if (app) {
      app.appendChild(banner);
    }
  }

  // Check if app is running as PWA
  isPWA() {
    return this.isAppInstalled();
  }

  // Clear old caches
  async clearOldCaches() {
    return errorHandler.safeAsync(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => !name.includes('v1')); // Keep current version
        await Promise.all(oldCaches.map(name => caches.delete(name)));
        return true;
      }
      return false;
    }, false, { operation: 'clearOldCaches' });
  }

  // Register background sync
  async registerBackgroundSync() {
    return errorHandler.safeAsync(async () => {
      if (this.swRegistration && 'sync' in this.swRegistration) {
        await this.swRegistration.sync.register('background-sync');
        return true;
      }
      return false;
    }, false, { operation: 'registerBackgroundSync' });
  }

  // Get installation state
  getInstallationState() {
    return {
      isInstallable: !!this.deferredPrompt,
      isInstalled: this.isAppInstalled(),
      hasServiceWorker: 'serviceWorker' in navigator,
      isOnline: this.isOnline
    };
  }

  // Get PWA capabilities
  getPWACapabilities() {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      notification: 'Notification' in window,
      backgroundSync: 'serviceWorker' in navigator,
      periodicSync: 'serviceWorker' in navigator,
      install: !!this.deferredPrompt,
      storage: 'storage' in navigator,
      cache: 'caches' in window
    };
  }

  // Create update banner (for tests)
  createUpdateBanner() {
    this.showUpdatePrompt();
  }

  // Apply update (for tests) 
  applyUpdate() {
    this.updateApp();
  }

  // Show update available (for tests)
  showUpdateAvailable() {
    this.showMessage('Update available! Click to refresh.', 'info');
  }
}