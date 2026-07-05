export function initGlobalTerminal(): void {
  const toggleTerminal = () => {
    document.body.classList.toggle('global-terminal-active');
    
    // Focus input if active
    if (document.body.classList.contains('global-terminal-active')) {
      const input = document.getElementById('terminal-input') as HTMLInputElement;
      if (input) setTimeout(() => input.focus(), 100);
    }
  };

  document.addEventListener('keydown', (e) => {
    // Listen for ~ or ` or Esc
    if ((e.key === '`' || e.key === '~') && e.target !== document.getElementById('terminal-input')) {
      e.preventDefault();
      toggleTerminal();
    } else if (e.key === 'Escape' && document.body.classList.contains('global-terminal-active')) {
      toggleTerminal();
    }
  });

  const closeBtn = document.getElementById('close-global-terminal');
  if (closeBtn) {
    closeBtn.addEventListener('click', toggleTerminal);
  }

  const openBtn = document.getElementById('btn-open-global-terminal');
  if (openBtn) {
    openBtn.addEventListener('click', toggleTerminal);
  }
}
