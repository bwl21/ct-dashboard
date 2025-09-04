import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default ({ mode }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
    return defineConfig({
        plugins: [vue()],
        base: `/ccm/${process.env.VITE_KEY}/`,
        server: {
            host: '0.0.0.0',
            port: 5173,
            allowedHosts: true
        }
    });
};
