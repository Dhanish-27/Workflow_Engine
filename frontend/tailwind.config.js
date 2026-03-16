/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#ffffff',
                    100: '#f5f5f5',
                    200: '#e5e5e5',
                    300: '#d4d4d4',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                    950: '#0a0a0a',
                },
                dark: {
                    bg: '#000000',
                    card: '#0a0a0a',
                    border: '#262626',
                    text: '#ffffff',
                    muted: '#a3a3a3',
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'fade-in-up': 'fadeInUp 0.4s ease-out',
                'fade-in-down': 'fadeInDown 0.4s ease-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'scale-in-up': 'scaleInUp 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
                'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
                'shimmer': 'shimmer 1.5s infinite',
                'focus-pulse': 'focusPulse 1s infinite',
                'pulse-border': 'pulseBorder 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInLeft: {
                    '0%': { transform: 'translateX(-10px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(10px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                scaleInUp: {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-3px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                focusPulse: {
                    '0%': { boxShadow: '0 0 0 0 rgba(14, 165, 233, 0.4)' },
                    '70%': { boxShadow: '0 0 0 6px rgba(14, 165, 233, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(14, 165, 233, 0)' },
                },
                pulseBorder: {
                    '0%, 100%': { borderColor: 'rgba(14, 165, 233, 0.3)' },
                    '50%': { borderColor: 'rgba(14, 165, 233, 0.6)' },
                },
            },
            transitionDuration: {
                '0': '0ms',
                '100': '100ms',
                '200': '200ms',
                '300': '300ms',
                '400': '400ms',
                '500': '500ms',
            },
            backdropBlur: {
                'xs': '2px',
            },
        },
    },
    plugins: [],
}
