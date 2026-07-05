import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';
import terminalData from '../data/terminal.json';

// Generate a massive string of system logs to use as our "wall of text" background
const rawText = Array(20)
  .fill(0)
  .map(() => terminalData.kernelLogs.join(' ') + ' ' + terminalData.introSequence.join(' '))
  .join(' ');

export function initAsciiArt(): void {
  const canvas = document.getElementById('pretext-ascii-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // We use the same code font defined in the CSS variables for the Tokyo Storm aesthetic
  const fontSize = 12;
  const lineHeight = 16;
  const fontSpec = `${fontSize}px "Space Grotesk", monospace`;

  // Pretext performs the expensive text measurement and segmentation *once* 
  // without triggering any DOM reflows.
  const preparedText = prepareWithSegments(rawText, fontSpec);

  let width = 0;
  let height = 0;

  const resize = () => {
    // We only take up the container's width/height, which is controlled by CSS
    const parent = canvas.parentElement;
    if (!parent) return;

    width = parent.clientWidth;
    height = parent.clientHeight;
    
    // Support high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    draw();
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    // Subtle matrix-like green/cyan coloring with low opacity 
    ctx.fillStyle = 'rgba(125, 207, 255, 0.15)'; 
    ctx.font = fontSpec;

    // Use Pretext's hot path layout function to instantly calculate where lines should wrap
    // given the current canvas width, completely skipping the DOM layout engine.
    const { lines } = layoutWithLines(preparedText, width, lineHeight);

    for (let i = 0; i < lines.length; i++) {
      // Stop drawing if we've rendered past the bottom of the canvas
      if (i * lineHeight > height) break;
      
      // Render text starting slightly offset 
      ctx.fillText(lines[i].text, 0, i * lineHeight + fontSize);
    }
  };

  // Initial layout
  resize();

  // On resize, we only need to call our fast draw() function.
  // Pretext already cached the text measurements in `prepareWithSegments`!
  window.addEventListener('resize', resize);
}
