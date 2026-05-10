
const startTime = Date.now() - (Math.random() * 10_000_000);

function update(): void {
  const now = new Date();
  const clockEl = document.getElementById('sys-clock');
  const uptimeEl = document.getElementById('sys-uptime');

  if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  if (uptimeEl) {
    const ms = Date.now() - startTime;
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    uptimeEl.textContent = `UP: ${h}h ${m}m`;
  }
}

export function initClock(): void {
  setInterval(update, 1000);
  update();
}
