// User Management Page
import { api } from '../../api.js';
import { showToast, formatDate, escapeHtml, debounce } from '../../utils.js';

export async function renderUserManagement(container) {
  container.innerHTML = `
    <div class="page-content page-enter">
      <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-6);">
        <div>
          <h1 style="margin-bottom: var(--spacing-1);">Quản lý người dùng</h1>
          <p class="text-muted" style="margin: 0;">Xem và quản lý tài khoản người dùng</p>
        </div>
        <div class="flex gap-2">
          <input type="text" id="user-search" class="form-input" placeholder="Tìm kiếm..." style="width: 250px;">
          <button class="btn btn-primary" id="btn-create-user">
            <span>+</span> Thêm người dùng
          </button>
        </div>
      </div>
      
      <div class="card">
        <div id="users-table">
          <div class="text-center" style="padding: var(--spacing-8);">
            <div class="loader" style="margin: 0 auto;"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- User Detail Modal -->
    <div class="modal-overlay" id="user-detail-modal">
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">Chi tiết người dùng</h3>
          <button class="modal-close" onclick="document.getElementById('user-detail-modal').classList.remove('active')">✕</button>
        </div>
        <div id="user-detail-content">
          <div class="text-center"><div class="loader" style="margin: 0 auto;"></div></div>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <div class="modal-overlay" id="create-user-modal">
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">Thêm người dùng mới</h3>
          <button class="modal-close" onclick="document.getElementById('create-user-modal').classList.remove('active')">✕</button>
        </div>
        <div class="modal-body">
          <form id="create-user-form">
            <div class="form-group">
              <label class="form-label">Tên đăng nhập</label>
              <input type="text" name="username" class="form-input" required minlength="3">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" name="email" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Mật khẩu</label>
              <input type="password" name="password" class="form-input" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">Vai trò</label>
              <select name="role" class="form-select">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="flex justify-end gap-2" style="margin-top: var(--spacing-6);">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('create-user-modal').classList.remove('active')">Hủy</button>
              <button type="submit" class="btn btn-primary">Tạo tài khoản</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  loadUsers();
  initUserManagementEvents();
}

async function loadUsers(page = 1, search = '') {
  const container = document.getElementById('users-table');
  
  try {
    const { users, totalPages, total } = await api.getUsers(page, search);
    
    container.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th style="text-align: right;">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td>${user.id}</td>
              <td style="font-weight: 500;">${escapeHtml(user.username)}</td>
              <td class="text-muted">${escapeHtml(user.email)}</td>
              <td>
                <span class="badge ${user.role === 'admin' ? 'badge-primary' : ''}">${user.role}</span>
              </td>
              <td>
                <span class="badge ${user.is_active ? 'badge-success' : 'badge-error'}">
                  ${user.is_active ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </td>
              <td class="text-muted">${formatDate(user.created_at)}</td>
              <td style="text-align: right;">
                <button class="btn btn-ghost btn-sm" data-action="view-user" data-id="${user.id}" title="Xem chi tiết">👁️</button>
                ${user.role !== 'admin' ? `
                  <button class="btn btn-ghost btn-sm" data-action="toggle-user" data-id="${user.id}" data-active="${user.is_active}" title="${user.is_active ? 'Khóa' : 'Mở khóa'}">
                    ${user.is_active ? '🔒' : '🔓'}
                  </button>
                  <button class="btn btn-ghost btn-sm text-error" data-action="delete-user" data-id="${user.id}" title="Xóa">
                    🗑️
                  </button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="flex justify-between items-center" style="margin-top: var(--spacing-4);">
        <div class="text-muted">Tổng: ${total} người dùng</div>
        ${totalPages > 1 ? `
          <div class="pagination">
            ${Array.from({length: Math.min(totalPages, 10)}, (_, i) => `
              <button class="pagination-btn ${i + 1 === page ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    initTableEvents();
  } catch (e) {
    container.innerHTML = `<p class="text-error text-center">Lỗi: ${e.message}</p>`;
  }
}

function initUserManagementEvents() {
  const searchInput = document.getElementById('user-search');
  searchInput?.addEventListener('input', debounce((e) => {
    loadUsers(1, e.target.value);
  }, 300));

  // Create User Modal
  const createBtn = document.getElementById('btn-create-user');
  const createModal = document.getElementById('create-user-modal');
  const createForm = document.getElementById('create-user-form');

  createBtn?.addEventListener('click', () => {
    createForm.reset();
    createModal.classList.add('active');
  });

  createForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(createForm);
    const data = Object.fromEntries(formData.entries());

    try {
      await api.createUser(data);
      showToast('Đã tạo người dùng mới thành công!');
      createModal.classList.remove('active');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function initTableEvents() {
  document.querySelectorAll('[data-action="view-user"]').forEach(btn => {
    btn.addEventListener('click', () => showUserDetail(btn.dataset.id));
  });

  document.querySelectorAll('[data-action="toggle-user"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const isActive = btn.dataset.active === 'true';
      
      if (!confirm(`Bạn có chắc muốn ${isActive ? 'khóa' : 'mở khóa'} tài khoản này?`)) return;
      
      try {
        await api.updateUser(id, { is_active: !isActive });
        showToast(`Đã ${isActive ? 'khóa' : 'mở khóa'} tài khoản!`);
        loadUsers();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-action="delete-user"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      
      if (!confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn người dùng này? Hành động này không thể hoàn tác!')) return;
      
      try {
        await api.deleteUser(id);
        showToast('Đã xóa người dùng thành công!');
        loadUsers();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  });

  document.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const search = document.getElementById('user-search')?.value || '';
      loadUsers(parseInt(btn.dataset.page), search);
    });
  });
}

async function showUserDetail(userId) {
  document.getElementById('user-detail-modal').classList.add('active');
  const content = document.getElementById('user-detail-content');
  content.innerHTML = '<div class="text-center"><div class="loader" style="margin: 0 auto;"></div></div>';
  
  try {
    const { user, stats, recentActivity, quizResults } = await api.getUserDetails(userId);
    
    content.innerHTML = `
      <div class="flex items-center gap-4" style="margin-bottom: var(--spacing-6);">
        <div class="avatar avatar-lg">${user.username.substring(0, 2).toUpperCase()}</div>
        <div>
          <h3 style="margin-bottom: var(--spacing-1);">${escapeHtml(user.username)}</h3>
          <p class="text-muted" style="margin: 0;">${escapeHtml(user.email)}</p>
        </div>
        <div style="margin-left: auto;">
          <span class="badge ${user.role === 'admin' ? 'badge-primary' : ''}">${user.role}</span>
          <span class="badge ${user.is_active ? 'badge-success' : 'badge-error'}" style="margin-left: var(--spacing-2);">
            ${user.is_active ? 'Hoạt động' : 'Đã khóa'}
          </span>
        </div>
      </div>
      
      <div class="grid grid-cols-2" style="gap: var(--spacing-4); margin-bottom: var(--spacing-6);">
        <div class="stat-card">
          <div class="stat-value">${stats?.total_reviews || 0}</div>
          <div class="stat-label">Lượt ôn tập</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: var(--success-500);">${stats?.words_learned || 0}</div>
          <div class="stat-label">Từ đã nhớ</div>
        </div>
      </div>
      
      <h4 style="margin-bottom: var(--spacing-3);">📊 Kết quả Quiz</h4>
      ${quizResults?.length ? `
        <div style="margin-bottom: var(--spacing-6);">
          ${quizResults.map(q => `
            <div class="flex justify-between items-center" style="padding: var(--spacing-2) 0; border-bottom: 1px solid var(--border-color);">
              <span>${q.quiz_type}</span>
              <div>
                <span class="text-muted">${q.attempts} lần</span>
                <span class="badge badge-primary" style="margin-left: var(--spacing-2);">${Math.round(q.avg_score)}%</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<p class="text-muted">Chưa làm quiz nào</p>'}
      
      <h4 style="margin-bottom: var(--spacing-3);">📅 Hoạt động gần đây</h4>
      ${recentActivity?.length ? `
        <div>
          ${recentActivity.slice(0, 7).map(a => `
            <div class="flex justify-between" style="padding: var(--spacing-2) 0;">
              <span class="text-muted">${a.date}</span>
              <span>${a.words_reviewed} từ</span>
            </div>
          `).join('')}
        </div>
      ` : '<p class="text-muted">Chưa có hoạt động</p>'}
    `;
  } catch (e) {
    content.innerHTML = `<p class="text-error">Lỗi: ${e.message}</p>`;
  }
}
