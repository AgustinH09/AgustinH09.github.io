import profileData from '../data/profile.json';
import skillsData from '../data/skills.json';
import projectsData from '../data/projects.json';
import blogData from '../data/blog.json';

export function initData(): void {
  const handleEl = document.getElementById('profile-handle');
  if (handleEl) handleEl.textContent = profileData.handle;

  const sysIdEl = document.getElementById('profile-system-id');
  if (sysIdEl) sysIdEl.textContent = profileData.systemId;

  const versionEl = document.getElementById('profile-version');
  if (versionEl) versionEl.textContent = profileData.version;

  const footerTextEl = document.getElementById('profile-footer-text');
  if (footerTextEl) footerTextEl.textContent = `© ${profileData.year} SYSTEM_ENGINEER // ${profileData.location}`;

  const footerLinksContainer = document.getElementById('footer-links-container');
  if (footerLinksContainer) {
    footerLinksContainer.innerHTML = profileData.footerLinks.map(link => 
      `<a class="footer__link" href="${link.url}" target="${link.url.startsWith('http') ? '_blank' : '_self'}">${link.label}</a>`
    ).join('');
  }

  const bioEl = document.getElementById('profile-bio');
  if (bioEl && profileData.bio) {
    bioEl.innerHTML = `<span style="color:var(--primary)">></span> ${profileData.bio}`;
  }

  const skillsGrid = document.getElementById('skills-grid');
  if (skillsGrid) {
    skillsGrid.innerHTML = skillsData.map(skill => `
      <div class="module-card ${skill.active ? 'module-card--active' : ''}">
        ${skill.active ? '<div class="module-card--active"><span class="module-card__badge text-label-caps">ACTIVE</span></div>' : ''}
        <div class="text-label-caps module-card-subtitle">${skill.id}</div>
        <h3 class="text-headline-md text-glow module-card-title">${skill.title}</h3>
        <p class="module-card-desc">${skill.description}</p>
        <div class="module-tag-container">
          ${skill.tags.map((tag: any) => `<span class="module-tag" ${tag.color ? `style="border-color:${tag.color};color:${tag.color}"` : ''}>${tag.label}</span>`).join('')}
        </div>
        <div class="module-card__overlay"><span class="text-glow blink module-card-overlay-text">${skill.active ? 'status: ACTIVE' : 'executing...'}</span></div>
      </div>
    `).join('');
  }

  const projectsGrid = document.getElementById('projects-grid');
  if (projectsGrid) {
    projectsGrid.innerHTML = projectsData.map(project => `
      <div class="project-card">
        <div class="project-card__version">${project.version}</div>
        <div class="text-label-caps project-card-subtitle">${project.id}</div>
        <h4 class="text-headline-md project-card-title">${project.title}</h4>
        <p class="project-card-desc">${project.description}</p>
        <div class="project-card-badge-container">
          ${project.tags.map((tag: any) => {
            const classMod = tag.label.toLowerCase();
            return `<span class="tag ${tag.color ? `tag--${classMod}` : ''}">${tag.label}</span>`;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  const blogGrid = document.getElementById('blog-grid');
  if (blogGrid) {
    const renderBlogs = (filterCategory: string) => {
      const filteredBlogs = filterCategory === 'All' 
        ? blogData 
        : blogData.filter(post => post.category === filterCategory);
        
      blogGrid.innerHTML = filteredBlogs.map(post => `
        <div class="blog-card" data-category="${post.category}">
          <div class="blog-card-header">
            <span class="text-label-caps blog-card-date">${post.date}</span>
            <span class="text-code-block blink blog-card-status">[READ_FILE]</span>
          </div>
          <h3 class="text-display-md text-glow blog-card-title">${post.title}</h3>
          <p class="blog-card-summary">${post.summary}</p>
          <div class="blog-card-tags">
            <span class="blog-tag" style="border-color:var(--primary);color:var(--primary)">${post.category}</span>
            ${post.tags.map((tag: string) => `<span class="blog-tag">${tag}</span>`).join('')}
          </div>
        </div>
      `).join('');
    };

    // Initial render
    renderBlogs('All');

    // Setup filter listeners
    const filterContainer = document.getElementById('blog-filters');
    if (filterContainer) {
      const buttons = filterContainer.querySelectorAll('.blog-filter-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          const category = target.getAttribute('data-category') || 'All';
          
          // Update active state
          buttons.forEach(b => b.classList.remove('active'));
          target.classList.add('active');
          
          renderBlogs(category);
        });
      });
    }
  }
}
