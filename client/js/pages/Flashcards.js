// Flashcards Page
import { api } from '../api.js';
import { FlashcardViewer } from '../components/Flashcard.js';
import { showToast } from '../utils.js';
import { router } from '../router.js';

let currentViewer = null;
let sessionLimit = parseInt(localStorage.getItem('flashcard_session_limit') || '10');
const TODAY_KEY = new Date().toISOString().slice(0, 10);

function getCompletedIds(setId) {
  try {
    return JSON.parse(localStorage.getItem(`flashcard_completed_${setId}`) || '[]');
  } catch {
    return [];
  }
}

function saveCompletedIds(setId, ids) {
  localStorage.setItem(`flashcard_completed_${setId}`, JSON.stringify(ids));
}

export async function renderFlashcardsPage(container, params) {
  // Check for query params
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const setId = urlParams.get('setId');
  const mode = urlParams.get('mode'); // 'difficult' or null
  const todayMode = mode === 'today';

  let words = [];
  let title = 'Học Flashcards';
  let subtitle = 'Chọn bộ từ để bắt đầu học';
  let setData = null;

  // Render initial skeleton
  container.innerHTML = `
    <div class="page-content page-enter">
      <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-6);">
        <div>
          <h1 style="margin-bottom: var(--spacing-1);" id="fc-title">${title}</h1>
          <p class="text-muted" style="margin: 0;" id="fc-subtitle">${subtitle}</p>
        </div>
      </div>
      
      <div style="display: flex; gap: var(--spacing-4); align-items: center; margin-bottom: var(--spacing-4);">
        <div class="text-muted">Số từ trong phiên học:</div>
        <select id="session-limit" class="form-input" style="width: 120px;">
          <option value="10">10 từ</option>
          <option value="15">15 từ</option>
          <option value="20">20 từ</option>
          <option value="9999">Tất cả</option>
        </select>
      </div>
      
      <div id="progress-section" style="display: none; margin-bottom: var(--spacing-6);">
        <div class="card" style="padding: var(--spacing-4);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-3);">
            <div>
              <span style="font-weight: 600; color: var(--text-primary);">Tiến độ học tập</span>
            </div>
            <div style="display: flex; gap: var(--spacing-6);">
              <div style="text-align: center;">
                <div id="learned-count" style="font-size: var(--font-size-xl); font-weight: 700; color: var(--success-500);">0</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Đã nhớ</div>
              </div>
              <div style="text-align: center;">
                <div id="learning-count" style="font-size: var(--font-size-xl); font-weight: 700; color: var(--warning-500);">0</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Đang học</div>
              </div>
              <div style="text-align: center;">
                <div id="total-count" style="font-size: var(--font-size-xl); font-weight: 700; color: var(--primary-400);">0</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Tổng số</div>
              </div>
            </div>
          </div>
          <div class="progress" style="height: 8px;">
            <div id="progress-bar" class="progress-bar" style="width: 0%; background: var(--gradient-primary);"></div>
          </div>
          <div style="margin-top: var(--spacing-2); font-size: var(--font-size-sm); color: var(--text-secondary); text-align: center;">
            <span id="progress-text">0% hoàn thành</span>
          </div>
        </div>
      </div>
      
      <div id="content-area">
        <div class="text-center"><div class="loader" style="margin: 0 auto;"></div></div>
      </div>
    </div>
  `;

  // Apply saved session limit
  const select = document.getElementById('session-limit');
  if (select) {
    select.value = sessionLimit >= 9999 ? '9999' : String(sessionLimit);
    select.addEventListener('change', (e) => {
      sessionLimit = parseInt(e.target.value) || 10;
      localStorage.setItem('flashcard_session_limit', sessionLimit);
      // Re-render with new limit
      renderFlashcardsPage(container, params);
    });
  }

  try {
    if (mode === 'difficult') {
      document.getElementById('fc-title').textContent = 'Ôn tập từ chưa vững';
      document.getElementById('fc-subtitle').textContent = 'Các từ bạn đã đánh dấu là chưa thuộc';
      
      const response = await api.getDifficultWords();
      const allDifficultWords = response.words;
      
      if (allDifficultWords.length === 0) {
        showToast('Bạn không có từ nào chưa vững! Tuyệt vời! 🎉', 'success');
        router.navigate('/');
        return;
      }
      
      // Limit per session
      const limit = sessionLimit >= 9999 ? allDifficultWords.length : sessionLimit;
      words = allDifficultWords.slice(0, limit);
      
      // Update subtitle to show count
      const remaining = allDifficultWords.length - words.length;
      document.getElementById('fc-subtitle').textContent = remaining > 0
        ? `Ôn tập ${words.length} từ (còn ${remaining} từ chưa vững)`
        : `Ôn tập ${words.length} từ chưa vững`;
      
      initFlashcardViewer(words, 'difficult');
    } else if (setId) {
      const response = await api.getWords(setId);
      const allWords = response.words;
      setData = response.set;
      document.getElementById('fc-subtitle').textContent = response.set.name;
      
      if (allWords.length === 0) {
        document.getElementById('content-area').innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📚</div>
            <h3 class="empty-state-title">Chưa có từ vựng</h3>
            <p class="empty-state-text">Thêm từ vào bộ từ này để bắt đầu học.</p>
            <a href="#/sets/${setId}" class="btn btn-primary">Thêm từ</a>
          </div>
        `;
        return;
      }
      
      // Lọc bỏ các từ đã hoàn thành ở các phiên trước (local)
      const completed = new Set(getCompletedIds(setId));
      const remaining = allWords.filter(w => !completed.has(w.id));
      
      if (!remaining.length) {
        document.getElementById('content-area').innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">✅</div>
            <h3 class="empty-state-title">Bạn đã học hết bộ từ này</h3>
            <p class="empty-state-text">Có thể đặt lại tiến trình bằng cách xóa lịch sử đã học.</p>
          </div>
        `;
        return;
      }
      
      const limit = sessionLimit >= 9999 ? remaining.length : sessionLimit;
      words = remaining.slice(0, limit);
      
      // Hiển thị tiến độ phiên học
      initSessionProgress(words.length);
      updateSessionProgress(0, words.length);
      // Nút reset tiến trình
      addResetButton(setId);
      
      initFlashcardViewer(words, setId);
    } else {
      // Today mode or selector
      if (todayMode) {
        const stored = localStorage.getItem('today_review_words');
        const storedDate = localStorage.getItem('today_review_date');
        if (!stored || storedDate !== TODAY_KEY) {
          document.getElementById('content-area').innerHTML = `<p class="text-error text-center">Chưa có danh sách ôn hôm nay. Về trang chủ để tạo mới.</p>`;
        } else {
          words = JSON.parse(stored);
          document.getElementById('fc-title').textContent = 'Ôn 10 từ hôm nay';
          document.getElementById('fc-subtitle').textContent = `Phiên ôn ngày ${TODAY_KEY}`;
          initFlashcardViewer(words, 'today');
        }
      } else {
        // Show set selector
        loadSetSelector();
        loadDueWords();
      }
    }
  } catch (e) {
    console.error('Error loading flashcards:', e);
    document.getElementById('content-area').innerHTML = `<p class="text-error text-center">Lỗi: ${e.message}</p>`;
  }
}

function initSessionProgress(total) {
  document.getElementById('progress-section').style.display = 'block';
  document.getElementById('learned-count').textContent = 0;
  document.getElementById('learning-count').textContent = total;
  document.getElementById('total-count').textContent = total;
  updateSessionProgress(0, total);
}

function updateSessionProgress(done, total) {
  const remaining = Math.max(total - done, 0);
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('learned-count').textContent = done;
  document.getElementById('learning-count').textContent = remaining;
  document.getElementById('total-count').textContent = total;
  document.getElementById('progress-bar').style.width = `${percentage}%`;
  document.getElementById('progress-text').textContent = `${percentage}% hoàn thành`;
}

function addResetButton(setId) {
  const titleRow = document.querySelector('.page-content .flex');
  if (!titleRow || !setId) return;
  if (document.getElementById('reset-progress-btn')) return;
  
  const btn = document.createElement('button');
  btn.id = 'reset-progress-btn';
  btn.className = 'btn btn-ghost btn-sm';
  btn.style.marginLeft = 'auto';
  btn.textContent = 'Đặt lại tiến trình';
  btn.onclick = () => {
    if (!confirm('Đặt lại tiến trình đã học của bộ này?')) return;
    localStorage.removeItem(`flashcard_completed_${setId}`);
    localStorage.removeItem(`flashcard_progress_${setId}`);
    showToast('Đã đặt lại tiến trình. Bắt đầu lại từ đầu!', 'success');
    // Reload page to re-slice words
    const hash = window.location.hash;
    window.location.hash = '';
    setTimeout(() => { window.location.hash = hash; }, 10);
  };
  titleRow.appendChild(btn);
}

async function loadSetSelector() {
  try {
    const { sets } = await api.getSets(1);
    const container = document.getElementById('content-area');
    
    let html = `
      <div class="card" style="margin-bottom: var(--spacing-6);">
        <h3 style="margin-bottom: var(--spacing-4);">Chọn bộ từ vựng</h3>
        <div id="set-selector">
    `;
    
    if (!sets.length) {
      html += `<p class="text-muted">Chưa có bộ từ nào. <a href="#/sets">Tạo bộ mới</a></p>`;
    } else {
      html += `
        <div class="grid grid-cols-3" style="gap: var(--spacing-4);">
          ${sets.map(set => `
            <a href="#/flashcards?setId=${set.id}" class="card" style="padding: var(--spacing-4);">
              <div style="font-weight: 500; margin-bottom: var(--spacing-1);">${set.name}</div>
              <div class="text-muted" style="font-size: var(--font-size-sm);">${set.word_count || 0} từ</div>
            </a>
          `).join('')}
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
      
      <div class="card">
        <h3 style="margin-bottom: var(--spacing-4);">🔄 Từ cần ôn tập hôm nay</h3>
        <div id="due-words">
          <div class="text-center"><div class="loader" style="margin: 0 auto;"></div></div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  } catch (e) {
    document.getElementById('content-area').innerHTML = `<p class="text-error">Lỗi: ${e.message}</p>`;
  }
}

async function loadDueWords() {
  try {
    const { words } = await api.getDueWords(20);
    const container = document.getElementById('due-words');
    
    if (!words.length) {
      container.innerHTML = `<p class="text-muted text-center">Không có từ nào cần ôn tập! 🎉</p>`;
      return;
    }
    
    const limited = sessionLimit >= 9999 ? words : words.slice(0, sessionLimit);
    container.innerHTML = `
      <p style="margin-bottom: var(--spacing-4);">${limited.length}/${words.length} từ cần ôn tập</p>
      <button class="btn btn-primary" id="review-due-btn">Bắt đầu ôn tập</button>
    `;
    
    document.getElementById('review-due-btn')?.addEventListener('click', () => {
      initFlashcardViewer(limited, 'due');
    });
  } catch (e) {
    document.getElementById('due-words').innerHTML = `<p class="text-error">Lỗi: ${e.message}</p>`;
  }
}

function initFlashcardViewer(words, setId = null) {
  // Clean up previous viewer
  if (currentViewer) {
    currentViewer.destroy();
  }
  
  // Re-render container if needed
  const existingContainer = document.getElementById('flashcard-viewer');
  if (!existingContainer) {
    const content = document.getElementById('content-area');
    content.innerHTML = `<div id="flashcard-viewer"></div>`;
  }
  
  currentViewer = new FlashcardViewer(
    'flashcard-viewer', 
    words, 
    async (wordId, remembered) => {
      try {
        await api.reviewWord(wordId, remembered, remembered ? 4 : 2);
        
        // Update the word's remembered status in the local array
        const word = words.find(w => w.id === wordId);
        if (word) {
          word.remembered = remembered ? 1 : 0;
        }
        
      } catch (e) {
        console.error('Failed to save progress:', e);
      }
    },
    (index) => {
      // Save progress
      if (setId) {
        localStorage.setItem(`flashcard_progress_${setId}`, index);
      }
    },
    () => {
      // On complete
      if (setId === 'today') {
        localStorage.setItem('today_review_done', '1');
        localStorage.setItem('today_review_done_date', TODAY_KEY);
        showToast('Hoàn thành 10 từ hôm nay! Tuyệt vời!', 'success');
        setTimeout(() => router.navigate('/'), 800);
      } else if (setId) {
        // Mark session words as completed for this set
        const completed = new Set(getCompletedIds(setId));
        words.forEach(w => completed.add(w.id));
        saveCompletedIds(setId, Array.from(completed));
        showToast('Đã hoàn thành phiên học.', 'success');
        showCompletionOptions(setId);
      }
    },
    (done, total) => {
      updateSessionProgress(done, total);
    }
  );
  
  // Restore progress
  if (setId) {
    const savedIndex = localStorage.getItem(`flashcard_progress_${setId}`);
    if (savedIndex) {
      const index = parseInt(savedIndex);
      if (index > 0 && index < words.length) {
        currentViewer.currentIndex = index;
        showToast(`Đã khôi phục vị trí học: Từ ${index + 1}/${words.length}`);
      }
    }
  }
  
  currentViewer.render();
}

// Cleanup when leaving page
export function cleanupFlashcardsPage() {
  if (currentViewer) {
    currentViewer.destroy();
    currentViewer = null;
  }
}

async function showCompletionOptions(setId) {
  if (!setId) return;
  try {
    const { words: allWords } = await api.getWords(setId);
    const completedIds = new Set(getCompletedIds(setId));
    const remaining = allWords.filter(w => !completedIds.has(w.id));
    const container = document.getElementById('content-area');
    if (!container) return;
    container.innerHTML = `
      <div class="card" style="padding: var(--spacing-8); text-align: center;">
        <div style="font-size: var(--font-size-3xl); margin-bottom: var(--spacing-4);">🎉 Hoàn thành phiên học!</div>
        <p class="text-muted" style="margin-bottom: var(--spacing-6);">Bạn đã học xong ${allWords.length - remaining.length} từ. ${remaining.length ? `${remaining.length} từ còn lại sẽ được học ở phiên tiếp theo.` : 'Bạn đã học hết bộ từ này.'}</p>
        <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-3); justify-content: center;">
          ${remaining.length ? `<button class="btn btn-primary" id="btn-continue-10">Học tiếp 10 từ</button>` : ''}
          <button class="btn btn-secondary" id="btn-back-home">Về trang chủ</button>
          <button class="btn btn-success" id="btn-review-quiz">Kiểm tra các từ đã học</button>
        </div>
      </div>
    `;
    document.getElementById('btn-continue-10')?.addEventListener('click', () => {
      // Reload same hash to start next session
      const hash = window.location.hash;
      window.location.hash = '';
      setTimeout(() => { window.location.hash = hash; }, 10);
    });
    document.getElementById('btn-back-home')?.addEventListener('click', () => {
      router.navigate('/');
    });
    document.getElementById('btn-review-quiz')?.addEventListener('click', () => {
      router.navigate(`/quiz?setId=${setId}`);
    });
  } catch (e) {
    console.error('Failed to show completion options:', e);
    router.navigate('/');
  }
}
