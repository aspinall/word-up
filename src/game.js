// Core game logic for Word Up
// Handles game state, word validation, and scoring

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
    
    // Basic word list for validation (will be expanded)
    this.validWords = new Set([
      'ABOUT', 'ABOVE', 'AFTER', 'AGAIN', 'ALONG', 'AMONG', 'ANGEL', 'ANGRY',
      'BADGE', 'BASIC', 'BEACH', 'BEGAN', 'BEING', 'BELOW', 'BENCH', 'BIRTH',
      'BOARD', 'BREAD', 'BREAK', 'BRING', 'BROAD', 'BROWN', 'BUILD', 'BUILT',
      'CHAIR', 'CHART', 'CHECK', 'CHEST', 'CHILD', 'CHINA', 'CHOSE', 'CIVIL',
      'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLIMB', 'CLOCK', 'CLOSE', 'COURT',
      'COVER', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM', 'CRIME', 'CROSS', 'CROWD',
      'DAILY', 'DANCE', 'DEATH', 'DOUBT', 'DRAFT', 'DRAMA', 'DREAM', 'DRESS',
      'DRINK', 'DRIVE', 'DROVE', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT',
      'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'EVENT',
      'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FAULT', 'FIELD',
      'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED', 'FLASH', 'FLOOR',
      'FOCUS', 'FORCE', 'FORTH', 'FORTY', 'FOUND', 'FRAME', 'FRANK', 'FRESH',
      'FRONT', 'FRUIT', 'FULLY', 'FUNNY', 'GHOST', 'GIVEN', 'GLASS', 'GLOBE',
      'GOING', 'GRACE', 'GRADE', 'GRAND', 'GRANT', 'GRASS', 'GRAVE', 'GREAT',
      'GREEN', 'GROSS', 'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE',
      'HAPPY', 'HARSH', 'HEART', 'HEAVY', 'HENRY', 'HORSE', 'HOTEL', 'HOUSE',
      'HUMAN', 'HURRY', 'IMAGE', 'INDEX', 'INNER', 'INPUT', 'ISSUE', 'JAPAN',
      'JIMMY', 'JOINT', 'JONES', 'JUDGE', 'KNOWN', 'LABEL', 'LARGE', 'LASER',
      'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL',
      'LEVEL', 'LEWIS', 'LIGHT', 'LIMIT', 'LIVED', 'LOCAL', 'LOOSE', 'LOWER',
      'LUCKY', 'LUNCH', 'LYING', 'MAGIC', 'MAJOR', 'MAKER', 'MARCH', 'MARIE',
      'MATCH', 'MAYBE', 'MAYOR', 'MEANT', 'MEDIA', 'METAL', 'MIGHT', 'MINOR',
      'MINUS', 'MIXED', 'MODEL', 'MONEY', 'MONTH', 'MORAL', 'MOUSE', 'MOUTH',
      'MOVIE', 'MUSIC', 'NEEDS', 'NEVER', 'NEWLY', 'NIGHT', 'NOISE', 'NORTH',
      'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN', 'ORDER',
      'OTHER', 'OUGHT', 'PAINT', 'PANEL', 'PAPER', 'PARTY', 'PEACE', 'PETER',
      'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PLACE',
      'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'POINT', 'POUND', 'POWER', 'PRESS',
      'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD',
      'PROVE', 'QUEEN', 'QUICK', 'QUIET', 'QUITE', 'RADIO', 'RAISE', 'RANGE',
      'RAPID', 'RATIO', 'REACH', 'READY', 'REFER', 'RIGHT', 'RIVER', 'ROBIN',
      'ROGER', 'ROMAN', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SCALE',
      'SCENE', 'SCOPE', 'SCORE', 'SENSE', 'SERVE', 'SEVEN', 'SHALL', 'SHAPE',
      'SHARE', 'SHARP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT',
      'SHOCK', 'SHOOT', 'SHORT', 'SHOWN', 'SIGHT', 'SINCE', 'SIXTH', 'SIXTY',
      'SIZED', 'SKILL', 'SLEEP', 'SLIDE', 'SMALL', 'SMART', 'SMILE', 'SMITH',
      'SMOKE', 'SNAKE', 'SNOW', 'SOLID', 'SOLVE', 'SORRY', 'SOUND', 'SOUTH',
      'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT', 'SPOKE',
      'SPORT', 'STAFF', 'STAGE', 'STAKE', 'STAND', 'START', 'STATE', 'STEAM',
      'STEEL', 'STICK', 'STILL', 'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM',
      'STORY', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE',
      'SUPER', 'SWEET', 'TABLE', 'TAKEN', 'TASTE', 'TAXES', 'TEACH', 'TEENS',
      'TEETH', 'TERRY', 'TEXAS', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE',
      'THESE', 'THICK', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW',
      'THROW', 'THUMB', 'TIGER', 'TIGHT', 'TIRED', 'TITLE', 'TODAY', 'TOPIC',
      'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIN', 'TREAT',
      'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED', 'TRIES', 'TRUCK', 'TRULY',
      'TRUNK', 'TRUST', 'TRUTH', 'TWICE', 'UNCLE', 'UNDER', 'UNDUE', 'UNION',
      'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VALUE',
      'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOCAL', 'VOICE', 'WASTE', 'WATCH',
      'WATER', 'WAVE', 'WAYS', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE',
      'WHOLE', 'WHOSE', 'WIDER', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE',
      'WORST', 'WORTH', 'WOULD', 'WRITE', 'WRONG', 'WROTE', 'YOUNG', 'YOUTH'
    ]);
    
    // Common target words for demo
    this.targetWords = [
      'ABOUT', 'WORLD', 'THINK', 'GREAT', 'WRITE', 'LIGHT', 'SPEAK', 'HAPPY',
      'MUSIC', 'DANCE', 'MAGIC', 'DREAM', 'HEART', 'SMILE', 'LEARN', 'PEACE'
    ];
  }

  // Initialize a new game
  startNewGame(targetWord = null) {
    this.targetWord = targetWord || this.getRandomTargetWord();
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
    const randomIndex = Math.floor(Math.random() * this.targetWords.length);
    return this.targetWords[randomIndex];
  }

  // Check if a word is valid for guessing
  isValidWord(word) {
    if (word.length !== 5) return false;
    return this.validWords.has(word.toUpperCase());
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
}