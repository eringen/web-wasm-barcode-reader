import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebWasmBarcodeReader',
      fileName: 'web-wasm-barcode-reader',
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
