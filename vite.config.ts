import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }
  return defineConfig({
    plugins: [vue()],
    base: mode === 'development' ? '/' : `/ccm/${process.env.VITE_KEY}/`,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
      watch: {
        ignored: [
          '**/.env',
          '**/.env.*', 
          '**/node_modules/**',
          '/usr/local/gitpod/secrets/**'
        ]
      }
    },
  })
}
