/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Chrome DevTools 风格配色（深色主题）
        'devtools': {
          'bg': 'var(--devtools-bg)',
          'bg-secondary': 'var(--devtools-bg-secondary)',
          'bg-hover': 'var(--devtools-bg-hover)',
          'bg-selected': 'var(--devtools-bg-selected)',
          'border': 'var(--devtools-border)',
          'text': 'var(--devtools-text)',
          'text-secondary': 'var(--devtools-text-secondary)',
          'accent': 'var(--devtools-accent)',
          'success': 'var(--devtools-success)',
          'warning': 'var(--devtools-warning)',
          'error': 'var(--devtools-error)',
          'pending': 'var(--devtools-pending)',
          'method': 'var(--devtools-method)',
          'header-name': 'var(--devtools-header-name)',
          'property': 'var(--devtools-property)',
          'string': 'var(--devtools-string)',
          'number': 'var(--devtools-number)',
          'boolean': 'var(--devtools-boolean)',
          'null': 'var(--devtools-null)',
        }
      },
      fontFamily: {
        'mono': ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
