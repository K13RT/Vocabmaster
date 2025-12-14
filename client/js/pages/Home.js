// Home Page
import { api } from '../api.js';
import { auth } from '../auth.js';
import { formatDate } from '../utils.js';

export async function renderHomePage(container) {
  const isAdmin = auth.isAdmin();
  
  let adminHtml = '';
  if (isAdmin) {
    adminHtml = `
      <div class="admin-section" style="margin-bottom: var(--spacing-8); padding-bottom: var(--spacing-8); border-bottom: 1px solid var(--border-color);">
        <div style="margin-bottom: var(--spacing-6);">
          <h2 style="margin-bottom: var(--spacing-1);">👑 Quản trị hệ thống</h2>
          <p class="text-muted" style="margin: 0;">Tổng quan hoạt động của ứng dụng</p>
        </div>
        
        <div class="grid grid-cols-4" style="margin-bottom: var(--spacing-6);" id="admin-stats">
          <div class="stat-card"><div class="loader" style="margin: 0 auto;"></div></div>
          <div class="stat-card"></div>
          <div class="stat-card"></div>
          <div class="stat-card"></div>
        </div>
        
        <div class="grid" style="grid-template-columns: 2fr 1fr; gap: var(--spacing-6); margin-bottom: var(--spacing-6);">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📊 Biểu đồ học tập</h3>
              <div class="tabs" id="report-tabs" style="margin: 0;">
                <button class="tab active" data-period="weekly" style="padding: 4px 12px; font-size: 12px;">Tuần</button>
                <button class="tab" data-period="monthly" style="padding: 4px 12px; font-size: 12px;">Tháng</button>
              </div>
            </div>
            <canvas id="admin-chart" height="200"></canvas>
          </div>
          
          <div class="card">
            <h3 class="card-title" style="margin-bottom: var(--spacing-4);">🏆 Top người dùng</h3>
            <div id="top-users">
              <div class="text-center"><div class="loader" style="margin: 0 auto;"></div></div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📝 Quản lý bài kiểm tra</h3>
            <button class="btn btn-primary btn-sm" id="create-test-btn">+ Tạo bài kiểm tra</button>
          </div>
          <div id="admin-tests-list">
            <div class="text-center"><div class="loader" style="margin: 0 auto;"></div></div>
          </div>
        </div>
      </div>
      
      <!-- Create Test Modal -->
      <div class="modal-overlay" id="create-test-modal">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title">📝 Tạo bài kiểm tra mới</h3>
            <button class="modal-close" onclick="document.getElementById('create-test-modal').classList.remove('active')">✕</button>
          </div>
          <form id="create-test-form">
            <div class="form-group">
              <label class="form-label">Tiêu đề bài kiểm tra *</label>
              <input type="text" id="test-title" class="form-input" placeholder="VD: Kiểm tra từ vựng IELTS" required>
            </div>
            <div class="form-group">
              <label class="form-label">Mô tả</label>
              <textarea id="test-description" class="form-input form-textarea" placeholder="Mô tả ngắn về bài kiểm tra"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Chọn bộ từ vựng</label>
              <select id="test-set-id" class="form-input">
                <option value="">-- Chọn bộ từ --</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Số lượng từ</label>
              <select id="test-word-count" class="form-input">
                <option value="5">5 từ</option>
                <option value="10" selected>10 từ</option>
                <option value="15">15 từ</option>
                <option value="20">20 từ</option>
              </select>
            </div>
            <div style="display: flex; gap: var(--spacing-4); justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('create-test-modal').classList.remove('active')">Hủy</button>
              <button type="submit" class="btn btn-primary" id="create-test-submit">Tạo bài kiểm tra</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Assign Test Modal -->
      <div class="modal-overlay" id="assign-test-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">👥 Giao bài cho người dùng</h3>
            <button class="modal-close" onclick="document.getElementById('assign-test-modal').classList.remove('active')">✕</button>
          </div>
          <form id="assign-test-form">
            <input type="hidden" id="assign-test-id">
            <div class="form-group">
              <label class="form-label">Chọn người dùng</label>
              <div id="user-checkboxes" style="max-height: 300px; overflow-y: auto;"></div>
            </div>
            <div style="display: flex; gap: var(--spacing-4); justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('assign-test-modal').classList.remove('active')">Hủy</button>
              <button type="submit" class="btn btn-primary">Giao bài</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="page-content page-enter">
      <div style="margin-bottom: var(--spacing-8);">
        <h1 style="margin-bottom: var(--spacing-2);">Xin chào, ${auth.user?.username}! 👋</h1>
        <p class="text-muted" style="margin: 0;">Sẵn sàng học từ vựng hôm nay chưa?</p>
      </div>
      
      ${adminHtml}
      
      <div class="grid grid-cols-4" style="margin-bottom: var(--spacing-8);" id="stats-grid">
        <div class="stat-card stagger-item">
          <div class="stat-value" id="stat-total">-</div>
          <div class="stat-label">Tổng từ vựng</div>
        </div>
        <div class="stat-card stagger-item">
          <div class="stat-value" style="background: linear-gradient(135deg, var(--success-500), var(--success-600)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;" id="stat-learned">-</div>
          <div class="stat-label">Đã nhớ</div>
        </div>
        <div class="stat-card stagger-item">
          <div class="stat-value" style="background: linear-gradient(135deg, var(--warning-500), var(--warning-600)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;" id="stat-progress">-</div>
          <div class="stat-label">Đang học</div>
        </div>
        <div class="stat-card stagger-item">
          <div class="stat-value" style="background: linear-gradient(135deg, var(--secondary-400), var(--secondary-600)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;" id="stat-due">-</div>
          <div class="stat-label">Cần ôn tập</div>
        </div>
      </div>
      
      <div class="card" id="today-review-card" style="margin-bottom: var(--spacing-6); display:none;">
        <div class="card-header">
          <h3 class="card-title">📅 Ôn tập hôm nay</h3>
        </div>
        <div id="today-review-content" style="padding: var(--spacing-4);">
          <div class="text-center"><div class="loader" style="margin: 0 auto;"></div></div>
        </div>
      </div>
      
      <div class="grid" style="grid-template-columns: 2fr 1fr; gap: var(--spacing-6);">
        <div>
          <div class="card" id="assigned-tests-card" style="margin-bottom: var(--spacing-6); display: none;">
            <div class="card-header">
              <h3 class="card-title">📋 Bài kiểm tra được giao</h3>
            </div>
            <div id="assigned-tests-list">
              <div class="text-center text-muted">Đang tải...</div>
            </div>
          </div>
          
          <div class="card" style="margin-bottom: var(--spacing-6);">
            <div class="card-header">
              <h3 class="card-title">🎯 Bắt đầu nhanh</h3>
            </div>
            <div class="quick-actions" style="
              display: grid;
              gap: var(--spacing-3);
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            ">
              <button class="btn btn-primary" style="justify-content: flex-start;" onclick="window.location.hash = '/flashcards'">
                <i class="fas fa-layer-group"></i>
                <span style="margin-left: 8px;">Học từ mới</span>
              </button>
              <button class="btn btn-success" style="justify-content: flex-start;" onclick="window.location.hash = '/quiz'">
                <i class="fas fa-graduation-cap"></i>
                <span style="margin-left: 8px;">Làm bài kiểm tra</span>
              </button>
              <button class="btn btn-warning" style="justify-content: flex-start;" onclick="window.location.hash = '/flashcards?mode=difficult'">
                <i class="fas fa-exclamation-triangle"></i>
                <span style="margin-left: 8px;">Ôn tập từ chưa vững</span>
              </button>
              <button class="btn btn-secondary" style="justify-content: flex-start;" onclick="window.location.hash = '/sets'">
                <i class="fas fa-list"></i>
                <span style="margin-left: 8px;">Quản lý bộ từ</span>
              </button>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📂 Bộ từ gần đây</h3>
              <a href="#/sets" class="btn btn-ghost btn-sm">Xem tất cả →</a>
            </div>
            <div id="recent-sets">
              <div class="text-center text-muted">Đang tải...</div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📊 Lịch sử Quiz</h3>
          </div>
          <div id="quiz-history">
            <div class="text-center text-muted">Đang tải...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Load stats
  loadHomeStats();
  loadRecentSets();
  loadQuizHistory();
  loadAssignedTests();
  loadTodayReview();
  
  if (isAdmin) {
    loadAdminData();
    initAdminEvents();
  }
}

async function loadHomeStats() {
  try {
    const { stats } = await api.getStats();
    const { words } = await api.getDueWords(100);
    
    document.getElementById('stat-total').textContent = stats.total || 0;
    document.getElementById('stat-learned').textContent = stats.learned || 0;
    document.getElementById('stat-progress').textContent = stats.inProgress || 0;
    document.getElementById('stat-due').textContent = words.length || 0;
  } catch (e) {
    console.error('Failed to load stats:', e);
    // Set default values on error
    document.getElementById('stat-total').textContent = '0';
    document.getElementById('stat-learned').textContent = '0';
    document.getElementById('stat-progress').textContent = '0';
    document.getElementById('stat-due').textContent = '0';
  }
}

async function loadRecentSets() {
  const container = document.getElementById('recent-sets');
  try {
    const { sets } = await api.getSets(1);
    
    if (!sets.length) {
      container.innerHTML = `
        <div class="empty-state" style="padding: var(--spacing-6);">
          <p class="text-muted">Chưa có bộ từ vựng nào.</p>
          <a href="#/sets" class="btn btn-primary btn-sm">Tạo bộ từ mới</a>
        </div>
      `;
      return;
    }
    
    container.innerHTML = sets.slice(0, 5).map(set => `
      <a href="#/sets/${set.id}" class="flex items-center justify-between" style="padding: var(--spacing-3); border-radius: var(--radius-lg); transition: background var(--transition-fast);" onmouseover="this.style.background='var(--bg-tertiary)'" onmouseout="this.style.background='transparent'">
        <div>
          <div style="font-weight: 500;">${set.name}</div>
          <div class="text-muted" style="font-size: var(--font-size-sm);">${set.word_count || 0} từ • ${set.topic || 'Chưa phân loại'}</div>
        </div>
        <span class="badge">${formatDate(set.created_at)}</span>
      </a>
    `).join('');
  } catch (e) {
    console.error('Failed to load recent sets:', e);
    container.innerHTML = `<div class="text-center text-muted" style="padding: var(--spacing-4);">Không thể tải dữ liệu.</div>`;
  }
}

async function loadQuizHistory() {
  const container = document.getElementById('quiz-history');
  try {
    const { history } = await api.getQuizHistory(5);
    
    if (!history.length) {
      container.innerHTML = `<p class="text-muted text-center" style="padding: var(--spacing-4);">Chưa có kết quả quiz.</p>`;
      return;
    }
    
    container.innerHTML = history.map(quiz => {
      const percentage = Math.round((quiz.score / quiz.total_questions) * 100);
      return `
        <div style="padding: var(--spacing-3) 0; border-bottom: 1px solid var(--border-color);">
          <div class="flex justify-between items-center">
            <div>
              <div style="font-weight: 500;">${quiz.set_name}</div>
              <div class="text-muted" style="font-size: var(--font-size-sm);">${quiz.quiz_type}</div>
            </div>
            <div class="badge ${percentage >= 80 ? 'badge-success' : percentage >= 50 ? 'badge-warning' : 'badge-error'}">
              ${percentage}%
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Failed to load quiz history:', e);
    container.innerHTML = `<div class="text-center text-muted" style="padding: var(--spacing-4);">Không thể tải dữ liệu.</div>`;
  }
}

async function loadAssignedTests() {
  const card = document.getElementById('assigned-tests-card');
  const container = document.getElementById('assigned-tests-list');
  if (!card || !container) return;
  
  try {
    const { tests } = await api.getAssignedTests();
    
    // Filter to show only incomplete tests
    const incompleteTests = tests.filter(t => !t.completed_at);
    
    if (!incompleteTests.length) {
      card.style.display = 'none';
      return;
    }
    
    card.style.display = 'block';
    container.innerHTML = incompleteTests.map(test => `
      <div style="padding: var(--spacing-3); border-bottom: 1px solid var(--border-color);">
        <div class="flex justify-between items-center">
          <div>
            <div style="font-weight: 500;">${test.title}</div>
            <div class="text-muted" style="font-size: var(--font-size-sm);">
              ${test.word_count} từ • Giao bởi ${test.created_by_name || 'Admin'}
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.location.hash = '/take-test/${test.test_id}'">
            Làm bài
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load assigned tests:', e);
    card.style.display = 'none';
  }
}

// Admin Functions
async function loadAdminData() {
  // Load overview stats
  try {
    const { stats } = await api.getAdminOverview();
    document.getElementById('admin-stats').innerHTML = `
      <div class="stat-card stagger-item">
        <div class="stat-value">${stats.totalUsers}</div>
        <div class="stat-label">Người dùng</div>
      </div>
      <div class="stat-card stagger-item">
        <div class="stat-value" style="background: var(--gradient-secondary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${stats.totalSets}</div>
        <div class="stat-label">Bộ từ vựng</div>
      </div>
      <div class="stat-card stagger-item">
        <div class="stat-value">${stats.totalWords}</div>
        <div class="stat-label">Tổng từ</div>
      </div>
      <div class="stat-card stagger-item">
        <div class="stat-value" style="color: var(--success-500);">${stats.activeToday}</div>
        <div class="stat-label">Hoạt động hôm nay</div>
      </div>
    `;
  } catch (e) {
    console.error('Failed to load admin stats:', e);
    document.getElementById('admin-stats').innerHTML = `<div class="col-span-4 text-center text-error">Không thể tải thống kê hệ thống</div>`;
  }

  // Load top users
  try {
    const { users } = await api.getTopUsers(5);
    document.getElementById('top-users').innerHTML = users.length ? users.map((user, i) => `
      <div class="flex items-center gap-3" style="padding: var(--spacing-2) 0; ${i < users.length - 1 ? 'border-bottom: 1px solid var(--border-color);' : ''}">
        <div class="avatar" style="width: 32px; height: 32px; font-size: var(--font-size-sm);">${i + 1}</div>
        <div style="flex: 1;">
          <div style="font-weight: 500;">${user.username}</div>
          <div class="text-muted" style="font-size: var(--font-size-xs);">${user.words_learned || 0} từ đã học</div>
        </div>
      </div>
    `).join('') : '<p class="text-muted text-center">Chưa có dữ liệu</p>';
  } catch (e) {
    console.error('Failed to load top users:', e);
    document.getElementById('top-users').innerHTML = `<p class="text-muted text-center">Không thể tải dữ liệu</p>`;
  }

  // Load chart
  loadAdminChart('weekly');
}

async function loadAdminChart(period) {
  try {
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    let data;
    if (period === 'weekly') {
      data = (await api.getWeeklyStats()).data;
    } else if (period === 'monthly') {
      data = (await api.getMonthlyStats()).data;
    } else {
      data = (await api.getYearlyStats()).data;
    }

    const labels = data.map(d => d.date || d.week || d.month);
    const values = data.map(d => d.words_reviewed);

    const ctx = document.getElementById('admin-chart')?.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (window.adminChart) {
      window.adminChart.destroy();
    }

    window.adminChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Từ đã ôn tập',
          data: values,
          backgroundColor: 'rgba(139, 92, 246, 0.5)',
          borderColor: '#8b5cf6',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#94a3b8' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  } catch (e) {
    console.error('Failed to load chart:', e);
    const canvas = document.getElementById('admin-chart');
    if (canvas?.parentElement) {
      canvas.parentElement.innerHTML = `<div class="text-error" style="padding: var(--spacing-4); text-align: center;">Không tải được biểu đồ. Kiểm tra kết nối và thử lại.</div>`;
    }
  }
}

// Today review block
async function loadTodayReview() {
  const card = document.getElementById('today-review-card');
  const content = document.getElementById('today-review-content');
  if (!card || !content) return;
  
  const todayKey = new Date().toISOString().slice(0, 10);
  const doneDate = localStorage.getItem('today_review_done_date');
  if (doneDate === todayKey) {
    card.style.display = 'block';
    content.innerHTML = `<p class="text-success">🎉 Bạn đã hoàn thành 10 từ ôn hôm nay. Tuyệt vời!</p>`;
    return;
  }
  
  try {
    const { words } = await api.getDueWords(200);
    const dueCount = words.length;
    card.style.display = 'block';
    
    if (!dueCount) {
      content.innerHTML = `<p class="text-muted">Hôm nay không có từ cần ôn. Tuyệt vời! 🎉</p>`;
      return;
    }
    
    // Shuffle and pick 10 random words
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const session = shuffled.slice(0, Math.min(10, shuffled.length));
    localStorage.setItem('today_review_words', JSON.stringify(session));
    localStorage.setItem('today_review_date', todayKey);
    localStorage.removeItem('today_review_done');
    localStorage.removeItem('today_review_done_date');
    
    content.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-4); align-items: center;">
        <div style="flex: 1; min-width: 220px;">
          <div style="font-weight: 600; margin-bottom: var(--spacing-1);">Phiên ôn hôm nay</div>
          <div class="text-muted" style="margin-bottom: var(--spacing-3);">${session.length} từ ngẫu nhiên từ các bộ của bạn</div>
          <button class="btn btn-primary" id="btn-review-today">Bắt đầu ôn 10 từ</button>
        </div>
      </div>
    `;
    
    document.getElementById('btn-review-today')?.addEventListener('click', () => {
      window.location.hash = '/flashcards?mode=today';
    });
  } catch (e) {
    console.error('Failed to load today review:', e);
    content.innerHTML = `<p class="text-error">Không thể tải dữ liệu ôn tập hôm nay.</p>`;
    card.style.display = 'block';
  }
}

function initAdminEvents() {
  document.querySelectorAll('#report-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#report-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadAdminChart(tab.dataset.period);
    });
  });

  // Create test button
  document.getElementById('create-test-btn')?.addEventListener('click', async () => {
    // Load vocabulary sets for dropdown
    try {
      const { sets } = await api.getSets(1);
      const select = document.getElementById('test-set-id');
      select.innerHTML = '<option value="">-- Chọn bộ từ --</option>' +
        sets.map(s => `<option value="${s.id}">${s.name} (${s.word_count || 0} từ)</option>`).join('');
    } catch (e) {
      console.error('Failed to load sets:', e);
      import('../utils.js').then(m => m.showToast('Không tải được danh sách bộ từ.', 'error'));
    }
    
    document.getElementById('test-title').value = '';
    document.getElementById('test-description').value = '';
    document.getElementById('test-set-id').value = '';
    document.getElementById('test-word-count').value = '10';
    document.getElementById('create-test-modal').classList.add('active');
  });

  // Create test form
  document.getElementById('create-test-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('test-title').value.trim();
    const description = document.getElementById('test-description').value.trim();
    const setId = document.getElementById('test-set-id').value;
    const wordCount = parseInt(document.getElementById('test-word-count').value);
    
    if (!title || !setId) {
      import('../utils.js').then(m => m.showToast('Vui lòng nhập tiêu đề và chọn bộ từ!', 'error'));
      return;
    }
    
    const btn = document.getElementById('create-test-submit');
    btn.disabled = true;
    btn.textContent = 'Đang tạo...';
    
    try {
      await api.createTestFromSet(title, description, setId, wordCount);
      document.getElementById('create-test-modal').classList.remove('active');
      import('../utils.js').then(m => m.showToast('Đã tạo bài kiểm tra thành công!'));
      loadAdminTests();
    } catch (error) {
      import('../utils.js').then(m => m.showToast(error.message, 'error'));
    } finally {
      btn.disabled = false;
      btn.textContent = 'Tạo bài kiểm tra';
    }
  });

  // Assign test form
  document.getElementById('assign-test-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const testId = document.getElementById('assign-test-id').value;
    const checkboxes = document.querySelectorAll('#user-checkboxes input[type="checkbox"]:checked');
    const userIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (userIds.length === 0) {
      import('../utils.js').then(m => m.showToast('Vui lòng chọn ít nhất 1 người dùng!', 'error'));
      return;
    }
    
    try {
      await api.assignTest(testId, userIds);
      document.getElementById('assign-test-modal').classList.remove('active');
      import('../utils.js').then(m => m.showToast(`Đã giao bài cho ${userIds.length} người dùng!`));
      loadAdminTests();
    } catch (error) {
      import('../utils.js').then(m => m.showToast(error.message, 'error'));
    }
  });

  // Load admin tests
  loadAdminTests();
}

async function loadAdminTests() {
  const container = document.getElementById('admin-tests-list');
  if (!container) return;
  
  try {
    const { tests } = await api.getAdminTests();
    
    if (!tests.length) {
      container.innerHTML = '<p class="text-muted text-center" style="padding: var(--spacing-4);">Chưa có bài kiểm tra nào. Nhấn "Tạo bài kiểm tra" để bắt đầu.</p>';
      return;
    }
    
    container.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Tiêu đề</th>
            <th>Số từ</th>
            <th>Đã giao</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${tests.map(test => `
            <tr>
              <td>
                <strong>${test.title}</strong>
                ${test.description ? `<br><small class="text-muted">${test.description}</small>` : ''}
              </td>
              <td>${test.word_count || 0}</td>
              <td>${test.assigned_count || 0} người</td>
              <td>${formatDate(test.created_at)}</td>
              <td>
                <div class="flex gap-2">
                  <button class="btn btn-secondary btn-sm" onclick="openAssignModal(${test.id})">👥 Giao bài</button>
                  <button class="btn btn-ghost btn-sm" onclick="exportTestCsv(${test.id}, '${test.title.replace(/'/g, "\\'")}')">⬇️ CSV</button>
                  <button class="btn btn-ghost btn-sm" onclick="deleteTest(${test.id})" style="color: var(--error-500);">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error('Failed to load admin tests:', e);
    container.innerHTML = '<p class="text-error text-center">Không thể tải danh sách bài kiểm tra</p>';
  }
}

// Global functions for onclick handlers
window.openAssignModal = async function(testId) {
  document.getElementById('assign-test-id').value = testId;
  
  // Load users
  try {
    const { users } = await api.getTestUsers();
    const container = document.getElementById('user-checkboxes');
    
    if (!users.length) {
      container.innerHTML = '<p class="text-muted">Không có người dùng nào.</p>';
      return;
    }
    
    container.innerHTML = users.map(user => `
      <label style="display: flex; align-items: center; gap: var(--spacing-2); padding: var(--spacing-2); cursor: pointer;">
        <input type="checkbox" value="${user.id}">
        <span>${user.username}</span>
        <span class="text-muted" style="font-size: var(--font-size-sm);">(${user.email})</span>
      </label>
    `).join('');
    
    document.getElementById('assign-test-modal').classList.add('active');
  } catch (e) {
    console.error('Failed to load users:', e);
    import('../utils.js').then(m => m.showToast('Không tải được danh sách người dùng.', 'error'));
  }
};

window.deleteTest = async function(testId) {
  if (!confirm('Bạn có chắc muốn xóa bài kiểm tra này?')) return;
  
  try {
    await api.deleteAdminTest(testId);
    import('../utils.js').then(m => m.showToast('Đã xóa bài kiểm tra!'));
    loadAdminTests();
  } catch (error) {
    import('../utils.js').then(m => m.showToast(error.message, 'error'));
  }
};

window.exportTestCsv = async function(testId, title) {
  try {
    const { results } = await api.getAdminTestResults(testId);
    if (!results.length) {
      import('../utils.js').then(m => m.showToast('Chưa có kết quả để xuất.', 'warning'));
      return;
    }
    const header = ['username', 'email', 'score', 'total_questions', 'completed_at', 'assigned_at'];
    const lines = [header.join(',')].concat(
      results.map(r => [
        r.username,
        r.email,
        r.score ?? '',
        r.total_questions ?? '',
        r.completed_at || '',
        r.assigned_at || ''
      ].map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))
    );
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'test'}-results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    import('../utils.js').then(m => m.showToast('Đã xuất CSV', 'success'));
  } catch (error) {
    console.error('Export CSV failed:', error);
    import('../utils.js').then(m => m.showToast('Không thể xuất CSV', 'error'));
  }
};
