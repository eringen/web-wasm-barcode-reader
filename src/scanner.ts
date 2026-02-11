/**
 * BarcodeScanner — wrapper-ready barcode scanning class.
 *
 * Manages the full lifecycle: DOM setup, camera stream, WASM loading,
 * scan loop with rotation-based skew correction, and cleanup.
 * Designed for easy integration into React/Vue/vanilla wrappers.
 *
 * Constructor is side-effect-free (React strict-mode safe).
 * Call start() to activate, stop() to tear down.
 */

import { createOverlay, removeOverlay } from './overlay';
import type { EmscriptenModule, ProcessResultCallback } from './types/emscripten';

// ── Public types ────────────────────────────────────────────────────

export interface ScannerOptions {
  /** Container element the scanner will mount into. */
  container: HTMLElement;
  /** Called on every successful barcode detection. */
  onDetect: (result: ScanResult) => void;
  /** Called on unrecoverable errors (camera denied, WASM load failure, etc.). */
  onError?: (error: Error) => void;
  /** Milliseconds between scan attempts. Default: 150. */
  scanInterval?: number;
  /** Play an audible beep on detection. Default: true. */
  beepOnDetect?: boolean;
  /** Camera facing mode. Default: 'environment'. */
  facingMode?: 'environment' | 'user';
  /**
   * Scan region as a fraction of the container dimensions.
   * Default: { width: 0.702, height: 0.242 } — matches the original barcode layout.
   */
  scanRegion?: { width: number; height: number };
  /**
   * Optional canvas to render a live preview of what each rotation pass
   * sees. Shows all three angles (0°, +30°, -30°) stacked vertically.
   * The detected angle gets a green highlight.
   */
  previewCanvas?: HTMLCanvasElement;
}

export interface ScanResult {
  /** Barcode symbology (e.g. "EAN-13", "QR-Code"). */
  symbol: string;
  /** Decoded barcode data string. */
  data: string;
  /** Flat polygon coordinates [x1,y1,x2,y2,...] in container-relative pixels. */
  polygon: number[];
}

// ── Internal helpers ────────────────────────────────────────────────

/** WASM API surface after cwrap. */
interface WasmApi {
  scan_image: (ptr: number, width: number, height: number) => void;
  create_buffer: (width: number, height: number) => number;
  destroy_buffer: (ptr: number) => void;
  destroy_scanner: () => void;
}

/** Base64-encoded short beep sound — avoids an external audio file. */
const BEEP_DATA_URI =
  'data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=';

/**
 * Rotation angles for skew correction.
 * We try 0° first; if no barcode is found, we retry at ±30°.
 * This handles tilted barcodes without requiring the user to perfectly align.
 */
const ROTATION_ANGLES = [0, Math.PI / 6, -Math.PI / 6];

// ── BarcodeScanner ──────────────────────────────────────────────────

export class BarcodeScanner {
  // Configuration (immutable after construction)
  private readonly container: HTMLElement;
  private readonly onDetect: (result: ScanResult) => void;
  private readonly onError: (error: Error) => void;
  private readonly scanInterval: number;
  private readonly beepOnDetect: boolean;
  private readonly facingMode: 'environment' | 'user';
  private readonly regionWidth: number;
  private readonly regionHeight: number;

  // Runtime state
  private _isRunning = false;
  private video: HTMLVideoElement | null = null;
  private polyCanvas: HTMLCanvasElement | null = null;
  private polyCtx: CanvasRenderingContext2D | null = null;
  private offscreen: OffscreenCanvas | HTMLCanvasElement | null = null;
  private offCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
  private overlayRoot: HTMLElement | null = null;
  private stream: MediaStream | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private wasmApi: WasmApi | null = null;
  private beepAudio: HTMLAudioElement | null = null;
  private previewCanvas: HTMLCanvasElement | null = null;
  private previewCtx: CanvasRenderingContext2D | null = null;

  // Cached layout values (set during setupDOM)
  private cameraWidth = 0;
  private cameraHeight = 0;
  private barcodeWidth = 0;
  private barcodeHeight = 0;
  private barcodeOffsetX = 0;
  private barcodeOffsetY = 0;

  /** Tracks whether we detected a barcode in the current scan tick. */
  private detectedThisTick = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  constructor(options: ScannerOptions) {
    this.container = options.container;
    this.onDetect = options.onDetect;
    this.onError = options.onError ?? ((e: Error) => console.error('[BarcodeScanner]', e));
    this.scanInterval = options.scanInterval ?? 150;
    this.beepOnDetect = options.beepOnDetect ?? true;
    this.facingMode = options.facingMode ?? 'environment';
    this.regionWidth = options.scanRegion?.width ?? 0.702;
    this.regionHeight = options.scanRegion?.height ?? 0.242;
    this.previewCanvas = options.previewCanvas ?? null;
  }

  // ── Public lifecycle ────────────────────────────────────────────

  async start(): Promise<void> {
    if (this._isRunning) return;

    try {
      this.setupDOM();
      await this.loadWasm();
      await this.startCamera();
      this.setupResultHandler();
      this.startScanLoop();
      this._isRunning = true;
    } catch (err) {
      this.stop();
      const error = err instanceof Error ? err : new Error(String(err));
      this.onError(error);
    }
  }

  stop(): void {
    this.stopScanLoop();
    this.stopCamera();
    this.teardownDOM();
    this.wasmApi?.destroy_scanner();
    this._isRunning = false;
  }

  /**
   * Toggle the device torch (flashlight). Returns the new torch state.
   * Only works on devices that support the torch constraint (most Android phones).
   */
  async toggleTorch(): Promise<boolean> {
    const track = this.stream?.getVideoTracks()[0];
    if (!track) return false;

    const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
    if (!capabilities.torch) return false;

    const settings = track.getSettings() as MediaTrackSettings & { torch?: boolean };
    const newState = !settings.torch;

    await track.applyConstraints({
      advanced: [{ torch: newState } as MediaTrackConstraintSet],
    });

    return newState;
  }

  // ── DOM setup / teardown ────────────────────────────────────────

  private setupDOM(): void {
    // Ensure the container is positioned so absolute children work correctly.
    const pos = getComputedStyle(this.container).position;
    if (pos === 'static') {
      this.container.style.position = 'relative';
    }

    this.cameraWidth = this.container.clientWidth;
    this.cameraHeight = this.container.clientHeight;
    this.barcodeWidth = Math.floor(this.cameraWidth * this.regionWidth);
    this.barcodeHeight = Math.floor(this.cameraHeight * this.regionHeight);
    this.barcodeOffsetX = Math.floor((this.cameraWidth - this.barcodeWidth) / 2);
    this.barcodeOffsetY = Math.floor((this.cameraHeight - this.barcodeHeight) / 2);

    // Video element — fills the container
    this.video = document.createElement('video');
    Object.assign(this.video.style, {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    });
    this.video.setAttribute('autoplay', '');
    this.video.setAttribute('muted', '');
    this.video.setAttribute('playsinline', '');
    // Property must also be set — attribute alone doesn't satisfy autoplay policy.
    this.video.muted = true;
    this.container.appendChild(this.video);

    // Canvas for drawing polygon overlays on detected barcodes
    this.polyCanvas = document.createElement('canvas');
    this.polyCanvas.width = this.cameraWidth;
    this.polyCanvas.height = this.cameraHeight;
    Object.assign(this.polyCanvas.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      pointerEvents: 'none',
    });
    this.container.appendChild(this.polyCanvas);
    this.polyCtx = this.polyCanvas.getContext('2d');

    // Offscreen canvas for pixel extraction — 2× for sharper image.
    // Fall back to a hidden HTMLCanvasElement when OffscreenCanvas is unavailable
    // (e.g. Safari < 16.4).
    const ow = this.barcodeWidth * 2;
    const oh = this.barcodeHeight * 2;
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreen = new OffscreenCanvas(ow, oh);
    } else {
      const c = document.createElement('canvas');
      c.width = ow;
      c.height = oh;
      this.offscreen = c;
    }
    this.offCtx = this.offscreen.getContext('2d', { willReadFrequently: true });

    // CSS overlay (mask + brackets + laser)
    this.overlayRoot = createOverlay(this.container, {
      widthRatio: this.regionWidth,
      heightRatio: this.regionHeight,
    });

    // Beep audio
    if (this.beepOnDetect) {
      this.beepAudio = new Audio(BEEP_DATA_URI);
    }

    // Preview canvas — size it to fit three stacked rotation frames.
    if (this.previewCanvas) {
      this.previewCanvas.width = this.barcodeWidth * 2;
      this.previewCanvas.height = this.barcodeHeight * 2 * ROTATION_ANGLES.length;
      this.previewCtx = this.previewCanvas.getContext('2d');
    }
  }

  private teardownDOM(): void {
    if (this.overlayRoot) {
      removeOverlay(this.overlayRoot);
      this.overlayRoot = null;
    }
    this.video?.remove();
    this.video = null;
    this.polyCanvas?.remove();
    this.polyCanvas = null;
    this.polyCtx = null;
    this.offscreen = null;
    this.offCtx = null;
    this.beepAudio = null;
    this.previewCtx = null;
  }

  // ── WASM loading ────────────────────────────────────────────────

  /**
   * Wait for the Emscripten Module to finish initializing.
   * The script is loaded via a classic <script> tag in index.html,
   * so by the time start() runs it may already be ready.
   */
  private loadWasm(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (typeof Module === 'undefined') {
        reject(new Error(
          'WASM Module not loaded. Load the Emscripten glue script (a.out.js) before calling start().',
        ));
        return;
      }

      const timeout = setTimeout(() => reject(new Error('WASM load timeout')), 15_000);

      const init = (): void => {
        clearTimeout(timeout);
        try {
          const cwrap = Module.cwrap;
          if (!cwrap) throw new Error('Module.cwrap not available after runtime init');

          // cwrap returns a callable; we cast to the known signatures.
          this.wasmApi = {
            scan_image: cwrap('scan_image', '', ['number', 'number', 'number']) as WasmApi['scan_image'],
            create_buffer: cwrap('create_buffer', 'number', ['number', 'number']) as WasmApi['create_buffer'],
            destroy_buffer: cwrap('destroy_buffer', '', ['number']) as WasmApi['destroy_buffer'],
            destroy_scanner: cwrap('destroy_scanner', '', []) as WasmApi['destroy_scanner'],
          };
          resolve();
        } catch (e) {
          reject(e);
        }
      };

      // If runtime already initialized (e.g. Module loaded before our code ran)
      if (Module.cwrap) {
        init();
      } else {
        const prev = Module.onRuntimeInitialized;
        Module.onRuntimeInitialized = () => {
          prev?.();
          init();
        };
      }
    });
  }

  // ── Camera ──────────────────────────────────────────────────────

  private async startCamera(): Promise<void> {
    if (!this.video) throw new Error('DOM not set up');

    // Request 2× container size for a crisper barcode capture region.
    const desiredSize = this.cameraWidth * 2;

    const constraints: MediaStreamConstraints = {
      video: {
        width: desiredSize,
        height: desiredSize,
        facingMode: this.facingMode,
        resizeMode: 'crop-and-scale' as string,
        aspectRatio: { exact: 1 },
      } as MediaTrackConstraints,
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = this.stream;
    await this.video.play();
  }

  private stopCamera(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  // ── Result handler ──────────────────────────────────────────────

  /**
   * Wire up Module.processResult so the WASM-side library.js callback
   * routes detected barcodes back into our class.
   */
  private setupResultHandler(): void {
    const handler: ProcessResultCallback = (symbol, data, polygon) => {
      if (!data) return;

      this.detectedThisTick = true;

      // Convert polygon from offscreen-canvas coords to container coords.
      // offscreen size may differ from barcodeWidth/Height (currently 2×),
      // so derive the scale dynamically rather than hardcoding / 2.
      const scaleToContainerX = this.barcodeWidth / (this.offscreen?.width ?? this.barcodeWidth);
      const scaleToContainerY = this.barcodeHeight / (this.offscreen?.height ?? this.barcodeHeight);
      const adjusted: number[] = [];
      for (let i = 0; i < polygon.length; i += 2) {
        adjusted.push(polygon[i] * scaleToContainerX + this.barcodeOffsetX);
        adjusted.push(polygon[i + 1] * scaleToContainerY + this.barcodeOffsetY);
      }

      // Draw detection polygon on the overlay canvas
      this.drawPoly(adjusted);

      // Audible feedback
      if (this.beepOnDetect && this.beepAudio) {
        this.beepAudio.play().catch(() => {
          /* autoplay policy may block — non-critical */
        });
      }

      const result: ScanResult = { symbol, data, polygon: adjusted };
      this.onDetect(result);
    };

    (Module as EmscriptenModule).processResult = handler;
  }

  // ── Scan loop ───────────────────────────────────────────────────

  private startScanLoop(): void {
    this.timerId = setInterval(() => this.scanTick(), this.scanInterval);
  }

  private stopScanLoop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * One scan tick: capture the barcode region, convert to grayscale,
   * and run through WASM. Uses rotation-based skew correction —
   * tries 0° first, then ±30° only if no barcode was found.
   */
  private scanTick(): void {
    if (!this.video || !this.offCtx || !this.offscreen || !this.wasmApi || !this.polyCtx) return;

    // videoWidth/videoHeight are the camera's actual intrinsic resolution.
    // They're 0 until the first frame is decoded — skip until ready.
    const videoW = this.video.videoWidth;
    const videoH = this.video.videoHeight;
    if (videoW === 0 || videoH === 0) return;

    // Map from container coordinates to the video's native pixel grid.
    // The old code assumed the video was exactly 2× the container, but the
    // camera may deliver any resolution. This scales correctly regardless.
    const scaleX = videoW / this.cameraWidth;
    const scaleY = videoH / this.cameraHeight;

    const srcX = this.barcodeOffsetX * scaleX;
    const srcY = this.barcodeOffsetY * scaleY;
    const srcW = this.barcodeWidth * scaleX;
    const srcH = this.barcodeHeight * scaleY;

    // Clear the polygon overlay from the previous tick
    this.polyCtx.clearRect(0, 0, this.cameraWidth, this.cameraHeight);

    const w = this.offscreen.width;
    const h = this.offscreen.height;

    // Clear preview canvas once per tick so all three rows are fresh.
    if (this.previewCtx) {
      this.previewCtx.clearRect(0, 0, this.previewCanvas!.width, this.previewCanvas!.height);
    }

    for (let ai = 0; ai < ROTATION_ANGLES.length; ai++) {
      const angle = ROTATION_ANGLES[ai];
      this.detectedThisTick = false;

      this.offCtx.save();

      if (angle !== 0) {
        // Rotate around the center of the offscreen canvas so the
        // barcode region stays centered after rotation.
        this.offCtx.translate(w / 2, h / 2);
        this.offCtx.rotate(angle);
        this.offCtx.translate(-w / 2, -h / 2);
      }

      // Crop the scan region from the video's intrinsic resolution
      // and draw it into the offscreen canvas at our target size.
      this.offCtx.drawImage(
        this.video,
        srcX, srcY, srcW, srcH,
        0, 0, w, h,
      );

      this.offCtx.restore();

      // Draw this rotation pass into the preview canvas (stacked vertically).
      if (this.previewCtx) {
        const rowY = ai * h;
        this.previewCtx.drawImage(this.offscreen, 0, 0, w, h, 0, rowY, w, h);
      }

      const imageData = this.offCtx.getImageData(0, 0, w, h);
      const grayData = this.toGrayscale(imageData.data);

      // Must allocate a fresh buffer each call: scan_image passes the pointer
      // to zbar with zbar_image_free_data as cleanup, so zbar frees it when
      // the image is destroyed. Reusing a pointer would be use-after-free.
      const ptr = this.wasmApi.create_buffer(w, h);
      if (ptr === 0) continue; // malloc failed (OOM) — skip this rotation
      Module.HEAP8.set(grayData, ptr);

      // scan_image triggers Module.processResult synchronously if a barcode is found.
      // The buffer is freed internally by zbar — do not free again from JS.
      this.wasmApi.scan_image(ptr, w, h);

      // Draw angle label + detection highlight on the preview row.
      if (this.previewCtx) {
        const rowY = ai * h;
        const deg = Math.round(angle * 180 / Math.PI);
        const label = `${deg >= 0 ? '+' : ''}${deg}°`;

        // Green border on the row that detected
        if (this.detectedThisTick) {
          this.previewCtx.strokeStyle = '#00ff88';
          this.previewCtx.lineWidth = 3;
          this.previewCtx.strokeRect(1, rowY + 1, w - 2, h - 2);
        }

        // Angle label
        this.previewCtx.font = 'bold 16px monospace';
        this.previewCtx.fillStyle = this.detectedThisTick ? '#00ff88' : 'rgba(255,255,255,0.7)';
        this.previewCtx.fillText(label, 8, rowY + 22);
      }

      // Early exit: if we found a barcode at this angle, skip remaining rotations.
      if (this.detectedThisTick) break;
    }
  }

  /**
   * Convert RGBA pixel data to grayscale using the BT.601 luma formula.
   * Uses integer arithmetic for speed (same formula as the original index.js).
   */
  private toGrayscale(rgba: Uint8ClampedArray): Uint8Array {
    const gray = new Uint8Array(rgba.length / 4);
    for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
      gray[j] = (rgba[i] * 66 + rgba[i + 1] * 129 + rgba[i + 2] * 25 + 4096) >> 8;
    }
    return gray;
  }

  // ── Drawing ─────────────────────────────────────────────────────

  /** Draw a polygon outline on the overlay canvas. */
  private drawPoly(coords: number[]): void {
    if (!this.polyCtx || coords.length < 4) return;

    this.polyCtx.beginPath();
    this.polyCtx.moveTo(coords[0], coords[1]);

    for (let i = 2; i < coords.length; i += 2) {
      this.polyCtx.lineTo(coords[i], coords[i + 1]);
    }

    this.polyCtx.closePath();
    this.polyCtx.lineWidth = 2;
    this.polyCtx.strokeStyle = '#FF0000';
    this.polyCtx.stroke();
  }

}
