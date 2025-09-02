/**
 * Seeded Random Number Generator for Candy Tempest
 * Uses sfc32 algorithm for cryptographically secure, reproducible random numbers
 */

export class SeededRNG {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: string | number = Date.now()) {
    // Convert seed to numbers for sfc32
    const seedStr = seed.toString();
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    
    for (let i = 0; i < seedStr.length; i++) {
      h1 = this.mulberry32Hash(h1 ^ seedStr.charCodeAt(i));
      h2 = this.mulberry32Hash(h2 ^ seedStr.charCodeAt(i));
      h3 = this.mulberry32Hash(h3 ^ seedStr.charCodeAt(i));
      h4 = this.mulberry32Hash(h4 ^ seedStr.charCodeAt(i));
    }
    
    this.a = h1 >>> 0;
    this.b = h2 >>> 0;
    this.c = h3 >>> 0;
    this.d = h4 >>> 0;
  }

  private mulberry32Hash(x: number): number {
    x |= 0;
    x = x + 0x9e3779b9 | 0;
    let t = x ^ x >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return (t ^ t >>> 15) >>> 0;
  }

  /**
   * SFC32 generator - produces high quality random numbers
   */
  next(): number {
    const t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21 | this.c >>> 11);
    this.d = (this.d + 1) | 0;
    const result = (t + this.d) | 0;
    this.c = (this.c + result) | 0;
    return (result >>> 0) / 4294967296;
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Generate random float between min and max
   */
  nextFloat(min: number = 0, max: number = 1): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Pick random element from array
   */
  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  /**
   * Weighted random selection
   */
  weightedChoice<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = this.next() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  /**
   * Shuffle array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate boolean with given probability (0-1)
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Set new seed and reinitialize RNG
   */
  setSeed(seed: string | number): void {
    const seedStr = seed.toString();
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    
    for (let i = 0; i < seedStr.length; i++) {
      h1 = this.mulberry32Hash(h1 ^ seedStr.charCodeAt(i));
      h2 = this.mulberry32Hash(h2 ^ seedStr.charCodeAt(i));
      h3 = this.mulberry32Hash(h3 ^ seedStr.charCodeAt(i));
      h4 = this.mulberry32Hash(h4 ^ seedStr.charCodeAt(i));
    }
    
    this.a = h1 >>> 0;
    this.b = h2 >>> 0;
    this.c = h3 >>> 0;
    this.d = h4 >>> 0;
  }
  getState(): [number, number, number, number] {
    return [this.a, this.b, this.c, this.d];
  }

  /**
   * Set seed state for reproduction
   */
  setState(state: [number, number, number, number]): void {
    [this.a, this.b, this.c, this.d] = state;
  }
}

// Global RNG instance
export const rng = new SeededRNG();