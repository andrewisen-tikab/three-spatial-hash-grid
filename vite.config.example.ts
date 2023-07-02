import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        outDir: './dist/examples',
        rollupOptions: {
            input: {
                example: resolve(__dirname, 'example/index.html'),
            },
        },
    },
});
