/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom colors for HSC with Liquid Glass variants
      colors: {
        // HSC Brand Colors with glass variants
        hsc: {
          background: '#D6D1CA',
          text: '#333333',
          'glass-white': 'rgba(255, 255, 255, 0.1)',
          'glass-white-hover': 'rgba(255, 255, 255, 0.2)',
          'glass-black': 'rgba(0, 0, 0, 0.1)',
          'glass-black-hover': 'rgba(0, 0, 0, 0.2)',
        },
        // Listing type colors with glass variants
        listing: {
          sell: '#22c55e',
          'sell-glass': 'rgba(34, 197, 94, 0.1)',
          'sell-border': 'rgba(34, 197, 94, 0.2)',
          'sell-glow': 'rgba(34, 197, 94, 0.3)',
          trade: '#eab308',
          'trade-glass': 'rgba(234, 179, 8, 0.1)',
          'trade-border': 'rgba(234, 179, 8, 0.2)',
          'trade-glow': 'rgba(234, 179, 8, 0.3)',
          announce: '#3b82f6',
          'announce-glass': 'rgba(59, 130, 246, 0.1)',
          'announce-border': 'rgba(59, 130, 246, 0.2)',
          'announce-glow': 'rgba(59, 130, 246, 0.3)',
          advertise: '#000000',
          'advertise-glass': 'rgba(0, 0, 0, 0.1)',
          'advertise-border': 'rgba(0, 0, 0, 0.2)',
          'advertise-glow': 'rgba(0, 0, 0, 0.3)',
        }
      },
      // Custom border radius for HSC signature style
      borderRadius: {
        'hsc': '25px 25px 25px 5px',
        'hsc-reverse': '5px 25px 25px 25px',
        'hsc-top': '25px 25px 5px 5px',
        'hsc-bottom': '5px 5px 25px 25px',
      },
      // Custom backdrop blur values for glass effects
      backdropBlur: {
        'xs': '2px',
        'glass': '12px',
        'glass-lg': '20px',
        'glass-xl': '24px',
      },
      // Custom box shadows for glass depth
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 12px 40px rgba(0, 0, 0, 0.15)',
        'glass-xl': '0 20px 60px rgba(0, 0, 0, 0.2)',
        'glass-inner': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-glow-sell': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glass-glow-trade': '0 0 20px rgba(234, 179, 8, 0.3)',
        'glass-glow-announce': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glass-glow-advertise': '0 0 20px rgba(0, 0, 0, 0.3)',
      },
      // Custom animations for glass interactions
      animation: {
        'glass-float': 'glassFloat 6s ease-in-out infinite',
        'glass-pulse': 'glassPulse 2s ease-in-out infinite',
        'glass-shimmer': 'glassShimmer 3s ease-in-out infinite',
        'glass-morph': 'glassMorph 0.3s ease-out',
        'chat-jingle': 'chatJingle 0.6s ease-in-out',
        'rainbow-shift': 'rainbowShift 6s ease-in-out infinite',
        'rainbow-shift-hover': 'rainbowShiftHover 3s ease-in-out infinite',
        'attention-pulse': 'attentionPulse 3s ease-in-out infinite',
      },
      keyframes: {
        glassFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glassPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glassShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glassMorph: {
          '0%': { transform: 'scale(1)', backdropFilter: 'blur(12px)' },
          '50%': { transform: 'scale(1.02)', backdropFilter: 'blur(16px)' },
          '100%': { transform: 'scale(1)', backdropFilter: 'blur(12px)' },
        },
        chatJingle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(-10deg)' },
          '20%': { transform: 'rotate(10deg)' },
          '30%': { transform: 'rotate(-8deg)' },
          '40%': { transform: 'rotate(8deg)' },
          '50%': { transform: 'rotate(-5deg)' },
          '60%': { transform: 'rotate(5deg)' },
          '70%': { transform: 'rotate(-2deg)' },
          '80%': { transform: 'rotate(2deg)' },
          '90%': { transform: 'rotate(-1deg)' },
        },
        rainbowShift: {
          '0%': { 
            backgroundColor: 'rgba(0, 255, 0, 0.15)',
            borderColor: 'rgba(0, 255, 0, 0.4)',
            boxShadow: '0 0 25px rgba(0, 255, 0, 0.3)',
            transform: 'scale(1)'
          },
          '25%': { 
            backgroundColor: 'rgba(255, 255, 0, 0.15)',
            borderColor: 'rgba(255, 255, 0, 0.4)',
            boxShadow: '0 0 25px rgba(255, 255, 0, 0.3)',
            transform: 'scale(1.02)'
          },
          '50%': { 
            backgroundColor: 'rgba(0, 255, 0, 0.15)',
            borderColor: 'rgba(0, 255, 0, 0.4)',
            boxShadow: '0 0 25px rgba(0, 255, 0, 0.3)',
            transform: 'scale(1.05)'
          },
          '75%': { 
            backgroundColor: 'rgba(255, 255, 0, 0.15)',
            borderColor: 'rgba(255, 255, 0, 0.4)',
            boxShadow: '0 0 25px rgba(255, 255, 0, 0.3)',
            transform: 'scale(1.02)'
          },
          '100%': { 
            backgroundColor: 'rgba(0, 255, 0, 0.15)',
            borderColor: 'rgba(0, 255, 0, 0.4)',
            boxShadow: '0 0 25px rgba(0, 255, 0, 0.3)',
            transform: 'scale(1)'
          },
        },
        rainbowShiftHover: {
          '0%': { 
            backgroundColor: 'rgba(0, 255, 0, 0.2)',
            borderColor: 'rgba(0, 255, 0, 0.5)',
            boxShadow: '0 0 30px rgba(0, 255, 0, 0.4)',
            transform: 'scale(1.02)'
          },
          '33%': { 
            backgroundColor: 'rgba(255, 255, 0, 0.2)',
            borderColor: 'rgba(255, 255, 0, 0.5)',
            boxShadow: '0 0 30px rgba(255, 255, 0, 0.4)',
            transform: 'scale(1.04)'
          },
          '66%': { 
            backgroundColor: 'rgba(138, 43, 226, 0.2)',
            borderColor: 'rgba(138, 43, 226, 0.5)',
            boxShadow: '0 0 30px rgba(138, 43, 226, 0.4)',
            transform: 'scale(1.06)'
          },
          '100%': { 
            backgroundColor: 'rgba(0, 255, 0, 0.2)',
            borderColor: 'rgba(0, 255, 0, 0.5)',
            boxShadow: '0 0 30px rgba(0, 255, 0, 0.4)',
            transform: 'scale(1.02)'
          },
        },
        attentionPulse: {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(1.05)',
            opacity: '0.9'
          },
        },
        greenYellowShift: {
          '0%': { 
            backgroundPosition: '0% 50%'
          },
          '50%': { 
            backgroundPosition: '100% 50%'
          },
          '100%': { 
            backgroundPosition: '0% 50%'
          },
        },
        greenYellowPurpleShift: {
          '0%': { 
            backgroundPosition: '0% 50%'
          },
          '33%': { 
            backgroundPosition: '50% 50%'
          },
          '66%': { 
            backgroundPosition: '100% 50%'
          },
          '100%': { 
            backgroundPosition: '0% 50%'
          },
        },
      },
      // Custom transitions for smooth glass effects
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      transitionTimingFunction: {
        'glass': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'glass-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [
    // Custom plugin for Liquid Glass utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Base glass effects
        '.glass': {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
        },
        '.glass-dark': {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
        // HSC Listing type glass effects
        '.glass-sell': {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          boxShadow: '0 8px 32px rgba(34, 197, 94, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            boxShadow: '0 12px 40px rgba(34, 197, 94, 0.2)',
          },
        },
        '.glass-trade': {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.2)',
          boxShadow: '0 8px 32px rgba(234, 179, 8, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(234, 179, 8, 0.15)',
            boxShadow: '0 12px 40px rgba(234, 179, 8, 0.2)',
          },
        },
        '.glass-announce': {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            boxShadow: '0 12px 40px rgba(59, 130, 246, 0.2)',
          },
        },
        '.glass-wanted': {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
          },
        },
        // Glass morphing effects
        '.glass-morph': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px) scale(1.01)',
            backdropFilter: 'blur(16px)',
          },
        },
        // Glass shimmer effect
        '.glass-shimmer': {
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            backgroundSize: '200% 100%',
            animation: 'glassShimmer 3s ease-in-out infinite',
            pointerEvents: 'none',
          },
        },
        // Glass button effects
        '.glass-button': {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            transform: 'translateY(-1px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          },
        },
        // Rainbow chat button special effect
        '.rainbow-chat-button': {
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-5px',
            left: '-5px',
            right: '-5px',
            bottom: '-5px',
            background: 'linear-gradient(45deg, #00ff00, #ffff00, #00ff00, #ffff00)',
            backgroundSize: '300% 300%',
            animation: 'greenYellowShift 6s ease-in-out infinite alternate',
            borderRadius: 'inherit',
            zIndex: '-1',
            filter: 'blur(15px)',
            opacity: '0.9',
            transition: 'all 0.3s ease',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '2px',
            left: '2px',
            right: '2px',
            bottom: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
            borderRadius: 'inherit',
            zIndex: '-1',
          },
          '&:hover::before': {
            background: 'linear-gradient(45deg, #00ff00, #ffff00, #8a2be2, #00ff00, #ffff00, #8a2be2)',
            backgroundSize: '400% 400%',
            animation: 'greenYellowPurpleShift 3s ease-in-out infinite alternate',
            filter: 'blur(18px)',
            opacity: '1',
            top: '-6px',
            left: '-6px',
            right: '-6px',
            bottom: '-6px',
          },
        },
        // Glass modal/overlay
        '.glass-modal': {
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} 