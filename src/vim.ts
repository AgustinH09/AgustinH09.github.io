

type VimMode = 'NORMAL' | 'INSERT' | 'VISUAL' | 'COMMAND';

interface VimBuffer {
  lines: string[];
  cursor: { row: number; col: number };
  mode: VimMode;
  filename: string;
  yankBuffer: string;
  undoStack: string[][];
  visualStart: { row: number; col: number } | null;
  cmdInput: string;
  pending: string;
}

interface VimElements {
  container: HTMLElement;
  lineNumbers: HTMLElement;
  content: HTMLElement;
  statusBar: HTMLElement;
  cmdLine: HTMLElement;
}

let buf: VimBuffer;
let els: VimElements;
let editorFocused = false;

function getVisualRange() {
  if (!buf.visualStart) return null;
  const start = buf.visualStart;
  const end = buf.cursor;
  if (start.row < end.row || (start.row === end.row && start.col <= end.col)) {
    return { start, end };
  } else {
    return { start: end, end: start };
  }
}

function deleteVisualRange(): string {
  if (!buf.visualStart) return '';
  const range = getVisualRange();
  if (!range) return '';
  
  saveUndo();
  let deletedText = '';
  
  if (range.start.row === range.end.row) {
    const line = buf.lines[range.start.row];
    deletedText = line.slice(range.start.col, range.end.col + 1);
    buf.lines[range.start.row] = line.slice(0, range.start.col) + line.slice(range.end.col + 1);
  } else {
    const firstLine = buf.lines[range.start.row];
    const lastLine = buf.lines[range.end.row];
    
    deletedText += firstLine.slice(range.start.col) + '\n';
    for (let i = range.start.row + 1; i < range.end.row; i++) {
      deletedText += buf.lines[i] + '\n';
    }
    deletedText += lastLine.slice(0, range.end.col + 1);
    
    buf.lines[range.start.row] = firstLine.slice(0, range.start.col) + lastLine.slice(range.end.col + 1);
    buf.lines.splice(range.start.row + 1, range.end.row - range.start.row);
  }
  
  buf.cursor.row = range.start.row;
  buf.cursor.col = range.start.col;
  buf.mode = 'NORMAL';
  buf.visualStart = null;
  clampCursor();
  
  return deletedText;
}

function yankVisualRange(): string {
  if (!buf.visualStart) return '';
  const range = getVisualRange();
  if (!range) return '';
  
  let yankedText = '';
  if (range.start.row === range.end.row) {
    const line = buf.lines[range.start.row];
    yankedText = line.slice(range.start.col, range.end.col + 1);
  } else {
    const firstLine = buf.lines[range.start.row];
    const lastLine = buf.lines[range.end.row];
    
    yankedText += firstLine.slice(range.start.col) + '\n';
    for (let i = range.start.row + 1; i < range.end.row; i++) {
      yankedText += buf.lines[i] + '\n';
    }
    yankedText += lastLine.slice(0, range.end.col + 1);
  }
  
  buf.mode = 'NORMAL';
  buf.visualStart = null;
  clampCursor();
  
  return yankedText;
}

function renderLine(line: string, row: number): string {
  const tokenClasses = new Array(line.length).fill('');
  
  function addToken(regex: RegExp, cls: string) {
    let match;
    while ((match = regex.exec(line)) !== null) {
      let overlap = false;
      for (let i = 0; i < match[0].length; i++) {
        if (tokenClasses[match.index + i] !== '') { overlap = true; break; }
      }
      if (!overlap) {
        for (let i = 0; i < match[0].length; i++) {
          tokenClasses[match.index + i] = cls;
        }
      }
      if (match[0].length === 0) regex.lastIndex++;
    }
  }

  addToken(/(\/\/.*$|#.*$)/g, 'syn-comment');
  addToken(/('[^']*'|"[^"]*"|`[^`]*`)/g, 'syn-str');
  addToken(/\b(Status\.\w+|true|false|null|undefined|None|Some)\b/g, 'syn-const');
  addToken(/\b(import|from|const|let|var|function|return|if|else|for|while|new|class|export|default|type|interface|enum|async|await|pub|fn|struct|impl|use|mod|crate|mut|ref|self|match)\b/g, 'syn-kw');
  addToken(/\b([A-Z][A-Za-z]+)\b/g, 'syn-type');
  addToken(/\b(\d+\.?\d*)\b/g, 'syn-num');

  const visualRange = buf.mode === 'VISUAL' ? getVisualRange() : null;
  const isVisualLine = visualRange && row >= visualRange.start.row && row <= visualRange.end.row;
  let sCol = 0, eCol = -1;
  if (isVisualLine && visualRange) {
    sCol = row === visualRange.start.row ? visualRange.start.col : 0;
    eCol = row === visualRange.end.row ? visualRange.end.col : line.length;
  }

  let html = '';
  let currentCls = '';
  let isSpanOpen = false;

  for (let i = 0; i < line.length; i++) {
    const isVisual = isVisualLine && i >= sCol && i <= eCol;
    const isCursor = row === buf.cursor.row && i === buf.cursor.col;
    
    let charCls = tokenClasses[i];
    if (isVisual) charCls += ' vim-visual-selected';
    if (isCursor) {
      charCls += buf.mode === 'INSERT' ? ' vim-cursor vim-cursor--insert' : ' vim-cursor vim-cursor--block';
    }
    charCls = charCls.trim();

    if (charCls !== currentCls) {
      if (isSpanOpen) html += '</span>';
      if (charCls) {
        html += `<span class="${charCls}">`;
        isSpanOpen = true;
      } else {
        isSpanOpen = false;
      }
      currentCls = charCls;
    }
    html += escHtml(line[i]);
  }
  if (isSpanOpen) html += '</span>';

  const isCursorEnd = row === buf.cursor.row && buf.cursor.col === line.length && buf.mode === 'INSERT';
  const isCursorEmptyLineNormal = row === buf.cursor.row && buf.mode === 'NORMAL' && line.length === 0 && buf.cursor.col === 0;
  const isVisualEnd = isVisualLine && eCol >= line.length;
  
  if (isCursorEnd || isCursorEmptyLineNormal || isVisualEnd) {
    let cls = '';
    if (isVisualEnd) cls += ' vim-visual-selected';
    if (isCursorEnd || isCursorEmptyLineNormal) {
      cls += buf.mode === 'INSERT' ? ' vim-cursor vim-cursor--insert' : ' vim-cursor vim-cursor--block';
    }
    cls = cls.trim();
    if (cls) {
      html += `<span class="${cls}"> </span>`;
    }
  }

  return html;
}

function render(): void {
  els.lineNumbers.innerHTML = buf.lines.map((_, i) =>
    `<div class="${i === buf.cursor.row ? 'vim-linenum--active' : ''}">${i + 1}</div>`
  ).join('');

  els.content.innerHTML = buf.lines.map((line, row) => {
    const isCurrentLine = row === buf.cursor.row;
    const cls = isCurrentLine ? 'vim-line vim-line--current' : 'vim-line';
    return `<div class="${cls}"><span class="vim-text">${renderLine(line, row)}</span></div>`;
  }).join('');

  const modeClass = `vim-mode--${buf.mode.toLowerCase()}`;
  const pos = `Ln ${buf.cursor.row + 1}, Col ${buf.cursor.col + 1}`;

  if (buf.mode === 'COMMAND') {
    els.statusBar.innerHTML = `<span class="vim-mode ${modeClass}">COMMAND</span><span class="vim-cmd-display">:${buf.cmdInput}</span><span class="vim-pos">${pos}</span>`;
  } else {
    els.statusBar.innerHTML = `<span class="vim-mode ${modeClass}">-- ${buf.mode} --</span><span class="vim-file">${buf.filename}</span><span class="vim-pos">${pos}</span>`;
  }

  const currentLineEl = els.content.querySelector('.vim-line--current');
  if (currentLineEl) currentLineEl.scrollIntoView({ block: 'nearest' });
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function saveUndo(): void {
  buf.undoStack.push(buf.lines.map(l => l));
  if (buf.undoStack.length > 50) buf.undoStack.shift();
}

function clampCursor(): void {
  buf.cursor.row = Math.max(0, Math.min(buf.cursor.row, buf.lines.length - 1));
  const maxCol = buf.mode === 'INSERT'
    ? buf.lines[buf.cursor.row].length
    : Math.max(0, buf.lines[buf.cursor.row].length - 1);
  buf.cursor.col = Math.max(0, Math.min(buf.cursor.col, maxCol));
}

function nextWordStart(row: number, col: number): { row: number; col: number } {
  const line = buf.lines[row];
  let c = col + 1;
  while (c < line.length && /\w/.test(line[c])) c++;
  // Skip whitespace
  while (c < line.length && /\s/.test(line[c])) c++;
  if (c >= line.length && row < buf.lines.length - 1) return { row: row + 1, col: 0 };
  return { row, col: Math.min(c, Math.max(0, line.length - 1)) };
}

function prevWordStart(row: number, col: number): { row: number; col: number } {
  let c = col - 1;
  if (c < 0 && row > 0) {
    const prevLine = buf.lines[row - 1];
    return { row: row - 1, col: Math.max(0, prevLine.length - 1) };
  }
  const line = buf.lines[row];
  while (c > 0 && /\s/.test(line[c])) c--;
  while (c > 0 && /\w/.test(line[c - 1])) c--;
  return { row, col: Math.max(0, c) };
}

function handleNormal(key: string, e: KeyboardEvent): void {
  const pending = buf.pending + key;

  if (pending === 'gg') {
    buf.cursor.row = 0; buf.cursor.col = 0; buf.pending = ''; clampCursor(); return;
  }
  if (pending === 'dd') {
    saveUndo();
    buf.yankBuffer = buf.lines[buf.cursor.row];
    buf.lines.splice(buf.cursor.row, 1);
    if (buf.lines.length === 0) buf.lines.push('');
    buf.pending = '';
    clampCursor(); return;
  }
  if (pending === 'yy') {
    buf.yankBuffer = buf.lines[buf.cursor.row];
    buf.pending = '';
    flashStatus('Yanked 1 line'); return;
  }
  if (pending === 'dw') {
    saveUndo();
    const line = buf.lines[buf.cursor.row];
    const nw = nextWordStart(buf.cursor.row, buf.cursor.col);
    if (nw.row === buf.cursor.row) {
      buf.lines[buf.cursor.row] = line.slice(0, buf.cursor.col) + line.slice(nw.col);
    }
    buf.pending = '';
    clampCursor(); return;
  }

  if (key === 'd' || key === 'g' || key === 'y') {
    buf.pending = pending; return;
  }
  buf.pending = '';

  switch (key) {
    case 'h': case 'ArrowLeft': buf.cursor.col--; break;
    case 'l': case 'ArrowRight': buf.cursor.col++; break;
    case 'j': case 'ArrowDown': buf.cursor.row++; break;
    case 'k': case 'ArrowUp': buf.cursor.row--; break;
    case 'w': { const p = nextWordStart(buf.cursor.row, buf.cursor.col); buf.cursor = p; break; }
    case 'b': { const p = prevWordStart(buf.cursor.row, buf.cursor.col); buf.cursor = p; break; }
    case 'e': {
      const line = buf.lines[buf.cursor.row];
      let c = buf.cursor.col + 1;
      while (c < line.length && /\w/.test(line[c])) c++;
      buf.cursor.col = Math.max(0, c - 1); break;
    }
    case '0': case 'Home': buf.cursor.col = 0; break;
    case '$': case 'End': buf.cursor.col = Math.max(0, buf.lines[buf.cursor.row].length - 1); break;
    case 'G': buf.cursor.row = buf.lines.length - 1; buf.cursor.col = 0; break;

    case 'i': buf.mode = 'INSERT'; break;
    case 'a': buf.cursor.col++; buf.mode = 'INSERT'; break;
    case 'I': buf.cursor.col = 0; buf.mode = 'INSERT'; break;
    case 'A': buf.cursor.col = buf.lines[buf.cursor.row].length; buf.mode = 'INSERT'; break;
    case 'o': saveUndo(); buf.lines.splice(buf.cursor.row + 1, 0, ''); buf.cursor.row++; buf.cursor.col = 0; buf.mode = 'INSERT'; break;
    case 'O': saveUndo(); buf.lines.splice(buf.cursor.row, 0, ''); buf.cursor.col = 0; buf.mode = 'INSERT'; break;

    case 'x': saveUndo(); {
      const line = buf.lines[buf.cursor.row];
      buf.lines[buf.cursor.row] = line.slice(0, buf.cursor.col) + line.slice(buf.cursor.col + 1);
      if (buf.lines[buf.cursor.row].length === 0 && buf.lines.length > 1) break;
    } break;

    case 'u': if (buf.undoStack.length > 0) { buf.lines = buf.undoStack.pop()!; clampCursor(); } break;

    // Paste
    case 'p': if (buf.yankBuffer) { saveUndo(); buf.lines.splice(buf.cursor.row + 1, 0, buf.yankBuffer); buf.cursor.row++; buf.cursor.col = 0; } break;

    case 'v': buf.mode = 'VISUAL'; buf.visualStart = { ...buf.cursor }; break;

    // Command
    case ':': buf.mode = 'COMMAND'; buf.cmdInput = ''; break;
  }

  clampCursor();
}

function handleInsert(key: string, e: KeyboardEvent): void {
  if (key === 'Escape') { buf.mode = 'NORMAL'; buf.cursor.col = Math.max(0, buf.cursor.col - 1); clampCursor(); return; }

  saveUndo();
  const line = buf.lines[buf.cursor.row];

  if (key === 'Enter') {
    const before = line.slice(0, buf.cursor.col);
    const after = line.slice(buf.cursor.col);
    buf.lines[buf.cursor.row] = before;
    buf.lines.splice(buf.cursor.row + 1, 0, after);
    buf.cursor.row++;
    buf.cursor.col = 0;
  } else if (key === 'Backspace') {
    if (buf.cursor.col > 0) {
      buf.lines[buf.cursor.row] = line.slice(0, buf.cursor.col - 1) + line.slice(buf.cursor.col);
      buf.cursor.col--;
    } else if (buf.cursor.row > 0) {
      const prevLine = buf.lines[buf.cursor.row - 1];
      buf.cursor.col = prevLine.length;
      buf.lines[buf.cursor.row - 1] = prevLine + line;
      buf.lines.splice(buf.cursor.row, 1);
      buf.cursor.row--;
    }
  } else if (key === 'Tab') {
    e.preventDefault();
    buf.lines[buf.cursor.row] = line.slice(0, buf.cursor.col) + '  ' + line.slice(buf.cursor.col);
    buf.cursor.col += 2;
  } else if (key.length === 1) {
    buf.lines[buf.cursor.row] = line.slice(0, buf.cursor.col) + key + line.slice(buf.cursor.col);
    buf.cursor.col++;
  }
}

function handleVisual(key: string): void {
  if (key === 'Escape') { buf.mode = 'NORMAL'; buf.visualStart = null; return; }
  
  if ('hjklwbe0$GgArrowUpArrowDownArrowLeftArrowRight'.includes(key)) {
    handleNormal(key, new KeyboardEvent('keydown'));
    buf.mode = 'VISUAL'; // stay in visual
    return;
  }
  
  if (key === 'd' || key === 'x' || key === 'Backspace') {
    buf.yankBuffer = deleteVisualRange();
    flashStatus('Deleted selection');
    return;
  }
  
  if (key === 'y') {
    buf.yankBuffer = yankVisualRange();
    flashStatus('Yanked selection');
    return;
  }

  if (key === 'c') {
    buf.yankBuffer = deleteVisualRange();
    buf.mode = 'INSERT';
    return;
  }
  
  if (key.length === 1) {
    deleteVisualRange();
    buf.mode = 'INSERT';
    handleInsert(key, new KeyboardEvent('keydown'));
    return;
  }
}

function handleCommand(key: string): void {
  if (key === 'Escape') { buf.mode = 'NORMAL'; buf.cmdInput = ''; return; }
  if (key === 'Enter') {
    execCommand(buf.cmdInput);
    buf.mode = 'NORMAL';
    buf.cmdInput = '';
    return;
  }
  if (key === 'Backspace') {
    buf.cmdInput = buf.cmdInput.slice(0, -1);
    if (buf.cmdInput === '') { buf.mode = 'NORMAL'; }
    return;
  }
  if (key.length === 1) buf.cmdInput += key;
}

function triggerShutdown(): void {
  document.body.classList.add('crt-off');
  setTimeout(() => {
    document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:#000"><div style="color:var(--primary);font-family:var(--font-code);font-size:24px;" class="blink">VIM: Connection closed. Rebooting...</div></div>';
    document.body.classList.remove('crt-off');
    setTimeout(() => window.location.reload(), 2000);
  }, 600);
}

function execCommand(cmd: string): void {
  switch (cmd) {
    case 'w': flashStatus(`"${buf.filename}" written`); break;
    case 'q':
    case 'wq':
      flashStatus(`"${buf.filename}" written. Initiating shutdown...`);
      triggerShutdown();
      break;
    case 'set number': flashStatus('Line numbers already enabled'); break;
    default: flashStatus(`E492: Not an editor command: ${cmd}`);
  }
}

function flashStatus(msg: string): void {
  const flash = document.createElement('div');
  flash.className = 'vim-flash';
  flash.textContent = msg;
  els.statusBar.appendChild(flash);
  setTimeout(() => flash.remove(), 2000);
}

import projectsData from '../data/projects.json';

const DEFAULT_CODE = `import { SystemEngineer } from '@core/uy-node';

const experienceLog: Project[] = [
${projectsData.map((p: any) => `  {
    id: '${p.id}',
    title: '${p.title}',
    stack: [${p.stack.map((s: string) => `'${s}'`).join(', ')}],
    status: Status.${p.status}
  }`).join(',\n')}
];`;

export function initVim(): void {
  const container = document.querySelector('.code-editor') as HTMLElement;
  if (!container) return;

  const lineNums = document.createElement('div');
  lineNums.className = 'code-editor__lines vim-linenums';

  const content = document.createElement('div');
  content.className = 'code-editor__content vim-content';
  content.setAttribute('tabindex', '0');
  content.setAttribute('contenteditable', 'true');

  const statusBar = document.createElement('div');
  statusBar.className = 'vim-statusbar';

  const cmdLine = document.createElement('div');
  cmdLine.className = 'vim-cmdline';

  container.innerHTML = '';
  const editorArea = document.createElement('div');
  editorArea.className = 'vim-editor-area';
  editorArea.appendChild(lineNums);
  editorArea.appendChild(content);
  container.appendChild(editorArea);
  container.appendChild(statusBar);

  els = { container, lineNumbers: lineNums, content, statusBar, cmdLine };

  buf = {
    lines: DEFAULT_CODE.split('\n'),
    cursor: { row: 0, col: 0 },
    mode: 'NORMAL',
    filename: 'ExperienceLog.ts',
    yankBuffer: '',
    undoStack: [],
    visualStart: null,
    cmdInput: '',
    pending: '',
  };

  // Track mouse clicks to distinguish intentional blurs from Vimium's programmatic blur
  let lastMouseDown = 0;
  window.addEventListener('mousedown', () => { lastMouseDown = Date.now(); }, true);

  content.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!editorFocused) return;

    // Map Ctrl+[ to Escape for true Vim feel
    const key = (e.key === '[' && e.ctrlKey) ? 'Escape' : e.key;

    // Prevent browser defaults for our keys
    if (key !== 'F5' && key !== 'F12' && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
    }

    switch (buf.mode) {
      case 'NORMAL': handleNormal(key, e); break;
      case 'INSERT': handleInsert(key, e); break;
      case 'VISUAL': handleVisual(key); break;
      case 'COMMAND': handleCommand(key); break;
    }

    render();
  });

  // Suppress native contenteditable input — all editing is handled by our keydown handler.
  // contenteditable is only set so Vimium/similar extensions treat this as an input field.
  content.addEventListener('beforeinput', (e: Event) => { e.preventDefault(); });

  content.addEventListener('focus', () => { editorFocused = true; });
  
  content.addEventListener('blur', () => { 
    editorFocused = false; 
    
    if (buf.mode !== 'NORMAL') {
      const wasInsert = buf.mode === 'INSERT';
      buf.mode = 'NORMAL';
      buf.cmdInput = '';
      buf.visualStart = null;
      if (wasInsert) {
        buf.cursor.col = Math.max(0, buf.cursor.col - 1);
      }
      clampCursor();
    }

    // Anti-Vimium hack: If blurred without a recent click (e.g., Vimium intercepting Escape), 
    // refocus the editor so the user doesn't lose keyboard control.
    if (Date.now() - lastMouseDown > 150) {
      setTimeout(() => {
        if (document.activeElement === document.body || document.activeElement === null) {
          content.focus();
        }
      }, 10);
    }
    
    render();
  });

  container.addEventListener('click', () => {
    content.focus();
  });

  render();
}
