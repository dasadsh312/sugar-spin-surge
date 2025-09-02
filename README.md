# Candy Tempest - Premium HTML5 Slot Game

A complete, production-ready HTML5 slot game with advanced mechanics, beautiful visuals, and professional architecture.

## 🎮 Game Features

- **6×5 Grid**: Cluster-based wins with tumble/cascade mechanics
- **RTP**: 96.2% ±0.3 with configurable volatility (Low/Medium/High)
- **Free Spins**: 4+ scatters trigger 10+ free spins with multipliers up to 100x
- **Tumble Mechanics**: Winning symbols disappear, new ones drop down
- **Seeded RNG**: Reproducible random number generation for testing
- **Audio System**: Procedural sound effects with Web Audio API
- **Responsive Design**: Works on desktop and mobile (16:9 and 9:16)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Run RTP simulation
npm run rtp:sim
```

## 🏗️ Architecture

### Core Systems
- **Engine**: Game logic, RNG, state machine, evaluator
- **Graphics**: PixiJS-based rendering with procedural symbols
- **Audio**: Web Audio API with procedural sound generation
- **UI**: React-based HUD with TypeScript

### File Structure
```
src/
├── engine/          # Core game logic
│   ├── gameEngine.ts    # Main coordinator
│   ├── evaluator.ts     # Win detection & payouts
│   └── stateMachine.ts  # Game state management
├── graphics/        # PixiJS rendering
├── audio/          # Sound system
├── ui/             # React UI components
└── utils/          # Utilities (RNG, formatting, easing)

config/
├── paytable.json   # Symbol payouts & game rules
└── volatility.json # Volatility presets
```

## 🎯 Game Rules

### Cluster Pays
- Wins require 8+ connected symbols (4-directional)
- Higher symbol counts = exponentially higher payouts
- Premium symbols require fewer symbols for wins

### Free Spins
- 4+ scatter symbols trigger free spins
- Additional scatters during free spins add +5 spins
- Multiplier crystals appear only during free spins
- Multipliers stack multiplicatively up to 1000x

### Volatility Settings
- **Low**: More frequent small wins, limited multipliers
- **Medium**: Balanced gameplay (default)
- **High**: Bigger wins, less frequent, higher multipliers

## 🔧 Configuration

### RTP Adjustment
Edit `config/paytable.json` to modify:
- Symbol rarities and payouts
- Scatter frequency
- Multiplier ranges
- Free spin triggers

### Volatility Tuning
Edit `config/volatility.json` to adjust:
- Symbol drop rates
- Multiplier value distributions
- Scatter frequency modifiers

## 🧪 Testing & Simulation

### RTP Simulation
```bash
npm run rtp:sim
```
Runs 100k spins simulation to verify RTP accuracy.

### Unit Tests
```bash
npm run test
```
Tests core game mechanics, evaluator logic, and RNG.

## 🎨 Graphics & Animations

- **Procedural Symbols**: Generated candy shapes with gradients
- **Particle Effects**: Win celebrations, multiplier trails
- **Smooth Animations**: Tumbles, spins, cascades with easing
- **Responsive**: Scales for all screen sizes

## 🔊 Audio System

- **Procedural SFX**: Generated with Web Audio API
- **Dynamic Music**: Adaptive background audio
- **Spatial Audio**: 3D positioned sound effects
- **Volume Control**: Master, SFX, and music levels

## 📱 Mobile Support

- Touch-optimized controls
- Portrait and landscape modes
- Retina display support
- 60fps performance on mobile devices

## 🔒 Security & Fair Play

- **Seeded RNG**: Cryptographically secure random generation
- **Reproducible**: Same seed produces identical results
- **Audit Trail**: All spins logged with checksums
- **No Client Manipulation**: Server-authoritative design ready

## 📊 Analytics & Debugging

### Dev Console Commands
```javascript
// Force scatter appearance
window.__slot.debug.forceScatter(4);

// Set specific multiplier
window.__slot.debug.forceMultiplier(25);

// Change volatility
window.__slot.debug.setVolatility('high');

// Set RNG seed
window.__slot.debug.setSeed(12345);
```

### Performance Monitoring
- Real-time FPS display
- Memory usage tracking
- Win rate analytics
- Average payout calculations

## 🌟 Premium Features

- **Big Win Celebrations**: Screen shake, particle explosions
- **Progressive Audio**: Sounds intensify with win size
- **Smart Auto-spin**: Stop conditions (win/loss limits)
- **Accessibility**: Screen reader support, keyboard navigation
- **Responsible Gaming**: Play time limits, reality checks

## 📋 License & Compliance

- **18+ Only**: Age verification required
- **Responsible Gaming**: Built-in tools and warnings
- **Jurisdiction Ready**: Configurable for different regions
- **Audit Friendly**: Complete transaction logging

Built with modern web technologies for the best possible gaming experience! 🎰✨