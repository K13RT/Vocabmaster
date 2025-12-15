// Register Page
import { auth } from '../auth.js';
import { router } from '../router.js';
import { showToast } from '../utils.js';
import { supabase } from '../utils/supabase.js';

export function renderRegisterPage(container) {
  container.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: var(--spacing-4); background: var(--bg-primary);">
      <div class="card" style="width: 100%; max-width: 420px; padding: var(--spacing-8);">
        <div style="text-align: center; margin-bottom: var(--spacing-8);">
          <div style="width: 64px; height: 64px; background: var(--gradient-primary); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--spacing-4);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <h1 style="font-size: var(--font-size-2xl); margin-bottom: var(--spacing-2);">Tạo tài khoản</h1>
          <p class="text-muted" style="margin: 0;">Đăng ký để bắt đầu học từ vựng</p>
        </div>
        
        <form id="register-form">
          <div class="form-group">
            <label class="form-label">Tên đăng nhập</label>
            <input type="text" id="username" class="form-input" placeholder="Nhập tên đăng nhập" required autofocus>
          </div>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="email" class="form-input" placeholder="Nhập email" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input type="password" id="password" class="form-input" placeholder="Tối thiểu 6 ký tự" required minlength="6">
          </div>
          
          <div class="form-group">
            <label class="form-label">Xác nhận mật khẩu</label>
            <input type="password" id="confirm-password" class="form-input" placeholder="Nhập lại mật khẩu" required>
          </div>
          
          <div id="register-error" class="form-error" style="margin-bottom: var(--spacing-4); display: none;"></div>
          
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;" id="register-btn">
            Đăng ký
          </button>
        </form>
        
        <div style="text-align: center; margin-top: var(--spacing-6);">
          <p class="text-muted">
            Đã có tài khoản? <a href="#/login">Đăng nhập</a>
          </p>
        </div>
      </div>
    </div>
  `;

  initRegisterEvents();
}

function initRegisterEvents() {
  const form = document.getElementById('register-form');
  const errorEl = document.getElementById('register-error');
  const btn = document.getElementById('register-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!username || !email || !password) {
      errorEl.textContent = 'Vui lòng nhập đầy đủ thông tin';
      errorEl.style.display = 'block';
      return;
    }
    
    if (password !== confirmPassword) {
      errorEl.textContent = 'Mật khẩu xác nhận không khớp';
      errorEl.style.display = 'block';
      return;
    }
    
    if (password.length < 6) {
      errorEl.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
      errorEl.style.display = 'block';
      return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Đang tạo tài khoản...';
    errorEl.style.display = 'none';
    
    try {
      // Call Supabase SDK directly
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) throw error;

      console.log("Đăng ký thành công:", data);
      showToast('Đăng ký thành công! Vui lòng kiểm tra email để xác thực (nếu cần).', 'success');
      
      // Sync with internal auth state
      await auth.init();
      
      router.navigate('/');
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      errorEl.textContent = error.message || 'Đăng ký thất bại';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng ký';
    }
  });
}
