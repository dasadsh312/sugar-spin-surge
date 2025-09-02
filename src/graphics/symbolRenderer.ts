/**
 * Symbol Renderer - Creates and manages symbol graphics using PixiJS
 */

import * as PIXI from 'pixi.js';

export interface SymbolConfig {
  id: string;
  name: string;
  color: number;
  secondaryColor?: number;
  size: number;
  glowColor?: number;
  shape: 'circle' | 'diamond' | 'star' | 'heart' | 'polygon';
  sides?: number; // For polygon shapes
}

export class SymbolRenderer {
  private app: PIXI.Application;
  private symbolConfigs: Map<string, SymbolConfig> = new Map();
  private textureCache: Map<string, PIXI.Texture> = new Map();

  constructor(app: PIXI.Application) {
    this.app = app;
    this.initializeSymbolConfigs();
  }

  /**
   * Initialize symbol configurations
   */
  private initializeSymbolConfigs(): void {
    const configs: SymbolConfig[] = [
      {
        id: 'candy_red',
        name: 'Red Candy',
        color: 0xFF4444,
        secondaryColor: 0xFF8888,
        glowColor: 0xFF0000,
        size: 64,
        shape: 'circle'
      },
      {
        id: 'candy_orange',
        name: 'Orange Candy',
        color: 0xFF8844,
        secondaryColor: 0xFFAA66,
        glowColor: 0xFF6600,
        size: 64,
        shape: 'diamond'
      },
      {
        id: 'candy_yellow',
        name: 'Yellow Candy',
        color: 0xFFDD44,
        secondaryColor: 0xFFEE88,
        glowColor: 0xFFCC00,
        size: 64,
        shape: 'star',
        sides: 6
      },
      {
        id: 'candy_green',
        name: 'Green Candy',
        color: 0x44DD44,
        secondaryColor: 0x88EE88,
        glowColor: 0x00CC00,
        size: 64,
        shape: 'heart'
      },
      {
        id: 'candy_blue',
        name: 'Blue Candy',
        color: 0x4488DD,
        secondaryColor: 0x88AAEE,
        glowColor: 0x0066CC,
        size: 64,
        shape: 'polygon',
        sides: 6
      },
      {
        id: 'candy_purple',
        name: 'Purple Candy',
        color: 0x8844DD,
        secondaryColor: 0xAA88EE,
        glowColor: 0x6600CC,
        size: 64,
        shape: 'star',
        sides: 8
      },
      {
        id: 'candy_pink',
        name: 'Pink Candy',
        color: 0xDD44AA,
        secondaryColor: 0xEE88CC,
        glowColor: 0xCC0088,
        size: 64,
        shape: 'diamond'
      },
      {
        id: 'scatter',
        name: 'Golden Star',
        color: 0xFFD700,
        secondaryColor: 0xFFF700,
        glowColor: 0xFFAA00,
        size: 72,
        shape: 'star',
        sides: 5
      },
      {
        id: 'multiplier',
        name: 'Crystal Multiplier',
        color: 0xCC88FF,
        secondaryColor: 0xEEAAFF,
        glowColor: 0x8844FF,
        size: 68,
        shape: 'diamond'
      }
    ];

    configs.forEach(config => {
      this.symbolConfigs.set(config.id, config);
    });
  }

  /**
   * Create symbol texture
   */
  createSymbolTexture(symbolId: string): PIXI.Texture | null {
    // Check cache first
    if (this.textureCache.has(symbolId)) {
      return this.textureCache.get(symbolId)!;
    }

    const config = this.symbolConfigs.get(symbolId);
    if (!config) {
      console.warn(`Symbol config not found: ${symbolId}`);
      return null;
    }

    // Create graphics object
    const graphics = new PIXI.Graphics();
    const size = config.size;
    const radius = size / 2;

    // Draw base shape with gradient effect
    this.drawSymbolShape(graphics, config, radius);

    // Generate texture
    const texture = this.app.renderer.generateTexture(graphics);
    this.textureCache.set(symbolId, texture);
    
    return texture;
  }

  /**
   * Draw symbol shape based on configuration
   */
  private drawSymbolShape(graphics: PIXI.Graphics, config: SymbolConfig, radius: number): void {
    const centerX = radius;
    const centerY = radius;

    // Draw glow effect
    if (config.glowColor) {
      graphics.beginFill(config.glowColor, 0.3);
      graphics.drawCircle(centerX, centerY, radius * 1.3);
      graphics.endFill();
    }

    // Draw outer shadow
    graphics.beginFill(0x000000, 0.2);
    graphics.drawCircle(centerX + 2, centerY + 2, radius * 0.9);
    graphics.endFill();

    // Draw main shape
    switch (config.shape) {
      case 'circle':
        this.drawCircle(graphics, config, centerX, centerY, radius);
        break;
      case 'diamond':
        this.drawDiamond(graphics, config, centerX, centerY, radius);
        break;
      case 'star':
        this.drawStar(graphics, config, centerX, centerY, radius);
        break;
      case 'heart':
        this.drawHeart(graphics, config, centerX, centerY, radius);
        break;
      case 'polygon':
        this.drawPolygon(graphics, config, centerX, centerY, radius);
        break;
    }

    // Add highlight
    this.addHighlight(graphics, config, centerX, centerY, radius);
  }

  /**
   * Draw circle shape
   */
  private drawCircle(graphics: PIXI.Graphics, config: SymbolConfig, x: number, y: number, radius: number): void {
    // Main circle
    graphics.beginFill(config.color);
    graphics.drawCircle(x, y, radius * 0.8);
    graphics.endFill();

    // Inner circle for depth
    if (config.secondaryColor) {
      graphics.beginFill(config.secondaryColor);
      graphics.drawCircle(x, y, radius * 0.6);
      graphics.endFill();
    }
  }

  /**
   * Draw diamond shape
   */
  private drawDiamond(graphics: PIXI.Graphics, config: SymbolConfig, x: number, y: number, radius: number): void {
    const size = radius * 0.8;
    
    // Main diamond
    graphics.beginFill(config.color);
    graphics.moveTo(x, y - size);
    graphics.lineTo(x + size, y);
    graphics.lineTo(x, y + size);
    graphics.lineTo(x - size, y);
    graphics.closePath();
    graphics.endFill();

    // Inner diamond
    if (config.secondaryColor) {
      const innerSize = size * 0.6;
      graphics.beginFill(config.secondaryColor);
      graphics.moveTo(x, y - innerSize);
      graphics.lineTo(x + innerSize, y);
      graphics.lineTo(x, y + innerSize);
      graphics.lineTo(x - innerSize, y);
      graphics.closePath();
      graphics.endFill();
    }
  }

  /**
   * Draw star shape
   */
  private drawStar(graphics: PIXI.Graphics, config: SymbolConfig, x: number, y: number, radius: number): void {
    const points = config.sides || 5;
    const outerRadius = radius * 0.8;
    const innerRadius = outerRadius * 0.4;

    graphics.beginFill(config.color);
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const pointX = x + Math.cos(angle) * r;
      const pointY = y + Math.sin(angle) * r;
      
      if (i === 0) {
        graphics.moveTo(pointX, pointY);
      } else {
        graphics.lineTo(pointX, pointY);
      }
    }
    
    graphics.closePath();
    graphics.endFill();

    // Inner star
    if (config.secondaryColor) {
      const innerOuterRadius = outerRadius * 0.6;
      const innerInnerRadius = innerOuterRadius * 0.4;

      graphics.beginFill(config.secondaryColor);
      
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? innerOuterRadius : innerInnerRadius;
        const pointX = x + Math.cos(angle) * r;
        const pointY = y + Math.sin(angle) * r;
        
        if (i === 0) {
          graphics.moveTo(pointX, pointY);
        } else {
          graphics.lineTo(pointX, pointY);
        }
      }
      
      graphics.closePath();
      graphics.endFill();
    }
  }

  /**
   * Draw heart shape
   */
  private drawHeart(graphics: PIXI.Graphics, config: SymbolConfig, x: number, y: number, radius: number): void {
    const size = radius * 0.7;
    
    graphics.beginFill(config.color);
    
    // Heart shape using bezier curves
    graphics.moveTo(x, y + size * 0.3);
    graphics.bezierCurveTo(
      x - size, y - size * 0.3,
      x - size, y - size * 0.8,
      x, y - size * 0.2
    );
    graphics.bezierCurveTo(
      x + size, y - size * 0.8,
      x + size, y - size * 0.3,
      x, y + size * 0.3
    );
    graphics.closePath();
    graphics.endFill();

    // Inner heart
    if (config.secondaryColor) {
      const innerSize = size * 0.6;
      graphics.beginFill(config.secondaryColor);
      graphics.moveTo(x, y + innerSize * 0.3);
      graphics.bezierCurveTo(
        x - innerSize, y - innerSize * 0.3,
        x - innerSize, y - innerSize * 0.8,
        x, y - innerSize * 0.2
      );
      graphics.bezierCurveTo(
        x + innerSize, y - innerSize * 0.8,
        x + innerSize, y - innerSize * 0.3,
        x, y + innerSize * 0.3
      );
      graphics.closePath();
      graphics.endFill();
    }
  }

  /**
   * Draw polygon shape
   */
  private drawPolygon(graphics: PIXI.Graphics, config: SymbolConfig, x: number, y: number, radius: number): void {
    const sides = config.sides || 6;
    const outerRadius = radius * 0.8;

    graphics.beginFill(config.color);
    
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const pointX = x + Math.cos(angle) * outerRadius;
      const pointY = y + Math.sin(angle) * outerRadius;
      
      if (i === 0) {
        graphics.moveTo(pointX, pointY);
      } else {
        graphics.lineTo(pointX, pointY);
      }
    }
    
    graphics.closePath();
    graphics.endFill();

    // Inner polygon
    if (config.secondaryColor) {
      const innerRadius = outerRadius * 0.6;
      graphics.beginFill(config.secondaryColor);
      
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const pointX = x + Math.cos(angle) * innerRadius;
        const pointY = y + Math.sin(angle) * innerRadius;
        
        if (i === 0) {
          graphics.moveTo(pointX, pointY);
        } else {
          graphics.lineTo(pointX, pointY);
        }
      }
      
      graphics.closePath();
      graphics.endFill();
    }
  }

  /**
   * Add highlight effect
   */
  private addHighlight(graphics: PIXI.Graphics, config: SymbolConfig, x: number, y: number, radius: number): void {
    // Top highlight
    graphics.beginFill(0xFFFFFF, 0.6);
    graphics.drawCircle(x - radius * 0.2, y - radius * 0.2, radius * 0.3);
    graphics.endFill();

    // Sparkle effect for special symbols
    if (config.id === 'scatter' || config.id === 'multiplier') {
      for (let i = 0; i < 3; i++) {
        const sparkleX = x + (Math.random() - 0.5) * radius;
        const sparkleY = y + (Math.random() - 0.5) * radius;
        graphics.beginFill(0xFFFFFF, 0.8);
        graphics.drawCircle(sparkleX, sparkleY, 2);
        graphics.endFill();
      }
    }
  }

  /**
   * Create symbol sprite
   */
  createSymbolSprite(symbolId: string): PIXI.Sprite | null {
    const texture = this.createSymbolTexture(symbolId);
    if (!texture) return null;

    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    
    return sprite;
  }

  /**
   * Create animated symbol with effects
   */
  createAnimatedSymbol(symbolId: string): PIXI.Container {
    const container = new PIXI.Container();
    const sprite = this.createSymbolSprite(symbolId);
    
    if (!sprite) return container;

    container.addChild(sprite);

    // Add particle system for special symbols
    if (symbolId === 'scatter' || symbolId === 'multiplier') {
      const particles = this.createParticleSystem(symbolId);
      container.addChild(particles);
    }

    return container;
  }

  /**
   * Create particle system for special effects
   */
  private createParticleSystem(symbolId: string): PIXI.Container {
    const container = new PIXI.Container();
    const config = this.symbolConfigs.get(symbolId);
    
    if (!config) return container;

    // Create small particles around the symbol
    for (let i = 0; i < 8; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(config.glowColor || config.color, 0.7);
      particle.drawCircle(0, 0, 2);
      particle.endFill();

      const angle = (i / 8) * Math.PI * 2;
      const radius = 40;
      particle.x = Math.cos(angle) * radius;
      particle.y = Math.sin(angle) * radius;

      container.addChild(particle);
    }

    return container;
  }

  /**
   * Get symbol configuration
   */
  getSymbolConfig(symbolId: string): SymbolConfig | undefined {
    return this.symbolConfigs.get(symbolId);
  }

  /**
   * Clear texture cache
   */
  clearCache(): void {
    this.textureCache.forEach(texture => texture.destroy());
    this.textureCache.clear();
  }

  /**
   * Update symbol configuration
   */
  updateSymbolConfig(symbolId: string, config: Partial<SymbolConfig>): void {
    const existingConfig = this.symbolConfigs.get(symbolId);
    if (existingConfig) {
      this.symbolConfigs.set(symbolId, { ...existingConfig, ...config });
      // Clear cached texture to force regeneration
      const texture = this.textureCache.get(symbolId);
      if (texture) {
        texture.destroy();
        this.textureCache.delete(symbolId);
      }
    }
  }
}