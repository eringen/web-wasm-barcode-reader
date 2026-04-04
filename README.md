# Web WASM Barcode Reader

A browser-based barcode scanner powered by [ZBar](https://zbar.sourceforge.net/) compiled to WebAssembly. Works on any browser, including Safari/iOS where the native [Barcode Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API) isn't available.

Built with TypeScript, Vite, and a wrapper-ready `BarcodeScanner` class designed for easy integration into React, Vue, or any frontend framework.

Based on the blog post: [Using the ZBar barcode scanning suite in the browser with WebAssembly](https://barkeywolf.consulting/posts/barcode-scanner-webassembly/).

My take: [Barcode Scanning on iOS: The Missing Web API and a WebAssembly Solution](https://eringen.com/blog/barcode-scanning-on-ios-the-missing-web-api-and-a-webassembly-solution).

NPM: [https://www.npmjs.com/package/web-wasm-barcode-reader](https://www.npmjs.com/package/web-wasm-barcode-reader)

```bash
npm i web-wasm-barcode-reader
```

## Features

- **Works out of the box** — no manual WASM file copying or script tag setup required
- **Real-time camera scanning** with configurable scan region and interval
- **Rotation-based skew correction** — scans at 0°, +30°, and -30° with early exit, so tilted barcodes are detected without perfect alignment
- **Animated CSS overlay** — dark viewfinder mask, corner brackets, and a sweeping laser line
- **Audible beep** on detection (base64-encoded, no external file)
- **Torch toggle** for devices that support flashlight control
- **Debug preview panel** — shows all three rotation passes stacked vertically with detection highlighting
- **Framework-agnostic** — `BarcodeScanner` class with `start()`/`stop()` lifecycle, constructor has no side effects (React strict-mode safe)

## Supported Barcode Formats

ZBar supports the following symbologies:

| 1D | 2D |
|---|---|
| EAN-13, EAN-8 | QR Code |
| UPC-A, UPC-E | |
| ISBN-10, ISBN-13 | |
| Code 128, Code 39, Code 93 | |
| Interleaved 2 of 5 (I25) | |
| DataBar | |

> **Note:** Data Matrix, PDF417, and Aztec codes are not supported by ZBar.

## Quick Start (Out of the Box)

### Create a New Vite Project from Scratch

```sh
# 1. Create a new Vite project
npm create vite@latest my-scanner -- --template vanilla-ts
cd my-scanner

# 2. Install the barcode reader
npm install web-wasm-barcode-reader

# 3. Add the Vite plugin to vite.config.ts
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { wasmBarcodeReaderPlugin } from 'web-wasm-barcode-reader/vite-plugin';

export default defineConfig({
  plugins: [wasmBarcodeReaderPlugin()],
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Barcode Scanner</title>
  <style>
    body {
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #111;
      color: #eee;
      font-family: system-ui, sans-serif;
    }
    #scanner-mount {
      position: relative;
      width: 500px;
      height: 500px;
      border: 3px solid #333;
      border-radius: 8px;
      overflow: hidden;
    }
    #scan-result {
      margin-top: 16px;
      font-size: 20px;
      min-height: 1.5em;
    }
  </style>
</head>
<body>
  <div id="scanner-mount"></div>
  <div id="scan-result"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

```typescript
// src/main.ts
import { BarcodeScanner } from 'web-wasm-barcode-reader';

const scanner = new BarcodeScanner({
  container: document.getElementById('scanner-mount')!,
  onDetect: (result) => {
    document.getElementById('scan-result')!.textContent = `${result.symbol}: ${result.data}`;
  },
});

scanner.start();
```

```sh
# 4. Run it
npm install
npm run dev
```

Open the URL shown by Vite, grant camera access, and scan.

### React

```tsx
import { useEffect, useRef } from 'react';
import { BarcodeScanner } from 'web-wasm-barcode-reader';

function Scanner({ onScan }: { onScan: (data: string) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<BarcodeScanner | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scanner = new BarcodeScanner({
      container: mountRef.current,
      onDetect: (result) => onScan(result.data),
    });

    scannerRef.current = scanner;
    scanner.start();

    return () => {
      scanner.stop();
      scannerRef.current = null;
    };
  }, [onScan]);

  return <div ref={mountRef} style={{ width: 400, height: 400 }} />;
}

export default function App() {
  const handleScan = (data: string) => {
    console.log('Scanned:', data);
  };

  return (
    <div>
      <h1>Barcode Scanner</h1>
      <Scanner onScan={handleScan} />
    </div>
  );
}
```

### Vue 3

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { BarcodeScanner } from 'web-wasm-barcode-reader';
import type { ScanResult } from 'web-wasm-barcode-reader';

const mountRef = ref<HTMLElement | null>(null);
const result = ref('');
let scanner: BarcodeScanner | null = null;

onMounted(async () => {
  if (!mountRef.current) return;

  scanner = new BarcodeScanner({
    container: mountRef.current,
    onDetect: (r: ScanResult) => {
      result.value = `${r.symbol}: ${r.data}`;
    },
  });

  await scanner.start();
});

onUnmounted(() => {
  scanner?.stop();
});
</script>

<template>
  <div>
    <div ref="mountRef" style="width: 400px; height: 400px" />
    <p>{{ result }}</p>
  </div>
</template>
```

### Svelte

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { BarcodeScanner } from 'web-wasm-barcode-reader';
  import type { ScanResult } from 'web-wasm-barcode-reader';

  let mountEl: HTMLDivElement;
  let result = '';
  let scanner: BarcodeScanner | null = null;

  onMount(async () => {
    scanner = new BarcodeScanner({
      container: mountEl,
      onDetect: (r: ScanResult) => {
        result = `${r.symbol}: ${r.data}`;
      },
    });
    await scanner.start();
  });

  onDestroy(() => {
    scanner?.stop();
  });
</script>

<div bind:this={mountEl} style="width: 400px; height: 400px" />
<p>{result}</p>
```

## Custom WASM Asset Path

When using the Vite plugin, WASM assets are served automatically. If you use a different bundler (Webpack, Rollup, etc.) or host assets on a CDN, set the `wasmPath` option:

```typescript
const scanner = new BarcodeScanner({
  container: document.getElementById('scanner-mount')!,
  wasmPath: 'https://cdn.example.com/wasm-barcode-reader/',
  onDetect: (result) => {
    console.log(result.symbol, result.data);
  },
});
```

The `wasmPath` should point to a directory containing both `a.out.js` and `a.out.wasm`.

## API

### `BarcodeScanner`

```typescript
import { BarcodeScanner } from 'web-wasm-barcode-reader';

const scanner = new BarcodeScanner({
  container: document.getElementById('scanner-mount')!,
  onDetect: (result) => {
    console.log(result.symbol, result.data);
  },
});

await scanner.start();
// later...
scanner.stop();
```

### `ScannerOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `container` | `HTMLElement` | *required* | Element to mount the scanner into |
| `onDetect` | `(result: ScanResult) => void` | *required* | Called on each barcode detection |
| `onError` | `(error: Error) => void` | `console.error` | Called on unrecoverable errors |
| `scanInterval` | `number` | `150` | Milliseconds between scan attempts |
| `beepOnDetect` | `boolean` | `true` | Play an audible beep on detection |
| `facingMode` | `'environment' \| 'user'` | `'environment'` | Camera facing mode |
| `scanRegion` | `{ width: number; height: number }` | `{ width: 0.702, height: 0.242 }` | Scan region as fraction of container |
| `previewCanvas` | `HTMLCanvasElement` | `undefined` | Optional canvas for rotation debug preview |
| `wasmPath` | `string` | *auto-detected* | Base URL for WASM assets (a.out.js + a.out.wasm) |

### `ScanResult`

| Field | Type | Description |
|---|---|---|
| `symbol` | `string` | Barcode symbology (e.g. `"EAN-13"`, `"QR-Code"`) |
| `data` | `string` | Decoded barcode content |
| `polygon` | `number[]` | Flat `[x1, y1, x2, y2, ...]` bounding polygon in container coordinates |

### Methods

| Method | Description |
|---|---|
| `start(): Promise<void>` | Initialize camera, WASM, and start scanning |
| `stop(): void` | Stop scanning, release camera, remove DOM elements |
| `toggleTorch(): Promise<boolean>` | Toggle flashlight, returns new state |
| `isRunning: boolean` | Whether the scanner is currently active |

## Framework Integration

The `BarcodeScanner` constructor has **no side effects** — it only stores configuration. This makes it safe to use with React strict mode, Vue lifecycle hooks, etc.

## Project Structure

```
web-wasm-barcode-reader/
├── public/
│   ├── a.out.js              # Emscripten JS glue (pre-compiled)
│   └── a.out.wasm            # ZBar WASM binary (pre-compiled)
├── src/
│   ├── scanner.ts            # BarcodeScanner class — core lifecycle + scan loop
│   ├── overlay.ts            # Animated CSS scan overlay (mask, brackets, laser)
│   ├── main.ts               # Demo entry point
│   └── types/
│       └── emscripten.d.ts   # TypeScript declarations for the Emscripten Module
├── index.html                # Demo page
├── scan.c                    # C source — ZBar image scanning + WASM buffer management
├── library.js                # Emscripten JS library — bridges WASM results to JS
├── package.json
├── tsconfig.json             # strict: true, noImplicitAny: true
└── vite.config.ts
```

## Architecture

### How a Scan Works

```
Camera frame
    │
    ├─ drawImage() ──► Offscreen canvas (crop scan region from video)
    │                      │
    │                      ├─ Rotate 0°  ──► grayscale ──► WASM scan_image()
    │                      ├─ Rotate +30° ──► grayscale ──► WASM scan_image()  (only if 0° missed)
    │                      └─ Rotate -30° ──► grayscale ──► WASM scan_image()  (only if ±30° missed)
    │
    └─ On detection: polygon overlay + beep + onDetect callback
```

### WASM Bridge

The scanner communicates with ZBar through C functions exposed via Emscripten:

| C function | Purpose |
|---|---|
| `create_buffer(w, h)` | Return a reusable buffer on the WASM heap for RGBA image data (grows if needed, never shrinks) |
| `scan_image_rgba(ptr, w, h)` | Convert RGBA→Y800 in-place and run ZBar. Calls `js_output_result` on hit. |
| `destroy_buffer(ptr)` | Free the reusable scan buffer. Call once when done scanning. |
| `destroy_scanner()` | Tear down the ZBar image scanner instance. |

`library.js` defines `js_output_result`, which reads symbol name, data, and polygon coordinates from the WASM heap and forwards them to `Module.processResult` — a callback set by the `BarcodeScanner` class.

> **Note:** The scan buffer is pre-allocated once and reused across all scan calls. ZBar uses a no-op cleanup handler so it doesn't free the buffer — lifetime is managed by `create_buffer`/`destroy_buffer`.

## Recompiling the WASM Module

The `public/a.out.js` and `public/a.out.wasm` files are pre-compiled. To rebuild them, you need [Emscripten](https://emscripten.org/) and ZBar installed:

```sh
emcc scan.c \
  -O3 -flto \
  -s WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_scan_image", "_scan_image_rgba", "_create_buffer", "_destroy_buffer", "_destroy_scanner"]' \
  -s EXPORTED_RUNTIME_METHODS='["UTF8ToString", "HEAP8", "HEAPU8", "HEAP32"]' \
  --js-library library.js \
  -I/path/to/zbar/include \
  /path/to/libzbar.a \
  -o public/a.out.js
```

The exact flags may vary depending on your Emscripten version and ZBar installation path. ZBar must be cross-compiled for WASM with `emcc` before linking.

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start Vite dev server with HMR |
| `build` | `npm run build` | Type-check + production build to `dist/` |
| `build:lib` | `npm run build:lib` | Build library bundle + generate type declarations |
| `build:plugin` | `npm run build:plugin` | Build Vite plugin |
| `build:all` | `npm run build:all` | Build library + plugin (runs before publish) |
| `preview` | `npm run preview` | Serve the production build locally |

## Browser Requirements

- **getUserMedia** (camera access) — all modern browsers
- **WebAssembly** — all modern browsers
- **OffscreenCanvas** — Chrome 69+, Firefox 105+, Safari 16.4+
- HTTPS or localhost (required for camera access)

## License

See the [ZBar license](http://zbar.sourceforge.net/about.html) for the scanning library. The JavaScript/TypeScript wrapper code in this repository is unlicensed.
