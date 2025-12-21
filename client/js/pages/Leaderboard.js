import { api } from '../api.js';

export const Leaderboard = {
  async render() {
    return `
      <div class="leaderboard-container">
        <div class="page-header">
          <h1>🏆 Bảng Xếp Hạng</h1>
          <p>Cạnh tranh với những người học khác trên toàn thế giới</p>
        </div>

        <div class="leaderboard-tabs">
          <button class="tab-btn active" data-type="words">Từ vựng</button>
          <button class="tab-btn" data-type="xp">Kinh nghiệm (XP)</button>
          <button class="tab-btn" data-type="streak">Chuỗi ngày (Streak)</button>
        </div>

        <div class="leaderboard-card">
          <div class="leaderboard-list" id="leaderboard-list">
            <div class="loading">Đang tải bảng xếp hạng...</div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    const listContainer = document.getElementById('leaderboard-list');
    const tabs = document.querySelectorAll('.tab-btn');

    const loadLeaderboard = async (type) => {
      listContainer.innerHTML = '<div class="loading">Đang tải bảng xếp hạng...</div>';
      try {
        const data = await api.getLeaderboard(type);
        this.renderList(data, type);
      } catch (error) {
        listContainer.innerHTML = `<div class="error">Lỗi: ${error.message}</div>`;
      }
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadLeaderboard(tab.dataset.type);
      });
    });

    // Initial load
    loadLeaderboard('words');
  },

  renderList(data, type) {
    const listContainer = document.getElementById('leaderboard-list');
    
    if (data.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">Chưa có dữ liệu xếp hạng</div>';
      return;
    }

    const getUnit = (type) => {
      switch(type) {
        case 'words': return 'từ';
        case 'xp': return 'XP';
        case 'streak': return 'ngày';
        default: return '';
      }
    };

    const unit = getUnit(type);

    listContainer.innerHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Hạng</th>
            <th>Người dùng</th>
            <th>Thành tích</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((entry, index) => `
            <tr class="${index < 3 ? 'top-rank' : ''}">
              <td class="rank-cell">
                ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </td>
              <td class="user-cell">
                <div class="user-info">
                  <div class="user-avatar">${entry.username.charAt(0).toUpperCase()}</div>
                  <span class="username">${entry.username}</span>
                </div>
              </td>
              <td class="value-cell">
                <span class="value">${entry.value}</span>
                <span class="unit">${unit}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
};
