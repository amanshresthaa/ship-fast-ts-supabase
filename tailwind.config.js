module.exports = {
    darkMode: ["class"],
    content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/globals.css",
  ],
  theme: {
  	screens: {
  		xs: '0px',
  		sm: '576px',
  		md: '768px',
  		lg: '992px',
  		xl: '1200px',
  		'2xl': '1400px'
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
  			'custom-gray-f2': '#f2f2f2',
  			'custom-gray-e4': '#e4e4e4',
  			'custom-gray-f0': '#f0f0f0',
  			'custom-gray-cc': '#cccccc',
  			'custom-gray-ca': '#cacaca',
  			'custom-gray-b3': '#b3b3b3',
  			'custom-purple-3f': '#3f3d56',
  			'custom-dark-2f': '#2f2e41',
  			'custom-pink-fb': '#ffb8b8',
  			'custom-yellow-ffc107': '#ffc107',
  			'custom-green-4caf50': '#4caf50',
  			'custom-blue-1976d2': '#1976d2',
  			'custom-orange-da552f': '#da552f',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
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
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		backgroundImage: {
  			gradient: 'linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)',
  			'primary-gradient': 'linear-gradient(135deg, #0078D7, #00BCF2)',
  			'accent-gradient': 'linear-gradient(135deg, #FF4081, #F06292)',
  			'success-gradient': 'linear-gradient(135deg, #00C853, #69F0AE)',
  			'error-gradient': 'linear-gradient(135deg, #FF3D00, #FF8A65)'
  		},
  		backgroundSize: {
  			'size-200': '200% 200%'
  		},
  		backgroundPosition: {
  			'pos-[-100%]: '-100% 50%'
  		},
  		boxShadow: {
  			'shadow-1': '0 4px 6px rgba(0,0,0,0.1)',
  			'shadow-2': '0 6px 16px rgba(0,0,0,0.1)',
  			'shadow-strong': '0 10px 25px rgba(0,0,0,0.15)'
  		},
  		borderRadius: {
  			'rounded-sm-ref': '8px',
  			'rounded-md-ref': '12px',
  			'rounded-lg-ref': '20px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		animation: {
  			opacity: 'opacity 0.25s ease-in-out',
  			appearFromRight: 'appearFromRight 300ms ease-in-out',
  			wiggle: 'wiggle 1.5s ease-in-out infinite',
  			popup: 'popup 0.25s ease-in-out',
  			shimmer: 'shimmer 3s ease-out infinite alternate',
  			'fade-in': 'fadeIn 0.8s ease-out',
  			'card-appear': 'cardAppear 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
  			'fade-in-up': 'fadeInUp 0.3s ease-out'
  		},
  		keyframes: {
  			opacity: {
  				'0%': {
  					opacity: 0
  				},
  				'100%': {
  					opacity: 1
  				}
  			},
  			appearFromRight: {
  				'0%': {
  					opacity: 0.3,
  					transform: 'translate(15%, 0px);'
  				},
  				'100%': {
  					opacity: 1,
  					transform: 'translate(0);'
  				}
  			},
  			wiggle: {
  				'0%, 20%, 80%, 100%': {
  					transform: 'rotate(0deg)'
  				},
  				'30%, 60%': {
  					transform: 'rotate(-2deg)'
  				},
  				'40%, 70%': {
  					transform: 'rotate(2deg)'
  				},
  				'45%': {
  					transform: 'rotate(-4deg)'
  				},
  				'55%': {
  					transform: 'rotate(4deg)'
  				}
  			},
  			popup: {
  				'0%': {
  					transform: 'scale(0.8)',
  					opacity: 0.8
  				},
  				'50%': {
  					transform: 'scale(1.1)',
  					opacity: 1
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: 1
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-100% 50%'
  				},
  				'100%': {
  					backgroundPosition: '100% 50%'
  				}
  			},
  			fadeIn: {
  				from: {
  					opacity: 0,
  					transform: 'translateY(-10px)'
  				},
  				to: {
  					opacity: 1,
  					transform: 'translateY(0)'
  				}
  			},
  			cardAppear: {
  				from: {
  					opacity: 0,
  					transform: 'translateY(20px) rotateX(5deg)'
  				},
  				to: {
  					opacity: 1,
  					transform: 'translateY(0) rotateX(0)'
  				}
  			},
  			fadeInUp: {
  				from: {
  					opacity: 0,
  					transform: 'translateY(10px)'
  				},
  				to: {
  					opacity: 1,
  					transform: 'translateY(0)'
  				}
  			}
  		}
  	}
  },
  plugins: [require("daisyui"), require("tailwindcss-animate")],
  daisyui: {
    themes: ["light", "dark"],
  },
};
