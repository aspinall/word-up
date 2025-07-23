import './style.css'
import { GameUI } from './ui.js'

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const gameUI = new GameUI();
  gameUI.init();

  // Demo functionality for testing the UI
  // This will be replaced with actual game logic
  let currentRow = 0;
  let currentCol = 0;
  const maxCols = 5;
  const maxRows = 6;

  // Handle key presses for demo
  document.addEventListener('keypress', (e) => {
    const { key } = e.detail;

    if (key === 'ENTER') {
      // Demo: simulate word validation
      if (currentCol === maxCols) {
        const letters = gameUI.getRowLetters(currentRow);
        const word = letters.join('');
        
        if (word.length < 5) {
          gameUI.showMessage('Not enough letters', 'error');
          gameUI.shakeRow(currentRow);
          return;
        }

        // Demo: random feedback for testing
        const states = letters.map(() => {
          const rand = Math.random();
          return rand < 0.2 ? 'correct' : rand < 0.5 ? 'present' : 'absent';
        });

        gameUI.updateRow(currentRow, letters, states, true);
        
        // Update keyboard states
        letters.forEach((letter, i) => {
          gameUI.updateKeyState(letter, states[i]);
        });

        currentRow++;
        currentCol = 0;

        // Demo: check for game end
        if (states.every(state => state === 'correct')) {
          setTimeout(() => {
            gameUI.showGameStatus(true, word.toUpperCase(), currentRow);
          }, 700);
        } else if (currentRow >= maxRows) {
          setTimeout(() => {
            gameUI.showGameStatus(false, 'DEMO');
          }, 700);
        }
      } else {
        gameUI.showMessage('Not enough letters', 'error');
        gameUI.shakeRow(currentRow);
      }
    } else if (key === 'BACKSPACE') {
      if (currentCol > 0) {
        currentCol--;
        gameUI.clearTile(currentRow, currentCol);
      }
    } else if (key.match(/^[A-Z]$/)) {
      if (currentRow < maxRows && currentCol < maxCols) {
        gameUI.updateTile(currentRow, currentCol, key, 'filled');
        currentCol++;
      }
    }
  });
});
