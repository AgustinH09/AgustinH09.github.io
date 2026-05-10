/**
 * Tokyo Storm — Main Entry Point
 * Initializes all modules after DOM is ready.
 */
import '../style.css';
import { initRouter, onNavigate } from './router';
import { initTerminal } from './terminal';
import { initGlobalTerminal } from './global-terminal';
import { initClock } from './clock';
import { initKernelCharts } from './kernel';
import { initConnect } from './connect';
import { initBackgroundLogs, initParallax } from './effects';
import { initVim } from './vim';
import { initWindowControls } from './window-controls';
import { initData } from './data-loader';
import { initTheme } from './theme';

document.addEventListener('DOMContentLoaded', () => {
  initData();
  initTheme();

  initRouter();
  initClock();
  initParallax();
  initBackgroundLogs();

  initTerminal();
  initGlobalTerminal();
  initConnect();
  initVim();
  initWindowControls();

  onNavigate((section: string) => {
    if (section === 'kernel') initKernelCharts();
  });

  const btnFetchConfig = document.getElementById('btn-fetch-config');
  if (btnFetchConfig) {
    btnFetchConfig.addEventListener('click', (e) => {
      e.preventDefault();
      import('../data/profile.json').then((module) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(module.default, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "system_profile.cfg");
        dlAnchorElem.click();
      });
    });
  }

  const btnExit = document.getElementById('btn-exit');
  if (btnExit) {
    btnExit.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:var(--background)"><div style="color:var(--error);font-family:var(--font-code);font-size:24px;" class="blink">SYSTEM HALTED.</div><p style="color:var(--outline);font-family:var(--font-code)">You may now close this window.</p></div>';
    });
  }
});
