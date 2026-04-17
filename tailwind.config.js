/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
    	extend: {
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		colors: {
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
    			},
				// Stitch theme tokens
				"error": "#ba1a1a",
				"surface-container": "#edeef0",
				"primary-fixed-dim": "#ffb690",
				"on-tertiary-container": "#003554",
				"on-primary": "#ffffff",
				"error-container": "#ffdad6",
				"on-tertiary-fixed": "#001d32",
				"surface-bright": "#f8f9fb",
				"primary-fixed": "#ffdbca",
				"on-error": "#ffffff",
				"on-secondary": "#ffffff",
				"tertiary-fixed": "#cde5ff",
				"surface-tint": "#9d4300",
				"surface": "#f8f9fb",
				"tertiary-container": "#00a2f4",
				"surface-dim": "#d9dadc",
				"inverse-primary": "#ffb690",
				"tertiary": "#006398",
				"on-surface": "#191c1e",
				"on-surface-variant": "#584237",
				"outline-variant": "#e0c0b1",
				"surface-container-low": "#f3f4f6",
				"surface-variant": "#e1e2e4",
				"inverse-surface": "#2e3132",
				"tertiary-fixed-dim": "#93ccff",
				"on-primary-fixed": "#341100",
				"primary-container": "#f97316",
				"surface-container-lowest": "#ffffff",
				"on-background": "#191c1e",
				"secondary-container": "#fda77a",
				"surface-container-high": "#e7e8ea",
				"on-primary-fixed-variant": "#783200",
				"secondary-fixed-dim": "#ffb690",
				"on-secondary-fixed": "#341100",
				"secondary-fixed": "#ffdbca",
				"inverse-on-surface": "#f0f1f3",
				"surface-container-highest": "#e1e2e4",
				"on-tertiary": "#ffffff",
				"on-error-container": "#93000a",
				"on-primary-container": "#582200",
				"on-tertiary-fixed-variant": "#004b74",
				"outline": "#8c7164",
				"on-secondary-fixed-variant": "#713612"
    		},
			fontFamily: {
				"headline": ["Manrope"],
				"body": ["Inter"],
				"label": ["Inter"]
			}
    	}
    },
    plugins: [require("tailwindcss-animate")],
};
