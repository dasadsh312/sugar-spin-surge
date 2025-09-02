/**
 * Easing functions for smooth animations in Candy Tempest
 */

export type EaseFunction = (t: number) => number;

/**
 * Linear easing - no acceleration
 */
export const linear: EaseFunction = (t: number) => t;

/**
 * Quadratic easing functions
 */
export const easeInQuad: EaseFunction = (t: number) => t * t;
export const easeOutQuad: EaseFunction = (t: number) => t * (2 - t);
export const easeInOutQuad: EaseFunction = (t: number) => 
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

/**
 * Cubic easing functions
 */
export const easeInCubic: EaseFunction = (t: number) => t * t * t;
export const easeOutCubic: EaseFunction = (t: number) => (--t) * t * t + 1;
export const easeInOutCubic: EaseFunction = (t: number) =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

/**
 * Quartic easing functions
 */
export const easeInQuart: EaseFunction = (t: number) => t * t * t * t;
export const easeOutQuart: EaseFunction = (t: number) => 1 - (--t) * t * t * t;
export const easeInOutQuart: EaseFunction = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;

/**
 * Quintic easing functions
 */
export const easeInQuint: EaseFunction = (t: number) => t * t * t * t * t;
export const easeOutQuint: EaseFunction = (t: number) => 1 + (--t) * t * t * t * t;
export const easeInOutQuint: EaseFunction = (t: number) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;

/**
 * Sine easing functions
 */
export const easeInSine: EaseFunction = (t: number) => 1 - Math.cos(t * Math.PI / 2);
export const easeOutSine: EaseFunction = (t: number) => Math.sin(t * Math.PI / 2);
export const easeInOutSine: EaseFunction = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * Exponential easing functions
 */
export const easeInExpo: EaseFunction = (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
export const easeOutExpo: EaseFunction = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
export const easeInOutExpo: EaseFunction = (t: number) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
};

/**
 * Circular easing functions
 */
export const easeInCirc: EaseFunction = (t: number) => 1 - Math.sqrt(1 - t * t);
export const easeOutCirc: EaseFunction = (t: number) => Math.sqrt(1 - (t - 1) * (t - 1));
export const easeInOutCirc: EaseFunction = (t: number) =>
  t < 0.5
    ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
    : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;

/**
 * Back easing functions (overshooting cubic easing)
 */
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;

export const easeInBack: EaseFunction = (t: number) => c3 * t * t * t - c1 * t * t;
export const easeOutBack: EaseFunction = (t: number) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
export const easeInOutBack: EaseFunction = (t: number) =>
  t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;

/**
 * Elastic easing functions
 */
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;

export const easeInElastic: EaseFunction = (t: number) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
};

export const easeOutElastic: EaseFunction = (t: number) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export const easeInOutElastic: EaseFunction = (t: number) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) {
    return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2;
  }
  return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
};

/**
 * Bounce easing functions
 */
export const easeOutBounce: EaseFunction = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

export const easeInBounce: EaseFunction = (t: number) => 1 - easeOutBounce(1 - t);

export const easeInOutBounce: EaseFunction = (t: number) =>
  t < 0.5 ? (1 - easeOutBounce(1 - 2 * t)) / 2 : (1 + easeOutBounce(2 * t - 1)) / 2;

/**
 * Animation utility class
 */
export class Tween {
  private startTime: number = 0;
  private duration: number;
  private startValue: number;
  private endValue: number;
  private easeFn: EaseFunction;
  private onUpdate?: (value: number) => void;
  private onComplete?: () => void;
  private isRunning: boolean = false;

  constructor(
    startValue: number,
    endValue: number,
    duration: number,
    easeFn: EaseFunction = easeOutQuart
  ) {
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.easeFn = easeFn;
  }

  onUpdateCallback(callback: (value: number) => void): Tween {
    this.onUpdate = callback;
    return this;
  }

  onCompleteCallback(callback: () => void): Tween {
    this.onComplete = callback;
    return this;
  }

  start(): void {
    this.startTime = performance.now();
    this.isRunning = true;
    this.update();
  }

  stop(): void {
    this.isRunning = false;
  }

  private update = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const elapsed = now - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    const easedProgress = this.easeFn(progress);
    const currentValue = this.startValue + (this.endValue - this.startValue) * easedProgress;

    this.onUpdate?.(currentValue);

    if (progress >= 1) {
      this.isRunning = false;
      this.onComplete?.();
    } else {
      requestAnimationFrame(this.update);
    }
  };
}

/**
 * Common easing presets for game elements
 */
export const gameEasing = {
  symbolDrop: easeOutBounce,
  symbolPop: easeInBack,
  winPulse: easeInOutSine,
  cascadeFlow: easeOutQuart,
  multiplierFloat: easeInOutSine,
  spinReel: easeInOutCubic,
  screenShake: easeInOutQuad,
  uiSlide: easeOutCubic,
  buttonPress: easeOutBack,
  modalFade: easeOutQuart
};