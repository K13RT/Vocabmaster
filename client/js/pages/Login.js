// Login Page
import { auth } from '../auth.js';
import { router } from '../router.js';
import { showToast } from '../utils.js';
import { supabase } from '../utils/supabase.js';

export function renderLoginPage(container) {
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
          <h1 style="font-size: var(--font-size-2xl); margin-bottom: var(--spacing-2);">VocabMaster</h1>
          <p class="text-muted" style="margin: 0;">Đăng nhập để tiếp tục học</p>
        </div>
        
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="email" class="form-input" placeholder="Nhập email của bạn" required autofocus>
          </div>
          
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input type="password" id="password" class="form-input" placeholder="Nhập mật khẩu" required>
          </div>
          
          <div id="login-error" class="form-error" style="margin-bottom: var(--spacing-4); display: none;"></div>
          
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;" id="login-btn">
            Đăng nhập
          </button>
        </form>
        
        <div style="text-align: center; margin-top: var(--spacing-6);">
          <p class="text-muted">
            Chưa có tài khoản? <a href="#/register">Đăng ký ngay</a>
          </p>
        </div>
      </div>
    </div>
  `;

  initLoginEvents();
}

function initLoginEvents() {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      errorEl.textContent = 'Vui lòng nhập đầy đủ thông tin';
      errorEl.style.display = 'block';
      return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';
    errorEl.style.display = 'none';
    
    try {
      // Call Supabase SDK directly
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      console.log("Đăng nhập thành công:", data);
      showToast('Đăng nhập thành công!', 'success');
      
      // Sync with internal auth state
      await auth.init();
      
      if (auth.isAdmin()) {
        router.navigate('/admin');
      } else {
        router.navigate('/');
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      errorEl.textContent = error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng nhập';
    }
  });
}
