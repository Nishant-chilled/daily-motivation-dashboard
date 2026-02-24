import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/daily-motivation-dashboard/", // ✅ IMPORTANT for GitHub Pages
});
