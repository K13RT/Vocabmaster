// Header Component
import { auth } from '../auth.js';
import { getInitials } from '../utils.js';

export function renderHeader() {
  const user = auth.user;
  
  return `
    <header class="header">
      <div class="flex items-center gap-4">
        <button id="menu-toggle" class="btn btn-ghost btn-icon lg-hidden">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="flex items-center gap-4">
        <button id="theme-toggle" class="btn btn-ghost btn-icon" title="Chuyển theme">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>
        
        <div class="dropdown" id="user-dropdown">
          <button class="flex items-center gap-2" onclick="document.getElementById('user-dropdown').classList.toggle('active')">
            <div class="avatar">${getInitials(user?.username || 'U')}</div>
            <span>${user?.username || 'User'}</span>
          </button>
          <div class="dropdown-menu">
            <a href="#/profile" class="dropdown-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Hồ sơ
            </a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" id="logout-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

export function initHeaderEvents() {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    auth.logout();
  });

  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('open');
  });

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme') || 'dark';
    body.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
    localStorage.setItem('theme', currentTheme === 'dark' ? 'light' : 'dark');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
}
