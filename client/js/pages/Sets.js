// Vocabulary Sets Page
import { api } from '../api.js';
import { auth } from '../auth.js';
import { showToast, formatDate, escapeHtml } from '../utils.js';

export async function renderSetsPage(container) {
  const isAdmin = auth.isAdmin();
  
  container.innerHTML = `
    <div class="page-content page-enter">
      <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-6);">
        <div>
          <h1 style="margin-bottom: var(--spacing-1);">Bộ từ vựng</h1>
          <p class="text-muted" style="margin: 0;">Quản lý và khám phá các bộ từ vựng</p>
        </div>
        <div class="flex gap-2">
          <input type="file" id="excel-upload" accept=".xlsx, .xls" style="display: none;">
          <button class="btn btn-secondary" onclick="document.getElementById('excel-upload').click()">
            📊 Import Excel
          </button>
          <button class="btn btn-secondary" id="ai-generate-btn">
            🤖 Tạo bằng AI
          </button>
          <button class="btn btn-primary" id="create-set-btn">
            + Tạo bộ mới
          </button>
        </div>
      </div>
      
      <div class="tabs" style="margin-bottom: var(--spacing-6);">
        <button class="tab active" data-tab="my-sets">Bộ từ của tôi</button>
        <button class="tab" data-tab="public-sets">Cộng đồng</button>
      </div>
      
      <div id="sets-container">
        <div class="text-center" style="padding: var(--spacing-12);">
          <div class="loader" style="margin: 0 auto;"></div>
        </div>
      </div>
    </div>
    
    <!-- Create/Edit Set Modal -->
    <div class="modal-overlay" id="set-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-title">Tạo bộ từ vựng mới</h3>
          <button class="modal-close" onclick="document.getElementById('set-modal').classList.remove('active')">✕</button>
        </div>
        <form id="set-form">
          <input type="hidden" id="set-id">
          <div class="form-group">
            <label class="form-label">Tên bộ từ *</label>
            <input type="text" id="set-name" class="form-input" placeholder="VD: Từ vựng IELTS" required>
          </div>
          <div class="form-group">
            <label class="form-label">Chủ đề</label>
            <input type="text" id="set-topic" class="form-input" placeholder="VD: IELTS, TOEIC, Business...">
          </div>
          <div class="form-group">
            <label class="form-label">Mô tả</label>
            <textarea id="set-description" class="form-input form-textarea" placeholder="Mô tả về bộ từ vựng..."></textarea>
          </div>
          ${isAdmin ? `
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: var(--spacing-2); cursor: pointer;">
              <input type="checkbox" id="set-public">
              <span>Chia sẻ công khai</span>
            </label>
          </div>
          ` : ''}
          <div style="display: flex; gap: var(--spacing-4); justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('set-modal').classList.remove('active')">Hủy</button>
            <button type="submit" class="btn btn-primary" id="save-set-btn">Lưu</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- AI Generate Modal -->
    <div class="modal-overlay" id="ai-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">🤖 Tạo từ vựng bằng AI</h3>
          <button class="modal-close" onclick="document.getElementById('ai-modal').classList.remove('active')">✕</button>
        </div>
        <form id="ai-form">
          <div class="form-group">
            <label class="form-label">Chủ đề *</label>
            <input type="text" id="ai-topic" class="form-input" placeholder="VD: Du lịch, Công nghệ, Ẩm thực..." required>
            <p style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: var(--spacing-1);">
              Nhập chủ đề bạn muốn học từ vựng
            </p>
          </div>
          <div class="form-group">
            <label class="form-label">Trình độ tiếng Anh</label>
            <select id="ai-level" class="form-input">
              <option value="beginner">Cơ bản (A1-A2)</option>
              <option value="intermediate" selected>Trung cấp (B1-B2)</option>
              <option value="advanced">Nâng cao (C1-C2)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Số lượng từ</label>
            <select id="ai-count" class="form-input">
              <option value="10">10 từ</option>
              <option value="20" selected>20 từ</option>
              <option value="30">30 từ</option>
            </select>
          </div>
          <div id="ai-status" style="display: none; margin-bottom: var(--spacing-4);">
            <div class="flex items-center gap-2" style="color: var(--primary-400);">
              <div class="loader" style="width: 20px; height: 20px;"></div>
              <span>Đang tạo từ vựng, vui lòng đợi...</span>
            </div>
          </div>
          <div style="display: flex; gap: var(--spacing-4); justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('ai-modal').classList.remove('active')">Hủy</button>
            <button type="submit" class="btn btn-primary" id="ai-generate-submit">
              🚀 Tạo ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  loadSets();
  initSetsEvents();
}

async function loadSets(page = 1) {
  const container = document.getElementById('sets-container');
  const activeTab = document.querySelector('.tab.active').dataset.tab;
  const isPublicTab = activeTab === 'public-sets';
  
  try {
    let data;
    let progressMap = {};

    if (isPublicTab) {
      data = await api.request(`/sets/public?page=${page}`);
    } else {
      const [setsData, progressData] = await Promise.all([
        api.getSets(page),
        api.getSetsProgress()
      ]);
      data = setsData;
      
      // Create a map for easy lookup
      if (progressData && progressData.progress) {
        progressData.progress.forEach(p => {
          progressMap[p.set_id] = p;
        });
      }
    }
    
    const { sets, totalPages } = data;
    
    if (!sets.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3 class="empty-state-title">${isPublicTab ? 'Chưa có bộ từ cộng đồng' : 'Chưa có bộ từ vựng'}</h3>
          <p class="empty-state-text">${isPublicTab ? 'Hãy quay lại sau.' : 'Tạo bộ từ vựng đầu tiên để bắt đầu học.'}</p>
          ${!isPublicTab ? `
          <button class="btn btn-primary" onclick="document.getElementById('set-modal').classList.add('active')">
            + Tạo bộ mới
          </button>
          ` : ''}
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="grid grid-cols-3">
        ${sets.map((set, i) => `
          <div class="card stagger-item" style="animation-delay: ${i * 0.05}s;">
            <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-4);">
              <div class="badge ${set.topic ? 'badge-primary' : ''}">${escapeHtml(set.topic || 'Chưa phân loại')}</div>
              ${!isPublicTab || set.user_id === auth.user?.id ? `
              <div class="dropdown" id="set-dropdown-${set.id}">
                <button class="btn btn-ghost btn-icon btn-sm" onclick="event.preventDefault(); document.getElementById('set-dropdown-${set.id}').classList.toggle('active')">
                  ⋮
                </button>
                <div class="dropdown-menu">
                  <button class="dropdown-item" data-action="edit" data-id="${set.id}">✏️ Chỉnh sửa</button>
                  <button class="dropdown-item" data-action="delete" data-id="${set.id}" style="color: var(--error-500);">🗑️ Xóa</button>
                </div>
              </div>
              ` : `<div class="text-muted" style="font-size: var(--font-size-xs);">bởi ${set.username || 'Admin'}</div>`}
            </div>
            <a href="#/sets/${set.id}">
              <h3 style="margin-bottom: var(--spacing-2);">
                ${escapeHtml(set.name)}
                ${!isPublicTab && progressMap[set.id]?.is_completed ? '<span title="Đã học xong" style="margin-left: 8px;">✅</span>' : ''}
              </h3>
              <p class="text-muted" style="margin-bottom: var(--spacing-4); font-size: var(--font-size-sm);">
                ${set.description ? escapeHtml(set.description.substring(0, 100)) + (set.description.length > 100 ? '...' : '') : 'Không có mô tả'}
              </p>
            </a>
            <div class="flex justify-between items-center text-muted" style="font-size: var(--font-size-sm);">
              <span>${set.word_count || 0} từ</span>
              <span>${formatDate(set.created_at)}</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${totalPages > 1 ? `
        <div class="pagination">
          ${Array.from({length: totalPages}, (_, i) => `
            <button class="pagination-btn ${i + 1 === page ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>
          `).join('')}
        </div>
      ` : ''}
    `;
    
    // Init dropdown and action events
    initSetActions();
  } catch (error) {
    container.innerHTML = `<div class="text-center text-error">Không thể tải dữ liệu: ${error.message}</div>`;
  }
}

function initSetsEvents() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show loading
      document.getElementById('sets-container').innerHTML = `
        <div class="text-center" style="padding: var(--spacing-12);">
          <div class="loader" style="margin: 0 auto;"></div>
        </div>
      `;
      
      loadSets();
    });
  });

  document.getElementById('create-set-btn')?.addEventListener('click', () => {
    document.getElementById('set-id').value = '';
    document.getElementById('set-name').value = '';
    document.getElementById('set-topic').value = '';
    document.getElementById('set-description').value = '';
    if (document.getElementById('set-public')) {
      document.getElementById('set-public').checked = false;
    }
    document.getElementById('modal-title').textContent = 'Tạo bộ từ vựng mới';
    document.getElementById('set-modal').classList.add('active');
  });

  document.getElementById('set-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('set-id').value;
    const name = document.getElementById('set-name').value.trim();
    const topic = document.getElementById('set-topic').value.trim();
    const description = document.getElementById('set-description').value.trim();
    const isPublic = document.getElementById('set-public') ? document.getElementById('set-public').checked : false;
    
    const btn = document.getElementById('save-set-btn');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    
    try {
      if (id) {
        await api.updateSet(id, { name, topic, description, is_public: isPublic });
        showToast('Cập nhật thành công!');
      } else {
        await api.createSet(name, topic, description, isPublic);
        showToast('Tạo bộ từ thành công!');
      }
      document.getElementById('set-modal').classList.remove('active');
      loadSets();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Lưu';
    }
  });

  // Excel upload event
  document.getElementById('excel-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const btn = document.querySelector('button[onclick*="excel-upload"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang import...';

    try {
      const result = await api.importExcelSet(file);
      showToast(`Import thành công! Đã thêm ${result.count} từ.`);
      loadSets();
    } catch (error) {
      console.error('Excel import error:', error);
      showToast(error.message || 'Lỗi khi import Excel', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
      e.target.value = ''; // Reset file input
    }
  });

  // AI Generation events
  document.getElementById('ai-generate-btn')?.addEventListener('click', () => {
    document.getElementById('ai-topic').value = '';
    document.getElementById('ai-level').value = 'intermediate';
    document.getElementById('ai-count').value = '20';
    document.getElementById('ai-status').style.display = 'none';
    document.getElementById('ai-modal').classList.add('active');
  });

  document.getElementById('ai-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const topic = document.getElementById('ai-topic').value.trim();
    const level = document.getElementById('ai-level').value;
    const count = parseInt(document.getElementById('ai-count').value);
    
    if (!topic) {
      showToast('Vui lòng nhập chủ đề!', 'error');
      return;
    }
    
    const btn = document.getElementById('ai-generate-submit');
    const status = document.getElementById('ai-status');
    
    btn.disabled = true;
    btn.textContent = 'Đang tạo...';
    status.style.display = 'block';
    
    try {
      const result = await api.generateVocabularyWithAI(topic, level, count);
      showToast(result.message || `Đã tạo thành công ${result.wordCount} từ!`);
      document.getElementById('ai-modal').classList.remove('active');
      
      // Navigate to the new set
      if (result.set && result.set.id) {
        window.location.hash = `#/sets/${result.set.id}`;
      } else {
        loadSets();
      }
    } catch (error) {
      console.error('AI generation error:', error);
      showToast(error.message || 'Lỗi khi tạo từ vựng bằng AI', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🚀 Tạo ngay';
      status.style.display = 'none';
    }
  });
}

function initSetActions() {
  document.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const { set } = await api.getSet(id);
      
      document.getElementById('set-id').value = set.id;
      document.getElementById('set-name').value = set.name;
      document.getElementById('set-topic').value = set.topic || '';
      document.getElementById('set-description').value = set.description || '';
      if (document.getElementById('set-public')) {
        document.getElementById('set-public').checked = set.is_public;
      }
      document.getElementById('modal-title').textContent = 'Chỉnh sửa bộ từ';
      document.getElementById('set-modal').classList.add('active');
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc muốn xóa bộ từ này? Tất cả từ vựng bên trong sẽ bị xóa.')) return;
      
      try {
        await api.deleteSet(btn.dataset.id);
        showToast('Đã xóa bộ từ!');
        loadSets();
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  });

  document.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => loadSets(parseInt(btn.dataset.page)));
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown.active').forEach(d => d.classList.remove('active'));
    }
  });
}
