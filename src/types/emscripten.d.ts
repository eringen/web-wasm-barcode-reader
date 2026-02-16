/**
 * Type declarations for the Emscripten-generated WASM module.
 *
 * The WASM build (a.out.js) creates a global `Module` object.
 * We load it as a classic <script> so it lands on `window.Module`.
 * These types describe the subset of the Emscripten API we actually use,
 * plus our custom `processResult` callback injected from library.js.
 */

/**
 * Callback that library.js invokes whenever the WASM scanner finds a symbol.
 * - symbol: barcode type (e.g. "EAN-13", "QR-Code")
 * - data:   decoded string content
 * - polygon: Int32Array of flat [x1,y1,x2,y2,...] coordinates
 */
type ProcessResultCallback = (symbol: string, data: string, polygon: Int32Array) => void;

interface EmscriptenModule {
  onRuntimeInitialized: (() => void) | null;

  /**
   * Direct WASM function exports (EMSCRIPTEN_KEEPALIVE).
   * Available after runtime init. Using these directly avoids
   * cwrap's argument validation overhead on every call.
   */
  _scan_image(ptr: number, width: number, height: number): number;
  _create_buffer(width: number, height: number): number;
  _destroy_buffer(ptr: number): void;
  _destroy_scanner?: () => void;

  /** Direct views into WASM linear memory. */
  HEAP8: Int8Array;
  HEAP32: Int32Array;

  /** Decode a UTF-8 string starting at the given byte offset in WASM memory. */
  UTF8ToString(ptr: number): string;

  /**
   * Client-side hook: library.js calls Module.processResult when a barcode
   * is detected. We set this from scanner.ts to handle results.
   */
  processResult?: ProcessResultCallback;

  /** Whether the runtime has been initialized (direct exports are available). */
  calledRun?: boolean;
}

declare global {
  // eslint-disable-next-line no-var -- must be var for global augmentation
  var Module: EmscriptenModule;
}

export type { EmscriptenModule, ProcessResultCallback };
