import './style.css'
import { GameUI } from './ui.js'
import { GameLogic } from './game.js'

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const gameUI = new GameUI();
  const gameLogic = new GameLogic();
  
  gameUI.init();
  
  // Start today's daily game
  const targetWord = gameLogic.startDailyGame();
  const dailyInfo = gameLogic.getTodaysWordInfo();
  
  console.log('Daily word info:', dailyInfo); // For development - remove in production
  console.log('Target word:', targetWord); // For development - remove in production
  
  // Start the daily timer
  gameUI.startDailyTimer(gameLogic);

  // Override stats button click to pass gameLogic
  document.getElementById('stats-btn').addEventListener('click', () => {
    gameUI.showStats(gameLogic);
  });

  // Add statistics event listeners
  document.addEventListener('exportStats', () => {
    const statsData = gameLogic.exportStatistics();
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
  });

  document.addEventListener('resetStats', () => {
    gameLogic.resetStatistics();
  });

  // Handle key presses with actual game logic
  document.addEventListener('keypress', (e) => {
    const { key } = e.detail;

    // Override getCurrentGuess method to get letters from UI
    gameLogic.getCurrentGuess = () => {
      const letters = gameUI.getRowLetters(gameLogic.currentRow);
      return letters.join('').toUpperCase();
    };

    // Process the key press through game logic
    const result = gameLogic.processKeyPress(key);

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
  });

  // Add restart functionality (development helper)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
      // Allow normal page refresh
      return;
    }
    
    // Restart game with 'R' key when game is over
    if (e.key.toLowerCase() === 'r' && gameLogic.gameState !== 'playing') {
      e.preventDefault();
      location.reload();
    }
  });
});
