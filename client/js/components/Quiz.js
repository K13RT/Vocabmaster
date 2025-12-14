// Quiz Component
import { escapeHtml, showToast, showConfetti } from '../utils.js';
import { api } from '../api.js';

export class QuizManager {
  constructor(containerId, quiz, onComplete) {
    this.container = document.getElementById(containerId);
    this.quiz = quiz;
    this.questions = quiz.questions;
    this.currentIndex = 0;
    this.score = 0;
    this.answers = [];
    this.startTime = Date.now();
    this.timeLimit = null; // Seconds, null = no limit
    this.timerInterval = null;
    this.onComplete = onComplete;
  }

  setTimeLimit(seconds) {
    this.timeLimit = seconds;
  }

  render() {
    if (!this.questions.length) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❓</div>
          <h3 class="empty-state-title">Không có câu hỏi</h3>
          <p class="empty-state-text">Cần ít nhất 4 từ để tạo quiz.</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <div class="quiz-wrapper">
        <div class="quiz-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-6);">
          <div>
            <h3 style="margin-bottom: var(--spacing-1);">${this.quiz.setName}</h3>
            <p class="text-muted" style="margin: 0;">Câu ${this.currentIndex + 1} / ${this.questions.length}</p>
          </div>
          ${this.timeLimit ? `
            <div class="quiz-timer" id="quiz-timer">${this.formatTime(this.timeLimit)}</div>
          ` : ''}
        </div>
        
        <div class="progress" style="margin-bottom: var(--spacing-6);">
          <div class="progress-bar" style="width: ${((this.currentIndex) / this.questions.length) * 100}%"></div>
        </div>
        
        <div id="quiz-question-container">
          ${this.renderQuestion()}
        </div>
      </div>
    `;

    if (this.timeLimit && !this.timerInterval) {
      this.startTimer();
    }

    this.initQuestionEvents();
  }

  renderQuestion() {
    const q = this.questions[this.currentIndex];
    
    // Always multiple-choice
    return `
      <div class="quiz-question card" style="padding: var(--spacing-8);">
        <h2 style="text-align: center; font-size: var(--font-size-3xl); margin-bottom: var(--spacing-2);">
          ${escapeHtml(q.word)}
        </h2>
        ${q.phonetic ? `<p style="text-align: center; color: var(--text-secondary); margin-bottom: var(--spacing-8);">${escapeHtml(q.phonetic)}</p>` : ''}
        
        <div class="quiz-options" style="display: grid; gap: var(--spacing-3);">
          ${q.options.map((option, i) => `
            <button class="quiz-option btn btn-secondary" style="justify-content: flex-start; padding: var(--spacing-4) var(--spacing-6);" data-index="${i}">
              <span class="option-letter" style="width: 28px; height: 28px; background: var(--bg-tertiary); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; margin-right: var(--spacing-3); font-weight: 600;">
                ${String.fromCharCode(65 + i)}
              </span>
              ${escapeHtml(option)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  initQuestionEvents() {
    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.checkAnswer(index);
      });
    });
  }

  checkAnswer(selectedIndex) {
    const q = this.questions[this.currentIndex];
    const correct = selectedIndex === q.correctIndex;
    
    if (correct) {
      this.score++;
    }
    
    this.answers.push({ questionId: q.id, correct });
    
    // Visual feedback
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correctIndex) {
        btn.style.background = 'var(--success-500)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--success-500)';
      } else if (i === selectedIndex && !correct) {
        btn.style.background = 'var(--error-500)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--error-500)';
      }
    });
    
    setTimeout(() => this.nextQuestion(), 1000);
  }

  nextQuestion() {
    this.currentIndex++;
    
    if (this.currentIndex >= this.questions.length) {
      this.finish();
    } else {
      // Update question content
      document.getElementById('quiz-question-container').innerHTML = this.renderQuestion();
      
      // Update progress bar
      document.querySelector('.progress-bar').style.width = `${((this.currentIndex) / this.questions.length) * 100}%`;
      
      // Update counter text
      const counterEl = document.querySelector('.quiz-header p');
      if (counterEl) {
        counterEl.textContent = `Câu ${this.currentIndex + 1} / ${this.questions.length}`;
      }
      
      this.initQuestionEvents();
    }
  }

  startTimer() {
    // Timer logic removed or kept if needed for future, but currently unused in multiple-choice only mode unless we want to keep it.
    // The user didn't explicitly ask to remove the timer functionality itself, just the "Timed" mode.
    // But since we removed the mode selection, this might not be triggered.
    // I'll keep it as is for safety, but it won't be called if we don't pass timeLimit.
    let remaining = this.timeLimit;
    const timerEl = document.getElementById('quiz-timer');
    
    this.timerInterval = setInterval(() => {
      remaining--;
      
      if (timerEl) {
        timerEl.textContent = this.formatTime(remaining);
        timerEl.classList.remove('warning', 'danger');
        
        if (remaining <= 10) {
          timerEl.classList.add('danger');
        } else if (remaining <= 30) {
          timerEl.classList.add('warning');
        }
      }
      
      if (remaining <= 0) {
        this.finish();
      }
    }, 1000);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async finish() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
    
    // Calculate score on 10-point scale
    // Score = (Correct / Total) * 10
    const score10 = (this.score / this.questions.length) * 10;
    // Round to 1 decimal place if needed, or integer? User said "max 10 points". Usually implies integer or 1 decimal.
    // Let's do 1 decimal place for better precision, or round to nearest 0.5?
    // Let's stick to simple rounding for display, but maybe keep precision?
    // "Số câu kiểm tra bằng với số câu trong bộ từ vựng, Có tính năng tính điểm với điểm tối đa là 10 điểm"
    const formattedScore = Math.round(score10 * 10) / 10; // 1 decimal place
    
    // Save result
    try {
      await api.submitQuiz(
        this.quiz.setId,
        this.quiz.type,
        this.score, // Saving raw score (number of correct answers)
        this.questions.length,
        timeTaken
      );
    } catch (e) {
      console.error('Failed to save quiz result:', e);
    }
    
    // Show confetti for high scores (>= 8.0)
    if (formattedScore >= 8.0) {
      showConfetti();
    }
    
    this.container.innerHTML = `
      <div class="quiz-result card" style="text-align: center; padding: var(--spacing-12);">
        <div class="success-check" style="margin: 0 auto var(--spacing-6);">
          ${formattedScore >= 8.0 ? '🎉' : formattedScore >= 5.0 ? '👍' : '💪'}
        </div>
        
        <h2 style="margin-bottom: var(--spacing-2);">Kết quả</h2>
        <p class="text-muted" style="margin-bottom: var(--spacing-8);">${this.quiz.setName}</p>
        
        <div class="stat-value" style="font-size: var(--font-size-5xl); margin-bottom: var(--spacing-2);">
          ${formattedScore} / 10
        </div>
        <p class="text-muted" style="margin-bottom: var(--spacing-6);">
          ${this.score} / ${this.questions.length} câu đúng
        </p>
        
        <div style="display: flex; gap: var(--spacing-4); justify-content: center; margin-bottom: var(--spacing-6);">
          <div class="stat-card">
            <div style="font-size: var(--font-size-2xl); font-weight: 600; color: var(--primary-400);">${this.formatTime(timeTaken)}</div>
            <div class="stat-label">Thời gian</div>
          </div>
        </div>
        
        <div style="display: flex; gap: var(--spacing-4); justify-content: center;">
          <a href="#/quiz" class="btn btn-secondary">← Quay lại</a>
          <button class="btn btn-primary" onclick="location.reload()">Làm lại</button>
        </div>
      </div>
    `;
    
    if (this.onComplete) {
      this.onComplete({ score: this.score, total: this.questions.length, timeTaken });
    }
  }
}
