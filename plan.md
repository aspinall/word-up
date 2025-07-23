# Word Up Implementation Plan

## Tech Stack (Mobile-First Web App)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Build**: Vite for fast development and optimized production builds
- **Storage**: LocalStorage for game state and statistics
- **Deployment**: Static hosting (Netlify/Vercel/GitHub Pages)
- **PWA**: Service Worker for offline capability and app-like experience

## Phase 1: Core Game Mechanics (Weeks 1-2)

### 1.1 Project Setup
- Initialize Vite project with PWA plugin
- Set up mobile-first responsive CSS architecture
- Configure build pipeline for production optimization

### 1.2 Game Board & UI
- Create 6x5 letter grid with touch-friendly sizing
- Implement virtual keyboard for mobile devices
- Add color-coded feedback system (green/yellow/gray)
- Design clean, distraction-free interface

### 1.3 Core Game Logic
- Word validation system with British English dictionary
- Six-attempt guessing mechanism
- Real-time letter feedback and board updates
- Win/lose game states with completion messaging

### 1.4 Daily Word System
- Seed-based daily word generation (consistent across sessions)
- Prevent multiple attempts on same daily puzzle
- Local timezone handling for midnight resets

### 1.5 British English Dictionary
- **Answer Pool**: ~2,500 common British English words (excluding very esoteric terms)
- **Valid Guesses**: Complete British English 5-letter word list (~12,000+ words)
- Prioritise everyday vocabulary for answers while allowing all valid British spellings for guesses
- British spelling preferences (COLOUR not COLOR, CENTRE not CENTER)

## Phase 2: Statistics & Polish (Weeks 3-4)

### 2.1 Performance Tracking
- Success rate calculation and storage
- Average guesses per win tracking
- Current and longest winning streak counters
- Historical performance data visualization

### 2.2 Mobile Optimization
- Progressive Web App configuration
- Offline gameplay capability
- Touch gesture improvements
- Responsive design testing across devices

### 2.3 User Experience Enhancements
- Loading states and smooth animations
- Help/rules overlay for new users
- Error handling with gentle messaging
- Keyboard accessibility support

## Key Mobile Considerations
- **Touch-First Design**: Large tap targets (44px minimum)
- **Viewport Optimization**: Proper viewport meta tags
- **Performance**: Lightweight bundle, fast load times
- **PWA Features**: Add to homescreen, offline capability
- **Responsive Grid**: Scales appropriately on all screen sizes
- **Virtual Keyboard**: Custom on-screen keyboard for consistent UX

## Dictionary Strategy
- **Answer Pool**: 2,500 carefully curated common British English words
- **Valid Guesses**: All British English 5-letter words (comprehensive dictionary)
- **Curation**: Answers exclude highly technical, archaic, or very obscure terms
- **Source**: British English dictionary with proper spellings (REALISE, COLOUR, METRE)

## File Structure
```
word-up/
├── index.html
├── src/
│   ├── js/
│   │   ├── game.js (core game logic)
│   │   ├── ui.js (DOM manipulation)
│   │   ├── storage.js (localStorage handling)
│   │   ├── words-answers.js (2,500 answer words)
│   │   └── words-valid.js (all valid British English words)
│   ├── css/
│   │   ├── main.css (core styles)
│   │   └── mobile.css (responsive styles)
│   └── assets/
├── manifest.json (PWA config)
├── sw.js (service worker)
└── package.json
```

## Implementation Sequence

### Phase 1 Tasks
1. **Project Setup** - Initialize Vite with PWA plugin
2. **Basic UI** - Create responsive game grid and virtual keyboard
3. **Core Logic** - Implement guessing mechanism and feedback
4. **Word System** - Set up daily word generation and validation
5. **Dictionary** - Create British English word lists

### Phase 2 Tasks
6. **Statistics** - Add performance tracking and data visualization
7. **PWA Features** - Implement offline capability and app-like experience
8. **Polish** - Add animations, help system, and error handling
9. **Testing** - Cross-device testing and optimization
10. **Deployment** - Production build and hosting setup

## Success Criteria
- Load time < 2 seconds
- Works offline after first visit
- Responsive on all mobile devices
- Clean, ad-free interface
- Daily puzzle availability at midnight
- Comprehensive statistics tracking