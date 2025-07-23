// UI module for Word Up game
// Handles DOM manipulation and rendering

export class GameUI {
  constructor() {
    this.app = document.querySelector('#app');
    this.gameBoard = null;
    this.keyboard = null;
    this.tiles = [];
    this.keys = {};
  }

  // Initialize the complete UI
  init() {
    if (!this.app) {
      console.warn('App element not found');
      return;
    }
    this.render();
    this.createGameBoard();
    this.createKeyboard();
    this.addEventListeners();
  }

  // Render the main game structure
  render() {
    if (!this.app) return;
    this.app.innerHTML = `
      <div class="container">
        <header class="header">
          <button class="stats-button" id="stats-btn" title="Statistics">📊</button>
          <h1>Word Up</h1>
          <div class="header-right">
            <span class="online-status online" id="online-status" title="Online">🌐</span>
            <button class="help-button" id="help-btn" title="Help">?</button>
          </div>
        </header>
        
        <div class="daily-info" id="daily-info">
          <span id="daily-text">Daily Word</span>
          <span id="daily-timer"></span>
          <button class="practice-toggle" id="practice-toggle" title="Switch to practice mode">Practice</button>
        </div>
        
        <main class="main">
          <div class="game-container">
            <div class="game-board" id="game-board"></div>
            <div class="keyboard" id="keyboard"></div>
          </div>
          
          <div class="game-status" id="game-status" style="display: none;">
            <h2 id="status-title">Game Complete!</h2>
            <p id="status-message">The word was: <strong id="correct-word"></strong></p>
          </div>
        </main>
      </div>
    `;

    this.gameBoard = document.getElementById('game-board');
    this.keyboard = document.getElementById('keyboard');
  }

  // Create the 6x5 game board grid
  createGameBoard() {
    // Clear existing tiles
    this.gameBoard.innerHTML = '';
    this.tiles = [];

    // Create 6 rows of 5 tiles each
    for (let row = 0; row < 6; row++) {
      const rowTiles = [];
      for (let col = 0; col < 5; col++) {
        const tile = document.createElement('div');
        tile.className = 'game-tile';
        tile.setAttribute('data-row', row);
        tile.setAttribute('data-col', col);
        tile.setAttribute('data-state', 'empty');
        
        this.gameBoard.appendChild(tile);
        rowTiles.push(tile);
      }
      this.tiles.push(rowTiles);
    }
  }

  // Create the virtual keyboard
  createKeyboard() {
    const keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['BACKSPACE', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER']
    ];

    this.keyboard.innerHTML = '';
    this.keys = {};

    keyboardLayout.forEach(row => {
      const keyboardRow = document.createElement('div');
      keyboardRow.className = 'keyboard-row';

      row.forEach(keyValue => {
        const key = document.createElement('button');
        key.className = 'key';
        key.setAttribute('data-key', keyValue);
        key.setAttribute('data-state', 'unused');

        if (keyValue === 'ENTER' || keyValue === 'BACKSPACE') {
          key.classList.add('wide');
          key.textContent = keyValue === 'ENTER' ? 'ENTER' : '⌫';
        } else {
          key.textContent = keyValue;
        }

        keyboardRow.appendChild(key);
        this.keys[keyValue] = key;
      });

      this.keyboard.appendChild(keyboardRow);
    });
  }

  // Add event listeners for keyboard and touch interactions
  addEventListeners() {
    // Virtual keyboard clicks
    this.keyboard.addEventListener('click', (e) => {
      if (e.target.matches('.key')) {
        const key = e.target.getAttribute('data-key');
        this.handleKeyPress(key);
      }
    });

    // Physical keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      const key = e.key.toUpperCase();
      
      if (key === 'ENTER') {
        e.preventDefault();
        this.handleKeyPress('ENTER');
      } else if (key === 'BACKSPACE') {
        e.preventDefault();
        this.handleKeyPress('BACKSPACE');
      } else if (key.match(/^[A-Z]$/)) {
        e.preventDefault();
        this.handleKeyPress(key);
      }
    });

    // Help and stats buttons
    document.getElementById('help-btn').addEventListener('click', () => {
      this.showHelp();
    });

  }

  // Handle key press events (to be connected to game logic)
  handleKeyPress(key) {
    // Dispatch custom event for game logic to handle
    document.dispatchEvent(new CustomEvent('keypress', { 
      detail: { key } 
    }));
  }

  // Update a tile with a letter and animation
  updateTile(row, col, letter, state = 'filled') {
    if (!this.tiles || !this.tiles[row] || !this.tiles[row][col]) {
      return;
    }
    const tile = this.tiles[row][col];
    if (!tile) return;

    tile.textContent = letter.toUpperCase();
    tile.setAttribute('data-state', state);
    
    // Add appropriate CSS class
    tile.className = `game-tile ${state}`;
    
    // Add pop animation for new letters
    if (letter && state === 'filled') {
      tile.classList.add('animate-pop');
      setTimeout(() => tile.classList.remove('animate-pop'), 150);
    }
  }

  // Update an entire row with results (correct, present, absent)
  updateRow(row, letters, states, animate = true) {
    if (animate) {
      // Add flip animation to the row
      const rowElement = this.tiles[row][0].parentElement;
      rowElement.classList.add('animate-flip-row');
      
      // Update each tile with staggered timing
      states.forEach((state, col) => {
        setTimeout(() => {
          this.updateTile(row, col, letters[col], state);
        }, col * 100);
      });

      // Remove animation class after completion
      setTimeout(() => {
        rowElement.classList.remove('animate-flip-row');
      }, 600);
    } else {
      // Update without animation
      states.forEach((state, col) => {
        this.updateTile(row, col, letters[col], state);
      });
    }
  }

  // Update keyboard key state based on letter feedback
  updateKeyState(letter, state) {
    const key = this.keys[letter.toUpperCase()];
    if (!key) return;

    const currentState = key.getAttribute('data-state');
    
    // Don't downgrade key state (correct > present > absent > unused)
    const stateHierarchy = { unused: 0, absent: 1, present: 2, correct: 3 };
    if (stateHierarchy[state] > stateHierarchy[currentState]) {
      key.setAttribute('data-state', state);
      key.className = `key ${state}`;
    }
  }

  // Show game status (win/lose)
  showGameStatus(isWin, correctWord, guessCount = 0) {
    const statusElement = document.getElementById('game-status');
    const titleElement = document.getElementById('status-title');
    const messageElement = document.getElementById('status-message');
    const correctWordElement = document.getElementById('correct-word');

    if (isWin) {
      statusElement.className = 'game-status win';
      titleElement.textContent = 'Excellent!';
      messageElement.innerHTML = `You solved it in ${guessCount} guess${guessCount !== 1 ? 'es' : ''}!`;
      
      // Add victory animation to the winning row
      const winningRow = this.tiles[guessCount - 1];
      winningRow[0].parentElement.classList.add('animate-victory');
    } else {
      statusElement.className = 'game-status lose';
      titleElement.textContent = 'Game Over';
      messageElement.innerHTML = `The word was: <strong id="correct-word">${correctWord}</strong>`;
      correctWordElement.textContent = correctWord;
    }

    statusElement.style.display = 'block';
    statusElement.classList.add('animate-fade-in');
  }

  // Show error message
  showMessage(text, type = 'error') {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    document.body.appendChild(message);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 3000);
  }

  // Shake animation for invalid words
  shakeRow(row) {
    const rowTiles = this.tiles[row];
    rowTiles.forEach(tile => {
      tile.classList.add('animate-shake');
    });
    
    setTimeout(() => {
      rowTiles.forEach(tile => {
        tile.classList.remove('animate-shake');
      });
    }, 500);
  }

  // Show help modal
  showHelp() {
    this.showMessage('Help: Guess the word in 6 tries! Green = correct, Yellow = wrong position, Gray = not in word', 'success');
  }

  // Show stats modal
  showStats(gameLogic) {
    const stats = gameLogic.getStatistics();
    this.showStatsModal(stats);
  }

  // Create and show statistics modal
  showStatsModal(stats) {
    // Remove existing modal if present
    const existingModal = document.getElementById('stats-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'stats-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Statistics</h2>
          <button class="modal-close" id="stats-close">&times;</button>
        </div>
        
        <div class="stats-container">
          <div class="stats-section">
            <h3>Overall Performance</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">${stats.overall.played}</div>
                <div class="stat-label">Played</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.overall.winRate}%</div>
                <div class="stat-label">Win Rate</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.overall.currentStreak}</div>
                <div class="stat-label">Current Streak</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.overall.maxStreak}</div>
                <div class="stat-label">Max Streak</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.overall.averageGuesses}</div>
                <div class="stat-label">Avg Guesses</div>
              </div>
            </div>
          </div>

          <div class="stats-section">
            <h3>Daily Words</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">${stats.daily.played}</div>
                <div class="stat-label">Played</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.daily.winRate}%</div>
                <div class="stat-label">Win Rate</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.daily.currentStreak}</div>
                <div class="stat-label">Current Streak</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.daily.maxStreak}</div>
                <div class="stat-label">Max Streak</div>
              </div>
            </div>
          </div>

          <div class="stats-section">
            <h3>Practice Games</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">${stats.practice.played}</div>
                <div class="stat-label">Played</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.practice.winRate}%</div>
                <div class="stat-label">Win Rate</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.practice.averageGuesses}</div>
                <div class="stat-label">Avg Guesses</div>
              </div>
            </div>
          </div>

          <div class="stats-section">
            <h3>Guess Distribution</h3>
            <div class="distribution-chart">
              ${this.createDistributionChart(stats.guessDistribution, stats.overall.played)}
            </div>
          </div>

          <div class="stats-section">
            <h3>Recent Games</h3>
            <div class="recent-games">
              ${this.createRecentGamesList(stats.recentGames)}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" id="export-stats">Export Data</button>
          <button class="btn-secondary" id="reset-stats">Reset Stats</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners for modal
    this.addStatsModalListeners(modal);

    // Show modal with animation
    setTimeout(() => modal.classList.add('show'), 10);
  }

  // Create distribution chart HTML
  createDistributionChart(distribution, totalGames) {
    const maxCount = Math.max(...distribution);
    
    return distribution.map((count, index) => {
      const percentage = totalGames > 0 ? Math.round((count / totalGames) * 100) : 0;
      const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
      
      return `
        <div class="distribution-row">
          <span class="guess-number">${index + 1}</span>
          <div class="distribution-bar">
            <div class="bar-fill" style="width: ${barWidth}%"></div>
            <span class="bar-count">${count}</span>
          </div>
          <span class="bar-percentage">${percentage}%</span>
        </div>
      `;
    }).join('');
  }

  // Create recent games list HTML
  createRecentGamesList(recentGames) {
    if (recentGames.length === 0) {
      return '<div class="no-games">No games played yet</div>';
    }

    return recentGames.slice(0, 5).map(game => {
      const resultIcon = game.won ? '✅' : '❌';
      const guessText = game.won ? `${game.guessCount}/6` : 'X/6';
      const modeText = game.gameMode === 'daily' ? 'Daily' : 'Practice';
      const date = new Date(game.date).toLocaleDateString();
      
      return `
        <div class="recent-game">
          <span class="game-result">${resultIcon}</span>
          <span class="game-word">${game.targetWord}</span>
          <span class="game-guesses">${guessText}</span>
          <span class="game-mode">${modeText}</span>
          <span class="game-date">${date}</span>
        </div>
      `;
    }).join('');
  }

  // Add event listeners for stats modal
  addStatsModalListeners(modal) {
    const closeBtn = modal.querySelector('#stats-close');
    const exportBtn = modal.querySelector('#export-stats');
    const resetBtn = modal.querySelector('#reset-stats');

    // Close modal
    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Export statistics
    exportBtn.addEventListener('click', () => {
      this.exportStatistics();
    });

    // Reset statistics (with confirmation)
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
        document.dispatchEvent(new CustomEvent('resetStats'));
        closeModal();
        this.showMessage('Statistics have been reset', 'success');
      }
    });

    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Export statistics as downloadable file
  exportStatistics() {
    document.dispatchEvent(new CustomEvent('exportStats'));
  }

  // Get current row state
  getCurrentRow() {
    for (let row = 0; row < 6; row++) {
      const rowTiles = this.tiles[row];
      const isEmpty = rowTiles.every(tile => tile.getAttribute('data-state') === 'empty');
      const isComplete = rowTiles.every(tile => tile.getAttribute('data-state') !== 'empty' && tile.getAttribute('data-state') !== 'filled');
      
      if (!isComplete && !isEmpty) {
        return row; // Current active row
      } else if (isEmpty) {
        return row; // Next empty row
      }
    }
    return -1; // All rows used
  }

  // Get letters in current row
  getRowLetters(row) {
    if (!this.tiles || !this.tiles[row]) {
      return [];
    }
    return this.tiles[row].map(tile => tile.textContent || '');
  }

  // Clear a tile
  clearTile(row, col) {
    this.updateTile(row, col, '', 'empty');
  }

  // Update daily word information display
  updateDailyInfo(dailyStats) {
    const dailyText = document.getElementById('daily-text');
    const dailyTimer = document.getElementById('daily-timer');
    
    if (dailyText && dailyTimer) {
      dailyText.textContent = `Word #${dailyStats.dayNumber}`;
      
      const { hours, minutes } = dailyStats.timeUntilNext;
      if (hours > 0) {
        dailyTimer.textContent = `Next word in ${hours}h ${minutes}m`;
      } else {
        dailyTimer.textContent = `Next word in ${minutes}m`;
      }
    }
  }

  // Start updating the daily timer
  startDailyTimer(gameLogic) {
    // Update immediately
    const dailyStats = gameLogic.getDailyStats();
    this.updateDailyInfo(dailyStats);
    
    // Update every minute
    this.dailyTimerInterval = setInterval(() => {
      const stats = gameLogic.getDailyStats();
      this.updateDailyInfo(stats);
      
      // If we've reached the next day, we could trigger a page refresh
      // or show a message to the user about the new word
      if (stats.timeUntilNext.hours === 0 && stats.timeUntilNext.minutes === 0) {
        this.showMessage('New daily word available! Refresh to play.', 'success');
      }
    }, 60000); // Update every minute
  }

  // Stop the daily timer
  stopDailyTimer() {
    if (this.dailyTimerInterval) {
      clearInterval(this.dailyTimerInterval);
      this.dailyTimerInterval = null;
    }
  }

  // Hide statistics modal
  hideStats() {
    const modal = document.getElementById('stats-modal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.remove();
        }
      }, 300);
    }
  }
}