
export function initKernelCharts(): void {
  const cpuBars = document.getElementById('cpu-bars');
  if (!cpuBars) return;

  const heights = [40, 45, 30, 60, 55, 80, 34];
  cpuBars.innerHTML = '';

  heights.forEach((h, i) => {
    const bar = document.createElement('div');
    const isLast = i === heights.length - 1;
    bar.className = `stat-bar stat-bar--animated${isLast ? ' stat-bar--active' : ''}`;
    bar.style.setProperty('--h', `${h}%`);
    bar.style.animationDelay = `${0.2 + i * 0.1}s`;
    cpuBars.appendChild(bar);
  });
}
