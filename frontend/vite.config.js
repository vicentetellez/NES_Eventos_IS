import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // Carga las variables de entorno según el entorno actual
    const env = loadEnv(mode, process.cwd(), '')
    const apiBaseUrl = env.VITE_BASE_URL || '/api'
    const apiTarget = env.VITE_API_TARGET || 'http://localhost:3000'

    return {
        plugins: [
            react(),
            tailwindcss()
        ],
        server: {
            proxy: {
                [apiBaseUrl]: {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    }
})
