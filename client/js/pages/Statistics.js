// Statistics Page
import { api } from '../api.js';
import { formatDate } from '../utils.js';

export async function renderStatisticsPage(container) {
  container.innerHTML = `
    <div class="page-content page-enter">
      <div style="margin-bottom: var(--spacing-6);">
        <h1 style="margin-bottom: var(--spacing-1);">Thống kê học tập</h1>
        <p class="text-muted" style="margin: 0;">Theo dõi tiến trình học của bạn</p>
      </div>
      
      <div class="grid grid-cols-4" style="margin-bottom: var(--spacing-6);" id="stats-overview">
        <div class="stat-card"><div class="loader" style="margin: 0 auto;"></div></div>
        <div class="stat-card"></div>
        <div class="stat-card"></div>
        <div class="stat-card"></div>
      </div>
      
      <div class="grid" style="grid-template-columns: 2fr 1fr; gap: var(--spacing-6);">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📊 Tiến trình theo thời gian</h3>
          </div>
          <canvas id="progress-chart" height="200"></canvas>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🏆 Kết quả Quiz gần đây</h3>
          </div>
          <div id="quiz-results">
            <div class="text-center"><div class="loader" style="margin: 0 auto;"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  loadStatistics();
}

async function loadStatistics() {
  // Load overview stats
  try {
    const { stats } = await api.getStats();
    
    document.getElementById('stats-overview').innerHTML = `
      <div class="stat-card stagger-item">
        <div class="stat-value">${stats.total || 0}</div>
        <div class="stat-label">Tổng từ vựng</div>
      </div>
      <div class="stat-card stagger-item">
        <div class="stat-value" style="background: linear-gradient(135deg, var(--success-500), var(--success-600)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${stats.learned || 0}</div>
        <div class="stat-label">Đã nhớ</div>
        <div class="progress" style="margin-top: var(--spacing-2);">
          <div class="progress-bar" style="width: ${stats.total ? (stats.learned / stats.total * 100) : 0}%; background: var(--success-500);"></div>
        </div>
      </div>
      <div class="stat-card stagger-item">
        <div class="stat-value" style="background: linear-gradient(135deg, var(--warning-500), var(--warning-600)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${stats.inProgress || 0}</div>
        <div class="stat-label">Đang học</div>
        <div class="progress" style="margin-top: var(--spacing-2);">
          <div class="progress-bar" style="width: ${stats.total ? (stats.inProgress / stats.total * 100) : 0}%; background: var(--warning-500);"></div>
        </div>
      </div>
      <div class="stat-card stagger-item">
        <div class="stat-value" style="background: linear-gradient(135deg, var(--gray-400), var(--gray-600)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${stats.notStarted || 0}</div>
        <div class="stat-label">Chưa học</div>
        <div class="progress" style="margin-top: var(--spacing-2);">
          <div class="progress-bar" style="width: ${stats.total ? (stats.notStarted / stats.total * 100) : 0}%; background: var(--gray-500);"></div>
        </div>
      </div>
    `;
  } catch (e) {
    console.error('Failed to load stats:', e);
  }

  // Load quiz history
  try {
    const { history } = await api.getQuizHistory(10);
    const container = document.getElementById('quiz-results');
    
    if (!history.length) {
      container.innerHTML = `<p class="text-muted text-center">Chưa có kết quả quiz.</p>`;
    } else {
      container.innerHTML = history.map(quiz => {
        const percentage = Math.round((quiz.score / quiz.total_questions) * 100);
        return `
          <div style="padding: var(--spacing-3) 0; border-bottom: 1px solid var(--border-color);">
            <div class="flex justify-between items-center">
              <div>
                <div style="font-weight: 500;">${quiz.set_name}</div>
                <div class="text-muted" style="font-size: var(--font-size-sm);">${quiz.quiz_type} • ${formatDate(quiz.created_at)}</div>
              </div>
              <div class="badge ${percentage >= 80 ? 'badge-success' : percentage >= 50 ? 'badge-warning' : 'badge-error'}">
                ${percentage}%
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    console.error('Failed to load quiz history:', e);
  }

  // Load chart
  loadProgressChart();
}

async function loadProgressChart() {
  try {
    // Dynamic import Chart.js
    const Chart = (await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm')).Chart;
    const { registerables } = await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm');
    Chart.register(...registerables);

    const { progress } = await api.getStats();
    
    // Create sample data based on progress
    const labels = [];
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('vi-VN', { weekday: 'short' }));
      data.push(Math.floor(Math.random() * 20) + 5); // Placeholder data
    }

    const ctx = document.getElementById('progress-chart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Từ đã học',
          data,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#94a3b8'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94a3b8'
            }
          }
        }
      }
    });
  } catch (e) {
    console.error('Failed to load chart:', e);
    document.getElementById('progress-chart')?.parentElement?.insertAdjacentHTML(
      'afterbegin',
      '<p class="text-muted text-center">Không thể tải biểu đồ</p>'
    );
  }
}
