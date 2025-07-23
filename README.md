# Word Up 🎮

A British English Wordle-style word game with daily challenges and Progressive Web App (PWA) capabilities.

[![Tests](https://img.shields.io/badge/tests-153%20passing-brightgreen)]()
[![PWA](https://img.shields.io/badge/PWA-enabled-blue)]()
[![British English](https://img.shields.io/badge/dictionary-British%20English-red)]()

## 🎯 Features

- **Daily Word Challenges** - New puzzle every day at midnight
- **British English Dictionary** - Authentic UK spelling and vocabulary
- **Progressive Web App** - Install and play offline
- **Mobile Optimized** - Perfect for iPhone and Android devices
- **Statistics Tracking** - Track your wins, streaks, and performance
- **Practice Mode** - Play unlimited random words
- **Responsive Design** - Works on all screen sizes

## 🚀 Quick Start

### Play Online
Visit the live game at: [Your deployment URL here]

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/aspinall/word-up.git
cd word-up
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
Navigate to `http://localhost:5173`

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI dashboard
npm run test:coverage # Run tests with coverage report
```

### Project Structure

```
src/
├── dictionaries/
│   ├── answers.js           # Target words for daily puzzles (379 words)
│   └── valid-guesses.js     # Additional valid guesses
├── css/
│   ├── variables.css        # CSS custom properties
│   ├── layout.css          # Responsive layout system
│   ├── components.css      # UI component styles
│   ├── animations.css      # Game animations
│   └── reset.css           # CSS reset and normalization
├── test/                   # Test files (153 tests)
├── daily-word.js           # Daily word generation system
├── game.js                 # Core game logic
├── ui.js                   # UI management and DOM manipulation
├── statistics.js           # Statistics tracking and storage
├── pwa-manager.js          # PWA installation and offline management
├── main.js                 # Application entry point
└── style.css              # Main stylesheet
```

## 🎮 How to Play

1. **Guess the 5-letter word** in 6 tries or fewer
2. **Color feedback** after each guess:
   - 🟩 **Green** = Correct letter in correct position
   - 🟨 **Yellow** = Correct letter in wrong position
   - ⬜ **Grey** = Letter not in the word
3. **New daily word** available at midnight
4. **Practice mode** available anytime with random words

## 🏗️ Technical Details

### Core Technologies
- **Vanilla JavaScript** - No framework dependencies
- **Vite** - Modern build tool and dev server
- **Vitest** - Fast unit testing framework
- **PWA** - Service worker and manifest for offline play

### Key Features
- **Seeded Random Generation** - Consistent daily words globally
- **Local Storage** - Statistics and progress persistence
- **Service Worker** - Offline functionality and caching
- **Responsive Design** - Mobile-first approach
- **Error Handling** - Comprehensive error management

### Browser Support
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with PWA support

## 📊 Testing

The project includes comprehensive tests covering:
- ✅ Core game logic and word validation
- ✅ Daily word generation and consistency
- ✅ Statistics tracking and persistence
- ✅ PWA functionality and offline capabilities
- ✅ UI interactions and error handling

Run tests with: `npm test`

## 🚀 Deployment

### GitHub Pages
```bash
npm run build
# Deploy dist/ folder to GitHub Pages
```

### Netlify/Vercel
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Self-hosted
```bash
npm run build
# Serve dist/ folder with any web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 Development Notes

### Daily Word System
- **Epoch**: January 1, 2024
- **Algorithm**: Linear Congruential Generator with salt
- **Consistency**: Same word globally regardless of timezone
- **Security**: Salt prevents easy prediction of future words

### Dictionary Structure
- **Answers**: 379 carefully curated British English words for daily puzzles
- **Valid Guesses**: Additional words accepted as valid guesses
- **British Spelling**: Includes colour, honour, centre, etc.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Wordle by Josh Wardle
- British English word list curated for UK players
- Built with modern web standards and PWA best practices

---

**Word Up** - Bringing British English word puzzles to the web! 🇬🇧