// Statistics tracking and storage for Word Up
// Handles game statistics, streaks, and performance metrics

import { errorHandler } from './error-handler.js';

export class GameStatistics {
  constructor() {
    this.storageKey = 'wordUp_statistics';
    this.fallbackMode = false;
    this.stats = this.loadStats();
  }

  // Load statistics from localStorage
  loadStats() {
    return errorHandler.safeSync(() => {
      const saved = errorHandler.safeStorage.get(this.storageKey);
      if (saved) {
        return this.validateAndMigrateStats(saved);
      }
      return this.getDefaultStats();
    }, this.getDefaultStats(), { operation: 'loadStats' });
  }

  // Get default statistics structure
  getDefaultStats() {
    return {
      version: 1,
      totalGames: 0,
      totalWins: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: [0, 0, 0, 0, 0, 0], // Index 0-5 for guesses 1-6
      averageGuesses: 0,
      lastPlayedDate: null,
      lastCompletedWord: null,
      gameHistory: [], // Last 100 games for detailed tracking
      dailyStats: {
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        lastPlayedDate: null
      },
      practiceStats: {
        played: 0,
        won: 0,
        totalGuesses: 0
      }
    };
  }

  // Validate and migrate stats from older versions
  validateAndMigrateStats(stats) {
    const defaultStats = this.getDefaultStats();
    
    // Ensure all required properties exist
    const migrated = { ...defaultStats, ...stats };
    
    // Ensure arrays have correct length
    if (!Array.isArray(migrated.guessDistribution) || migrated.guessDistribution.length !== 6) {
      migrated.guessDistribution = defaultStats.guessDistribution;
    }
    
    if (!Array.isArray(migrated.gameHistory)) {
      migrated.gameHistory = [];
    }
    
    // Ensure nested objects exist
    migrated.dailyStats = { ...defaultStats.dailyStats, ...(migrated.dailyStats || {}) };
    migrated.practiceStats = { ...defaultStats.practiceStats, ...(migrated.practiceStats || {}) };
    
    return migrated;
  }

  // Save statistics to localStorage
  saveStats() {
    const success = errorHandler.safeStorage.set(this.storageKey, this.stats);
    
    if (!success) {
      this.fallbackMode = true;
      errorHandler.handleError('Statistics Save Failed', new Error('Unable to save statistics'), {
        operation: 'saveStats',
        storageKey: this.storageKey,
        statsSize: JSON.stringify(this.stats).length
      });
      return false;
    }

    // Request background sync if available
    errorHandler.safeAsync(async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await registration.sync.register('statistics-sync');
        }
      }
    }, null, { operation: 'backgroundSync' });

    return true;
  }

  // Record a completed game
  recordGame(gameResult) {
    const {
      won,
      guessCount,
      targetWord,
      gameMode = 'daily',
      date = new Date().toISOString().split('T')[0]
    } = gameResult;

    // Update total stats
    this.stats.totalGames++;
    if (won) {
      this.stats.totalWins++;
      this.stats.guessDistribution[guessCount - 1]++;
      this.updateCurrentStreak(true, date);
    } else {
      this.updateCurrentStreak(false, date);
    }

    // Update mode-specific stats
    if (gameMode === 'daily') {
      this.updateDailyStats(won, guessCount, date);
    } else {
      this.updatePracticeStats(won, guessCount);
    }

    // Add to game history (keep last 100 games)
    const gameRecord = {
      date,
      won,
      guessCount: won ? guessCount : null,
      targetWord,
      gameMode
    };
    
    this.stats.gameHistory.unshift(gameRecord);
    if (this.stats.gameHistory.length > 100) {
      this.stats.gameHistory = this.stats.gameHistory.slice(0, 100);
    }

    // Update derived stats
    this.updateAverageGuesses();
    this.stats.lastPlayedDate = date;
    this.stats.lastCompletedWord = targetWord;

    this.saveStats();
  }

  // Update daily game statistics
  updateDailyStats(won, guessCount, date) {
    this.stats.dailyStats.played++;
    
    if (won) {
      this.stats.dailyStats.won++;
    }

    // Update daily streak
    const lastDate = this.stats.dailyStats.lastPlayedDate;
    if (lastDate) {
      const daysDiff = this.getDaysDifference(lastDate, date);
      
      if (daysDiff === 1 && won) {
        // Consecutive day win
        this.stats.dailyStats.currentStreak++;
      } else if (daysDiff === 1 && !won) {
        // Consecutive day but lost
        this.stats.dailyStats.currentStreak = 0;
      } else if (daysDiff > 1) {
        // Gap in playing
        this.stats.dailyStats.currentStreak = won ? 1 : 0;
      }
      // Same day (daysDiff === 0) - don't change streak
    } else {
      // First daily game
      this.stats.dailyStats.currentStreak = won ? 1 : 0;
    }

    if (this.stats.dailyStats.currentStreak > this.stats.dailyStats.maxStreak) {
      this.stats.dailyStats.maxStreak = this.stats.dailyStats.currentStreak;
    }

    this.stats.dailyStats.lastPlayedDate = date;
  }

  // Update practice game statistics
  updatePracticeStats(won, guessCount) {
    this.stats.practiceStats.played++;
    
    if (won) {
      this.stats.practiceStats.won++;
      this.stats.practiceStats.totalGuesses += guessCount;
    }
  }

  // Update overall streak
  updateCurrentStreak(won, date) {
    const lastDate = this.stats.lastPlayedDate;
    
    if (won) {
      if (!lastDate || this.getDaysDifference(lastDate, date) <= 1) {
        this.stats.currentStreak++;
      } else {
        this.stats.currentStreak = 1;
      }
      
      if (this.stats.currentStreak > this.stats.maxStreak) {
        this.stats.maxStreak = this.stats.currentStreak;
      }
    } else {
      this.stats.currentStreak = 0;
    }
  }

  // Calculate average guesses for won games
  updateAverageGuesses() {
    const totalGuesses = this.stats.guessDistribution.reduce((sum, count, index) => {
      return sum + (count * (index + 1));
    }, 0);
    
    this.stats.averageGuesses = this.stats.totalWins > 0 
      ? Math.round((totalGuesses / this.stats.totalWins) * 10) / 10 
      : 0;
  }

  // Get difference in days between two date strings
  getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const timeDiff = d2.getTime() - d1.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  }

  // Get formatted statistics for display
  getDisplayStats() {
    const winRate = this.stats.totalGames > 0 
      ? Math.round((this.stats.totalWins / this.stats.totalGames) * 100) 
      : 0;
    
    const dailyWinRate = this.stats.dailyStats.played > 0
      ? Math.round((this.stats.dailyStats.won / this.stats.dailyStats.played) * 100)
      : 0;
    
    const practiceWinRate = this.stats.practiceStats.played > 0
      ? Math.round((this.stats.practiceStats.won / this.stats.practiceStats.played) * 100)
      : 0;

    const practiceAverage = this.stats.practiceStats.won > 0
      ? Math.round((this.stats.practiceStats.totalGuesses / this.stats.practiceStats.won) * 10) / 10
      : 0;

    return {
      overall: {
        played: this.stats.totalGames,
        winRate,
        currentStreak: this.stats.currentStreak,
        maxStreak: this.stats.maxStreak,
        averageGuesses: this.stats.averageGuesses
      },
      daily: {
        played: this.stats.dailyStats.played,
        won: this.stats.dailyStats.won,
        winRate: dailyWinRate,
        currentStreak: this.stats.dailyStats.currentStreak,
        maxStreak: this.stats.dailyStats.maxStreak
      },
      practice: {
        played: this.stats.practiceStats.played,
        won: this.stats.practiceStats.won,
        winRate: practiceWinRate,
        averageGuesses: practiceAverage
      },
      guessDistribution: [...this.stats.guessDistribution],
      recentGames: this.stats.gameHistory.slice(0, 10)
    };
  }

  // Check if player has played today
  hasPlayedToday(gameMode = 'daily') {
    const today = new Date().toISOString().split('T')[0];
    
    if (gameMode === 'daily') {
      return this.stats.dailyStats.lastPlayedDate === today;
    }
    
    return this.stats.lastPlayedDate === today;
  }

  // Get statistics for a specific time period
  getStatsForPeriod(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffString = cutoffDate.toISOString().split('T')[0];
    
    const recentGames = this.stats.gameHistory.filter(game => game.date >= cutoffString);
    
    const wins = recentGames.filter(game => game.won).length;
    const total = recentGames.length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    
    return {
      period: `${days} days`,
      totalGames: total,
      wins,
      winRate,
      games: recentGames
    };
  }

  // Export statistics data
  exportStats() {
    return {
      exportDate: new Date().toISOString(),
      statistics: { ...this.stats }
    };
  }

  // Import statistics data
  importStats(importedData) {
    return errorHandler.safeSync(() => {
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid import data format');
      }
      
      if (!importedData.statistics) {
        throw new Error('No statistics data found in import');
      }
      
      const validatedStats = this.validateAndMigrateStats(importedData.statistics);
      this.stats = validatedStats;
      
      if (!this.saveStats()) {
        throw new Error('Failed to save imported statistics');
      }
      
      return true;
    }, false, { 
      operation: 'importStats',
      dataKeys: importedData ? Object.keys(importedData) : []
    });
  }

  // Reset all statistics
  resetStats() {
    this.stats = this.getDefaultStats();
    this.saveStats();
  }

  // Get raw statistics object
  getRawStats() {
    return { ...this.stats };
  }

  // Check if we're in fallback mode (statistics not saving)
  isInFallbackMode() {
    return this.fallbackMode;
  }

  // Get system health status
  getSystemHealth() {
    return {
      storageWorking: !this.fallbackMode,
      storageAvailable: errorHandler.isStorageAvailable(),
      lastSaveSuccess: !this.fallbackMode,
      statsCount: this.stats.totalGames
    };
  }
}