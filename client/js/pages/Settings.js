import { api } from '../api.js';

export const Settings = {
  async render() {
    let user = null;
    try {
      const data = await api.getMe();
      user = data.user;
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
    }

    return `
      <div class="settings-container">
        <div class="page-header">
          <h1>⚙️ Cài đặt</h1>
          <p>Quản lý tài khoản và cấu hình ứng dụng</p>
        </div>

        <div class="card settings-card">
          <div class="card-header">
            <h3>Cấu hình AI</h3>
          </div>
          <div class="card-body">
            <p class="text-secondary mb-4">
              Để sử dụng tính năng tạo từ vựng bằng AI, bạn cần cung cấp API Key của Groq. 
              Bạn có thể lấy key miễn phí tại <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">console.groq.com</a>.
            </p>
            
            <form id="settings-form">
              <div class="form-group">
                <label for="ai_api_key">Groq API Key</label>
                <div class="input-with-action">
                  <input type="password" id="ai_api_key" name="ai_api_key" 
                    placeholder="${user?.ai_api_key ? user.ai_api_key : 'Nhập Groq API Key của bạn'}"
                    class="form-control">
                  <button type="button" id="toggle-api-key" class="btn-icon">
                    <span class="icon">👁️</span>
                  </button>
                </div>
                <small class="form-text text-muted">Key của bạn sẽ được mã hóa và lưu trữ an toàn.</small>
              </div>

              <div class="form-actions mt-6">
                <button type="submit" class="btn btn-primary">Lưu cài đặt</button>
              </div>
            </form>
          </div>
        </div>

        <div class="card settings-card mt-6">
          <div class="card-header">
            <h3>Thông tin tài khoản</h3>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">Tên người dùng:</span>
              <span class="value">${user?.username || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${user?.email || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Vai trò:</span>
              <span class="value badge badge-secondary">${user?.role || 'user'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    const form = document.getElementById('settings-form');
    const apiKeyInput = document.getElementById('ai_api_key');
    const toggleBtn = document.getElementById('toggle-api-key');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const type = apiKeyInput.type === 'password' ? 'text' : 'password';
        apiKeyInput.type = type;
        toggleBtn.innerHTML = `<span class="icon">${type === 'password' ? '👁️' : '🔒'}</span>`;
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
          alert('Vui lòng nhập API Key');
          return;
        }

        try {
          const submitBtn = form.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Đang lưu...';

          await api.updateSettings({ ai_api_key: apiKey });
          
          alert('Đã cập nhật cài đặt thành công!');
          apiKeyInput.value = ''; // Clear the input
          apiKeyInput.placeholder = '********' + apiKey.slice(-4);
        } catch (error) {
          alert('Lỗi: ' + error.message);
        } finally {
          const submitBtn = form.querySelector('button[type="submit"]');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Lưu cài đặt';
        }
      });
    }
  }
};
