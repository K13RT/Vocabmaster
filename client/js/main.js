// Main Application Entry Point
import { router } from './router.js';
import { auth } from './auth.js';
import { renderHeader, initHeaderEvents } from './components/Header.js';
import { renderSidebar, updateSidebarActive, updateSidebarStats } from './components/Sidebar.js';

// Pages
import { renderHomePage } from './pages/Home.js';
import { renderLoginPage } from './pages/Login.js';
import { renderRegisterPage } from './pages/Register.js';
import { renderSetsPage } from './pages/Sets.js';
import { renderSetDetailPage } from './pages/SetDetail.js';
import { renderFlashcardsPage, cleanupFlashcardsPage } from './pages/Flashcards.js';
import { renderQuizPage } from './pages/Quiz.js';
import { renderStatisticsPage } from './pages/Statistics.js';
import { renderLearnedWordsPage } from './pages/LearnedWords.js';
import { renderUserManagement } from './pages/admin/UserManagement.js';
import { Leaderboard } from './pages/Leaderboard.js';
import { Settings } from './pages/Settings.js';

// App container
const app = document.getElementById('app');

// Initialize app
async function init() {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);

  // Check authentication
  const isLoggedIn = await auth.init();

  // Setup routes
  setupRoutes();

  // Initial route
  if (!isLoggedIn && !window.location.hash.includes('/login') && !window.location.hash.includes('/register')) {
    router.navigate('/login');
  } else {
    router.handleRoute();
  }
}

function setupRoutes() {
  // Public routes
  router.addRoute('/login', (params) => {
    if (auth.isAuthenticated) {
      router.navigate('/');
      return;
    }
    renderLoginPage(app);
  });

  router.addRoute('/register', (params) => {
    if (auth.isAuthenticated) {
      router.navigate('/');
      return;
    }
    renderRegisterPage(app);
  });

  // Protected routes
  router.addRoute('/', (params) => {
    renderProtectedPage(renderHomePage, params, '/');
  });

  router.addRoute('/sets', (params) => {
    renderProtectedPage(renderSetsPage, params, '/sets');
  });

  router.addRoute('/sets/:id', (params) => {
    renderProtectedPage(renderSetDetailPage, params, '/sets');
  });

  router.addRoute('/flashcards', (params) => {
    renderProtectedPage(renderFlashcardsPage, params, '/flashcards');
  });

  router.addRoute('/quiz', (params) => {
    renderProtectedPage(renderQuizPage, params, '/quiz');
  });

  router.addRoute('/statistics', (params) => {
    renderProtectedPage(renderStatisticsPage, params, '/statistics');
  });

  router.addRoute('/learned-words', (params) => {
    renderProtectedPage(renderLearnedWordsPage, params, '/learned-words');
  });

  router.addRoute('/leaderboard', (params) => {
    renderProtectedPage((container) => {
      Leaderboard.render().then(html => {
        container.innerHTML = html;
        Leaderboard.afterRender();
      });
    }, params, '/leaderboard');
  });

  router.addRoute('/settings', (params) => {
    renderProtectedPage(async (container) => {
      container.innerHTML = await Settings.render();
      Settings.afterRender();
    }, params, '/settings');
  });

  // Admin routes
  router.addRoute('/admin/users', (params) => {
    renderProtectedPage(renderUserManagement, params, '/admin/users', true);
  });

  router.addRoute('/admin', (params) => {
    // Check admin
    if (!auth.isAuthenticated || !auth.isAdmin()) {
      router.navigate('/');
      return;
    }
    // Redirect to home (which now has admin dashboard)
    router.navigate('/');
  });
}

async function renderProtectedPage(pageRenderer, params, path, requireAdmin = false) {
  // Cleanup previous page
  if (typeof cleanupFlashcardsPage === 'function') {
    cleanupFlashcardsPage();
  }

  // Check auth
  if (!auth.isAuthenticated) {
    router.navigate('/login');
    return;
  }

  // Check admin
  if (requireAdmin && !auth.isAdmin()) {
    router.navigate('/');
    return;
  }

  // Render layout
  app.innerHTML = `
    <div class="app-layout">
      ${renderSidebar()}
      <main class="main-content">
        ${renderHeader()}
        <div id="page-container"></div>
      </main>
    </div>
  `;

  // Init header events
  initHeaderEvents();

  // Update sidebar
  updateSidebarActive(path);
  updateSidebarStats();

  // Render page content
  const pageContainer = document.getElementById('page-container');
  await pageRenderer(pageContainer, params);
}

// Start app
init();
