
type NavigateCallback = (section: string) => void;
const callbacks: NavigateCallback[] = [];

export function onNavigate(cb: NavigateCallback): void {
  callbacks.push(cb);
}

export function navigate(hash: string): void {
  const target = hash.replace('#', '') || 'home';

  document.querySelectorAll<HTMLElement>('.section').forEach(s => {
    s.classList.toggle('section--active', s.dataset.section === target);
  });

  document.querySelectorAll<HTMLElement>('[data-nav]').forEach(l => {
    l.classList.toggle('sidebar__link--active', l.dataset.nav === target);
  });

  callbacks.forEach(cb => cb(target));
}

export function initRouter(): void {
  window.addEventListener('hashchange', () => navigate(location.hash));
  navigate(location.hash || '#home');
}
