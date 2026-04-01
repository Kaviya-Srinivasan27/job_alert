/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Reference image CRM vibe-kaga customized colors
        'crm-blue': '#3b82f6',
        'crm-bg': '#f4f7fe',
        'crm-sidebar': '#fcfdff',
        'crm-card-border': '#e2e8f0',
      },
    },
  },
  plugins: [],
}