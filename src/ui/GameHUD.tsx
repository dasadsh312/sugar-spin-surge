/**
 * Game HUD - Main UI overlay for the slot game
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatBalance, formatBet, formatWin, formatMultiplier } from '../utils/formatCurrency';
import { GameState, GameStateData } from '../engine/stateMachine';

export interface GameStats {
  totalSpins: number;
  totalWins: number;
  biggestWin: number;
  winRate: number;
  averagePayout: number;
}

export interface GameHUDProps {
  gameState: GameState;
  stateData: GameStateData;
  stats: GameStats;
  onSpin: () => void;
  onAutoSpin: (count: number) => void;
  onStopAutoSpin: () => void;
  onBetChange: (amount: number) => void;
  onSettingsOpen: () => void;
  onPaytableOpen: () => void;
  canSpin: boolean;
  isAutoSpinning: boolean;
  lastWin?: number;
  freeSpinsRemaining?: number;
  multiplier?: number;
}

const BET_LEVELS = [0.20, 0.40, 0.60, 0.80, 1.00, 1.50, 2.00, 3.00, 4.00, 5.00, 7.50, 10.00, 15.00, 20.00, 30.00, 40.00, 50.00, 75.00, 100.00];

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  stateData,
  stats,
  onSpin,
  onAutoSpin,
  onStopAutoSpin,
  onBetChange,
  onSettingsOpen,
  onPaytableOpen,
  canSpin,
  isAutoSpinning,
  lastWin = 0,
  freeSpinsRemaining = 0,
  multiplier = 1
}) => {
  const [selectedBetIndex, setSelectedBetIndex] = useState(
    BET_LEVELS.findIndex(bet => bet === stateData.bet) || 4
  );
  const [showAutoSpinOptions, setShowAutoSpinOptions] = useState(false);

  // Update bet when selection changes
  useEffect(() => {
    const newBet = BET_LEVELS[selectedBetIndex];
    if (newBet !== stateData.bet) {
      onBetChange(newBet);
    }
  }, [selectedBetIndex, stateData.bet, onBetChange]);

  const handleBetDecrease = () => {
    if (selectedBetIndex > 0) {
      setSelectedBetIndex(selectedBetIndex - 1);
    }
  };

  const handleBetIncrease = () => {
    if (selectedBetIndex < BET_LEVELS.length - 1) {
      setSelectedBetIndex(selectedBetIndex + 1);
    }
  };

  const handleAutoSpinSelect = (count: number) => {
    setShowAutoSpinOptions(false);
    onAutoSpin(count);
  };

  const getGameStateDisplay = () => {
    switch (gameState) {
      case GameState.SPINNING:
        return { text: 'Spinning...', color: 'text-primary' };
      case GameState.EVALUATING:
        return { text: 'Evaluating...', color: 'text-accent' };
      case GameState.TUMBLING:
        return { text: 'Cascading...', color: 'text-win-glow' };
      case GameState.SHOWING_WIN:
        return { text: 'Big Win!', color: 'text-win-big' };
      case GameState.FREE_SPINS:
        return { text: `Free Spins (${freeSpinsRemaining})`, color: 'text-special-scatter' };
      case GameState.FREE_SPINS_TRIGGER:
        return { text: 'Free Spins Triggered!', color: 'text-special-scatter' };
      case GameState.GAME_OVER:
        return { text: 'Game Over', color: 'text-destructive' };
      default:
        return { text: 'Ready to Spin', color: 'text-foreground' };
    }
  };

  const stateDisplay = getGameStateDisplay();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Bar */}
      <div className="flex justify-between items-start p-4 pointer-events-auto">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onPaytableOpen}
            className="bg-card/80 backdrop-blur-sm"
          >
            Paytable
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onSettingsOpen}
            className="bg-card/80 backdrop-blur-sm"
          >
            Settings
          </Button>
        </div>

        {/* Balance Display */}
        <Card className="px-4 py-2 bg-card/90 backdrop-blur-sm border-primary/20">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className="text-xl font-bold text-primary">
              {formatBalance(stateData.balance)}
            </div>
          </div>
        </Card>
      </div>

      {/* Game State Indicator */}
      <div className="flex justify-center mt-4 pointer-events-auto">
        <Badge 
          variant="secondary" 
          className={`${stateDisplay.color} bg-card/90 backdrop-blur-sm px-4 py-2 text-base font-semibold animate-pulse`}
        >
          {stateDisplay.text}
        </Badge>
      </div>

      {/* Free Spins & Multiplier Display */}
      {(freeSpinsRemaining > 0 || multiplier > 1) && (
        <div className="flex justify-center gap-4 mt-4 pointer-events-auto">
          {freeSpinsRemaining > 0 && (
            <Card className="px-3 py-1 bg-special-scatter/20 border-special-scatter/40 backdrop-blur-sm">
              <div className="text-center text-special-scatter font-bold">
                Free Spins: {freeSpinsRemaining}
              </div>
            </Card>
          )}
          {multiplier > 1 && (
            <Card className="px-3 py-1 bg-special-multiplier/20 border-special-multiplier/40 backdrop-blur-sm animate-multiplier-float">
              <div className="text-center text-special-multiplier font-bold">
                {formatMultiplier(multiplier)}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Last Win Display */}
      {lastWin > 0 && (
        <div className="flex justify-center mt-4 pointer-events-auto">
          <Card className="px-6 py-3 bg-win-glow/20 border-win-glow/40 backdrop-blur-sm animate-win-pulse">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Last Win</div>
              <div className="text-2xl font-bold text-win-glow">
                {formatWin(lastWin)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
        <Card className="bg-card/95 backdrop-blur-sm border-primary/20 p-4">
          <div className="flex items-center justify-between">
            {/* Bet Controls */}
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">Bet</div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBetDecrease}
                disabled={selectedBetIndex === 0 || !canSpin}
                className="w-8 h-8 p-0"
              >
                -
              </Button>
              <div className="min-w-[80px] text-center font-bold text-primary">
                {formatBet(BET_LEVELS[selectedBetIndex])}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBetIncrease}
                disabled={selectedBetIndex === BET_LEVELS.length - 1 || !canSpin}
                className="w-8 h-8 p-0"
              >
                +
              </Button>
            </div>

            {/* Spin Controls */}
            <div className="flex items-center gap-3">
              {/* Auto Spin */}
              <div className="relative">
                <Button
                  variant={isAutoSpinning ? "destructive" : "secondary"}
                  onClick={isAutoSpinning ? onStopAutoSpin : () => setShowAutoSpinOptions(!showAutoSpinOptions)}
                  disabled={!canSpin && !isAutoSpinning}
                  className="min-w-[100px] shadow-button"
                >
                  {isAutoSpinning ? `Stop (${stateData.autoSpinCount})` : 'Auto Spin'}
                </Button>

                {/* Auto Spin Options */}
                {showAutoSpinOptions && (
                  <Card className="absolute bottom-full mb-2 left-0 p-2 bg-card/95 backdrop-blur-sm border-primary/20 min-w-[200px]">
                    <div className="text-sm font-semibold mb-2">Auto Spin Count</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[10, 25, 50, 100, 250, 500].map(count => (
                        <Button
                          key={count}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAutoSpinSelect(count)}
                          className="text-xs"
                        >
                          {count}
                        </Button>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Main Spin Button */}
              <Button
                variant="default"
                size="lg"
                onClick={onSpin}
                disabled={!canSpin || isAutoSpinning}
                className="min-w-[120px] h-12 text-lg font-bold bg-gradient-button shadow-button hover:shadow-win transform transition-all duration-200 hover:scale-105"
              >
                {gameState === GameState.SPINNING ? 'Spinning...' : 'SPIN'}
              </Button>
            </div>

            {/* Stats Display */}
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Win Rate</div>
              <div className="font-semibold text-primary">
                {(stats.winRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Spins: {stats.totalSpins}
              </div>
            </div>
          </div>

          {/* Auto Spin Progress */}
          {isAutoSpinning && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Auto Spin Progress</span>
                <span>{stateData.maxAutoSpins - stateData.autoSpinCount}/{stateData.maxAutoSpins}</span>
              </div>
              <Progress 
                value={((stateData.maxAutoSpins - stateData.autoSpinCount) / stateData.maxAutoSpins) * 100}
                className="h-2"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};