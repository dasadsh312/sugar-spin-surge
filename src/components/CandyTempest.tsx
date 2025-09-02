/**
 * Candy Tempest - Main Game Component
 */

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { GameEngine, GameEngineConfig } from '../engine/gameEngine';
import { GameHUD, GameStats } from '../ui/GameHUD';
import { GameState } from '../engine/stateMachine';
import { audioManager } from '../audio/audioManager';
import { SymbolRenderer } from '../graphics/symbolRenderer';

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

  useEffect(() => {
    initializeGame();
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
    });

    setGameEngine(engine);

    // Create game graphics
    const symbolRenderer = new SymbolRenderer(app);
    
    // Create 6x5 grid of symbol sprites
    const gridContainer = new PIXI.Container();
    gridContainer.x = app.screen.width / 2 - 192;
    gridContainer.y = app.screen.height / 2 - 160;
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        const symbolSprite = symbolRenderer.createSymbolSprite('candy_red');
        if (symbolSprite) {
          symbolSprite.x = col * 64;
          symbolSprite.y = row * 64;
          gridContainer.addChild(symbolSprite);
        }
      }
    }
    
    app.stage.addChild(gridContainer);
  };

  const handleSpin = async () => {
    if (!gameEngine || !gameEngine.canSpin()) return;
    
    audioManager.play('spin_start');
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

  return (
    <div className="relative w-full h-screen bg-gradient-game overflow-hidden">
      {/* Game Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
        <h1 className="text-4xl font-bold text-transparent bg-gradient-candy bg-clip-text text-center animate-win-pulse">
          Candy Tempest
        </h1>
        <p className="text-center text-muted-foreground mt-1">Premium Cluster Slot</p>
      </div>

      {/* Main Game Area */}
      <div className="flex items-center justify-center h-full pt-20 pb-32">
        <div className="relative">
          {/* Game Board Background */}
          <div className="bg-card/20 backdrop-blur-sm border-2 border-primary/30 rounded-xl p-4 shadow-2xl">
            {/* 6x5 Symbol Grid */}
            <div className="grid grid-cols-6 gap-2 p-4 bg-game-overlay/50 rounded-lg">
              {Array.from({ length: 30 }, (_, index) => {
                const row = Math.floor(index / 6);
                const col = index % 6;
                return (
                  <SymbolSlot
                    key={`${row}-${col}`}
                    symbolId={getSymbolForPosition(row, col)}
                    isWinning={false}
                    row={row}
                    col={col}
                  />
                );
              })}
            </div>
          </div>

          {/* Cascade/Win Effects Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* This is where win animations and effects would appear */}
          </div>
        </div>
      </div>

      {/* PixiJS Canvas (Hidden for now, will be used for advanced effects) */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        style={{ imageRendering: 'crisp-edges' }}
      />
      
      {/* Game HUD Overlay */}
      <GameHUD
        gameState={gameState}
        stateData={stateData}
        stats={stats}
        onSpin={handleSpin}
        onAutoSpin={handleAutoSpin}
        onStopAutoSpin={handleStopAutoSpin}
        onBetChange={handleBetChange}
        onSettingsOpen={() => console.log('Settings')}
        onPaytableOpen={() => console.log('Paytable')}
        canSpin={gameEngine?.canSpin() || false}
        isAutoSpinning={isAutoSpinning}
        lastWin={lastWin}
        freeSpinsRemaining={stateData.freeSpinsRemaining}
        multiplier={stateData.multiplier}
      />
    </div>
  );
};

// Helper function to get symbol for each position (for demo)
const getSymbolForPosition = (row: number, col: number): string => {
  const symbols = ['candy_red', 'candy_orange', 'candy_yellow', 'candy_green', 'candy_blue', 'candy_purple', 'candy_pink', 'scatter', 'multiplier'];
  return symbols[(row * 6 + col) % symbols.length];
};

// Individual Symbol Slot Component
interface SymbolSlotProps {
  symbolId: string;
  isWinning: boolean;
  row: number;
  col: number;
}

const SymbolSlot: React.FC<SymbolSlotProps> = ({ symbolId, isWinning }) => {
  const getSymbolDisplay = (id: string) => {
    const symbolMap: Record<string, { emoji: string; color: string; name: string }> = {
      candy_red: { emoji: '🍎', color: 'bg-candy-red', name: 'Red Candy' },
      candy_orange: { emoji: '🍊', color: 'bg-candy-orange', name: 'Orange Candy' },
      candy_yellow: { emoji: '🍋', color: 'bg-candy-yellow', name: 'Yellow Candy' },
      candy_green: { emoji: '🍏', color: 'bg-candy-green', name: 'Green Candy' },
      candy_blue: { emoji: '🫐', color: 'bg-candy-blue', name: 'Blue Candy' },
      candy_purple: { emoji: '🍇', color: 'bg-candy-purple', name: 'Purple Candy' },
      candy_pink: { emoji: '🍑', color: 'bg-candy-pink', name: 'Pink Candy' },
      scatter: { emoji: '⭐', color: 'bg-special-scatter', name: 'Golden Star' },
      multiplier: { emoji: '💎', color: 'bg-special-multiplier', name: 'Multiplier Crystal' }
    };
    return symbolMap[id] || symbolMap.candy_red;
  };

  const symbol = getSymbolDisplay(symbolId);

  return (
    <div 
      className={`
        relative w-16 h-16 rounded-xl flex items-center justify-center
        ${symbol.color}/20 border-2 border-current/30
        ${isWinning ? 'animate-win-pulse shadow-win' : 'shadow-candy'}
        hover:scale-105 transition-all duration-300 cursor-pointer
        backdrop-blur-sm
      `}
      title={symbol.name}
    >
      {/* Symbol Icon */}
      <div className="text-3xl transform hover:scale-110 transition-transform">
        {symbol.emoji}
      </div>
      
      {/* Win Glow Effect */}
      {isWinning && (
        <div className="absolute inset-0 rounded-xl bg-win-glow/30 animate-pulse"></div>
      )}
      
      {/* Special Symbol Border */}
      {(symbolId === 'scatter' || symbolId === 'multiplier') && (
        <div className="absolute inset-0 rounded-xl border-2 border-win-glow/50 animate-scatter-glow"></div>
      )}
    </div>
  );
};