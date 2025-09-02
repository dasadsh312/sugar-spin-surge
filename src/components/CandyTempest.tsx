/**
 * Candy Tempest - Professional Slot Game Component
 */

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { GameEngine, GameEngineConfig } from '../engine/gameEngine';
import { GameHUD, GameStats } from '../ui/GameHUD';
import { GameState } from '../engine/stateMachine';
import { audioManager } from '../audio/audioManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Import configs
import paytableConfig from '../../config/paytable.json';
import volatilityConfig from '../../config/volatility.json';

export const CandyTempest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [stateData, setStateData] = useState<any>({
    balance: 1000,
    bet: 1,
    totalWin: 0,
    cascadeCount: 0,
    freeSpinsRemaining: 0,
    isInFreeSpins: false,
    multiplier: 1,
    lastWinAmount: 0,
    autoSpinCount: 0
  });
  const [stats, setStats] = useState<GameStats>({
    totalSpins: 0,
    totalWins: 0,
    biggestWin: 0,
    winRate: 0,
    averagePayout: 0
  });
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [gameGrid, setGameGrid] = useState<string[][]>(() => 
    Array(5).fill(null).map(() => Array(6).fill('candy_red'))
  );
  const [winningPositions, setWinningPositions] = useState<Set<string>>(new Set());

  useEffect(() => {
    initializeGame();
    generateRandomGrid();
    return () => {
      // Cleanup
      if (gameEngine) {
        // Cleanup code would go here
      }
    };
  }, []);

  const initializeGame = async () => {
    if (!canvasRef.current) return;

    // Initialize PixiJS
    const app = new PIXI.Application();
    await app.init({
      canvas: canvasRef.current,
      width: 1200,
      height: 800,
      backgroundColor: 0x1a0d2e
    });

    // Initialize audio
    await audioManager.initialize();

    // Initialize game engine
    const config: GameEngineConfig = {
      paytable: paytableConfig as any,
      volatility: volatilityConfig.presets.medium as any,
      initialBalance: 1000,
      initialBet: 1,
      seed: Date.now()
    };

    const engine = new GameEngine(config);
    
    // Set up event handlers
    engine.onStateChangeHandler((state, data) => {
      setGameState(state);
      setStateData(data);
    });

    engine.onSpinCompleteHandler((result) => {
      setLastWin(result.totalWin);
      audioManager.play(result.totalWin > 0 ? 'win_small' : 'reel_stop');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalSpins: prev.totalSpins + 1,
        totalWins: result.totalWin > 0 ? prev.totalWins + 1 : prev.totalWins,
        biggestWin: Math.max(prev.biggestWin, result.totalWin),
        winRate: (prev.totalWins + (result.totalWin > 0 ? 1 : 0)) / (prev.totalSpins + 1),
        averagePayout: (prev.averagePayout * prev.totalSpins + result.totalWin) / (prev.totalSpins + 1)
      }));

      // Generate new grid after spin
      generateRandomGrid();
      
      // Simulate win positions if there's a win
      if (result.totalWin > 0) {
        simulateWinPositions();
      }
    });

    setGameEngine(engine);
  };

  const generateRandomGrid = () => {
    const symbols = ['candy_red', 'candy_orange', 'candy_yellow', 'candy_green', 'candy_blue', 'candy_purple', 'candy_pink', 'scatter', 'multiplier'];
    const weights = [25, 25, 20, 15, 10, 3, 2, 1, 2]; // Matching rarity from config
    
    const newGrid = Array(5).fill(null).map(() => 
      Array(6).fill(null).map(() => {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < symbols.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            return symbols[i];
          }
        }
        return symbols[0];
      })
    );
    
    setGameGrid(newGrid);
  };

  const simulateWinPositions = () => {
    // Simulate some winning positions for demo
    const positions = new Set<string>();
    const numWins = Math.floor(Math.random() * 8) + 8; // 8-15 winning symbols
    
    for (let i = 0; i < numWins; i++) {
      const row = Math.floor(Math.random() * 5);
      const col = Math.floor(Math.random() * 6);
      positions.add(`${row}-${col}`);
    }
    
    setWinningPositions(positions);
    
    // Clear win positions after animation
    setTimeout(() => {
      setWinningPositions(new Set());
    }, 3000);
  };

  const handleSpin = async () => {
    if (!gameEngine || !gameEngine.canSpin()) return;
    
    audioManager.play('spin_start');
    setWinningPositions(new Set()); // Clear previous wins
    await gameEngine.spin();
  };

  const handleAutoSpin = (count: number) => {
    if (!gameEngine) return;
    
    setIsAutoSpinning(true);
    gameEngine.startAutoSpin({ count });
  };

  const handleStopAutoSpin = () => {
    if (!gameEngine) return;
    
    setIsAutoSpinning(false);
    gameEngine.stopAutoSpin();
  };

  const handleBetChange = (amount: number) => {
    if (!gameEngine) return;
    gameEngine.setBet(amount);
  };

  const getGameStateDisplay = () => {
    switch (gameState) {
      case GameState.SPINNING:
        return { text: 'Spinning...', color: 'text-gold-primary', pulse: true };
      case GameState.EVALUATING:
        return { text: 'Evaluating...', color: 'text-accent', pulse: true };
      case GameState.TUMBLING:
        return { text: 'Cascading...', color: 'text-win-medium', pulse: true };
      case GameState.SHOWING_WIN:
        return { text: 'Big Win!', color: 'text-win-big', pulse: true };
      case GameState.FREE_SPINS:
        return { text: `Free Spins (${stateData.freeSpinsRemaining})`, color: 'text-special-scatter', pulse: true };
      case GameState.FREE_SPINS_TRIGGER:
        return { text: 'Free Spins Triggered!', color: 'text-special-scatter', pulse: true };
      case GameState.GAME_OVER:
        return { text: 'Insufficient Balance', color: 'text-red-400', pulse: false };
      default:
        return { text: 'Ready to Spin', color: 'text-gold-primary', pulse: false };
    }
  };

  const stateDisplay = getGameStateDisplay();

  return (
    <div className="relative w-full h-screen bg-gradient-dark overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      {/* Professional Game Title */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
        <h1 className="game-title text-center">
          CANDY TEMPEST
        </h1>
        <div className="text-center mt-2">
          <Badge variant="secondary" className="bg-gold-primary/20 text-gold-primary border-gold-primary/30 font-semibold">
            Premium Cluster Slot
          </Badge>
        </div>
      </div>

      {/* Game State Indicator */}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
        <Badge 
          variant="secondary" 
          className={`${stateDisplay.color} bg-card/90 backdrop-blur-sm px-6 py-2 text-lg font-bold border-current/30 ${stateDisplay.pulse ? 'animate-pulse' : ''}`}
        >
          {stateDisplay.text}
        </Badge>
      </div>

      {/* Main Game Area */}
      <div className="flex items-center justify-center h-full pt-40 pb-40">
        <div className="relative">
          {/* Professional Game Board */}
          <div className="game-board p-8">
            <div className="relative">
              {/* 6x5 Professional Symbol Grid */}
              <div className="grid grid-cols-6 gap-3 p-6 bg-game-overlay/60 rounded-xl backdrop-blur-sm border border-gold-primary/20">
                {gameGrid.map((row, rowIndex) =>
                  row.map((symbolId, colIndex) => (
                    <ProfessionalSymbolSlot
                      key={`${rowIndex}-${colIndex}`}
                      symbolId={symbolId}
                      isWinning={winningPositions.has(`${rowIndex}-${colIndex}`)}
                      row={rowIndex}
                      col={colIndex}
                      isSpinning={gameState === GameState.SPINNING}
                    />
                  ))
                )}
              </div>

              {/* Win Line Overlays */}
              {winningPositions.size > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-gold-primary/10 to-transparent animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Win Amount Display */}
          {lastWin > 0 && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 pointer-events-none">
              <div className="win-display text-center">
                +${lastWin.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Control Panel */}
      <div className="absolute bottom-8 left-8 right-8 pointer-events-auto">
        <div className="control-panel">
          <div className="flex items-center justify-between">
            {/* Left: Balance & Stats */}
            <div className="flex gap-4">
              <div className="stat-card">
                <div className="text-sm text-muted-foreground mb-1">Balance</div>
                <div className="text-2xl font-bold text-gold-primary">
                  ${stateData.balance.toFixed(2)}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-sm text-muted-foreground mb-1">Bet</div>
                <div className="text-xl font-bold text-foreground">
                  ${stateData.bet.toFixed(2)}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
                <div className="text-lg font-semibold text-win-medium">
                  {(stats.winRate * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Center: Main Controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline" 
                size="lg"
                onClick={() => handleBetChange(Math.max(0.2, stateData.bet - 0.2))}
                disabled={!gameEngine?.canSpin() || stateData.bet <= 0.2}
                className="premium-button w-12 h-12 text-lg"
              >
                -
              </Button>

              <Button
                size="lg"
                onClick={handleSpin}
                disabled={!gameEngine?.canSpin() || isAutoSpinning}
                className="premium-button min-w-[140px] h-14 text-xl font-black shadow-glow hover:shadow-win"
              >
                {gameState === GameState.SPINNING ? 'SPINNING...' : 'SPIN'}
              </Button>

              <Button
                variant="outline"
                size="lg" 
                onClick={() => handleBetChange(Math.min(100, stateData.bet + 0.2))}
                disabled={!gameEngine?.canSpin() || stateData.bet >= 100}
                className="premium-button w-12 h-12 text-lg"
              >
                +
              </Button>
            </div>

            {/* Right: Auto Spin & Settings */}
            <div className="flex gap-4">
              <Button
                variant={isAutoSpinning ? "destructive" : "secondary"}
                onClick={isAutoSpinning ? handleStopAutoSpin : () => handleAutoSpin(10)}
                disabled={!gameEngine?.canSpin() && !isAutoSpinning}
                className="premium-button min-w-[120px]"
              >
                {isAutoSpinning ? `Stop (${stateData.autoSpinCount})` : 'Auto Spin'}
              </Button>
              
              <Button variant="outline" className="premium-button">
                Settings
              </Button>
            </div>
          </div>

          {/* Free Spins & Multiplier Info */}
          {(stateData.freeSpinsRemaining > 0 || stateData.multiplier > 1) && (
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gold-primary/20">
              {stateData.freeSpinsRemaining > 0 && (
                <div className="stat-card bg-special-scatter/20 border-special-scatter/40">
                  <div className="text-center text-special-scatter font-bold text-lg">
                    Free Spins: {stateData.freeSpinsRemaining}
                  </div>
                </div>
              )}
              {stateData.multiplier > 1 && (
                <div className="stat-card bg-special-multiplier/20 border-special-multiplier/40 animate-multiplier-float">
                  <div className="text-center text-special-multiplier font-bold text-lg">
                    {stateData.multiplier}x Multiplier
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden PixiJS Canvas for advanced effects */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};

// Professional Symbol Slot Component
interface ProfessionalSymbolSlotProps {
  symbolId: string;
  isWinning: boolean;
  row: number;
  col: number;
  isSpinning: boolean;
}

const ProfessionalSymbolSlot: React.FC<ProfessionalSymbolSlotProps> = ({ 
  symbolId, 
  isWinning, 
  isSpinning 
}) => {
  const getSymbolDisplay = (id: string) => {
    const symbolMap: Record<string, { 
      emoji: string; 
      gradient: string; 
      name: string; 
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
    }> = {
      candy_red: { 
        emoji: '🍎', 
        gradient: 'from-red-500 to-red-600', 
        name: 'Ruby Candy',
        rarity: 'common'
      },
      candy_orange: { 
        emoji: '🍊', 
        gradient: 'from-orange-500 to-orange-600', 
        name: 'Citrus Candy',
        rarity: 'common'
      },
      candy_yellow: { 
        emoji: '🍋', 
        gradient: 'from-yellow-400 to-yellow-500', 
        name: 'Golden Candy',
        rarity: 'rare'
      },
      candy_green: { 
        emoji: '🍏', 
        gradient: 'from-green-500 to-green-600', 
        name: 'Emerald Candy',
        rarity: 'rare'
      },
      candy_blue: { 
        emoji: '🫐', 
        gradient: 'from-blue-500 to-blue-600', 
        name: 'Sapphire Candy',
        rarity: 'epic'
      },
      candy_purple: { 
        emoji: '🍇', 
        gradient: 'from-purple-500 to-purple-600', 
        name: 'Amethyst Candy',
        rarity: 'epic'
      },
      candy_pink: { 
        emoji: '🍑', 
        gradient: 'from-pink-500 to-pink-600', 
        name: 'Diamond Candy',
        rarity: 'legendary'
      },
      scatter: { 
        emoji: '⭐', 
        gradient: 'from-gold-primary to-gold-secondary', 
        name: 'Golden Star',
        rarity: 'legendary'
      },
      multiplier: { 
        emoji: '💎', 
        gradient: 'from-special-multiplier to-purple-400', 
        name: 'Multiplier Crystal',
        rarity: 'legendary'
      }
    };
    return symbolMap[id] || symbolMap.candy_red;
  };

  const symbol = getSymbolDisplay(symbolId);
  const isSpecial = symbolId === 'scatter' || symbolId === 'multiplier';

  return (
    <div 
      className={`
        symbol-slot
        ${isWinning ? 'symbol-winning' : ''}
        ${isSpecial ? 'symbol-special' : ''}
        ${isSpinning ? 'animate-reel-spin' : ''}
        bg-gradient-to-br ${symbol.gradient}/20
        ${symbol.rarity === 'legendary' ? 'border-gold-primary/60' : 
          symbol.rarity === 'epic' ? 'border-purple-400/50' :
          symbol.rarity === 'rare' ? 'border-blue-400/50' : 'border-slate-500/50'}
      `}
      title={symbol.name}
    >
      {/* Symbol Icon */}
      <div className={`text-4xl transform transition-all duration-300 ${isSpinning ? 'blur-sm' : ''}`}>
        {symbol.emoji}
      </div>
      
      {/* Rarity Indicator */}
      <div className="absolute top-1 right-1">
        {symbol.rarity === 'legendary' && <div className="w-2 h-2 bg-gold-primary rounded-full animate-pulse" />}
        {symbol.rarity === 'epic' && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />}
        {symbol.rarity === 'rare' && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
      </div>
      
      {/* Win Particles Effect */}
      {isWinning && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gold-primary rounded-full animate-bounce"
              style={{
                left: `${20 + i * 10}%`,
                top: `${20 + (i % 2) * 20}%`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};