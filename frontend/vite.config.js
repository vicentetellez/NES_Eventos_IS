import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // Carga las variables de entorno según el entorno actual
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [
            react(),
            tailwindcss()
        ],
        server: {
            proxy: {
                [env.VITE_BASE_URL]: {
                    target: env.VITE_API_TARGET,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    }
})
