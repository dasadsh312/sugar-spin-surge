/**
 * Game Evaluator - Handles win detection, cluster analysis, and payout calculation
 */

import { rng } from '../utils/rng';

export interface GridPosition {
  col: number;
  row: number;
}

export interface Symbol {
  id: string;
  position: GridPosition;
  isWinning?: boolean;
  clusterId?: number;
}

export interface Cluster {
  id: number;
  symbolId: string;
  positions: GridPosition[];
  size: number;
  payout: number;
}

export interface WinResult {
  clusters: Cluster[];
  totalPayout: number;
  multiplier: number;
  scatterCount: number;
  freeSpinsAwarded: number;
  multiplierSymbols: Array<{ position: GridPosition; value: number }>;
}

export interface PaytableSymbol {
  id: string;
  name: string;
  rarity: number;
  minCluster: number;
  payoutTable: Record<string, number>;
}

export interface SpecialSymbol {
  id: string;
  name: string;
  rarity: number;
  minCount?: number;
  freeSpinsTable?: Record<string, number>;
  values?: number[];
  weights?: number[];
}

export interface GameConfig {
  symbols: PaytableSymbol[];
  specialSymbols: SpecialSymbol[];
  gameSettings: {
    gridSize: { columns: number; rows: number };
    targetRTP: number;
    maxCascades: number;
  };
}

export class GameEvaluator {
  private config: GameConfig;
  private grid: Symbol[][];
  private clusterId: number = 0;

  constructor(config: GameConfig) {
    this.config = config;
    this.grid = [];
  }

  /**
   * Initialize empty grid
   */
  initializeGrid(): void {
    const { columns, rows } = this.config.gameSettings.gridSize;
    this.grid = Array(rows).fill(null).map(() => Array(columns).fill(null));
  }

  /**
   * Set grid state
   */
  setGrid(grid: Symbol[][]): void {
    this.grid = grid;
  }

  /**
   * Get current grid
   */
  getGrid(): Symbol[][] {
    return this.grid;
  }

  /**
   * Evaluate current grid for wins and calculate payouts
   */
  evaluateWin(bet: number, isFreeSpin: boolean = false): WinResult {
    this.clusterId = 0;
    const clusters = this.findClusters();
    const scatterCount = this.countScatters();
    const multiplierSymbols = isFreeSpin ? this.findMultiplierSymbols() : [];
    
    let totalPayout = 0;
    let freeSpinsAwarded = 0;
    
    // Calculate cluster payouts
    for (const cluster of clusters) {
      const symbol = this.config.symbols.find(s => s.id === cluster.symbolId);
      if (symbol && cluster.size >= symbol.minCluster) {
        const payout = symbol.payoutTable[cluster.size.toString()] || 0;
        cluster.payout = payout * bet;
        totalPayout += cluster.payout;
      }
    }

    // Calculate free spins from scatters
    if (scatterCount >= 4) {
      const scatterSymbol = this.config.specialSymbols.find(s => s.id === 'scatter');
      if (scatterSymbol?.freeSpinsTable) {
        freeSpinsAwarded = scatterSymbol.freeSpinsTable[scatterCount.toString()] || 0;
      }
    }

    // Apply multipliers in free spins
    let multiplier = 1;
    if (isFreeSpin && multiplierSymbols.length > 0) {
      multiplier = multiplierSymbols.reduce((acc, m) => acc * m.value, 1);
      multiplier = Math.min(multiplier, 1000); // Cap multiplier
    }

    return {
      clusters,
      totalPayout: totalPayout * multiplier,
      multiplier,
      scatterCount,
      freeSpinsAwarded,
      multiplierSymbols
    };
  }

  /**
   * Find all symbol clusters using flood fill algorithm
   */
  private findClusters(): Cluster[] {
    const clusters: Cluster[] = [];
    const visited = new Set<string>();
    const { columns, rows } = this.config.gameSettings.gridSize;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const posKey = `${col},${row}`;
        if (!visited.has(posKey) && this.grid[row][col]) {
          const cluster = this.floodFill(col, row, visited);
          if (cluster.positions.length >= 1) {
            clusters.push(cluster);
          }
        }
      }
    }

    return clusters;
  }

  /**
   * Flood fill algorithm to find connected symbols
   */
  private floodFill(startCol: number, startRow: number, visited: Set<string>): Cluster {
    const symbolId = this.grid[startRow][startCol]?.id;
    if (!symbolId) {
      return { id: -1, symbolId: '', positions: [], size: 0, payout: 0 };
    }

    const cluster: Cluster = {
      id: this.clusterId++,
      symbolId,
      positions: [],
      size: 0,
      payout: 0
    };

    const stack: GridPosition[] = [{ col: startCol, row: startRow }];
    const { columns, rows } = this.config.gameSettings.gridSize;

    while (stack.length > 0) {
      const { col, row } = stack.pop()!;
      const posKey = `${col},${row}`;

      if (visited.has(posKey)) continue;
      if (col < 0 || col >= columns || row < 0 || row >= rows) continue;
      if (!this.grid[row][col] || this.grid[row][col].id !== symbolId) continue;

      visited.add(posKey);
      cluster.positions.push({ col, row });
      
      // Mark symbol as part of this cluster
      if (this.grid[row][col]) {
        this.grid[row][col].clusterId = cluster.id;
      }

      // Add adjacent positions (4-directional)
      stack.push(
        { col: col - 1, row },
        { col: col + 1, row },
        { col, row: row - 1 },
        { col, row: row + 1 }
      );
    }

    cluster.size = cluster.positions.length;
    return cluster;
  }

  /**
   * Count scatter symbols on the grid
   */
  private countScatters(): number {
    let count = 0;
    const { columns, rows } = this.config.gameSettings.gridSize;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (this.grid[row][col]?.id === 'scatter') {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Find multiplier symbols and their values
   */
  private findMultiplierSymbols(): Array<{ position: GridPosition; value: number }> {
    const multipliers: Array<{ position: GridPosition; value: number }> = [];
    const { columns, rows } = this.config.gameSettings.gridSize;
    const multiplierSymbol = this.config.specialSymbols.find(s => s.id === 'multiplier');

    if (!multiplierSymbol?.values || !multiplierSymbol?.weights) {
      return multipliers;
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (this.grid[row][col]?.id === 'multiplier') {
          const value = rng.weightedChoice(multiplierSymbol.values, multiplierSymbol.weights);
          multipliers.push({
            position: { col, row },
            value
          });
        }
      }
    }

    return multipliers;
  }

  /**
   * Remove winning symbols from grid (for tumble mechanic)
   */
  removeWinningSymbols(clusters: Cluster[]): void {
    for (const cluster of clusters) {
      for (const pos of cluster.positions) {
        if (this.grid[pos.row][pos.col]) {
          this.grid[pos.row][pos.col] = null as any;
        }
      }
    }
  }

  /**
   * Apply gravity and drop symbols down
   */
  applyGravity(): void {
    const { columns, rows } = this.config.gameSettings.gridSize;

    for (let col = 0; col < columns; col++) {
      // Collect non-null symbols from bottom to top
      const column: Symbol[] = [];
      for (let row = rows - 1; row >= 0; row--) {
        if (this.grid[row][col]) {
          column.push(this.grid[row][col]);
        }
      }

      // Clear column
      for (let row = 0; row < rows; row++) {
        this.grid[row][col] = null as any;
      }

      // Place symbols from bottom up
      for (let i = 0; i < column.length; i++) {
        const targetRow = rows - 1 - i;
        this.grid[targetRow][col] = column[i];
        this.grid[targetRow][col].position = { col, row: targetRow };
      }
    }
  }

  /**
   * Fill empty positions with new symbols
   */
  fillEmptyPositions(symbolPool: string[]): void {
    const { columns, rows } = this.config.gameSettings.gridSize;

    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rows; row++) {
        if (!this.grid[row][col]) {
          const symbolId = rng.choice(symbolPool);
          this.grid[row][col] = {
            id: symbolId,
            position: { col, row }
          };
        }
      }
    }
  }

  /**
   * Generate symbol pool based on rarity weights
   */
  generateSymbolPool(volatilityMultipliers?: Record<string, number>): string[] {
    const pool: string[] = [];

    // Add regular symbols
    for (const symbol of this.config.symbols) {
      const multiplier = volatilityMultipliers?.[symbol.id] || 1;
      const adjustedRarity = Math.round(symbol.rarity * multiplier);
      
      for (let i = 0; i < adjustedRarity; i++) {
        pool.push(symbol.id);
      }
    }

    // Add special symbols
    for (const symbol of this.config.specialSymbols) {
      const multiplier = volatilityMultipliers?.[symbol.id] || 1;
      const adjustedRarity = Math.round(symbol.rarity * multiplier);
      
      for (let i = 0; i < adjustedRarity; i++) {
        pool.push(symbol.id);
      }
    }

    return pool;
  }

  /**
   * Calculate theoretical RTP for current configuration
   */
  simulateRTP(spins: number = 100000, bet: number = 1): number {
    let totalWins = 0;
    let totalBet = spins * bet;

    console.log(`Starting RTP simulation: ${spins} spins at ${bet} bet`);

    for (let i = 0; i < spins; i++) {
      // Generate random grid
      this.initializeGrid();
      const symbolPool = this.generateSymbolPool();
      this.fillEmptyPositions(symbolPool);

      // Simulate cascades
      let cascadeCount = 0;
      while (cascadeCount < this.config.gameSettings.maxCascades) {
        const result = this.evaluateWin(bet);
        if (result.clusters.length === 0) break;

        totalWins += result.totalPayout;
        this.removeWinningSymbols(result.clusters);
        this.applyGravity();
        this.fillEmptyPositions(symbolPool);
        cascadeCount++;
      }

      // Log progress
      if (i % 10000 === 0) {
        const currentRTP = (totalWins / (i * bet)) * 100;
        console.log(`Simulation progress: ${i}/${spins} (${currentRTP.toFixed(2)}% RTP)`);
      }
    }

    const rtp = (totalWins / totalBet) * 100;
    console.log(`RTP Simulation Complete: ${rtp.toFixed(3)}%`);
    return rtp;
  }
}