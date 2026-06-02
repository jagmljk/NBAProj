/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ESPN-inspired primary colors
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          red: '#D00',
          crimson: '#B91C1C',
          scarlet: '#DC2626',
          orange: '#F97316',
          amber: '#F59E0B',
          gold: '#FBBF24',
        },
        // Modern accent colors
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          blue: '#0EA5E9',
          cyan: '#06B6D4',
          emerald: '#10B981',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          blue: '#3B82F6',
          indigo: '#6366F1',
          purple: '#8B5CF6',
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Modern dark theme - ESPN inspired
        surface: {
          base: '#0D0D0D',
          raised: '#141414',
          overlay: '#1A1A1A',
          card: '#1F1F1F',
          elevated: '#262626',
          border: '#2E2E2E',
          hover: '#333333',
        },
        // Text colors
        content: {
          primary: '#FFFFFF',
          secondary: '#A3A3A3',
          tertiary: '#737373',
          muted: '#525252',
        },
        // Status colors - vibrant but refined
        success: '#22C55E',
        warning: '#EAB308',
        error: '#EF4444',
        info: '#0EA5E9',
        live: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-xl': ['4rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display-lg': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'title': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'xl': '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'DEFAULT': '0 2px 4px 0 rgba(0, 0, 0, 0.5)',
        'md': '0 4px 8px -1px rgba(0, 0, 0, 0.5)',
        'lg': '0 8px 16px -2px rgba(0, 0, 0, 0.5)',
        'xl': '0 16px 32px -4px rgba(0, 0, 0, 0.6)',
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.4)',
        'glow-blue': '0 0 20px rgba(14, 165, 233, 0.4)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.4)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-live': 'pulseLive 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.5s ease-out',
      },
      keyframes: {
        pulseLive: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(220, 38, 38, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%': { transform: 'scale(0.97)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'radial-gradient(ellipse at top, #1F1F1F 0%, #0D0D0D 100%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, transparent 100%)',
        'red-gradient': 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
        'blue-gradient': 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
        'dark-gradient': 'linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}
