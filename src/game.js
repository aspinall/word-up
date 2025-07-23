// Core game logic for Word Up
// Handles game state, word validation, and scoring

import { ANSWERS } from './dictionaries/answers.js';
import { VALID_GUESSES } from './dictionaries/valid-guesses.js';
import { DailyWordGenerator } from './daily-word.js';
import { GameStatistics } from './statistics.js';
import { errorHandler } from './error-handler.js';

export class GameLogic {
  constructor() {
    this.targetWord = '';
    this.currentRow = 0;
    this.currentCol = 0;
    this.gameState = 'playing'; // 'playing', 'won', 'lost'
    this.guesses = [];
    this.maxRows = 6;
    this.maxCols = 5;
    this.initialized = false;
    
    // Letter frequency tracking for keyboard hints
    this.letterStates = new Map(); // 'unused', 'absent', 'present', 'correct'
    
    // Game state persistence
    this.gameStateKey = 'wordUp_gameState';
    
    // Initialize components with error handling
    this.initializeGame();
  }

  // Initialize game components with error handling
  initializeGame() {
    try {
      // Single British English word dictionary
      this.answers = ANSWERS;
      this.validGuesses = VALID_GUESSES;
      if (!this.answers || !Array.isArray(this.answers) || this.answers.length === 0) {
        throw new Error('Answer dictionary is empty or invalid');
      }
      if (!this.validGuesses || !Array.isArray(this.validGuesses) || this.validGuesses.length === 0) {
        throw new Error('Valid guesses dictionary is empty or invalid');
      }
      
      // Daily word generator
      this.dailyWordGenerator = new DailyWordGenerator(this.answers);
      
      // Statistics tracking
      this.statistics = new GameStatistics();
      
      // Game mode: 'daily' only
      this.gameMode = 'daily';
      
      this.initialized = true;
      
      // Try to restore existing game state or start new game
      this.initializeDailyGame();
    } catch (error) {
      this.initialized = false;
      errorHandler.handleError('Game Initialization Error', error, {
        operation: 'initializeGame',
        wordsLength: this.answers?.length || 0,
        gameMode: this.gameMode
      });
    }
  }

  // Initialize a new game
  startNewGame(targetWord = null, mode = 'daily') {
    this.gameMode = 'daily'; // Only daily mode supported
    
    if (targetWord) {
      this.targetWord = targetWord;
    } else {
      const dailyWord = this.dailyWordGenerator.getTodaysWord();
      this.targetWord = dailyWord.word;
    }
    
    this.currentRow = 0;
    this.currentCol = 0;
    this.gameState = 'playing';
    this.guesses = [];
    this.letterStates.clear();
    
    // Initialize all letters as unused
    for (let i = 65; i <= 90; i++) {
      this.letterStates.set(String.fromCharCode(i), 'unused');
    }
    
    return this.targetWord;
  }


  // Check if a word is valid for guessing
  isValidWord(word) {
    if (word.length !== 5) return false;
    const upperWord = word.toUpperCase();
    return this.answers.includes(upperWord) || this.validGuesses.includes(upperWord);
  }

  // Process a key press
  processKeyPress(key) {
    if (!this.initialized) {
      return { success: false, reason: 'Game not properly initialized' };
    }
    
    if (this.gameState !== 'playing') {
      return { success: false, reason: 'Game is over' };
    }

    if (key === 'ENTER') {
      return this.submitGuess();
    } else if (key === 'BACKSPACE') {
      return this.deleteLetter();
    } else if (key.match(/^[A-Z]$/)) {
      return this.addLetter(key);
    }

    return { success: false, reason: 'Invalid key' };
  }

  // Add a letter to the current position
  addLetter(letter) {
    if (this.currentCol >= this.maxCols) {
      return { success: false, reason: 'Row is full' };
    }

    return {
      success: true,
      action: 'add_letter',
      letter: letter,
      row: this.currentRow,
      col: this.currentCol++
    };
  }

  // Delete the last letter
  deleteLetter() {
    if (this.currentCol <= 0) {
      return { success: false, reason: 'Nothing to delete' };
    }

    this.currentCol--;
    return {
      success: true,
      action: 'delete_letter',
      row: this.currentRow,
      col: this.currentCol
    };
  }

  // Submit the current guess
  submitGuess() {
    if (this.currentCol < this.maxCols) {
      return { 
        success: false, 
        reason: 'Not enough letters',
        action: 'shake_row',
        row: this.currentRow
      };
    }

    // Get the current guess from the UI (this will be passed in)
    const guess = this.getCurrentGuess();
    
    if (!this.isValidWord(guess)) {
      return {
        success: false,
        reason: 'Not in word list',
        action: 'shake_row',
        row: this.currentRow
      };
    }

    // Validate the guess and get feedback
    const result = this.validateGuess(guess);
    this.guesses.push({ word: guess, result: result.states });

    // Update letter states for keyboard
    this.updateLetterStates(guess, result.states);

    // Check win condition
    if (result.states.every(state => state === 'correct')) {
      this.gameState = 'won';
      
      // Record win in statistics
      this.statistics.recordGame({
        won: true,
        guessCount: this.currentRow + 1,
        targetWord: this.targetWord,
        gameMode: this.gameMode
      });
      
      // Save game state after win
      this.saveGameState();
      
      return {
        success: true,
        action: 'win_game',
        row: this.currentRow,
        letters: guess.split(''),
        states: result.states,
        guessCount: this.currentRow + 1
      };
    }

    // Move to next row
    this.currentRow++;
    this.currentCol = 0;

    // Check lose condition
    if (this.currentRow >= this.maxRows) {
      this.gameState = 'lost';
      
      // Record loss in statistics
      this.statistics.recordGame({
        won: false,
        guessCount: this.maxRows,
        targetWord: this.targetWord,
        gameMode: this.gameMode
      });
      
      // Save game state after loss
      this.saveGameState();
      
      return {
        success: true,
        action: 'lose_game',
        row: this.currentRow - 1,
        letters: guess.split(''),
        states: result.states,
        targetWord: this.targetWord
      };
    }

    // Save game state after each guess
    this.saveGameState();
    
    return {
      success: true,
      action: 'continue_game',
      row: this.currentRow - 1,
      letters: guess.split(''),
      states: result.states
    };
  }

  // Validate a guess against the target word
  validateGuess(guess) {
    const target = this.targetWord.toUpperCase();
    const guessArray = guess.toUpperCase().split('');
    const targetArray = target.split('');
    const states = new Array(5).fill('absent');
    
    // Track letter counts in target word
    const targetCounts = {};
    targetArray.forEach(letter => {
      targetCounts[letter] = (targetCounts[letter] || 0) + 1;
    });

    // First pass: mark correct letters
    guessArray.forEach((letter, i) => {
      if (letter === targetArray[i]) {
        states[i] = 'correct';
        targetCounts[letter]--;
      }
    });

    // Second pass: mark present letters
    guessArray.forEach((letter, i) => {
      if (states[i] === 'absent' && targetCounts[letter] > 0) {
        states[i] = 'present';
        targetCounts[letter]--;
      }
    });

    return {
      word: guess,
      states: states,
      isWin: states.every(state => state === 'correct')
    };
  }

  // Update letter states for keyboard display
  updateLetterStates(guess, states) {
    guess.split('').forEach((letter, i) => {
      const currentState = this.letterStates.get(letter);
      const newState = states[i];
      
      // Priority: correct > present > absent > unused
      const statePriority = { unused: 0, absent: 1, present: 2, correct: 3 };
      
      if (statePriority[newState] > statePriority[currentState]) {
        this.letterStates.set(letter, newState);
      }
    });
  }

  // Get current guess (overridden by UI integration)
  getCurrentGuess() {
    return '';
  }

  // Get game statistics
  getGameStats() {
    return {
      gameState: this.gameState,
      currentRow: this.currentRow,
      currentCol: this.currentCol,
      targetWord: this.targetWord,
      guesses: this.guesses,
      letterStates: Object.fromEntries(this.letterStates)
    };
  }

  // Reset game state
  reset() {
    this.startNewGame();
  }


  // Get today's daily word information
  getTodaysWordInfo() {
    return this.dailyWordGenerator.getTodaysWord();
  }

  // Get daily word stats (including time until next word)
  getDailyStats() {
    return this.dailyWordGenerator.getDayStats();
  }

  // Check if game is in daily mode
  isDailyMode() {
    return this.gameMode === 'daily';
  }


  // Start today's daily game
  startDailyGame() {
    return this.startNewGame(null, 'daily');
  }

  // Get word for a specific date (for testing/admin)
  getWordForDate(dateString) {
    return this.dailyWordGenerator.getWordForDate(dateString);
  }

  // Validate the daily word system
  validateDailySystem() {
    return this.dailyWordGenerator.validateSystem();
  }


  // Get formatted statistics for display
  getStatistics() {
    return this.statistics.getDisplayStats();
  }

  // Check if player has played today
  hasPlayedToday() {
    return this.statistics.hasPlayedToday(this.gameMode);
  }

  // Get statistics for a specific period
  getStatsForPeriod(days = 30) {
    return this.statistics.getStatsForPeriod(days);
  }

  // Export statistics
  exportStatistics() {
    return this.statistics.exportStats();
  }

  // Import statistics
  importStatistics(data) {
    return this.statistics.importStats(data);
  }

  // Reset statistics
  resetStatistics() {
    this.statistics.resetStats();
  }

  // Initialize daily game with state restoration
  initializeDailyGame() {
    const today = new Date().toISOString().split('T')[0];
    const savedState = this.loadGameState();
    
    // Check if we have a saved state for today
    if (savedState && savedState.date === today) {
      // Restore the saved game state
      this.restoreGameState(savedState);
    } else {
      // Clear any old game state and start fresh
      this.clearGameState();
      this.startNewGame();
    }
  }

  // Save current game state to localStorage
  saveGameState() {
    const today = new Date().toISOString().split('T')[0];
    const gameState = {
      date: today,
      targetWord: this.targetWord,
      currentRow: this.currentRow,
      currentCol: this.currentCol,
      gameState: this.gameState,
      guesses: [...this.guesses],
      letterStates: Object.fromEntries(this.letterStates),
      gameMode: this.gameMode
    };
    
    return errorHandler.safeStorage.set(this.gameStateKey, gameState);
  }

  // Load game state from localStorage
  loadGameState() {
    return errorHandler.safeStorage.get(this.gameStateKey);
  }

  // Restore game state from saved data
  restoreGameState(savedState) {
    this.targetWord = savedState.targetWord;
    this.currentRow = savedState.currentRow;
    this.currentCol = savedState.currentCol;
    this.gameState = savedState.gameState;
    this.guesses = [...savedState.guesses];
    this.gameMode = savedState.gameMode || 'daily';
    
    // Restore letter states
    this.letterStates.clear();
    if (savedState.letterStates) {
      Object.entries(savedState.letterStates).forEach(([letter, state]) => {
        this.letterStates.set(letter, state);
      });
    } else {
      // Initialize all letters as unused if no saved states
      for (let i = 65; i <= 90; i++) {
        this.letterStates.set(String.fromCharCode(i), 'unused');
      }
    }
  }

  // Clear saved game state
  clearGameState() {
    errorHandler.safeStorage.remove(this.gameStateKey);
  }

  // Check if today's daily word has been completed
  isDailyWordCompleted() {
    const today = new Date().toISOString().split('T')[0];
    const savedState = this.loadGameState();
    
    return savedState && 
           savedState.date === today && 
           (savedState.gameState === 'won' || savedState.gameState === 'lost');
  }
}