/**
 * RTP Simulation Tests for Candy Tempest
 */

import { describe, it, expect } from 'vitest';
import { GameEvaluator } from '../src/engine/evaluator';
import paytableConfig from '../config/paytable.json';

describe('RTP Simulation', () => {
  it('should achieve target RTP within tolerance', async () => {
    const evaluator = new GameEvaluator(paytableConfig as any);
    const targetRTP = paytableConfig.gameSettings.targetRTP;
    const tolerance = paytableConfig.gameSettings.rtpTolerance;
    
    const actualRTP = evaluator.simulateRTP(10000, 1);
    
    expect(actualRTP).toBeGreaterThan(targetRTP - tolerance);
    expect(actualRTP).toBeLessThan(targetRTP + tolerance);
  });
});