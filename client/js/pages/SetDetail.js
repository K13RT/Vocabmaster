// Set Detail Page
import { api } from '../api.js';
import { auth } from '../auth.js';
import { showToast, formatDate, escapeHtml } from '../utils.js';
import { router } from '../router.js';

export async function renderSetDetailPage(container, params) {
  const setId = params.id;
  
  container.innerHTML = `
    <div class="page-content page-enter">
      <div id="set-detail-content">
        <div class="text-center" style="padding: var(--spacing-12);">
          <div class="loader" style="margin: 0 auto;"></div>
        </div>
      </div>
    </div>
    
    <!-- Add/Edit Word Modal -->
    <div class="modal-overlay" id="word-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="word-modal-title">Thêm từ mới</h3>
          <button class="modal-close" onclick="document.getElementById('word-modal').classList.remove('active')">✕</button>
        </div>
        <form id="word-form">
          <input type="hidden" id="word-id">
          <div class="form-group">
            <label class="form-label">Từ vựng *</label>
            <input type="text" id="word-text" class="form-input" placeholder="VD: achievement" required>
          </div>
          <div class="form-group">
            <label class="form-label">Loại từ</label>
            <input type="text" id="word-type" class="form-input" placeholder="VD: n, v, adj...">
          </div>
          <div class="form-group">
            <label class="form-label">Phiên âm</label>
            <input type="text" id="word-phonetic" class="form-input" placeholder="VD: /əˈtʃiːvmənt/">
          </div>
          <div class="form-group">
            <label class="form-label">Nghĩa *</label>
            <input type="text" id="word-meaning" class="form-input" placeholder="VD: thành tựu, thành công" required>
          </div>
          <div class="form-group">
            <label class="form-label">Giải thích (Anh-Anh)</label>
            <textarea id="word-explain" class="form-input form-textarea" placeholder="VD: something very good and difficult that you have succeeded in doing"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Ví dụ</label>
            <textarea id="word-example" class="form-input form-textarea" placeholder="VD: Her greatest achievement was winning the gold medal."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Dịch ví dụ</label>
            <textarea id="word-example-vietnamese" class="form-input form-textarea" placeholder="VD: Thành tựu lớn nhất của cô ấy là giành huy chương vàng."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">File audio</label>
            <input type="file" id="word-audio" class="form-input" accept="audio/*">
          </div>
          <div style="display: flex; gap: var(--spacing-4); justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('word-modal').classList.remove('active')">Hủy</button>
            <button type="submit" class="btn btn-primary" id="save-word-btn">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  `;

  loadSetDetail(setId);
  initStaticEvents(setId);
}

function initStaticEvents(setId) {
  document.getElementById('word-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('word-id').value;
    const word = document.getElementById('word-text').value.trim();
    const meaning = document.getElementById('word-meaning').value.trim();
    const phonetic = document.getElementById('word-phonetic').value.trim();
    const type = document.getElementById('word-type').value.trim();
    const explain = document.getElementById('word-explain').value.trim();
    const example = document.getElementById('word-example').value.trim();
    const exampleVietnamese = document.getElementById('word-example-vietnamese').value.trim();
    const audioFile = document.getElementById('word-audio').files[0];
    
    const btn = document.getElementById('save-word-btn');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    
    try {
      const wordData = { 
        word, 
        meaning, 
        phonetic, 
        type, 
        explain, 
        example, 
        example_vietnamese: exampleVietnamese 
      };

      if (audioFile) {
        wordData.audio = audioFile;
      }

      if (id) {
        await api.updateWord(id, wordData);
        showToast('Cập nhật thành công!');
      } else {
        await api.createWord(setId, wordData);
        showToast('Thêm từ thành công!');
      }
      document.getElementById('word-modal').classList.remove('active');
      loadSetDetail(setId);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Lưu';
    }
  });
}

async function loadSetDetail(setId) {
  const content = document.getElementById('set-detail-content');
  
  try {
    const { words, set } = await api.getWords(setId);
    const isOwner = auth.user && set.user_id === auth.user.id;
    const isLocked = !!set.is_locked;
    
    content.innerHTML = `
      <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-6);">
        <div>
          <div class="flex items-center gap-4" style="margin-bottom: var(--spacing-2);">
            <a href="#/sets" class="btn btn-ghost btn-sm">← Quay lại</a>
            <div class="badge badge-primary">${escapeHtml(set.topic || 'Chưa phân loại')}</div>
            ${isLocked ? '<div class="badge badge-secondary">Đã khóa chỉnh sửa</div>' : ''}
          </div>
          <h1 style="margin-bottom: var(--spacing-1);">${escapeHtml(set.name)}</h1>
          <p class="text-muted" style="margin: 0;">
            ${set.word_count || 0} từ • Tạo ${formatDate(set.created_at)}
            ${!isOwner ? `• Bởi <strong>${escapeHtml(set.username || 'Unknown')}</strong>` : ''}
          </p>
        </div>
        <div class="flex gap-4">
          <a href="#/flashcards?setId=${setId}" class="btn btn-secondary">📚 Học Flashcard</a>
          ${isOwner ? `
            ${auth.isAdmin() ? `
              <button class="btn ${set.is_public ? 'btn-success' : 'btn-secondary'}" id="share-set-btn" data-public="${set.is_public ? '1' : '0'}">
                ${set.is_public ? '✅ Đã chia sẻ' : '🔗 Chia sẻ cho tất cả'}
              </button>
              <button class="btn ${isLocked ? 'btn-secondary' : 'btn-warning'}" id="lock-set-btn" data-locked="${isLocked ? '1' : '0'}">
                ${isLocked ? '🔒 Đã khóa chỉnh sửa' : '🔓 Khóa chỉnh sửa'}
              </button>
            ` : ''}
            <button class="btn btn-primary" id="add-word-btn" ${isLocked && !auth.isAdmin() ? 'disabled' : ''}>+ Thêm từ</button>
          ` : `
            <button class="btn btn-primary" id="import-set-btn">⬇️ Lưu về bộ từ vựng cá nhân</button>
          `}
        </div>
      </div>
      
      ${set.description ? `<p class="text-muted" style="margin-bottom: var(--spacing-6);">${escapeHtml(set.description)}</p>` : ''}
      
      <div class="card">
        ${words.length ? `
          <table class="table">
            <thead>
              <tr>
                <th style="width: 20%;">Từ vựng</th>
                <th style="width: 10%;">Loại</th>
                <th style="width: 25%;">Nghĩa</th>
                <th style="width: 35%;">Ví dụ</th>
                <th style="width: 10%; text-align: right;">${isOwner ? 'Thao tác' : ''}</th>
              </tr>
            </thead>
            <tbody>
              ${words.map(word => `
                <tr>
                  <td>
                    <div style="font-weight: 500;">${escapeHtml(word.word)}</div>
                    ${word.phonetic ? `<div class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(word.phonetic)}</div>` : ''}
                    ${word.audio_path ? `<button class="btn btn-ghost btn-sm" onclick="new Audio('${word.audio_path}').play()">🔊</button>` : ''}
                  </td>
                  <td>${word.type ? `<span class="badge badge-secondary">${escapeHtml(word.type)}</span>` : '-'}</td>
                  <td>
                    <div>${escapeHtml(word.meaning)}</div>
                    ${word.explain ? `<div class="text-muted" style="font-size: var(--font-size-sm); font-style: italic;">${escapeHtml(word.explain)}</div>` : ''}
                  </td>
                  <td class="text-muted">
                    ${word.example ? `<div>${escapeHtml(word.example)}</div>` : ''}
                    ${word.example_vietnamese ? `<div style="font-style: italic;">${escapeHtml(word.example_vietnamese)}</div>` : ''}
                    ${!word.example && !word.example_vietnamese ? '-' : ''}
                  </td>
                  <td style="text-align: right;">
                    ${isOwner ? `
                      <button class="btn btn-ghost btn-sm" data-action="edit-word" data-word='${JSON.stringify(word).replace(/'/g, "&#39;")}' ${isLocked && !auth.isAdmin() ? 'disabled' : ''}>✏️</button>
                      <button class="btn btn-ghost btn-sm" data-action="delete-word" data-id="${word.id}" style="color: var(--error-500);" ${isLocked && !auth.isAdmin() ? 'disabled' : ''}>🗑️</button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <h3 class="empty-state-title">Chưa có từ vựng</h3>
            <p class="empty-state-text">Thêm từ vựng đầu tiên vào bộ từ này.</p>
          </div>
        `}
      </div>
    `;

    initDynamicEvents(setId, isLocked);
  } catch (error) {
    content.innerHTML = `<div class="text-center text-error">Không thể tải dữ liệu: ${error.message}</div>`;
  }
}

function initDynamicEvents(setId, isLocked) {
  // Share button for admin
  document.getElementById('share-set-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('share-set-btn');
    const isCurrentlyPublic = btn.dataset.public === '1';
    const newPublicStatus = !isCurrentlyPublic;
    
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';
    
    try {
      await api.updateSet(setId, { is_public: newPublicStatus });
      
      btn.dataset.public = newPublicStatus ? '1' : '0';
      btn.className = `btn ${newPublicStatus ? 'btn-success' : 'btn-secondary'}`;
      btn.textContent = newPublicStatus ? '✅ Đã chia sẻ' : '🔗 Chia sẻ cho tất cả';
      
      showToast(newPublicStatus ? 'Đã chia sẻ bộ từ cho tất cả người dùng!' : 'Đã hủy chia sẻ công khai');
    } catch (error) {
      showToast(error.message, 'error');
      btn.textContent = isCurrentlyPublic ? '✅ Đã chia sẻ' : '🔗 Chia sẻ cho tất cả';
    } finally {
      btn.disabled = false;
    }
  });

  // Lock button for admin
  document.getElementById('lock-set-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('lock-set-btn');
    const isCurrentlyLocked = btn.dataset.locked === '1';
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';
    try {
      const updated = await api.updateSet(setId, { is_locked: !isCurrentlyLocked });
      btn.dataset.locked = updated.set.is_locked ? '1' : '0';
      btn.className = `btn ${updated.set.is_locked ? 'btn-secondary' : 'btn-warning'}`;
      btn.textContent = updated.set.is_locked ? '🔒 Đã khóa chỉnh sửa' : '🔓 Khóa chỉnh sửa';
      showToast(updated.set.is_locked ? 'Đã khóa chỉnh sửa bộ từ.' : 'Đã mở khóa chỉnh sửa.');
      loadSetDetail(setId);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // Owner events
  document.getElementById('add-word-btn')?.addEventListener('click', () => {
    if (isLocked && !auth.isAdmin()) {
      showToast('Bộ từ đã bị khóa, không thể chỉnh sửa.', 'error');
      return;
    }
    document.getElementById('word-id').value = '';
    document.getElementById('word-text').value = '';
    document.getElementById('word-meaning').value = '';
    document.getElementById('word-phonetic').value = '';
    document.getElementById('word-type').value = '';
    document.getElementById('word-explain').value = '';
    document.getElementById('word-example').value = '';
    document.getElementById('word-example-vietnamese').value = '';
    document.getElementById('word-audio').value = '';
    document.getElementById('word-modal-title').textContent = 'Thêm từ mới';
    document.getElementById('word-modal').classList.add('active');
  });

  document.querySelectorAll('[data-action="edit-word"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isLocked && !auth.isAdmin()) {
        showToast('Bộ từ đã bị khóa, không thể chỉnh sửa.', 'error');
        return;
      }
      const word = JSON.parse(btn.dataset.word);
      document.getElementById('word-id').value = word.id;
      document.getElementById('word-text').value = word.word;
      document.getElementById('word-meaning').value = word.meaning;
      document.getElementById('word-phonetic').value = word.phonetic || '';
      document.getElementById('word-type').value = word.type || '';
      document.getElementById('word-explain').value = word.explain || '';
      document.getElementById('word-example').value = word.example || '';
      document.getElementById('word-example-vietnamese').value = word.example_vietnamese || '';
      document.getElementById('word-modal-title').textContent = 'Chỉnh sửa từ';
      document.getElementById('word-modal').classList.add('active');
    });
  });

  document.querySelectorAll('[data-action="delete-word"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (isLocked && !auth.isAdmin()) {
        showToast('Bộ từ đã bị khóa, không thể chỉnh sửa.', 'error');
        return;
      }
      if (!confirm('Bạn có chắc muốn xóa từ này?')) return;
      try {
        await api.deleteWord(btn.dataset.id);
        showToast('Đã xóa từ!');
        loadSetDetail(setId);
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  });

  // Import event
  document.getElementById('import-set-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('import-set-btn');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    
    try {
      await api.importSet(setId);
      showToast('Đã lưu bộ từ vựng thành công!');
      // Navigate to the sets list
      router.navigate('/sets');
    } catch (error) {
      showToast(error.message, 'error');
      btn.disabled = false;
      btn.textContent = '⬇️ Lưu về bộ từ vựng cá nhân';
    }
  });
}
