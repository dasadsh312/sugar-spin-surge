/**
 * Audio Manager for Candy Tempest
 * Handles all sound effects and background music
 */

export interface AudioConfig {
  volume: number;
  muted: boolean;
  soundEffects: boolean;
  backgroundMusic: boolean;
}

export interface SoundEffect {
  id: string;
  src: string;
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

export class AudioManager {
  private config: AudioConfig;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private masterVolume: number = 1.0;
  private muted: boolean = false;
  private initialized: boolean = false;

  constructor(config: Partial<AudioConfig> = {}) {
    this.config = {
      volume: 0.7,
      muted: false,
      soundEffects: true,
      backgroundMusic: true,
      ...config
    };

    this.masterVolume = this.config.volume;
    this.muted = this.config.muted;
  }

  /**
   * Initialize audio system with predefined sound effects
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Define game sound effects
    const soundEffects: SoundEffect[] = [
      { id: 'spin_start', src: this.generateTone(440, 0.1, 'sine'), volume: 0.3 },
      { id: 'reel_stop', src: this.generateTone(220, 0.2, 'square'), volume: 0.2 },
      { id: 'symbol_land', src: this.generateTone(330, 0.1, 'triangle'), volume: 0.15 },
      { id: 'symbol_pop', src: this.generateTone(660, 0.3, 'sine'), volume: 0.4 },
      { id: 'cascade_drop', src: this.generateTone(110, 0.4, 'sawtooth'), volume: 0.3 },
      { id: 'win_small', src: this.generateChord([262, 330, 392], 0.5), volume: 0.5 },
      { id: 'win_medium', src: this.generateChord([330, 415, 523], 0.7), volume: 0.6 },
      { id: 'win_big', src: this.generateChord([523, 659, 784], 1.0), volume: 0.8 },
      { id: 'scatter_tease', src: this.generateTone(880, 0.8, 'sine'), volume: 0.5 },
      { id: 'scatter_land', src: this.generateChord([880, 1108, 1320], 1.2), volume: 0.7 },
      { id: 'free_spins_trigger', src: this.generateFanfare(), volume: 0.8 },
      { id: 'multiplier_land', src: this.generateArpeggio([523, 659, 784, 1047], 0.6), volume: 0.6 },
      { id: 'multiplier_apply', src: this.generateGlissando(523, 1047, 0.5), volume: 0.7 },
      { id: 'balance_update', src: this.generateTone(523, 0.2, 'sine'), volume: 0.3 },
      { id: 'button_click', src: this.generateTone(800, 0.1, 'square'), volume: 0.2 },
      { id: 'button_hover', src: this.generateTone(600, 0.05, 'sine'), volume: 0.1 },
      { id: 'error', src: this.generateTone(150, 0.5, 'sawtooth'), volume: 0.4 },
      { id: 'jackpot', src: this.generateCelebration(), volume: 1.0 }
    ];

    // Load all sound effects
    await Promise.all(soundEffects.map(sfx => this.loadSound(sfx)));

    this.initialized = true;
    console.log('Audio Manager initialized with', this.sounds.size, 'sound effects');
  }

  /**
   * Load a single sound effect
   */
  private async loadSound(sfx: SoundEffect): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = sfx.preload ? 'auto' : 'none';
      audio.volume = (sfx.volume || 1.0) * this.masterVolume;
      audio.loop = sfx.loop || false;
      audio.src = sfx.src;

      audio.addEventListener('canplaythrough', () => {
        this.sounds.set(sfx.id, audio);
        resolve();
      });

      audio.addEventListener('error', () => {
        console.warn(`Failed to load sound: ${sfx.id}`);
        resolve(); // Don't reject to avoid breaking initialization
      });

      audio.load();
    });
  }

  /**
   * Play a sound effect
   */
  play(soundId: string, options: { volume?: number; playbackRate?: number } = {}): void {
    if (this.muted || !this.config.soundEffects) return;

    const sound = this.sounds.get(soundId);
    if (!sound) {
      console.warn(`Sound not found: ${soundId}`);
      return;
    }

    try {
      // Clone audio for overlapping sounds
      const audioClone = sound.cloneNode() as HTMLAudioElement;
      
      if (options.volume !== undefined) {
        audioClone.volume = options.volume * this.masterVolume;
      }
      
      if (options.playbackRate !== undefined) {
        audioClone.playbackRate = options.playbackRate;
      }

      audioClone.currentTime = 0;
      audioClone.play().catch(e => {
        console.warn(`Failed to play sound ${soundId}:`, e);
      });
    } catch (error) {
      console.warn(`Error playing sound ${soundId}:`, error);
    }
  }

  /**
   * Stop a sound effect
   */
  stop(soundId: string): void {
    const sound = this.sounds.get(soundId);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.config.volume = this.masterVolume;
    
    // Update all loaded sounds
    this.sounds.forEach(sound => {
      sound.volume = sound.volume * this.masterVolume;
    });
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.masterVolume;
  }

  /**
   * Mute/unmute all audio
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    this.config.muted = muted;
  }

  /**
   * Check if audio is muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Enable/disable sound effects
   */
  setSoundEffects(enabled: boolean): void {
    this.config.soundEffects = enabled;
  }

  /**
   * Duck volume temporarily (for voiceovers, etc.)
   */
  duck(duckVolume: number = 0.3, duration: number = 1000): void {
    const originalVolume = this.masterVolume;
    this.setVolume(duckVolume);
    
    setTimeout(() => {
      this.setVolume(originalVolume);
    }, duration);
  }

  /**
   * Generate procedural audio using Web Audio API
   */
  private generateTone(
    frequency: number, 
    duration: number, 
    waveform: OscillatorType = 'sine'
  ): string {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const samples = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (waveform) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'triangle':
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
      }

      // Apply envelope (attack, decay)
      const envelope = Math.exp(-t * 5) * (t < duration * 0.1 ? t / (duration * 0.1) : 1);
      data[i] = sample * envelope * 0.5;
    }

    // Convert to data URL
    return this.bufferToDataURL(buffer);
  }

  /**
   * Generate chord
   */
  private generateChord(frequencies: number[], duration: number): string {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const samples = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Add all frequencies
      for (const freq of frequencies) {
        sample += Math.sin(2 * Math.PI * freq * t) / frequencies.length;
      }

      // Apply envelope
      const envelope = Math.exp(-t * 3) * (t < duration * 0.1 ? t / (duration * 0.1) : 1);
      data[i] = sample * envelope * 0.7;
    }

    return this.bufferToDataURL(buffer);
  }

  /**
   * Generate arpeggio
   */
  private generateArpeggio(frequencies: number[], duration: number): string {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const samples = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    const noteLength = duration / frequencies.length;

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / noteLength);
      const freq = frequencies[Math.min(noteIndex, frequencies.length - 1)];
      
      const sample = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.exp(-(t % noteLength) * 8);
      data[i] = sample * envelope * 0.6;
    }

    return this.bufferToDataURL(buffer);
  }

  /**
   * Generate glissando (pitch sweep)
   */
  private generateGlissando(startFreq: number, endFreq: number, duration: number): string {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const samples = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freq = startFreq + (endFreq - startFreq) * progress;
      
      const sample = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.exp(-t * 2);
      data[i] = sample * envelope * 0.6;
    }

    return this.bufferToDataURL(buffer);
  }

  /**
   * Generate fanfare
   */
  private generateFanfare(): string {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 2.0;
    const samples = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    const melody = [523, 659, 784, 1047, 784, 659, 523, 659, 784];
    const noteLength = duration / melody.length;

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / noteLength);
      const freq = melody[Math.min(noteIndex, melody.length - 1)];
      
      let sample = Math.sin(2 * Math.PI * freq * t);
      sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.3; // Harmonic
      
      const envelope = Math.exp(-(t % noteLength) * 4);
      data[i] = sample * envelope * 0.4;
    }

    return this.bufferToDataURL(buffer);
  }

  /**
   * Generate celebration sound
   */
  private generateCelebration(): string {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 3.0;
    const samples = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // Multiple oscillators for rich sound
      let sample = 0;
      sample += Math.sin(2 * Math.PI * 440 * t) * 0.3;
      sample += Math.sin(2 * Math.PI * 554 * t) * 0.2;
      sample += Math.sin(2 * Math.PI * 659 * t) * 0.3;
      sample += Math.sin(2 * Math.PI * 880 * t) * 0.2;
      
      // Add some randomness for sparkle effect
      sample += (Math.random() - 0.5) * 0.1 * Math.sin(2 * Math.PI * t * 20);
      
      const envelope = Math.exp(-t * 1.5);
      data[i] = sample * envelope * 0.5;
    }

    return this.bufferToDataURL(buffer);
  }

  /**
   * Convert audio buffer to data URL
   */
  private bufferToDataURL(buffer: AudioBuffer): string {
    const samples = buffer.getChannelData(0);
    const dataView = new DataView(new ArrayBuffer(44 + samples.length * 2));
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        dataView.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    dataView.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    dataView.setUint32(16, 16, true);
    dataView.setUint16(20, 1, true);
    dataView.setUint16(22, 1, true);
    dataView.setUint32(24, buffer.sampleRate, true);
    dataView.setUint32(28, buffer.sampleRate * 2, true);
    dataView.setUint16(32, 2, true);
    dataView.setUint16(34, 16, true);
    writeString(36, 'data');
    dataView.setUint32(40, samples.length * 2, true);

    // Convert samples to 16-bit PCM
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      dataView.setInt16(44 + i * 2, sample * 0x7FFF, true);
    }

    // Convert to base64
    const bytes = new Uint8Array(dataView.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return 'data:audio/wav;base64,' + btoa(binary);
  }

  /**
   * Get configuration
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...updates };
    this.setVolume(this.config.volume);
    this.setMuted(this.config.muted);
  }
}

// Global audio manager instance
export const audioManager = new AudioManager();