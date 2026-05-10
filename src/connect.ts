
function spawnParticle(container: HTMLElement, color: string): void {
  const p = document.createElement('div');
  p.className = 'particle';
  const size = Math.random() * 5 + 1;
  p.style.width = `${size}px`;
  p.style.height = `${size}px`;
  p.style.left = `${Math.random() * 100}%`;
  p.style.animationDuration = `${Math.random() * 5 + 3}s`;
  p.style.backgroundColor = color;
  p.style.opacity = '0.5';
  container.appendChild(p);
  setTimeout(() => p.remove(), 8000);
}

function getInputColor(id: string): string {
  switch (id) {
    case 'arg-email': return '#ff007c';
    case 'arg-name': return '#d4bbff';
    default: return '#7dcfff';
  }
}

export function initConnect(): void {
  const noise = document.getElementById('connect-noise');
  if (!noise) return;

  document.querySelectorAll<HTMLElement>('.term-input').forEach(input => {
    input.addEventListener('input', () => {
      for (let i = 0; i < 3; i++) spawnParticle(noise, getInputColor(input.id));
    });
  });

  const btn = document.getElementById('connect-submit');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const name = (document.getElementById('arg-name') as HTMLInputElement)?.value;
    const email = (document.getElementById('arg-email') as HTMLInputElement)?.value;
    const msg = (document.getElementById('arg-message') as HTMLTextAreaElement)?.value;

    if (!name || !email || !msg) {
      btn.textContent = 'ERROR: Missing params';
      btn.style.background = 'var(--error-container)';
      setTimeout(() => {
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:20px">send</span>--EXECUTE';
        btn.style.background = '';
      }, 2000);
      return;
    }

    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:20px">check_circle</span>TRANSMITTED';
    btn.style.background = 'var(--secondary-container)';
    btn.style.color = 'var(--on-secondary-container)';
    btn.style.color = 'var(--on-secondary-container)';

    window.location.href = `mailto:hello@agustinh.uy?subject=Contact via Tokyo Storm&body=${encodeURIComponent(`From: ${name} <${email}>\n\n${msg}`)}`;

    const colors = ['#c3e6ff', '#d4bbff', '#ff007c', '#7dcfff'];
    for (let i = 0; i < 20; i++) {
      spawnParticle(noise, colors[Math.floor(Math.random() * colors.length)]);
    }
  });
}
