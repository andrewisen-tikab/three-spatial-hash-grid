import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'ThreeSpatialHashGrid',
            // the proper extensions will be added
            fileName: 'three-spatial-hash-grid',
            formats: ['es'],
        },
        rollupOptions: {
            external: ['three'],
        },
    },
    plugins: [dts({ insertTypesEntry: true })],
});
