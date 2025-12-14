// Quiz Page
import { api } from '../api.js';
import { QuizManager } from '../components/Quiz.js';

export async function renderQuizPage(container, params) {
  const setId = params.setId;
  
  container.innerHTML = `
    <div class="page-content page-enter">
      <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-6);">
        <div>
          <h1 style="margin-bottom: var(--spacing-1);">Kiểm tra</h1>
          <p class="text-muted" style="margin: 0;" id="quiz-subtitle">Chọn bộ từ để bắt đầu</p>
        </div>
      </div>
      
      <div id="quiz-container">
        ${!setId ? await renderQuizSelector() : '<div class="text-center"><div class="loader" style="margin: 0 auto;"></div></div>'}
      </div>
    </div>
  `;

  if (setId) {
    startQuiz(setId);
  } else {
    // Attach events for selector
    attachSelectorEvents();
  }
}

function attachSelectorEvents() {
  document.querySelectorAll('input[name="quiz-set"]').forEach(input => {
    input.addEventListener('change', () => {
      const setId = document.querySelector('input[name="quiz-set"]:checked')?.value;
      const btn = document.getElementById('start-quiz-btn');
      if (btn) btn.disabled = !setId;
    });
  });
}

async function renderQuizSelector() {
  try {
    const { sets } = await api.getSets(1);
    
    if (!sets.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">❓</div>
          <h3 class="empty-state-title">Chưa có bộ từ vựng</h3>
          <p class="empty-state-text">Tạo bộ từ và thêm từ vựng để làm quiz.</p>
          <a href="#/sets" class="btn btn-primary">Tạo bộ mới</a>
        </div>
      `;
    }
    
    return `
      <div class="card" style="margin-bottom: var(--spacing-6);">
        <h3 style="margin-bottom: var(--spacing-4);">Chọn bộ từ vựng</h3>
        <div class="grid grid-cols-3" style="gap: var(--spacing-4);">
          ${sets.filter(s => s.word_count >= 4).map(set => `
            <label class="card set-selector-item" style="cursor: pointer; padding: var(--spacing-4);">
              <input type="radio" name="quiz-set" value="${set.id}" style="display: none;">
              <div style="font-weight: 500; margin-bottom: var(--spacing-1);">${set.name}</div>
              <div class="text-muted" style="font-size: var(--font-size-sm);">${set.word_count || 0} từ</div>
            </label>
          `).join('')}
          ${sets.filter(s => s.word_count < 4).length ? `
            <p class="text-muted" style="grid-column: 1/-1; margin-top: var(--spacing-2);">
              * Bộ từ cần ít nhất 4 từ để tạo quiz
            </p>
          ` : ''}
        </div>
      </div>
      
      <div class="text-center">
        <button class="btn btn-primary btn-lg" id="start-quiz-btn" disabled>
          Bắt đầu Quiz
        </button>
      </div>
      
      <style>
        .set-selector-item:has(input:checked) {
          border-color: var(--primary-500);
          background: rgba(139, 92, 246, 0.1);
        }
      </style>
    `;
  } catch (e) {
    return `<p class="text-error text-center">Lỗi: ${e.message}</p>`;
  }
}

async function startQuiz(setId) {
  try {
    // Limit to 10 random words
    const data = await api.getMultipleChoiceQuiz(setId, 10);
    const quiz = data.quiz;
    
    document.getElementById('quiz-subtitle').textContent = quiz.setName;
    
    const manager = new QuizManager('quiz-container', quiz);
    manager.render();
  } catch (e) {
    const container = document.getElementById('quiz-container');
    if (container) {
      // Check if it's a "no learned words" error
      const isNoLearnedWords = e.message.includes('chưa học') || e.message.includes('cần học');
      
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${isNoLearnedWords ? '📚' : '❌'}</div>
          <h3 class="empty-state-title">${isNoLearnedWords ? 'Chưa có từ đã học' : 'Lỗi'}</h3>
          <p class="empty-state-text">${e.message}</p>
          ${isNoLearnedWords ? `
            <div style="display: flex; gap: var(--spacing-4); justify-content: center; margin-top: var(--spacing-6);">
              <a href="#/flashcards?setId=${setId}" class="btn btn-primary">
                📖 Học Flashcard
              </a>
              <a href="#/quiz" class="btn btn-secondary">
                ← Quay lại
              </a>
            </div>
          ` : `
            <a href="#/quiz" class="btn btn-primary" style="margin-top: var(--spacing-6);">Quay lại</a>
          `}
        </div>
      `;
    }
  }
}

// Init events after render
document.addEventListener('click', (e) => {
  if (e.target.id === 'start-quiz-btn') {
    const setId = document.querySelector('input[name="quiz-set"]:checked')?.value;
    if (setId) {
      window.location.hash = `#/quiz?setId=${setId}`;
    }
  }
});
