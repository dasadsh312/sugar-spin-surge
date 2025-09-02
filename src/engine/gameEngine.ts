/**
 * Main Game Engine - Coordinates all game systems
 */

import { GameEvaluator, WinResult, GameConfig } from './evaluator';
import { GameStateMachine, GameState, GameEvent, GameStateData } from './stateMachine';
import { rng } from '../utils/rng';

export interface GameEngineConfig {
  paytable: GameConfig;
  volatility: {
    symbolRarityMultiplier: Record<string, number>;
    multiplierValueWeights: Record<string, number>;
    maxMultiplierPerSpin: number;
    scatterFrequencyBoost: number;
  };
  initialBalance: number;
  initialBet: number;
  seed?: string | number;
}

export interface SpinResult {
  grid: any[][];
  winResult: WinResult;
  cascades: WinResult[];
  totalWin: number;
  newBalance: number;
  freeSpinsAwarded: number;
  isFreeSpin: boolean;
  gameState: GameState;
}

export interface AutoSpinSettings {
  count: number;
  stopOnWin?: boolean;
  stopOnLoss?: boolean;
  winThreshold?: number;
  lossThreshold?: number;
}

export class GameEngine {
  private evaluator: GameEvaluator;
  private stateMachine: GameStateMachine;
  private config: GameEngineConfig;
  private spinHistory: SpinResult[] = [];
  private currentSpinId: number = 0;

  // Event callbacks
  private onStateChange?: (state: GameState, data: GameStateData) => void;
  private onSpinStart?: (bet: number, balance: number) => void;
  private onSpinComplete?: (result: SpinResult) => void;
  private onWinDetected?: (winResult: WinResult, cascadeNumber: number) => void;
  private onFreeSpinsTriggered?: (spinsAwarded: number) => void;
  private onBalanceUpdate?: (newBalance: number, change: number) => void;

  constructor(config: GameEngineConfig) {
    this.config = config;
    
    // Initialize RNG with seed if provided
    if (config.seed !== undefined) {
      rng.setSeed(config.seed);
    }

    // Initialize evaluator
    this.evaluator = new GameEvaluator(config.paytable);
    this.evaluator.initializeGrid();

    // Initialize state machine
    this.stateMachine = new GameStateMachine({
      balance: config.initialBalance,
      bet: config.initialBet
    });

    // Listen to state changes
    this.stateMachine.addStateListener(this.handleStateChange.bind(this));

    console.log('Game Engine initialized', {
      balance: config.initialBalance,
      bet: config.initialBet,
      seed: config.seed
    });
  }

  /**
   * Start a new spin
   */
  async spin(): Promise<SpinResult | null> {
    if (!this.stateMachine.canSpin()) {
      console.warn('Cannot spin in current state:', this.stateMachine.getCurrentState());
      return null;
    }

    const stateData = this.stateMachine.getStateData();
    this.onSpinStart?.(stateData.bet, stateData.balance);

    // Process spin event
    if (!this.stateMachine.processEvent(GameEvent.SPIN)) {
      return null;
    }

    // Generate initial grid
    await this.generateNewGrid();

    // Complete spin
    this.stateMachine.processEvent(GameEvent.SPIN_COMPLETE);

    // Start evaluation and cascade loop
    return await this.evaluateAndCascade();
  }

  /**
   * Set auto-spin settings and start auto-spin
   */
  startAutoSpin(settings: AutoSpinSettings): void {
    this.stateMachine.updateStateData({
      autoSpinCount: settings.count,
      maxAutoSpins: settings.count,
      stopOnWin: settings.stopOnWin || false,
      stopOnLoss: settings.stopOnLoss || false,
      winThreshold: settings.winThreshold || 0,
      lossThreshold: settings.lossThreshold || 0
    });

    this.processAutoSpin();
  }

  /**
   * Stop auto-spin
   */
  stopAutoSpin(): void {
    this.stateMachine.updateStateData({ autoSpinCount: 0 });
  }

  /**
   * Process auto-spin loop
   */
  private async processAutoSpin(): Promise<void> {
    while (this.stateMachine.shouldContinueAutoSpin()) {
      const result = await this.spin();
      if (!result) break;

      // Decrement auto-spin count
      const stateData = this.stateMachine.getStateData();
      this.stateMachine.updateStateData({ 
        autoSpinCount: stateData.autoSpinCount - 1 
      });

      // Add delay between spins
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Generate new grid with symbols
   */
  private async generateNewGrid(): Promise<void> {
    const symbolPool = this.evaluator.generateSymbolPool(
      this.config.volatility.symbolRarityMultiplier
    );

    this.evaluator.initializeGrid();
    this.evaluator.fillEmptyPositions(symbolPool);
  }

  /**
   * Evaluate grid and handle cascades
   */
  private async evaluateAndCascade(): Promise<SpinResult> {
    const cascades: WinResult[] = [];
    const stateData = this.stateMachine.getStateData();
    let totalWin = 0;

    // Evaluation and cascade loop
    while (cascades.length < this.config.paytable.gameSettings.maxCascades) {
      // Evaluate current grid
      const winResult = this.evaluator.evaluateWin(
        stateData.bet,
        stateData.isInFreeSpins
      );

      // Process result
      if (winResult.clusters.length > 0 || winResult.scatterCount >= 4) {
        cascades.push(winResult);
        totalWin += winResult.totalPayout;

        // Notify of win
        this.onWinDetected?.(winResult, cascades.length);

        // Handle free spins trigger
        if (winResult.freeSpinsAwarded > 0) {
          this.stateMachine.updateStateData({
            freeSpinsRemaining: stateData.freeSpinsRemaining + winResult.freeSpinsAwarded
          });
          this.onFreeSpinsTriggered?.(winResult.freeSpinsAwarded);
          this.stateMachine.processEvent(GameEvent.FREE_SPINS_TRIGGERED);
        } else {
          this.stateMachine.processEvent(GameEvent.WIN_DETECTED);
        }

        // Simulate win animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.stateMachine.processEvent(GameEvent.WIN_ANIMATION_COMPLETE);

        // Remove winning symbols and apply gravity
        this.evaluator.removeWinningSymbols(winResult.clusters);
        this.evaluator.applyGravity();

        // Fill empty positions
        const symbolPool = this.evaluator.generateSymbolPool(
          this.config.volatility.symbolRarityMultiplier
        );
        this.evaluator.fillEmptyPositions(symbolPool);

        // Simulate tumble animation
        await new Promise(resolve => setTimeout(resolve, 800));
        this.stateMachine.processEvent(GameEvent.TUMBLE_COMPLETE);
      } else {
        // No win detected
        this.stateMachine.processEvent(GameEvent.NO_WIN);
        break;
      }
    }

    // Update balance with wins
    const newBalance = stateData.balance + totalWin;
    this.stateMachine.updateStateData({
      totalWin: stateData.totalWin + totalWin,
      lastWinAmount: totalWin
    });

    if (!stateData.isInFreeSpins) {
      this.stateMachine.updateStateData({ balance: newBalance });
      this.onBalanceUpdate?.(newBalance, totalWin);
    }

    // Create spin result
    const spinResult: SpinResult = {
      grid: this.evaluator.getGrid(),
      winResult: cascades[0] || {
        clusters: [],
        totalPayout: 0,
        multiplier: 1,
        scatterCount: 0,
        freeSpinsAwarded: 0,
        multiplierSymbols: []
      },
      cascades,
      totalWin,
      newBalance: stateData.isInFreeSpins ? stateData.balance : newBalance,
      freeSpinsAwarded: cascades.reduce((sum, cascade) => sum + cascade.freeSpinsAwarded, 0),
      isFreeSpin: stateData.isInFreeSpins,
      gameState: this.stateMachine.getCurrentState()
    };

    // Add to history
    this.spinHistory.push(spinResult);
    this.currentSpinId++;

    // Notify completion
    this.onSpinComplete?.(spinResult);

    return spinResult;
  }

  /**
   * Handle state machine changes
   */
  private handleStateChange(
    previousState: GameState,
    currentState: GameState,
    event: GameEvent,
    data: GameStateData
  ): void {
    console.log(`State: ${previousState} -> ${currentState} (${event})`);
    this.onStateChange?.(currentState, data);

    // Handle free spins completion
    if (currentState === GameState.IDLE && previousState === GameState.FREE_SPINS) {
      this.onBalanceUpdate?.(data.balance, data.totalWin);
    }
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return this.stateMachine.getCurrentState();
  }

  /**
   * Check if game can accept spin input
   */
  canSpin(): boolean {
    return this.stateMachine.canSpin();
  }

  /**
   * Get current state data
   */
  getStateData(): GameStateData {
    return this.stateMachine.getStateData();
  }

  /**
   * Get current grid
   */
  getGrid(): any[][] {
    return this.evaluator.getGrid();
  }

  /**
   * Update bet amount
   */
  setBet(amount: number): boolean {
    const stateData = this.stateMachine.getStateData();
    if (amount <= stateData.balance && amount > 0) {
      this.stateMachine.updateStateData({ bet: amount });
      return true;
    }
    return false;
  }

  /**
   * Add balance (for testing or bonus credits)
   */
  addBalance(amount: number): void {
    const stateData = this.stateMachine.getStateData();
    const newBalance = stateData.balance + amount;
    this.stateMachine.updateStateData({ balance: newBalance });
    this.onBalanceUpdate?.(newBalance, amount);
  }

  /**
   * Get spin history
   */
  getSpinHistory(): SpinResult[] {
    return [...this.spinHistory];
  }

  /**
   * Calculate RTP simulation
   */
  async simulateRTP(spins: number = 100000): Promise<number> {
    return this.evaluator.simulateRTP(spins, this.config.initialBet);
  }

  /**
   * Reset game to initial state
   */
  reset(): void {
    this.stateMachine.reset({
      balance: this.config.initialBalance,
      bet: this.config.initialBet,
      totalWin: 0,
      cascadeCount: 0,
      freeSpinsRemaining: 0,
      isInFreeSpins: false,
      multiplier: 1,
      lastWinAmount: 0,
      autoSpinCount: 0
    });

    this.evaluator.initializeGrid();
    this.spinHistory = [];
    this.currentSpinId = 0;
  }

  /**
   * Event handlers
   */
  onStateChangeHandler(callback: (state: GameState, data: GameStateData) => void): void {
    this.onStateChange = callback;
  }

  onSpinStartHandler(callback: (bet: number, balance: number) => void): void {
    this.onSpinStart = callback;
  }

  onSpinCompleteHandler(callback: (result: SpinResult) => void): void {
    this.onSpinComplete = callback;
  }

  onWinDetectedHandler(callback: (winResult: WinResult, cascadeNumber: number) => void): void {
    this.onWinDetected = callback;
  }

  onFreeSpinsTriggeredHandler(callback: (spinsAwarded: number) => void): void {
    this.onFreeSpinsTriggered = callback;
  }

  onBalanceUpdateHandler(callback: (newBalance: number, change: number) => void): void {
    this.onBalanceUpdate = callback;
  }
}