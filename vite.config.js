import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base is '/Task_flow/' for GitHub Pages deployment.
// If you deploy to Vercel/Netlify/Firebase Hosting (root domain),
// change this to '/' or remove the base line entirely.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || '/Task_flow/',
})
