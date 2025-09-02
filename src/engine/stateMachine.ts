/**
 * Game State Machine - Manages game flow and state transitions
 */

export enum GameState {
  IDLE = 'idle',
  SPINNING = 'spinning',
  EVALUATING = 'evaluating',
  TUMBLING = 'tumbling',
  SHOWING_WIN = 'showing_win',
  FREE_SPINS_TRIGGER = 'free_spins_trigger',
  FREE_SPINS = 'free_spins',
  GAME_OVER = 'game_over'
}

export enum GameEvent {
  SPIN = 'spin',
  SPIN_COMPLETE = 'spin_complete',
  EVALUATION_COMPLETE = 'evaluation_complete',
  WIN_DETECTED = 'win_detected',
  NO_WIN = 'no_win',
  TUMBLE_COMPLETE = 'tumble_complete',
  WIN_ANIMATION_COMPLETE = 'win_animation_complete',
  FREE_SPINS_TRIGGERED = 'free_spins_triggered',
  FREE_SPINS_COMPLETE = 'free_spins_complete',
  BALANCE_INSUFFICIENT = 'balance_insufficient',
  RESET = 'reset'
}

export interface GameStateData {
  balance: number;
  bet: number;
  totalWin: number;
  cascadeCount: number;
  freeSpinsRemaining: number;
  isInFreeSpins: boolean;
  multiplier: number;
  lastWinAmount: number;
  autoSpinCount: number;
  maxAutoSpins: number;
  stopOnWin: boolean;
  stopOnLoss: boolean;
  winThreshold: number;
  lossThreshold: number;
}

export type StateTransition = {
  from: GameState;
  to: GameState;
  event: GameEvent;
  condition?: (data: GameStateData) => boolean;
  action?: (data: GameStateData) => void;
};

export type StateChangeListener = (
  previousState: GameState,
  currentState: GameState,
  event: GameEvent,
  data: GameStateData
) => void;

export class GameStateMachine {
  private currentState: GameState = GameState.IDLE;
  private stateData: GameStateData;
  private transitions: StateTransition[] = [];
  private listeners: StateChangeListener[] = [];
  private stateHistory: { state: GameState; timestamp: number; event: GameEvent }[] = [];

  constructor(initialData: Partial<GameStateData> = {}) {
    this.stateData = {
      balance: 1000,
      bet: 1,
      totalWin: 0,
      cascadeCount: 0,
      freeSpinsRemaining: 0,
      isInFreeSpins: false,
      multiplier: 1,
      lastWinAmount: 0,
      autoSpinCount: 0,
      maxAutoSpins: 0,
      stopOnWin: false,
      stopOnLoss: false,
      winThreshold: 0,
      lossThreshold: 0,
      ...initialData
    };

    this.initializeTransitions();
  }

  /**
   * Initialize state transition rules
   */
  private initializeTransitions(): void {
    this.transitions = [
      // From IDLE
      {
        from: GameState.IDLE,
        to: GameState.SPINNING,
        event: GameEvent.SPIN,
        condition: (data) => data.balance >= data.bet,
        action: (data) => {
          data.balance -= data.bet;
          data.cascadeCount = 0;
          data.totalWin = 0;
          data.multiplier = 1;
        }
      },
      {
        from: GameState.IDLE,
        to: GameState.GAME_OVER,
        event: GameEvent.SPIN,
        condition: (data) => data.balance < data.bet
      },

      // From SPINNING
      {
        from: GameState.SPINNING,
        to: GameState.EVALUATING,
        event: GameEvent.SPIN_COMPLETE
      },

      // From EVALUATING
      {
        from: GameState.EVALUATING,
        to: GameState.SHOWING_WIN,
        event: GameEvent.WIN_DETECTED,
        action: (data) => {
          data.cascadeCount++;
        }
      },
      {
        from: GameState.EVALUATING,
        to: GameState.FREE_SPINS_TRIGGER,
        event: GameEvent.FREE_SPINS_TRIGGERED,
        action: (data) => {
          // Free spins awarded will be set by the game engine
        }
      },
      {
        from: GameState.EVALUATING,
        to: GameState.IDLE,
        event: GameEvent.NO_WIN,
        action: (data) => {
          data.cascadeCount = 0;
          data.multiplier = 1;
        }
      },

      // From SHOWING_WIN
      {
        from: GameState.SHOWING_WIN,
        to: GameState.TUMBLING,
        event: GameEvent.WIN_ANIMATION_COMPLETE
      },

      // From TUMBLING
      {
        from: GameState.TUMBLING,
        to: GameState.EVALUATING,
        event: GameEvent.TUMBLE_COMPLETE
      },

      // From FREE_SPINS_TRIGGER
      {
        from: GameState.FREE_SPINS_TRIGGER,
        to: GameState.FREE_SPINS,
        event: GameEvent.WIN_ANIMATION_COMPLETE,
        action: (data) => {
          data.isInFreeSpins = true;
        }
      },

      // From FREE_SPINS
      {
        from: GameState.FREE_SPINS,
        to: GameState.SPINNING,
        event: GameEvent.SPIN,
        condition: (data) => data.freeSpinsRemaining > 0,
        action: (data) => {
          data.freeSpinsRemaining--;
          data.cascadeCount = 0;
        }
      },
      {
        from: GameState.FREE_SPINS,
        to: GameState.IDLE,
        event: GameEvent.FREE_SPINS_COMPLETE,
        action: (data) => {
          data.isInFreeSpins = false;
          data.freeSpinsRemaining = 0;
          data.balance += data.totalWin;
          data.totalWin = 0;
        }
      },

      // Reset from any state
      {
        from: GameState.IDLE,
        to: GameState.IDLE,
        event: GameEvent.RESET
      },
      {
        from: GameState.SPINNING,
        to: GameState.IDLE,
        event: GameEvent.RESET
      },
      {
        from: GameState.EVALUATING,
        to: GameState.IDLE,
        event: GameEvent.RESET
      },
      {
        from: GameState.TUMBLING,
        to: GameState.IDLE,
        event: GameEvent.RESET
      },
      {
        from: GameState.SHOWING_WIN,
        to: GameState.IDLE,
        event: GameEvent.RESET
      },
      {
        from: GameState.FREE_SPINS_TRIGGER,
        to: GameState.IDLE,
        event: GameEvent.RESET
      },
      {
        from: GameState.FREE_SPINS,
        to: GameState.IDLE,
        event: GameEvent.RESET,
        action: (data) => {
          data.isInFreeSpins = false;
          data.freeSpinsRemaining = 0;
        }
      },
      {
        from: GameState.GAME_OVER,
        to: GameState.IDLE,
        event: GameEvent.RESET
      }
    ];
  }

  /**
   * Process game event and transition state if valid
   */
  processEvent(event: GameEvent): boolean {
    const validTransitions = this.transitions.filter(
      t => t.from === this.currentState && t.event === event
    );

    for (const transition of validTransitions) {
      if (!transition.condition || transition.condition(this.stateData)) {
        const previousState = this.currentState;
        
        // Execute action if defined
        if (transition.action) {
          transition.action(this.stateData);
        }

        // Change state
        this.currentState = transition.to;

        // Add to history
        this.stateHistory.push({
          state: this.currentState,
          timestamp: Date.now(),
          event
        });

        // Notify listeners
        this.notifyListeners(previousState, this.currentState, event);

        return true;
      }
    }

    console.warn(`Invalid transition: ${this.currentState} -> ${event}`);
    return false;
  }

  /**
   * Get current state
   */
  getCurrentState(): GameState {
    return this.currentState;
  }

  /**
   * Get state data
   */
  getStateData(): GameStateData {
    return { ...this.stateData };
  }

  /**
   * Update state data
   */
  updateStateData(updates: Partial<GameStateData>): void {
    this.stateData = { ...this.stateData, ...updates };
  }

  /**
   * Check if in specific state
   */
  isInState(state: GameState): boolean {
    return this.currentState === state;
  }

  /**
   * Check if game can accept spin input
   */
  canSpin(): boolean {
    return this.currentState === GameState.IDLE || 
           (this.currentState === GameState.FREE_SPINS && this.stateData.freeSpinsRemaining > 0);
  }

  /**
   * Check if auto-spin should continue
   */
  shouldContinueAutoSpin(): boolean {
    if (this.stateData.autoSpinCount <= 0) return false;
    if (this.stateData.balance < this.stateData.bet) return false;
    
    if (this.stateData.stopOnWin && this.stateData.lastWinAmount >= this.stateData.winThreshold) {
      return false;
    }

    if (this.stateData.stopOnLoss && this.stateData.balance <= this.stateData.lossThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Add state change listener
   */
  addStateListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove state change listener
   */
  removeStateListener(listener: StateChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(
    previousState: GameState,
    currentState: GameState,
    event: GameEvent
  ): void {
    for (const listener of this.listeners) {
      listener(previousState, currentState, event, this.stateData);
    }
  }

  /**
   * Get state history for debugging
   */
  getStateHistory(): { state: GameState; timestamp: number; event: GameEvent }[] {
    return [...this.stateHistory];
  }

  /**
   * Clear state history
   */
  clearHistory(): void {
    this.stateHistory = [];
  }

  /**
   * Reset to initial state
   */
  reset(newData?: Partial<GameStateData>): void {
    const previousState = this.currentState;
    this.currentState = GameState.IDLE;
    
    if (newData) {
      this.stateData = { ...this.stateData, ...newData };
    }

    this.notifyListeners(previousState, this.currentState, GameEvent.RESET);
  }

  /**
   * Export current state for save/load
   */
  exportState(): { state: GameState; data: GameStateData } {
    return {
      state: this.currentState,
      data: { ...this.stateData }
    };
  }

  /**
   * Import state from save data
   */
  importState(saveData: { state: GameState; data: GameStateData }): void {
    const previousState = this.currentState;
    this.currentState = saveData.state;
    this.stateData = { ...saveData.data };
    
    this.notifyListeners(previousState, this.currentState, GameEvent.RESET);
  }
}