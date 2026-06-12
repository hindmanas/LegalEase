/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101418',
        slateink: '#202832',
        paper: '#fbfaf7',
        mist: '#f2f4f1',
        line: '#dde2dc',
        sage: '#6f8b7a',
        fern: '#1f6f4a',
        brass: '#b98534',
        clay: '#b95e42',
        brandBlue: '#2563eb', // Vibrant blue for CTAs
        glowBlue: 'rgba(37, 99, 235, 0.5)',
        glowFern: 'rgba(31, 111, 74, 0.4)',
      },
      boxShadow: {
        soft: '0 24px 70px rgba(20, 31, 25, 0.10)',
        ring: '0 0 0 1px rgba(16, 20, 24, 0.08), 0 18px 45px rgba(16, 20, 24, 0.08)',
        glow: '0 0 40px -10px var(--tw-shadow-color)',
        float: '0 30px 60px -15px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter Tight', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      animation: {
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 1s ease-out both',
        'soft-pulse': 'softPulse 2.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        softPulse: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.9' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      }
    }
  },
  plugins: []
};
