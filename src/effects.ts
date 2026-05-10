
import terminalData from '../data/terminal.json';

export function initBackgroundLogs(): void {
  const el = document.getElementById('kernel-log-content');
  if (!el) return;
  let html = '';
  for (let i = 0; i < 5; i++) {
    terminalData.kernelLogs.forEach(m => { html += `<div>${m}</div>`; });
  }
  el.innerHTML = html;
}

export function initParallax(): void {
  document.addEventListener('mousemove', (e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    document.querySelectorAll<HTMLElement>('.kanji-bg').forEach(el => {
      const isLeft = el.classList.contains('kanji-bg--left');
      const dx = isLeft ? x * 0.5 : -x * 0.5;
      const dy = isLeft ? y * 0.5 : -y * 0.5;
      el.style.transform = `translateY(-50%) translate(${dx}px, ${dy}px)`;
    });
  });
}
