# Web Barcode Scanner

A browser-based barcode scanner using the [ZBar](https://zbar.sourceforge.net/) library compiled to WebAssembly via Emscripten.

Based on the blog post: [Using the ZBar barcode scanning suite in the browser with WebAssembly](https://barkeywolf.consulting/posts/barcode-scanner-webassembly/).

## How It Works

1. Captures frames from the device camera (rear-facing by default)
2. Crops to a region of interest and converts to grayscale
3. Sends the image data to ZBar running in WebAssembly for barcode detection
4. Draws bounding polygons and decoded text on a canvas overlay
5. Plays an audio beep on successful detection

## Files

| File | Description |
|------|-------------|
| `scan.c` | C source using ZBar API to scan grayscale images for barcodes |
| `library.js` | Emscripten JS library bridging WASM results to JavaScript |
| `a.out.wasm` / `a.out.js` | Pre-compiled WebAssembly binary and JS glue code |
| `index.html` | Main UI with webcam feed and barcode overlay |
| `index.js` | Application logic: camera capture, image processing, scan loop |
| `index2.html` | Standalone OCR/MRZ reader experiment using Tesseract.js |
| `barcodelayout.png` | Visual overlay indicating the scan target area |

## Usage

Serve the project directory with any static HTTP server and open `index.html` in a browser:

```sh
npx serve .
```

A camera permission prompt will appear. Grant access and point the camera at a barcode within the highlighted region.

### Controls

- **light** - Toggle the device flashlight (if supported)
- **sound** - Test the detection beep sound
