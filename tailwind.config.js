module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/globals.css",
  ],
  theme: {
    screens: {
      'xs': '0px',
      'sm': '576px',    // Mobile large
      'md': '768px',    // Tablet
      'lg': '992px',    // Desktop  
      'xl': '1200px',   // Large desktop
      '2xl': '1400px',  // Extra large
    },
    extend: {
      colors: {
        'custom-primary': '#0078D7',
        'custom-accent': '#FF4081',
        'custom-success': '#00C853',
        'custom-error': '#FF3D00',
        'custom-dark-blue': '#1A2151',
        'custom-light-bg': '#F5F8FA',
        'custom-gray-1': '#333333',
        'custom-gray-2': '#757575',
        'custom-gray-3': '#BDBDBD',
      },
      backgroundImage: {
        gradient:
          "linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)",
        'primary-gradient': 'linear-gradient(135deg, #0078D7, #00BCF2)',
        'accent-gradient': 'linear-gradient(135deg, #FF4081, #F06292)',
        'success-gradient': 'linear-gradient(135deg, #00C853, #69F0AE)',
        'error-gradient': 'linear-gradient(135deg, #FF3D00, #FF8A65)',
      },
      backgroundSize: {
        'size-200': '200% 200%',
      },
      backgroundPosition: {
        'pos-[-100%]': '-100% 50%',
      },
      boxShadow: {
        'shadow-1': '0 4px 6px rgba(0,0,0,0.1)',
        'shadow-2': '0 6px 16px rgba(0,0,0,0.1)',
        'shadow-strong': '0 10px 25px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'rounded-sm-ref': '8px',
        'rounded-md-ref': '12px',
        'rounded-lg-ref': '20px',
      },
      animation: {
        opacity: "opacity 0.25s ease-in-out",
        appearFromRight: "appearFromRight 300ms ease-in-out",
        wiggle: "wiggle 1.5s ease-in-out infinite",
        popup: "popup 0.25s ease-in-out",
        shimmer: "shimmer 3s ease-out infinite alternate",
        'fade-in': 'fadeIn 0.8s ease-out',
        'card-appear': 'cardAppear 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
      },
      keyframes: {
        opacity: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        appearFromRight: {
          "0%": { opacity: 0.3, transform: "translate(15%, 0px);" },
          "100%": { opacity: 1, transform: "translate(0);" },
        },
        wiggle: {
          "0%, 20%, 80%, 100%": { transform: "rotate(0deg)" },
          "30%, 60%": { transform: "rotate(-2deg)" },
          "40%, 70%": { transform: "rotate(2deg)" },
          "45%": { transform: "rotate(-4deg)" },
          "55%": { transform: "rotate(4deg)" },
        },
        popup: {
          "0%": { transform: "scale(0.8)", opacity: 0.8 },
          "50%": { transform: "scale(1.1)", opacity: 1 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-100% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        fadeIn: {
          'from': { opacity: 0, transform: 'translateY(-10px)' },
          'to': { opacity: 1, transform: 'translateY(0)' },
        },
        cardAppear: {
          'from': { opacity: 0, transform: 'translateY(20px) rotateX(5deg)' },
          'to': { opacity: 1, transform: 'translateY(0) rotateX(0)' },
        },
        fadeInUp: {
          'from': { opacity: 0, transform: 'translateY(10px)' },
          'to': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"],
  },
};
