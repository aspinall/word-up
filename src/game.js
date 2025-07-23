// Core game logic for Word Up
// Handles game state, word validation, and scoring

import { WORDS } from './dictionaries/words.js';
import { DailyWordGenerator } from './daily-word.js';

export class GameLogic {
  constructor() {
    this.targetWord = '';
    this.currentRow = 0;
    this.currentCol = 0;
    this.gameState = 'playing'; // 'playing', 'won', 'lost'
    this.guesses = [];
    this.maxRows = 6;
    this.maxCols = 5;
    
    // Letter frequency tracking for keyboard hints
    this.letterStates = new Map(); // 'unused', 'absent', 'present', 'correct'
    
    // Single British English word dictionary
    this.words = WORDS;
    
    // Daily word generator
    this.dailyWordGenerator = new DailyWordGenerator();
    
    // Game mode: 'daily' or 'random'
    this.gameMode = 'daily';
  }

  // Initialize a new game
  startNewGame(targetWord = null, mode = 'daily') {
    this.gameMode = mode;
    
    if (targetWord) {
      this.targetWord = targetWord;
    } else if (mode === 'daily') {
      const dailyWord = this.dailyWordGenerator.getTodaysWord();
      this.targetWord = dailyWord.word;
    } else {
      this.targetWord = this.getRandomTargetWord();
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

  // Get a random target word
  getRandomTargetWord() {
    const randomIndex = Math.floor(Math.random() * this.words.length);
    return this.words[randomIndex];
  }

  // Check if a word is valid for guessing
  isValidWord(word) {
    if (word.length !== 5) return false;
    return this.words.includes(word.toUpperCase());
  }

  // Process a key press
  processKeyPress(key) {
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
      return {
        success: true,
        action: 'lose_game',
        row: this.currentRow - 1,
        letters: guess.split(''),
        states: result.states,
        targetWord: this.targetWord
      };
    }

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

  // Get current guess (placeholder - will be implemented with UI integration)
  getCurrentGuess() {
    // This will be provided by the UI component
    // For now, return empty string - will be overridden
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

  // Get hint (for development/testing)
  getHint() {
    if (this.gameState !== 'playing') return null;
    
    return {
      targetWord: this.targetWord,
      currentPosition: `${this.currentRow},${this.currentCol}`,
      letterStates: Object.fromEntries(this.letterStates)
    };
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

  // Start a random practice game
  startPracticeGame() {
    return this.startNewGame(null, 'random');
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

  // Get preview of upcoming daily words (development only)
  getDailyWordPreview(days = 7) {
    return this.dailyWordGenerator.getWordPreview(days);
  }
}