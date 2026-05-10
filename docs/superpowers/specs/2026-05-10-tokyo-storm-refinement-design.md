# Tokyo Storm Refinement Design

## 1. Overview
The goal of this project is to elevate the existing "Tokyo Storm System Terminal" website by bridging the gap between a deeply technical aesthetic and broad accessibility (inspired by fsobral.dev). We will refine the existing architecture without rewriting the application from scratch.

## 2. Approach
We will implement three targeted improvements:
1. **Content Polish & Storytelling**: Update data sources (`projects.json`, `blog.json`, `profile.json`) to emphasize narrative and impact over raw technical lists.
2. **Elevated Readability (Typography & Spacing)**: Refine CSS in reading areas (like `projects-display` and `blog-grid`) by increasing line heights, adjusting font sizing, and softening contrast to make the content effortless to read for non-technical visitors.
3. **Global Terminal Overlay (Easter Egg)**: Transform the existing interactive shell from a static home page section into a globally accessible, togglable overlay activated by a hotkey (e.g., `~` or `` ` ``), satisfying the "hardcore tech" audience while keeping the default UI clean.

## 3. Architecture & Components
- **Data Layer**: Modify the structure of the JSON data files in `/data` to support longer-form, narrative descriptions.
- **CSS / Styling**: Update `style.css` targeting the reading containers. Adjust `line-height` (target ~1.6 for body text), font scaling, and whitespace padding to improve the reading experience.
- **Global Terminal Component**: 
  - Extract the terminal logic (currently tied to the home section) to be a global modal/overlay.
  - Listen for the global keydown event (for `` ` `` or `~`) to toggle a `.terminal-overlay-active` state.
  - Ensure the overlay has a high z-index, blurring or darkening the background site to focus on the terminal.

## 4. Implementation Boundaries
- **In Scope**: Updating JSON content, refining CSS for readability, implementing the global terminal toggle logic.
- **Out of Scope**: Completely redesigning the website structure, removing the IDE panels, migrating to a new frontend framework.

## 5. Testing & Validation
- **Visual Check**: Verify that text in projects and blog sections is highly readable on both desktop and mobile views.
- **Functional Check**: Ensure the global terminal hotkey opens and closes the terminal overlay seamlessly from any section of the site without losing focus or breaking existing terminal commands.
