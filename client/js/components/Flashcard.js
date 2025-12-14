// Flashcard Component
import { playAudio, escapeHtml } from '../utils.js';

export class FlashcardViewer {
  constructor(containerId, words, onReview, onCardChange, onComplete, onProgress) {
    this.container = document.getElementById(containerId);
    this.words = [...words]; // mutable queue
    this.totalCount = words.length;
    this.completedCount = 0;
    this.currentIndex = 0;
    this.isFlipped = false;
    this.showExample = true;
    this.showPhonetic = true;
    this.mode = 'random'; // 'sequential' | 'random'
    this.onReview = onReview;
    this.onCardChange = onCardChange;
    this.onComplete = onComplete;
    this.onProgress = onProgress;
    
    if (this.mode === 'random') {
      this.shuffleWords();
    }
  }

  shuffleWords() {
    for (let i = this.words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
    }
  }

  render() {
    if (!this.words.length) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3 class="empty-state-title">Không có từ vựng</h3>
          <p class="empty-state-text">Thêm từ vựng vào bộ từ để bắt đầu học.</p>
        </div>
      `;
      return;
    }

    const word = this.words[this.currentIndex];
    
    this.container.innerHTML = `
      <div class="flashcard-wrapper">
        <div class="flashcard-options" style="display: flex; justify-content: center; gap: var(--spacing-4); margin-bottom: var(--spacing-6);">
          <label style="display: flex; align-items: center; gap: var(--spacing-2); cursor: pointer;">
            <input type="checkbox" id="show-example" ${this.showExample ? 'checked' : ''}>
            <span style="color: var(--text-secondary);">Hiện ví dụ</span>
          </label>
          <label style="display: flex; align-items: center; gap: var(--spacing-2); cursor: pointer;">
            <input type="checkbox" id="show-phonetic" ${this.showPhonetic ? 'checked' : ''}>
            <span style="color: var(--text-secondary);">Hiện phiên âm</span>
          </label>
          <select id="flashcard-mode" class="form-input" style="width: auto;">
            <option value="sequential" ${this.mode === 'sequential' ? 'selected' : ''}>Tuần tự</option>
            <option value="random" ${this.mode === 'random' ? 'selected' : ''}>Ngẫu nhiên</option>
          </select>
        </div>
        
        <div class="flashcard-container" id="flashcard">
          <div class="flashcard ${this.isFlipped ? 'flipped' : ''}">
            <div class="flashcard-face flashcard-front">
              <button class="btn btn-ghost btn-icon btn-sm favorite-btn ${word.is_favorite ? 'active' : ''}" 
                      id="toggle-favorite" 
                      onclick="event.stopPropagation();"
                      style="position: absolute; top: 1rem; right: 1rem; color: ${word.is_favorite ? 'var(--error-500)' : 'var(--text-muted)'}; font-size: 1.5rem;">
                ${word.is_favorite ? '❤️' : '🤍'}
              </button>
              
              <div class="flashcard-word">${escapeHtml(word.word)}</div>
              ${this.showPhonetic && word.phonetic ? `<div class="flashcard-phonetic">${escapeHtml(word.phonetic)}</div>` : ''}
              ${word.audio_path ? `
                <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();" id="play-audio">
                  🔊 Phát âm
                </button>
              ` : ''}
              <p style="color: var(--text-secondary); margin-top: var(--spacing-4);">Nhấn để lật thẻ</p>
            </div>
            <div class="flashcard-face flashcard-back">
              <div class="flashcard-meaning">${escapeHtml(word.meaning)}</div>
              ${this.showExample && word.example ? `<div class="flashcard-example">"${escapeHtml(word.example)}"</div>` : ''}
            </div>
          </div>
        </div>
        
        <div class="flashcard-nav">
          <button class="flashcard-nav-btn" id="prev-card" ${this.currentIndex === 0 ? 'disabled' : ''}>
            ←
          </button>
          <div class="flashcard-counter">
            ${this.currentIndex + 1} / ${this.words.length}
          </div>
          <button class="flashcard-nav-btn" id="next-card" ${this.currentIndex === this.words.length - 1 ? 'disabled' : ''}>
            →
          </button>
        </div>
        
        <div class="flashcard-actions">
          <button class="btn btn-not-remembered" id="not-remembered">
            ❌ Chưa nhớ
          </button>
          <button class="btn btn-remembered" id="remembered">
            ✓ Đã nhớ
          </button>
        </div>
      </div>
    `;

    this.initEvents();
  }

  initEvents() {
    const flashcard = document.getElementById('flashcard');
    flashcard?.addEventListener('click', () => this.flip());

    document.getElementById('prev-card')?.addEventListener('click', () => this.prev());
    document.getElementById('next-card')?.addEventListener('click', () => this.next());
    
    document.getElementById('play-audio')?.addEventListener('click', (e) => {
      e.stopPropagation();
      playAudio(this.words[this.currentIndex].audio_path);
    });

    document.getElementById('toggle-favorite')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const word = this.words[this.currentIndex];
      const btn = e.currentTarget;
      
      // Optimistic UI update
      word.is_favorite = !word.is_favorite;
      btn.textContent = word.is_favorite ? '❤️' : '🤍';
      btn.style.color = word.is_favorite ? 'var(--error-500)' : 'var(--text-muted)';
      btn.classList.toggle('active');
      
      try {
        await import('../api.js').then(m => m.api.toggleFavorite(word.id));
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        // Revert on error
        word.is_favorite = !word.is_favorite;
        this.render();
      }
    });

    document.getElementById('remembered')?.addEventListener('click', () => this.markRemembered(true));
    document.getElementById('not-remembered')?.addEventListener('click', () => this.markRemembered(false));

    document.getElementById('show-example')?.addEventListener('change', (e) => {
      this.showExample = e.target.checked;
      this.render();
    });

    document.getElementById('show-phonetic')?.addEventListener('change', (e) => {
      this.showPhonetic = e.target.checked;
      this.render();
    });

    document.getElementById('flashcard-mode')?.addEventListener('change', (e) => {
      this.mode = e.target.value;
      if (this.mode === 'random') {
        this.shuffleWords();
      }
      this.currentIndex = 0;
      this.isFlipped = false;
      this.render();
      if (this.onCardChange) this.onCardChange(this.currentIndex);
    });

    // Keyboard shortcuts
    this.keyHandler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.flip();
      } else if (e.code === 'ArrowLeft') {
        this.prev();
      } else if (e.code === 'ArrowRight') {
        this.next();
      } else if (e.code === 'KeyR') {
        this.markRemembered(true);
      } else if (e.code === 'KeyF') {
        this.markRemembered(false);
      }
    };
    document.addEventListener('keydown', this.keyHandler);
  }

  flip() {
    this.isFlipped = !this.isFlipped;
    const flashcard = document.querySelector('.flashcard');
    flashcard?.classList.toggle('flipped', this.isFlipped);
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.isFlipped = false;
      this.render();
      if (this.onCardChange) this.onCardChange(this.currentIndex);
    }
  }

  next() {
    if (this.currentIndex < this.words.length - 1) {
      this.currentIndex++;
      this.isFlipped = false;
      this.render();
      if (this.onCardChange) this.onCardChange(this.currentIndex);
    }
  }

  markRemembered(remembered) {
    const word = this.words[this.currentIndex];
    if (this.onReview) {
      this.onReview(word.id, remembered);
    }

    // Remove current card from queue
    this.words.splice(this.currentIndex, 1);

    if (remembered) {
      this.completedCount += 1;
    } else {
      // Re-insert the word at a random position later in the queue
      const pos = Math.floor(Math.random() * (this.words.length + 1));
      this.words.splice(pos, 0, word);
    }

    if (this.onProgress) {
      this.onProgress(this.completedCount, this.totalCount);
    }

    // Visual feedback
    const container = document.querySelector('.flashcard-container');
    container?.classList.add(remembered ? 'bounce' : 'shake');
    setTimeout(() => {
      container?.classList.remove('bounce', 'shake');
      if (this.words.length === 0) {
        if (this.onComplete) this.onComplete();
        return;
      }
      if (this.currentIndex >= this.words.length) {
        this.currentIndex = 0;
      }
      this.isFlipped = false;
      this.render();
      if (this.onCardChange) this.onCardChange(this.currentIndex);
    }, 500);
  }

  destroy() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
  }
}
