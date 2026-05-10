/**
 * Window Controls — Close, Minimize, Fullscreen
 * Attaches to any element with .shell-dot controls inside a .shell-titlebar
 */

type WindowState = 'normal' | 'minimized' | 'fullscreen' | 'closed';

interface ManagedWindow {
  el: HTMLElement;
  titlebar: HTMLElement;
  state: WindowState;
  title: string;
  pill: HTMLElement | null;
  placeholder: HTMLElement | null;
}

const windows: ManagedWindow[] = [];
let dock: HTMLElement;

function createDock(): void {
  dock = document.createElement('div');
  dock.className = 'window-dock';
  dock.id = 'window-dock';
  document.body.appendChild(dock);
}

function getTitle(el: HTMLElement): string {
  const label = el.querySelector('.text-label-caps, .shell-titlebar .text-label-caps');
  return label?.textContent?.trim() || 'Window';
}

function setState(win: ManagedWindow, newState: WindowState): void {
  const prev = win.state;
  win.state = newState;

  win.el.classList.remove('win--minimized', 'win--fullscreen', 'win--closed', 'win--restoring');

  if (win.pill) { win.pill.remove(); win.pill = null; }
  if (win.placeholder) { win.placeholder.remove(); win.placeholder = null; }

  switch (newState) {
    case 'normal':
      win.el.classList.add('win--restoring');
      win.el.style.display = '';
      setTimeout(() => win.el.classList.remove('win--restoring'), 400);
      break;

    case 'minimized':
      win.el.classList.add('win--minimized');
      setTimeout(() => {
        win.el.style.display = 'none';
        const pill = document.createElement('button');
        pill.className = 'dock-pill';
        pill.innerHTML = `<span class="material-symbols-outlined" style="font-size:14px">web_asset</span>${win.title}`;
        pill.addEventListener('click', () => setState(win, 'normal'));
        dock.appendChild(pill);
        win.pill = pill;
      }, 300);
      break;

    case 'fullscreen':
      win.el.classList.add('win--fullscreen');
      const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setState(win, 'normal');
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
      break;

    case 'closed':
      win.el.classList.add('win--closed');
      setTimeout(() => {
        win.el.style.display = 'none';
        const chip = document.createElement('button');
        chip.className = 'win-reopen-chip';
        chip.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px">open_in_new</span> Reopen ${win.title}`;
        chip.addEventListener('click', () => setState(win, 'normal'));
        win.el.parentElement?.insertBefore(chip, win.el);
        win.placeholder = chip;
      }, 300);
      break;
  }
}

function attachControls(el: HTMLElement): void {
  const titlebar = el.querySelector('.shell-titlebar, .ide-tabs') as HTMLElement;
  if (!titlebar) return;

  const dots = titlebar.querySelectorAll('.shell-dot');
  if (dots.length < 3) return;

  const win: ManagedWindow = {
    el,
    titlebar,
    state: 'normal',
    title: getTitle(el),
    pill: null,
    placeholder: null,
  };

  windows.push(win);

  dots[0].addEventListener('click', (e) => {
    e.stopPropagation();
    setState(win, win.state === 'closed' ? 'normal' : 'closed');
  });

  dots[1].addEventListener('click', (e) => {
    e.stopPropagation();
    setState(win, win.state === 'minimized' ? 'normal' : 'minimized');
  });

  dots[2].addEventListener('click', (e) => {
    e.stopPropagation();
    setState(win, win.state === 'fullscreen' ? 'normal' : 'fullscreen');
  });

  dots.forEach(d => (d as HTMLElement).style.cursor = 'pointer');
}

export function initWindowControls(): void {
  createDock();

  document.querySelectorAll<HTMLElement>('.interactive-shell, .ide-container').forEach(el => {
    attachControls(el);
  });
}
