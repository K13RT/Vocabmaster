// Sidebar Component
import { auth } from '../auth.js';

export function renderSidebar() {
  const isAdmin = auth.isAdmin();
  
  return `
    <aside class="sidebar">
      <div class="sidebar-header" style="padding: var(--spacing-6); border-bottom: 1px solid var(--border-color);">
        <a href="#/" class="flex items-center gap-3" style="text-decoration: none;">
          <div style="width: 40px; height: 40px; background: var(--gradient-primary); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <span style="font-size: var(--font-size-xl); font-weight: 700; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">VocabMaster</span>
        </a>
      </div>
      
      <nav class="sidebar-nav" style="padding: var(--spacing-4); flex: 1; overflow-y: auto;">
        <div class="nav-section" style="margin-bottom: var(--spacing-6);">
          <div class="nav-section-title" style="font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--spacing-2); padding: 0 var(--spacing-3);">
            Menu chính
          </div>
          <a href="#/" class="nav-item" data-path="/">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Trang chủ
          </a>
          <a href="#/sets" class="nav-item" data-path="/sets">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            Bộ từ vựng
          </a>
          <a href="#/flashcards" class="nav-item" data-path="/flashcards">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
            Flashcards
          </a>
          <a href="#/flashcards?mode=difficult" class="nav-item" data-path="/flashcards/difficult">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Từ chưa thuộc
          </a>
          <a href="#/learned-words" class="nav-item" data-path="/learned-words">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Từ đã thuộc
          </a>
          <a href="#/quiz" class="nav-item" data-path="/quiz">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Kiểm tra
          </a>
          <a href="#/statistics" class="nav-item" data-path="/statistics">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Thống kê
          </a>
          <a href="#/leaderboard" class="nav-item" data-path="/leaderboard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            Bảng xếp hạng
          </a>
          <a href="#/settings" class="nav-item" data-path="/settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Cài đặt
          </a>
        </div>
        
        ${isAdmin ? `
        <div class="nav-section" style="margin-bottom: var(--spacing-6);">
          <div class="nav-section-title" style="font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--spacing-2); padding: 0 var(--spacing-3);">
            Quản trị
          </div>
          <a href="#/admin/users" class="nav-item" data-path="/admin/users">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Quản lý người dùng
          </a>
        </div>
        ` : ''}
      </nav>
      
      
      <div class="sidebar-footer" style="padding: var(--spacing-4); border-top: 1px solid var(--border-color);">
        <div class="stat-mini" style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <div id="sidebar-learned" style="font-size: var(--font-size-lg); font-weight: 600; color: var(--success-500);">0</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Đã nhớ</div>
          </div>
          <div>
            <div id="sidebar-progress" style="font-size: var(--font-size-lg); font-weight: 600; color: var(--warning-500);">0</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Đang học</div>
          </div>
          <div>
            <div id="sidebar-total" style="font-size: var(--font-size-lg); font-weight: 600; color: var(--primary-400);">0</div>
            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Tổng</div>
          </div>
        </div>
      </div>
    </aside>
    
    <style>
      .nav-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: var(--spacing-3) var(--spacing-4);
        color: var(--text-secondary);
        border-radius: var(--radius-lg);
        transition: all var(--transition-fast);
        margin-bottom: var(--spacing-1);
      }
      
      .nav-item:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }
      
      .nav-item.active {
        background: rgba(139, 92, 246, 0.1);
        color: var(--primary-400);
      }
      
      .nav-item.active svg {
        stroke: var(--primary-400);
      }
      
      @media (max-width: 1024px) {
        .lg-hidden { display: block; }
      }
      
      @media (min-width: 1025px) {
        .lg-hidden { display: none; }
      }
    </style>
  `;
}

export function updateSidebarActive(path) {
  document.querySelectorAll('.nav-item').forEach(item => {
    const itemPath = item.getAttribute('data-path');
    
    // Special handling for difficult words mode
    if (window.location.hash.includes('mode=difficult')) {
      if (itemPath === '/flashcards/difficult') {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    } else if (itemPath === path || (path.startsWith(itemPath) && itemPath !== '/')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

export async function updateSidebarStats() {
  try {
    const { api } = await import('../api.js');
    const { stats } = await api.getStats();
    
    document.getElementById('sidebar-learned').textContent = stats.learned || 0;
    document.getElementById('sidebar-progress').textContent = stats.inProgress || 0;
    document.getElementById('sidebar-total').textContent = stats.total || 0;
  } catch (e) {
    // Ignore errors
  }
}
