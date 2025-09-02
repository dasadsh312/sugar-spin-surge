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
      {/* PixiJS Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
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

      {/* Game Title */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <h1 className="text-6xl font-bold text-transparent bg-gradient-candy bg-clip-text text-center animate-win-pulse">
          Candy Tempest
        </h1>
        <p className="text-center text-muted-foreground mt-2">Premium Cluster Slot Experience</p>
      </div>
    </div>
  );
};