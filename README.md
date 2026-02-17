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

- **Real-time camera scanning** with configurable scan region and interval
- **Rotation-based skew correction** — scans at 0°, +30°, and -30° with early exit, so tilted barcodes are detected without perfect alignment
- **Animated CSS overlay** — dark viewfinder mask, corner brackets, and a sweeping laser line (replaces the old static PNG)
- **Audible beep** on detection (base64-encoded, no external file)
- **Torch toggle** for devices that support flashlight control
- **Debug preview panel** — shows all three rotation passes side-by-side with detection highlighting
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

## Quick Start

```sh
npm install
npm run dev
```

Open the URL shown by Vite (typically `http://localhost:5173`). Grant camera access and point at a barcode within the scan region.

### Production Build

```sh
npm run build
npm run preview
```

The build output goes to `dist/`. Type-checking runs automatically before the Vite build.

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

## Usage as npm Package

The library requires the Emscripten WASM glue script (`a.out.js`) to be loaded before the scanner is started. The WASM binary (`a.out.wasm`) is fetched automatically by the glue script at runtime.

### 1. Copy the WASM files into your public/static directory

After installing, copy the WASM assets to a location your web server can serve:

```sh
cp node_modules/web-wasm-barcode-reader/public/a.out.js  public/
cp node_modules/web-wasm-barcode-reader/public/a.out.wasm public/
```

Or with a bundler, add a copy step to your build pipeline.

### 2. Load the glue script before using the scanner

Add a `<script>` tag in your HTML **before** your app bundle:

```html
<script>var Module = {};</script>
<script src="/a.out.js"></script>
<script type="module" src="/your-app.js"></script>
```

> **Important:** You must define `var Module = {}` before loading `a.out.js`. The closure-compiled glue script binds to this pre-existing object so the scanner can access the WASM exports via the global `Module`.

### 3. Import and use

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

If `a.out.js` is not loaded, `start()` will reject with a clear error message.

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

### React Example

```tsx
import { useEffect, useRef } from 'react';
import { BarcodeScanner } from 'web-wasm-barcode-reader';

function Scanner({ onScan }: { onScan: (data: string) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scanner = new BarcodeScanner({
      container: mountRef.current!,
      onDetect: (result) => onScan(result.data),
    });
    scanner.start();
    return () => scanner.stop();
  }, [onScan]);

  return <div ref={mountRef} style={{ width: 400, height: 400 }} />;
}
```

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
| `preview` | `npm run preview` | Serve the production build locally |

## Browser Requirements

- **getUserMedia** (camera access) — all modern browsers
- **WebAssembly** — all modern browsers
- **OffscreenCanvas** — Chrome 69+, Firefox 105+, Safari 16.4+
- HTTPS or localhost (required for camera access)

## License

See the [ZBar license](http://zbar.sourceforge.net/about.html) for the scanning library. The JavaScript/TypeScript wrapper code in this repository is unlicensed.
