# Tokyo Storm Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Tokyo Storm portfolio by improving content storytelling, elevating CSS readability, and extracting the home terminal into a globally togglable Easter egg overlay.

**Architecture:** We will modify static JSON data for content polish, adjust CSS custom properties and classes for readability, and move the existing terminal element into a fixed full-screen overlay controlled by a new TypeScript module listening for a hotkey.

**Tech Stack:** HTML, Vanilla CSS, TypeScript, Vite.

---

### Task 1: Content Polish & Storytelling

**Files:**
- Modify: `data/projects.json`
- Modify: `data/blog.json`
- Modify: `data/profile.json`

- [ ] **Step 1: Update projects.json with narrative descriptions**

```json
[
  {
    "id": "PROJECT_01",
    "title": "Tokyo_Storm UI",
    "description": "A highly immersive terminal-inspired design system. It brings the aesthetic of an engineering workstation to the web, proving that abstract architectures can still be accessible and beautiful.",
    "stack": ["React", "Tailwind", "Figma"],
    "status": "DEPLOYED",
    "version": "v2.1.0",
    "codePreview": {
      "language": "typescript",
      "filename": "ExperienceLog.ts"
    },
    "tags": [
      { "label": "React", "color": "#82aaff" },
      { "label": "Tailwind", "color": null }
    ]
  },
  {
    "id": "PROJECT_02",
    "title": "Kernel Engine",
    "description": "An experimental core logic processor built to explore the boundaries of memory safety and raw execution speed. It serves as a sandbox for high-concurrency systems design.",
    "stack": ["Rust", "WASM"],
    "status": "IN_PROGRESS",
    "version": "v0.9.beta",
    "codePreview": {
      "language": "rust",
      "filename": "Project_Matrix.rs"
    },
    "tags": [
      { "label": "Rust", "color": "#f07178" },
      { "label": "WASM", "color": null }
    ]
  },
  {
    "id": "PROJECT_03",
    "title": "Core Rails API",
    "description": "The invisible workhorse. A robust backend API that powers data pipelines and real-time event streams silently and efficiently behind the scenes.",
    "stack": ["Ruby", "PostgreSQL"],
    "status": "MAINTENANCE",
    "version": "v3.2.1",
    "codePreview": {
      "language": "ruby",
      "filename": "ApiController.rb"
    },
    "tags": [
      { "label": "Ruby", "color": "#ff7eb6" },
      { "label": "PostgreSQL", "color": null }
    ]
  }
]
```

- [ ] **Step 2: Update blog.json summaries**

```json
[
  {
    "id": "BLOG_01",
    "title": "On Abstraction: The Architect's Dilemma",
    "date": "2026-04-12",
    "summary": "We build systems to hide complexity, but when do our abstractions become prisons? A deep dive into the philosophy of system architecture and the danger of losing touch with the bare metal.",
    "tags": ["ARCHITECTURE", "LINUX", "PHILOSOPHY"],
    "category": "Developer"
  },
  {
    "id": "BLOG_02",
    "title": "Configuring the Perfect Dotfiles",
    "date": "2026-03-28",
    "summary": "Your terminal is your home. In this post, I break down my approach to creating reproducible, modular dotfiles that turn a chaotic bash prompt into a hyper-personalized command center.",
    "tags": ["TERMINAL", "VIM", "SETUP"],
    "category": "Personal"
  },
  {
    "id": "BLOG_03",
    "title": "Starting the Kanji Journey",
    "date": "2026-02-15",
    "summary": "Learning a new language is the ultimate system refactor. Here is how I am applying engineering principles to the acquisition of Kanji, tracking spaced repetition and visual memory.",
    "tags": ["JAPANESE", "LEARNING", "TOOLS"],
    "category": "Japanese Learner"
  }
]
```

- [ ] **Step 3: Update profile.json with a bio**

Modify `data/profile.json` to include a bio field (add it after `year`):
```json
{
  "name": "Agustín Hernández",
  "handle": "ROOT",
  "systemId": "FE_304_STORM",
  "version": "TOKYO_STORM_v1.0.4",
  "location": "SYS_NODE",
  "year": 2026,
  "bio": "Systems Engineer. Bridging the gap between deeply abstract architectures and accessible web experiences.",
  "links": {
    "github": "https://github.com/AgustinH09",
    "fedora": "https://fedoraproject.org/",
    "linux_foundation": "https://openprofile.dev/profile/agustinh09",
    "dotfiles": "https://github.com/AgustinH09/dotfiles",
    "hyprland": "https://hyprland.org/"
  },
  "footerLinks": [
    { "label": "GitHub_OSS", "url": "https://github.com/AgustinH09" },
    { "label": "Fedora_Project", "url": "https://fedoraproject.org/" },
    { "label": "Linux_Foundation", "url": "https://openprofile.dev/profile/agustinh09" },
    { "label": "Dotfiles", "url": "https://github.com/AgustinH09/dotfiles" },
    { "label": "Hyprland", "url": "https://hyprland.org/" }
  ]
}
```

- [ ] **Step 4: Commit Task 1**

```bash
git add data/projects.json data/blog.json data/profile.json
git commit -m "feat: polish JSON data content for better storytelling"
```

---

### Task 2: Elevated Readability (CSS)

**Files:**
- Modify: `style.css`
- Modify: `src/data-loader.ts`

- [ ] **Step 1: Update style.css for readability**

Find `.project-card-desc` and `.blog-card-summary` in `style.css` and replace them with:

```css
.project-card-desc {
  font-family: var(--font-sans);
  color: var(--on-surface);
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 24px;
  flex: 1;
  opacity: 0.9;
}

.blog-card-summary {
  font-family: var(--font-sans);
  color: var(--on-surface);
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 24px;
  opacity: 0.9;
}
```

- [ ] **Step 2: Inject profile bio in data-loader.ts**

Modify `src/data-loader.ts`. In `initData()`, under the setup for `skillsGrid`, add code to inject the bio if there is an element for it:

```typescript
  const bioEl = document.getElementById('profile-bio');
  if (bioEl && profileData.bio) {
    bioEl.innerHTML = `<span style="color:var(--primary)">></span> ${profileData.bio}`;
  }
```

- [ ] **Step 3: Add bio container in index.html**

In `index.html`, inside `<div class="content-canvas">` under `#section-home`, add the bio container before the `.interactive-shell`:

```html
<section style="margin-bottom: 32px; padding: 24px; background: var(--surface-container-low); border: 1px solid var(--outline-variant); border-left: 4px solid var(--primary);">
  <p id="profile-bio" class="text-code-block" style="font-size: 14px; line-height: 1.6; color: var(--on-surface);"></p>
</section>
```

- [ ] **Step 4: Commit Task 2**

```bash
git add style.css src/data-loader.ts index.html
git commit -m "style: elevate typography readability and add bio"
```

---

### Task 3: Global Terminal Overlay

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Create: `src/global-terminal.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Move terminal element in index.html**

In `index.html`, cut the `<section class="boot-terminal text-code-block">...` out of `#section-home`.
Paste it directly inside `<body>`, just below `<!-- Kernel Log Background -->`.
Add the ID `global-terminal-overlay` to it:

```html
<!-- Global Terminal Overlay -->
<section id="global-terminal-overlay" class="boot-terminal text-code-block">
  <div class="boot-terminal__header">
    <span class="text-label-caps" style="color:var(--on-surface-variant)">BOOT_SEQ_01</span>
    <span style="color:var(--primary);opacity:0.5" class="text-glow">tty1</span>
    <button id="close-global-terminal" style="margin-left:auto; background:none; border:none; color:var(--error); cursor:pointer; font-family:var(--font-code);">[ESC] CLOSE</button>
  </div>
  <div class="boot-terminal__body" id="terminal-container">
    <div id="terminal-output"></div>
    <div id="terminal-prompt" class="terminal-prompt-line" style="display:none">
      <span class="text-glow" style="color:var(--primary)">ROOT ~/home $</span>
      <input type="text" id="terminal-input" class="terminal-input" autocomplete="off" spellcheck="false" />
    </div>
  </div>
</section>
```

Add a hint to the home shell prompt inside `#section-home`:
```html
<div class="cli-prompt"><span class="text-glow shell-body-prompt-text">ROOT ~/home $</span>&nbsp;<span class="text-glow" style="color:var(--outline)">Press ~ or ` to drop to shell</span><span class="cli-cursor blink"></span></div>
```

- [ ] **Step 2: Add CSS for the overlay in style.css**

Add this to the end of `style.css`:

```css
#global-terminal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: rgba(4, 5, 6, 0.95);
  backdrop-filter: blur(8px);
  padding: 40px;
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  border: none;
}

body.global-terminal-active #global-terminal-overlay {
  opacity: 1;
  pointer-events: all;
}
```

- [ ] **Step 3: Create src/global-terminal.ts**

```typescript
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
}
```

- [ ] **Step 4: Wire it up in src/main.ts**

Import it in `src/main.ts`:
```typescript
import { initGlobalTerminal } from './global-terminal';
```
And call it inside the `DOMContentLoaded` event listener:
```typescript
  initTerminal();
  initGlobalTerminal();
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: Passes successfully with Vite.

- [ ] **Step 6: Commit Task 3**

```bash
git add index.html style.css src/global-terminal.ts src/main.ts
git commit -m "feat: implement global terminal easter egg"
```
