import terminalData from '../data/terminal.json';

const TYPING_MIN = 15;
const TYPING_MAX = 40;
const LINE_DELAY = 250;

export class Terminal {
  out: HTMLElement;
  input: HTMLInputElement;
  prompt: HTMLElement;
  container: HTMLElement;
  header: HTMLElement | null;
  ghost: HTMLElement;
  booting: boolean = true;
  history: string[] = [];
  histIdx: number = 0;

  constructor(out: HTMLElement, input: HTMLInputElement, prompt: HTMLElement, container: HTMLElement, header: HTMLElement | null) {
    this.out = out;
    this.input = input;
    this.prompt = prompt;
    this.container = container;
    this.header = header;

    this.ghost = document.createElement('span');
    this.ghost.className = 'terminal-ghost';
    this.ghost.style.display = 'none';
    this.input.parentElement?.appendChild(this.ghost);

    this.prompt.style.display = 'none';

    this.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const match = this.getCompletion(this.input.value);
        if (match) this.input.value = match;
        this.updateGhost();
        return;
      }
      if (e.key === 'Enter') {
        const v = this.input.value;
        this.input.value = '';
        this.updateGhost();
        this.handleCmd(v);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.histIdx > 0) { this.histIdx--; this.input.value = this.history[this.histIdx] || ''; }
        this.updateGhost();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.histIdx < this.history.length - 1) { this.histIdx++; this.input.value = this.history[this.histIdx] || ''; }
        else { this.histIdx = this.history.length; this.input.value = ''; }
        this.updateGhost();
      }
    });

    this.input.addEventListener('input', () => this.updateGhost());

    this.container.addEventListener('click', () => {
      if (!this.booting) this.input.focus();
    });
  }

  async sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  scroll(): void {
    this.container.scrollTop = this.container.scrollHeight;
  }

  addLine(text: string, cls = ''): HTMLElement {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    this.out.appendChild(el);
    this.scroll();
    return el;
  }

  addHtml(html: string): void {
    const el = document.createElement('div');
    el.innerHTML = html;
    this.out.appendChild(el);
    this.scroll();
  }

  async showProgressBar(name: string, duration: number): Promise<void> {
    const row = document.createElement('div');
    row.className = 'term-progress-row';
    row.innerHTML = `<span class="term-progress-bar"><span class="term-progress-fill"></span></span><span class="term-progress-label">${name}</span>`;
    this.out.appendChild(row);
    this.scroll();

    const fill = row.querySelector<HTMLElement>('.term-progress-fill')!;
    const start = performance.now();

    await new Promise<void>(resolve => {
      const frame = (now: number) => {
        const pct = Math.min((now - start) / duration, 1);
        fill.style.width = `${pct * 100}%`;
        this.scroll();
        if (pct < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });

    row.innerHTML = `<span class="term-ok">[  OK  ]</span> Started ${name}.`;
    row.className = 'term-line term-line--boot';
    this.scroll();
  }

  async typeLine(text: string, cls = ''): Promise<void> {
    const span = document.createElement('span');
    span.className = cls;
    this.out.appendChild(span);
    this.scroll();

    for (const ch of text) {
      span.textContent += ch;
      this.scroll();
      await this.sleep(Math.random() * (TYPING_MAX - TYPING_MIN) + TYPING_MIN);
    }

    const div = document.createElement('div');
    div.className = cls;
    div.textContent = span.textContent;
    span.replaceWith(div);
  }

  renderNeofetch(): void {
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
    this.out.appendChild(wrapper);
    this.scroll();
  }

  async boot(): Promise<void> {
    this.booting = true;
    this.header?.classList.add('glitch-active');

    for (const svc of terminalData.bootServices) {
      await this.showProgressBar(svc.name, svc.duration);
    }

    await this.sleep(300);
    this.header?.classList.remove('glitch-active');
    this.addLine('', '');

    for (const line of terminalData.introSequence) {
      if (!line) { this.addLine('', ''); await this.sleep(150); }
      else { await this.typeLine(line, 'term-line term-line--intro'); await this.sleep(LINE_DELAY); }
    }

    await this.sleep(400);
    this.addLine('', '');

    this.renderNeofetch();
    await this.sleep(200);
    this.addLine('', '');

    this.booting = false;
    this.showPrompt();
  }

  getCompletion(partial: string): string | null {
    if (!partial) return null;
    const match = terminalData.commands.find((c: string) =>
      c.startsWith(partial.toLowerCase()) && c !== partial.toLowerCase()
    );
    return match || null;
  }

  updateGhost(): void {
    if (!this.ghost) return;
    const val = this.input.value;
    const match = this.getCompletion(val);
    if (match && val.length > 0) {
      this.ghost.textContent = match.slice(val.length);
      this.ghost.style.display = 'inline';
    } else {
      this.ghost.style.display = 'none';
    }
  }

  async triggerKernelPanic(): Promise<void> {
    this.input.disabled = true;
    document.body.classList.add('kernel-panic');
    
    for(let i=0; i<30; i++) {
      this.addLine(`[${(Math.random() * 1000).toFixed(6)}] Kernel panic - not syncing: Fatal exception in interrupt`, 'term-line--error');
      this.addLine(`[${(Math.random() * 1000).toFixed(6)}] stack backtrace:`, 'term-line--error');
      this.addLine(`[${(Math.random() * 1000).toFixed(6)}] CPU: ${Math.floor(Math.random()*8)} PID: ${Math.floor(Math.random()*9999)} Comm: bash Tainted: G      D    W   O      6.8.0-custom-opt #1`, 'term-line--error');
      await this.sleep(Math.random() * 50 + 20);
    }
    
    await this.sleep(1500);
    document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:var(--background)"><div style="color:var(--primary);font-family:var(--font-code);font-size:24px;" class="blink">SYSTEM REBOOTING...</div></div>';
    setTimeout(() => window.location.reload(), 2000);
  }

  triggerMatrix(): void {
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

    const draw = () => {
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
    this.addLine('Entering the matrix...', 'term-line--system');
  }

  handleCmd(raw: string): void {
    const input = raw.trim();
    const cmd = input.toLowerCase();

    this.addHtml(`<span class="term-prompt-echo">${terminalData.prompt}</span> <span>${input}</span>`);

    if (!cmd) { this.showPrompt(); return; }

    this.history.push(input);
    this.histIdx = this.history.length;

    switch (cmd) {
      case 'help':
        this.addLine('Available commands:', 'term-line--system');
        terminalData.commands.forEach((c: string) => {
          this.addLine(`  ${c}`, 'term-line--system');
        });
        break;
      case 'whoami':
        this.addLine('root@uy — Systems Engineer // Uruguay Node', 'term-line--primary');
        break;
      case 'skills':
        this.addLine('MODULE_01  Ruby on Rails   [BACKEND]', 'term-line--system');
        this.addLine('MODULE_02  React.js        [FRONTEND] *ACTIVE*', 'term-line--primary');
        this.addLine('MODULE_03  Rust            [SYSTEMS]', 'term-line--system');
        break;
      case 'clear':
        this.out.innerHTML = '';
        this.showPrompt();
        return;
      case 'uname -a':
        this.addLine('Linux tokyo-storm 6.5.0-storm x86_64 GNU/Linux', 'term-line--system');
        break;
      case 'neofetch':
        this.renderNeofetch();
        break;
      case 'date':
        this.addLine(new Date().toString(), 'term-line--system');
        break;
      case 'uptime':
        this.addLine(`up ${Math.floor(Math.random() * 90)}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`, 'term-line--system');
        break;
      case 'projects': case 'cd ~/projects':
        window.location.hash = '#projects'; break;
      case 'kernel': case 'cd ~/kernel':
        window.location.hash = '#kernel'; break;
      case 'connect': case 'cd ~/connect':
        window.location.hash = '#connect'; break;
      case 'blog': case 'cd ~/blog':
        window.location.hash = '#blog'; break;
      case 'rm -rf /': case 'sudo rm -rf /':
        this.triggerKernelPanic();
        return;
      case 'matrix':
        this.triggerMatrix();
        break;
      default:
        this.addLine(`bash: ${cmd}: command not found`, 'term-line--error');
    }

    this.addLine('', '');
    this.showPrompt();
  }

  showPrompt(): void {
    this.prompt.style.display = 'flex';
    this.input.focus();
    this.scroll();
  }
}

export function initTerminal(): void {
  // Global Terminal
  const gout = document.getElementById('terminal-output');
  const ginput = document.getElementById('terminal-input') as HTMLInputElement | null;
  const gprompt = document.getElementById('terminal-prompt');
  const gcontainer = document.getElementById('terminal-container');
  const gheader = document.querySelector('.boot-terminal__header') as HTMLElement | null;
  if (gout && ginput && gprompt && gcontainer) {
    const globalTerm = new Terminal(gout, ginput, gprompt, gcontainer, gheader);
    globalTerm.boot();
  }

  // Home Terminal
  const hout = document.getElementById('home-terminal-output');
  const hinput = document.getElementById('home-terminal-input') as HTMLInputElement | null;
  const hprompt = document.getElementById('home-terminal-prompt');
  const hcontainer = document.getElementById('home-terminal-container');
  if (hout && hinput && hprompt && hcontainer) {
    const homeTerm = new Terminal(hout, hinput, hprompt, hcontainer, null);
    homeTerm.boot();
  }
}
