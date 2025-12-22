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
    const top3 = data.slice(0, 3);
    const rest = data.slice(3);

    // Helper to get avatar letter
    const getAvatar = (username) => username.charAt(0).toUpperCase();

    let html = '';

    // Render Podium
    if (top3.length > 0) {
      html += '<div class="podium-container">';
      
      // Rank 2 (Left)
      if (top3[1]) {
        html += `
          <div class="podium-item rank-2">
            <div class="podium-avatar-wrapper">
              <div class="podium-avatar">${getAvatar(top3[1].username)}</div>
            </div>
            <div class="podium-base">
              <div class="podium-username">${top3[1].username}</div>
              <div class="podium-value">${top3[1].value} ${unit}</div>
              <div class="podium-rank">2</div>
            </div>
          </div>
        `;
      }

      // Rank 1 (Center)
      if (top3[0]) {
        html += `
          <div class="podium-item rank-1">
            <div class="podium-avatar-wrapper">
              <div class="crown-icon">👑</div>
              <div class="podium-avatar">${getAvatar(top3[0].username)}</div>
            </div>
            <div class="podium-base">
              <div class="podium-username">${top3[0].username}</div>
              <div class="podium-value">${top3[0].value} ${unit}</div>
              <div class="podium-rank">1</div>
            </div>
          </div>
        `;
      }

      // Rank 3 (Right)
      if (top3[2]) {
        html += `
          <div class="podium-item rank-3">
            <div class="podium-avatar-wrapper">
              <div class="podium-avatar">${getAvatar(top3[2].username)}</div>
            </div>
            <div class="podium-base">
              <div class="podium-username">${top3[2].username}</div>
              <div class="podium-value">${top3[2].value} ${unit}</div>
              <div class="podium-rank">3</div>
            </div>
          </div>
        `;
      }

      html += '</div>'; // End podium-container
    }

    // Render List (Rank 4+)
    if (rest.length > 0) {
      html += '<div class="leaderboard-list">';
      html += rest.map((entry, index) => `
        <div class="leaderboard-item" style="animation-delay: ${(index + 3) * 0.05}s">
          <div class="item-rank">${index + 4}</div>
          <div class="item-avatar">${getAvatar(entry.username)}</div>
          <div class="item-info">
            <div class="item-username">${entry.username}</div>
          </div>
          <div class="item-value">
            ${entry.value} <span class="item-unit">${unit}</span>
          </div>
        </div>
      `).join('');
      html += '</div>';
    }

    listContainer.innerHTML = html;
  }
};
