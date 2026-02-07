/**
 * Demo entry point — thin wrapper that mounts the BarcodeScanner
 * into #scanner-mount and wires up the torch/sound buttons.
 */

import { BarcodeScanner } from './scanner';

const mount = document.getElementById('scanner-mount');
if (!mount) throw new Error('Missing #scanner-mount element');

const resultEl = document.getElementById('scan-result');
const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement | null;

const scanner = new BarcodeScanner({
  container: mount,
  previewCanvas: previewCanvas ?? undefined,
  onDetect: (result) => {
    console.log(`[${result.symbol}] ${result.data}`);
    if (resultEl) {
      resultEl.textContent = `${result.symbol}: ${result.data}`;
    }
  },
  onError: (err) => {
    console.error('Scanner error:', err);
  },
});

// Torch toggle
const lightBtn = document.getElementById('light');
lightBtn?.addEventListener('click', () => {
  scanner.toggleTorch().then((on) => {
    if (lightBtn) lightBtn.textContent = on ? 'torch: ON' : 'torch: OFF';
  });
});

// Start scanning
scanner.start();
