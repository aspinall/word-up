import './style.css'
import { GameUI } from './ui.js'
import { GameLogic } from './game.js'

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const gameUI = new GameUI();
  const gameLogic = new GameLogic();
  
  gameUI.init();
  
  // Start a new game
  const targetWord = gameLogic.startNewGame();
  console.log('Target word:', targetWord); // For development - remove in production

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
