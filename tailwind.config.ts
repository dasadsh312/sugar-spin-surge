import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--game-background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--foreground))'
				},
				// Professional Gold Palette
				gold: {
					primary: 'hsl(var(--gold-primary))',
					secondary: 'hsl(var(--gold-secondary))',
					dark: 'hsl(var(--gold-dark))',
				},
				// Enhanced Candy Colors
				candy: {
					red: 'hsl(var(--candy-red))',
					orange: 'hsl(var(--candy-orange))',
					yellow: 'hsl(var(--candy-yellow))',
					green: 'hsl(var(--candy-green))',
					blue: 'hsl(var(--candy-blue))',
					purple: 'hsl(var(--candy-purple))',
					pink: 'hsl(var(--candy-pink))',
				},
				special: {
					scatter: 'hsl(var(--scatter))',
					multiplier: 'hsl(var(--multiplier))',
					wild: 'hsl(var(--wild))',
				},
				win: {
					small: 'hsl(var(--win-small))',
					medium: 'hsl(var(--win-medium))',
					big: 'hsl(var(--win-big))',
					mega: 'hsl(var(--win-mega))',
				},
				game: {
					background: 'hsl(var(--game-background))',
					overlay: 'hsl(var(--game-overlay))',
				}
			},
			backgroundImage: {
				'gradient-gold': 'var(--gradient-gold)',
				'gradient-dark': 'var(--gradient-dark)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-button': 'var(--gradient-button)',
				'gradient-win': 'var(--gradient-win)',
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'medium': 'var(--shadow-medium)',
				'strong': 'var(--shadow-strong)',
				'glow': 'var(--shadow-glow)',
				'win': 'var(--shadow-win)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				// Game Animations
				'candy-pop': {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'50%': { transform: 'scale(1.2)', opacity: '0.8' },
					'100%': { transform: 'scale(0)', opacity: '0' }
				},
				'symbol-drop': {
					'0%': { transform: 'translateY(-100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'win-pulse': {
					'0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
					'50%': { transform: 'scale(1.05)', filter: 'brightness(1.2)' }
				},
				'multiplier-float': {
					'0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
					'50%': { transform: 'translateY(-10px) rotate(5deg)' }
				},
				'scatter-glow': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(var(--scatter) / 0.5)' },
					'50%': { boxShadow: '0 0 40px hsl(var(--scatter) / 0.8)' }
				},
				'screen-shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'25%': { transform: 'translateX(-5px)' },
					'75%': { transform: 'translateX(5px)' }
				},
				'reel-spin': {
					'0%': { transform: 'rotateY(0deg)' },
					'50%': { transform: 'rotateY(90deg)' },
					'100%': { transform: 'rotateY(0deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'candy-pop': 'candy-pop 0.6s ease-out forwards',
				'symbol-drop': 'symbol-drop 0.4s ease-out',
				'win-pulse': 'win-pulse 1s ease-in-out infinite',
				'multiplier-float': 'multiplier-float 2s ease-in-out infinite',
				'scatter-glow': 'scatter-glow 1.5s ease-in-out infinite',
				'screen-shake': 'screen-shake 0.5s ease-in-out',
				'reel-spin': 'reel-spin 0.8s ease-in-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
