// Admin Reports Page
import { api } from '../../api.js';

export async function renderReportsPage(container) {
  container.innerHTML = `
    <div class="page-content page-enter">
      <div style="margin-bottom: var(--spacing-6);">
        <h1 style="margin-bottom: var(--spacing-1);">Báo cáo chi tiết</h1>
        <p class="text-muted" style="margin: 0;">Thống kê học tập theo thời gian</p>
      </div>
      
      <div class="tabs" id="period-tabs" style="margin-bottom: var(--spacing-6);">
        <button class="tab active" data-period="weekly">Tuần này</button>
        <button class="tab" data-period="monthly">Tháng này</button>
        <button class="tab" data-period="yearly">Năm nay</button>
      </div>
      
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: var(--spacing-6);">
        <div class="card">
          <h3 style="margin-bottom: var(--spacing-4);">📈 Từ vựng đã ôn tập</h3>
          <canvas id="words-chart" height="250"></canvas>
        </div>
        
        <div class="card">
          <h3 style="margin-bottom: var(--spacing-4);">👥 Người dùng hoạt động</h3>
          <canvas id="users-chart" height="250"></canvas>
        </div>
      </div>
      
      <div class="card" style="margin-top: var(--spacing-6);">
        <h3 style="margin-bottom: var(--spacing-4);">📋 Dữ liệu chi tiết</h3>
        <div id="report-table">
          <div class="text-center"><div class="loader" style="margin: 0 auto;"></div></div>
        </div>
      </div>
    </div>
  `;

  loadReportData('weekly');
  initReportEvents();
}

async function loadReportData(period) {
  try {
    let data;
    if (period === 'weekly') {
      data = (await api.getWeeklyStats()).data;
    } else if (period === 'monthly') {
      data = (await api.getMonthlyStats()).data;
    } else {
      data = (await api.getYearlyStats()).data;
    }

    renderCharts(data);
    renderTable(data, period);
  } catch (e) {
    console.error('Failed to load report data:', e);
  }
}

async function renderCharts(data) {
  const Chart = (await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm')).Chart;
  const { registerables } = await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm');
  Chart.register(...registerables);

  const labels = data.map(d => d.date || d.week || d.month);
  const wordsData = data.map(d => d.words_reviewed);
  const usersData = data.map(d => d.active_users);

  // Destroy existing charts
  if (window.wordsChart) window.wordsChart.destroy();
  if (window.usersChart) window.usersChart.destroy();

  const wordsCtx = document.getElementById('words-chart')?.getContext('2d');
  const usersCtx = document.getElementById('users-chart')?.getContext('2d');

  if (wordsCtx) {
    window.wordsChart = new Chart(wordsCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Từ đã ôn',
          data: wordsData,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }

  if (usersCtx) {
    window.usersChart = new Chart(usersCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Người dùng',
          data: usersData,
          backgroundColor: 'rgba(34, 211, 238, 0.5)',
          borderColor: '#22d3ee',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }
}

function renderTable(data, period) {
  const periodLabel = period === 'weekly' ? 'Ngày' : period === 'monthly' ? 'Tuần' : 'Tháng';
  
  document.getElementById('report-table').innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>${periodLabel}</th>
          <th>Từ đã ôn tập</th>
          <th>Người dùng hoạt động</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(d => `
          <tr>
            <td>${d.date || d.week || d.month}</td>
            <td>${d.words_reviewed}</td>
            <td>${d.active_users}</td>
          </tr>
        `).join('')}
        ${data.length === 0 ? '<tr><td colspan="3" class="text-center text-muted">Chưa có dữ liệu</td></tr>' : ''}
      </tbody>
      <tfoot>
        <tr style="font-weight: 600; background: var(--bg-tertiary);">
          <td>Tổng</td>
          <td>${data.reduce((sum, d) => sum + d.words_reviewed, 0)}</td>
          <td>-</td>
        </tr>
      </tfoot>
    </table>
  `;
}

function initReportEvents() {
  document.querySelectorAll('#period-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#period-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadReportData(tab.dataset.period);
    });
  });
}
