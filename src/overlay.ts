/**
 * Programmatic scan overlay — replaces the static barcodelayout.png.
 *
 * Creates a dark viewfinder mask with a transparent scan region,
 * L-shaped corner brackets, and an animated sweeping laser line.
 * All styling is injected via a single <style> tag (deduplicated).
 */

export interface ScanRegion {
  /** Fraction of container width (0–1). */
  widthRatio: number;
  /** Fraction of container height (0–1). */
  heightRatio: number;
}

const STYLE_ID = 'barcode-scanner-overlay-styles';
const MASK_COLOR = 'rgba(0, 0, 0, 0.55)';
const BRACKET_COLOR = '#00ff88';
const BRACKET_SIZE = 24;
const BRACKET_THICKNESS = 3;
const SCAN_LINE_COLOR = '#00ff88';

/** Inject the keyframe animation + shared styles exactly once. */
function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes scan-sweep {
      0%, 100% { top: 0; }
      50% { top: calc(100% - 2px); }
    }

    .scan-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10;
    }

    .scan-overlay__mask {
      position: absolute;
      background: ${MASK_COLOR};
    }

    .scan-overlay__region {
      position: absolute;
      /* Dimensions set via CSS custom properties from JS */
      width: var(--scan-w);
      height: var(--scan-h);
      left: var(--scan-x);
      top: var(--scan-y);
    }

    .scan-overlay__bracket {
      position: absolute;
      width: ${BRACKET_SIZE}px;
      height: ${BRACKET_SIZE}px;
      border-color: ${BRACKET_COLOR};
      border-style: solid;
      border-width: 0;
    }

    /* Four corners: each gets two border sides to form an L-shape */
    .scan-overlay__bracket--tl {
      top: -1px; left: -1px;
      border-top-width: ${BRACKET_THICKNESS}px;
      border-left-width: ${BRACKET_THICKNESS}px;
      border-top-left-radius: 4px;
    }
    .scan-overlay__bracket--tr {
      top: -1px; right: -1px;
      border-top-width: ${BRACKET_THICKNESS}px;
      border-right-width: ${BRACKET_THICKNESS}px;
      border-top-right-radius: 4px;
    }
    .scan-overlay__bracket--bl {
      bottom: -1px; left: -1px;
      border-bottom-width: ${BRACKET_THICKNESS}px;
      border-left-width: ${BRACKET_THICKNESS}px;
      border-bottom-left-radius: 4px;
    }
    .scan-overlay__bracket--br {
      bottom: -1px; right: -1px;
      border-bottom-width: ${BRACKET_THICKNESS}px;
      border-right-width: ${BRACKET_THICKNESS}px;
      border-bottom-right-radius: 4px;
    }

    .scan-overlay__line {
      position: absolute;
      left: 10%;
      width: 80%;
      height: 2px;
      background: ${SCAN_LINE_COLOR};
      box-shadow: 0 0 8px ${SCAN_LINE_COLOR}, 0 0 24px ${SCAN_LINE_COLOR};
      animation: scan-sweep 2.5s ease-in-out infinite;
      border-radius: 1px;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Build four mask divs that darken everything outside the scan region.
 * Layout: top bar, bottom bar, left strip, right strip.
 */
function createMasks(
  root: HTMLElement,
  scanX: string,
  scanY: string,
  scanW: string,
  scanH: string,
): void {
  const positions: Array<Record<string, string>> = [
    // Top bar: full width, from top to scan region top
    { top: '0', left: '0', width: '100%', height: scanY },
    // Bottom bar: full width, from scan region bottom to container bottom
    { top: `calc(${scanY} + ${scanH})`, left: '0', width: '100%', height: `calc(100% - ${scanY} - ${scanH})` },
    // Left strip: between top and bottom bars
    { top: scanY, left: '0', width: scanX, height: scanH },
    // Right strip: between top and bottom bars
    { top: scanY, left: `calc(${scanX} + ${scanW})`, width: `calc(100% - ${scanX} - ${scanW})`, height: scanH },
  ];

  for (const pos of positions) {
    const mask = document.createElement('div');
    mask.className = 'scan-overlay__mask';
    Object.assign(mask.style, pos);
    root.appendChild(mask);
  }
}

/**
 * Create the overlay DOM tree inside `container`.
 *
 * Returns the overlay root element so the caller can remove it later.
 * The scan region is positioned relative to the container using the
 * provided width/height ratios (e.g. 0.702 × 0.242 matches the original
 * barcodelayout.png proportions).
 */
export function createOverlay(container: HTMLElement, scanRegion: ScanRegion): HTMLElement {
  injectStyles();

  const root = document.createElement('div');
  root.className = 'scan-overlay';

  // Compute scan region bounds as CSS calc expressions centered in the container.
  const scanW = `${(scanRegion.widthRatio * 100).toFixed(2)}%`;
  const scanH = `${(scanRegion.heightRatio * 100).toFixed(2)}%`;
  const scanX = `${(((1 - scanRegion.widthRatio) / 2) * 100).toFixed(2)}%`;
  const scanY = `${(((1 - scanRegion.heightRatio) / 2) * 100).toFixed(2)}%`;

  // Set CSS custom properties for the region so children can reference them.
  root.style.setProperty('--scan-w', scanW);
  root.style.setProperty('--scan-h', scanH);
  root.style.setProperty('--scan-x', scanX);
  root.style.setProperty('--scan-y', scanY);

  // Dark mask around the scan region
  createMasks(root, scanX, scanY, scanW, scanH);

  // Transparent scan region container (holds brackets + laser line)
  const region = document.createElement('div');
  region.className = 'scan-overlay__region';

  // Four corner brackets
  const corners = ['tl', 'tr', 'bl', 'br'] as const;
  for (const corner of corners) {
    const bracket = document.createElement('div');
    bracket.className = `scan-overlay__bracket scan-overlay__bracket--${corner}`;
    region.appendChild(bracket);
  }

  // Animated sweep line
  const line = document.createElement('div');
  line.className = 'scan-overlay__line';
  region.appendChild(line);

  root.appendChild(region);
  container.appendChild(root);

  return root;
}

/** Remove the overlay and clean up. */
export function removeOverlay(overlayRoot: HTMLElement): void {
  overlayRoot.remove();
}
