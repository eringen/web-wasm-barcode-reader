# Barcode Scanning on iOS: The Missing Web API and a WebAssembly Solution

If you've ever tried to build a web-based barcode scanner targeting iOS, you've likely hit a wall: Safari doesn't support the [Barcode Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API).

## The Problem

The Barcode Detection API is part of the Shape Detection API spec and provides a clean, native way to detect barcodes from images or camera feeds in the browser. Chrome on Android has supported it for a while, but Safari — and by extension every browser on iOS, since they all use WebKit under the hood — simply doesn't implement it.

This means any web app relying on `BarcodeDetector` will silently fail on iPhones and iPads. For projects that need cross-platform barcode scanning without a native app, this is a dealbreaker.

## The Usual Workarounds

Most JavaScript barcode libraries tackle this with pure JS decoding. They work, but the performance cost is noticeable — especially on older iOS devices where you need smooth, real-time scanning from a camera feed. Dropped frames and slow detection make for a poor user experience.

## A WebAssembly Approach

Instead of decoding barcodes in JavaScript, we can compile a proven C library — [ZBar](https://zbar.sourceforge.net/) — to WebAssembly using Emscripten. ZBar has been around for years and handles a wide range of barcode formats reliably.

The workflow is straightforward:

1. Capture camera frames using `getUserMedia`
2. Crop to a region of interest and convert to grayscale in JavaScript
3. Pass the pixel data to ZBar running in WebAssembly
4. Get back the decoded barcode type, data, and bounding polygon

Because the heavy lifting happens in compiled WASM rather than interpreted JavaScript, the performance is near-native. On iOS devices, this translates to fast, responsive scanning that feels like a native app.

## Results

In practice, the WASM-based scanner detects barcodes within a couple of frames on modern iPhones. The scan loop runs at roughly 150ms intervals, and ZBar's processing time per frame is negligible. Combined with a visual overlay for the scan region and audio feedback on detection, the experience is smooth enough that users won't notice they're using a web app.

## Takeaway

Until Apple adds Barcode Detection API support to Safari, WebAssembly is the best path to performant barcode scanning on iOS. By leveraging battle-tested C libraries through WASM, we get reliability and speed without waiting for browser vendors to catch up.

The full source is available at [web-wasm-barcode-reader](https://github.com/eringen/web-wasm-barcode-reader).
