import './style.css'
import { GameUI } from './ui.js'
import { GameLogic } from './game.js'
import { PWAManager } from './pwa-manager.js'
import { errorHandler } from './error-handler.js'

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check system health before initialization
  const systemHealth = errorHandler.checkSystemHealth();
  
  // Initialize game components with error handling
  const gameUI = errorHandler.safeSync(() => new GameUI(), null, { operation: 'GameUI initialization' });
  const gameLogic = errorHandler.safeSync(() => new GameLogic(), null, { operation: 'GameLogic initialization' });
  const pwaManager = errorHandler.safeSync(() => new PWAManager(), null, { operation: 'PWAManager initialization' });

  // Check if critical components failed to initialize
  if (!gameUI || !gameLogic) {
    errorHandler.showUserError({
      title: 'Game Initialization Failed',
      message: 'Unable to start the game. Please refresh the page.',
      action: 'If the problem persists, try clearing your browser cache.'
    });
    return;
  }
  
  gameUI.init();
  
  // Start today's daily game
  gameLogic.startDailyGame();
  
  // Start the daily timer
  gameUI.startDailyTimer(gameLogic);

  // Override stats button click to pass gameLogic
  const statsBtn = errorHandler.safeDom.querySelector('#stats-btn');
  if (statsBtn) {
    errorHandler.safeDom.addEventListener(statsBtn, 'click', () => {
      errorHandler.safeSync(() => {
        gameUI.showStats(gameLogic);
      }, null, { operation: 'showStats' });
    });
  }

  // Add statistics event listeners
  document.addEventListener('exportStats', () => {
    errorHandler.safeSync(() => {
      const statsData = gameLogic.exportStatistics();
      if (!statsData) {
        throw new Error('No statistics data available for export');
      }
      
      const dataStr = JSON.stringify(statsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `word-up-statistics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      gameUI.showMessage('Statistics exported successfully!', 'success');
    }, null, { operation: 'exportStats' });
  });

  document.addEventListener('resetStats', () => {
    gameLogic.resetStatistics();
  });

  // Handle key presses with actual game logic
  document.addEventListener('keypress', (e) => {
    errorHandler.safeSync(() => {
      const { key } = e.detail;

      // Override getCurrentGuess method to get letters from UI
      gameLogic.getCurrentGuess = () => {
        const letters = gameUI.getRowLetters(gameLogic.currentRow);
        if (!letters || !Array.isArray(letters)) {
          throw new Error('Unable to get current guess from UI');
        }
        return letters.join('').toUpperCase();
      };

      // Process the key press through game logic
      const result = gameLogic.processKeyPress(key);
      if (!result) {
        throw new Error('Game logic returned invalid result');
      }

      if (!result.success) {
        // Handle errors
        if (result.reason === 'Not enough letters' || result.reason === 'Not in word list') {
          gameUI.showMessage(result.reason, 'error');
          if (result.action === 'shake_row') {
            gameUI.shakeRow(result.row);
          }
        }
        return;
      }

      // Handle successful actions
      switch (result.action) {
        case 'add_letter':
          gameUI.updateTile(result.row, result.col, result.letter, 'filled');
          break;

        case 'delete_letter':
          gameUI.clearTile(result.row, result.col);
          break;

        case 'continue_game':
          // Update the completed row with results
          gameUI.updateRow(result.row, result.letters, result.states, true);
          
          // Update keyboard states
          result.letters.forEach((letter, i) => {
            gameUI.updateKeyState(letter, result.states[i]);
          });
          break;

        case 'win_game':
          // Update the winning row
          gameUI.updateRow(result.row, result.letters, result.states, true);
          
          // Update keyboard states
          result.letters.forEach((letter, i) => {
            gameUI.updateKeyState(letter, result.states[i]);
          });
          
          // Show win message after animation
          setTimeout(() => {
            gameUI.showGameStatus(true, gameLogic.targetWord, result.guessCount);
          }, 700);
          break;

        case 'lose_game':
          // Update the final row
          gameUI.updateRow(result.row, result.letters, result.states, true);
          
          // Update keyboard states
          result.letters.forEach((letter, i) => {
            gameUI.updateKeyState(letter, result.states[i]);
          });
          
          // Show lose message after animation
          setTimeout(() => {
            gameUI.showGameStatus(false, result.targetWord);
          }, 700);
          break;
      }
    }, null, { operation: 'keypress', key: e.detail?.key });
  });

});
