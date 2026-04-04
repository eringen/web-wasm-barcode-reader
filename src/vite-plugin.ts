import type { Plugin, Connect } from 'vite';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Vite plugin that serves the WASM assets from web-wasm-barcode-reader.
 * Add this to your vite.config.ts to make the scanner work out of the box.
 *
 * ```ts
 * import { wasmBarcodeReaderPlugin } from 'web-wasm-barcode-reader/vite-plugin';
 *
 * export default defineConfig({
 *   plugins: [wasmBarcodeReaderPlugin()],
 * });
 * ```
 */
export function wasmBarcodeReaderPlugin(): Plugin {
  const wasmDir = resolve(__dirname, '..', 'public');

  return {
    name: 'wasm-barcode-reader',
    configureServer(server) {
      server.middlewares.use('/@wasm-barcode-reader/', (req: Connect.IncomingMessage, res, next) => {
        const filename = req.url?.replace(/^\//, '') ?? '';
        if (filename !== 'a.out.js' && filename !== 'a.out.wasm') {
          return next();
        }

        const filePath = join(wasmDir, filename);
        if (!existsSync(filePath)) {
          res.statusCode = 404;
          res.end(`WASM file not found: ${filename}`);
          return;
        }

        const ext = filename.split('.').pop();
        const mimeTypes: Record<string, string> = {
          js: 'application/javascript',
          wasm: 'application/wasm',
        };
        res.setHeader('Content-Type', mimeTypes[ext ?? ''] ?? 'application/octet-stream');
        res.end(readFileSync(filePath));
      });
    },
    config() {
      return {
        optimizeDeps: {
          exclude: ['web-wasm-barcode-reader'],
        },
      };
    },
  };
}
