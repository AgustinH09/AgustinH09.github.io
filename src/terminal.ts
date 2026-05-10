import terminalData from '../data/terminal.json';

const TYPING_MIN = 15;
const TYPING_MAX = 40;
const LINE_DELAY = 250;

interface TermState {
  out: HTMLElement;
  input: HTMLInputElement;
  prompt: HTMLElement;
  container: HTMLElement;
  header: HTMLElement | null;
  ghost: HTMLElement | null;
  booting: boolean;
  history: string[];
  histIdx: number;
}

let S: TermState;

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function scroll(): void {
  S.container.scrollTop = S.container.scrollHeight;
}

function addLine(text: string, cls = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = text;
  S.out.appendChild(el);
  scroll();
  return el;
}

function addHtml(html: string): void {
  const el = document.createElement('div');
  el.innerHTML = html;
  S.out.appendChild(el);
  scroll();
}

async function showProgressBar(name: string, duration: number): Promise<void> {
  const row = document.createElement('div');
  row.className = 'term-progress-row';
  row.innerHTML = `<span class="term-progress-bar"><span class="term-progress-fill"></span></span><span class="term-progress-label">${name}</span>`;
  S.out.appendChild(row);
  scroll();

  const fill = row.querySelector<HTMLElement>('.term-progress-fill')!;
  const start = performance.now();

  await new Promise<void>(resolve => {
    function frame(now: number) {
      const pct = Math.min((now - start) / duration, 1);
      fill.style.width = `${pct * 100}%`;
      scroll();
      if (pct < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  row.innerHTML = `<span class="term-ok">[  OK  ]</span> Started ${name}.`;
  row.className = 'term-line term-line--boot';
  scroll();
}

async function typeLine(text: string, cls = ''): Promise<void> {
  const span = document.createElement('span');
  span.className = cls;
  S.out.appendChild(span);
  scroll();

  for (const ch of text) {
    span.textContent += ch;
    scroll();
    await sleep(Math.random() * (TYPING_MAX - TYPING_MIN) + TYPING_MIN);
  }

  const div = document.createElement('div');
  div.className = cls;
  div.textContent = span.textContent;
  span.replaceWith(div);
}

function renderNeofetch(): void {
  const nf = terminalData.neofetch;
  const wrapper = document.createElement('div');
  wrapper.className = 'neofetch';

  const asciiCol = document.createElement('pre');
  asciiCol.className = 'neofetch__ascii';
  asciiCol.textContent = nf.ascii.join('\n');

  const infoCol = document.createElement('div');
  infoCol.className = 'neofetch__info';

  const title = document.createElement('div');
  title.className = 'neofetch__title';
  title.innerHTML = '<span class="neofetch__user">root</span>@<span class="neofetch__host">uy-storm</span>';
  infoCol.appendChild(title);

  const sep = document.createElement('div');
  sep.className = 'neofetch__sep';
  sep.textContent = '─'.repeat(20);
  infoCol.appendChild(sep);

  nf.info.forEach((item: { label: string; value: string }) => {
    const row = document.createElement('div');
    row.innerHTML = `<span class="neofetch__label">${item.label}</span>: ${item.value}`;
    infoCol.appendChild(row);
  });

  const colors = document.createElement('div');
  colors.className = 'neofetch__colors';
  ['#1a1b26','#f7768e','#9ece6a','#e0af68','#7aa2f7','#bb9af7','#7dcfff','#c0caf5'].forEach(c => {
    const b = document.createElement('span');
    b.className = 'neofetch__color-block';
    b.style.background = c;
    colors.appendChild(b);
  });
  infoCol.appendChild(colors);

  wrapper.appendChild(asciiCol);
  wrapper.appendChild(infoCol);
  S.out.appendChild(wrapper);
  scroll();
}

async function boot(): Promise<void> {
  S.booting = true;

  S.header?.classList.add('glitch-active');

  for (const svc of terminalData.bootServices) {
    await showProgressBar(svc.name, svc.duration);
  }

  await sleep(300);
  S.header?.classList.remove('glitch-active');
  addLine('', '');

  for (const line of terminalData.introSequence) {
    if (!line) { addLine('', ''); await sleep(150); }
    else { await typeLine(line, 'term-line term-line--intro'); await sleep(LINE_DELAY); }
  }

  await sleep(400);
  addLine('', '');

  renderNeofetch();
  await sleep(200);
  addLine('', '');

  S.booting = false;
  showPrompt();
}

function getCompletion(partial: string): string | null {
  if (!partial) return null;
  const match = terminalData.commands.find((c: string) =>
    c.startsWith(partial.toLowerCase()) && c !== partial.toLowerCase()
  );
  return match || null;
}

function updateGhost(): void {
  if (!S.ghost) return;
  const val = S.input.value;
  const match = getCompletion(val);
  if (match && val.length > 0) {
    S.ghost.textContent = match.slice(val.length);
    S.ghost.style.display = 'inline';
  } else {
    S.ghost.style.display = 'none';
  }
}

async function triggerKernelPanic(): Promise<void> {
  S.input.disabled = true;
  document.body.classList.add('kernel-panic');
  
  for(let i=0; i<30; i++) {
    addLine(`[${(Math.random() * 1000).toFixed(6)}] Kernel panic - not syncing: Fatal exception in interrupt`, 'term-line--error');
    addLine(`[${(Math.random() * 1000).toFixed(6)}] stack backtrace:`, 'term-line--error');
    addLine(`[${(Math.random() * 1000).toFixed(6)}] CPU: ${Math.floor(Math.random()*8)} PID: ${Math.floor(Math.random()*9999)} Comm: bash Tainted: G      D    W   O      6.8.0-custom-opt #1`, 'term-line--error');
    await sleep(Math.random() * 50 + 20);
  }
  
  await sleep(1500);
  document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:var(--background)"><div style="color:var(--primary);font-family:var(--font-code);font-size:24px;" class="blink">SYSTEM REBOOTING...</div></div>';
  setTimeout(() => window.location.reload(), 2000);
}

function triggerMatrix(): void {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789技師嵐東京システム'.split('');
  const fontSize = 16;
  const columns = canvas.width / fontSize;
  const drops: number[] = [];
  for (let x = 0; x < columns; x++) drops[x] = 1;

  function draw() {
    ctx!.fillStyle = 'rgba(18, 19, 29, 0.1)';
    ctx!.fillRect(0, 0, canvas.width, canvas.height);
    ctx!.fillStyle = '#7dcfff';
    ctx!.font = fontSize + 'px var(--font-code)';
    for (let i = 0; i < drops.length; i++) {
      const text = letters[Math.floor(Math.random() * letters.length)];
      ctx!.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  setInterval(draw, 33);
  addLine('Entering the matrix...', 'term-line--system');
}

function handleCmd(raw: string): void {
  const input = raw.trim();
  const cmd = input.toLowerCase();

  addHtml(`<span class="term-prompt-echo">${terminalData.prompt}</span> <span>${input}</span>`);

  if (!cmd) { showPrompt(); return; }

  S.history.push(input);
  S.histIdx = S.history.length;

  switch (cmd) {
    case 'help':
      addLine('Available commands:', 'term-line--system');
      terminalData.commands.forEach((c: string) => {
        addLine(`  ${c}`, 'term-line--system');
      });
      break;
    case 'whoami':
      addLine('root@uy — Systems Engineer // Uruguay Node', 'term-line--primary');
      break;
    case 'skills':
      addLine('MODULE_01  Ruby on Rails   [BACKEND]', 'term-line--system');
      addLine('MODULE_02  React.js        [FRONTEND] *ACTIVE*', 'term-line--primary');
      addLine('MODULE_03  Rust            [SYSTEMS]', 'term-line--system');
      break;
    case 'clear':
      S.out.innerHTML = '';
      showPrompt();
      return;
    case 'uname -a':
      addLine('Linux tokyo-storm 6.5.0-storm x86_64 GNU/Linux', 'term-line--system');
      break;
    case 'neofetch':
      renderNeofetch();
      break;
    case 'date':
      addLine(new Date().toString(), 'term-line--system');
      break;
    case 'uptime':
      addLine(`up ${Math.floor(Math.random() * 90)}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`, 'term-line--system');
      break;
    case 'projects': case 'cd ~/projects':
      window.location.hash = '#projects'; break;
    case 'kernel': case 'cd ~/kernel':
      window.location.hash = '#kernel'; break;
    case 'connect': case 'cd ~/connect':
      window.location.hash = '#connect'; break;
    case 'rm -rf /': case 'sudo rm -rf /':
      triggerKernelPanic();
      return;
    case 'matrix':
      triggerMatrix();
      break;
    default:
      addLine(`bash: ${cmd}: command not found`, 'term-line--error');
  }

  addLine('', '');
  showPrompt();
}

function showPrompt(): void {
  S.prompt.style.display = 'flex';
  S.input.focus();
  scroll();
}

export function initTerminal(): void {
  const out = document.getElementById('terminal-output');
  const input = document.getElementById('terminal-input') as HTMLInputElement | null;
  const prompt = document.getElementById('terminal-prompt');
  const container = document.getElementById('terminal-container');
  const header = document.querySelector('.boot-terminal__header');

  if (!out || !input || !prompt || !container) return;

  const ghost = document.createElement('span');
  ghost.className = 'terminal-ghost';
  ghost.style.display = 'none';
  input.parentElement?.appendChild(ghost);

  S = { out, input, prompt, container, header: header as HTMLElement, ghost, booting: true, history: [], histIdx: 0 };

  prompt.style.display = 'none';

  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const match = getCompletion(input.value);
      if (match) input.value = match;
      updateGhost();
      return;
    }
    if (e.key === 'Enter') {
      const v = input.value;
      input.value = '';
      updateGhost();
      handleCmd(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (S.histIdx > 0) { S.histIdx--; input.value = S.history[S.histIdx] || ''; }
      updateGhost();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (S.histIdx < S.history.length - 1) { S.histIdx++; input.value = S.history[S.histIdx] || ''; }
      else { S.histIdx = S.history.length; input.value = ''; }
      updateGhost();
    }
  });

  input.addEventListener('input', updateGhost);

  container.addEventListener('click', () => {
    if (!S.booting) input.focus();
  });

  boot();
}
