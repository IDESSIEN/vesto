import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({ include: ['events', 'buffer', 'util'] }),
  ],
  server: {
    host: true,
    port: 5173,
    open: false,
    allowedHosts: ['itczm57kpg2kd8onm1au9.preview.studio.arc.io'],
  },
});
