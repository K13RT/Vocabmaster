// Learned Words Page
import { api } from '../api.js';
import { escapeHtml } from '../utils.js';

export async function renderLearnedWordsPage(container) {
  container.innerHTML = `
    <div class="page-content page-enter">
      <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-6);">
        <div>
          <h1 style="margin-bottom: var(--spacing-1);">Từ đã thuộc</h1>
          <p class="text-muted" style="margin: 0;">Danh sách các từ bạn đã ghi nhớ thành công</p>
        </div>
        <button id="btn-export-excel" class="btn btn-secondary" style="display: none;">
          <span>📥</span> Xuất Excel
        </button>
      </div>

      <div id="learned-words-content">
        <div class="text-center" style="padding: var(--spacing-12);">
          <div class="loader" style="margin: 0 auto;"></div>
        </div>
      </div>
    </div>
  `;

  try {
    const { words } = await api.getLearnedWords();
    
    const content = document.getElementById('learned-words-content');
    const exportBtn = document.getElementById('btn-export-excel');
    
    if (words.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎓</div>
          <h3 class="empty-state-title">Chưa có từ nào đã thuộc</h3>
          <p class="empty-state-text">Hãy tiếp tục học tập để làm giàu vốn từ vựng của bạn!</p>
          <a href="#/sets" class="btn btn-primary" style="margin-top: var(--spacing-4);">Bắt đầu học ngay</a>
        </div>
      `;
      return;
    }

    // Show export button and attach event
    exportBtn.style.display = 'flex';
    exportBtn.onclick = () => exportToExcel(words);

    content.innerHTML = `
      <div class="card">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 25%;">Từ vựng</th>
                <th style="width: 10%;">Loại</th>
                <th style="width: 30%;">Nghĩa</th>
                <th style="width: 20%;">Bộ từ</th>
                <th style="width: 15%;">Đã thuộc</th>
              </tr>
            </thead>
            <tbody>
              ${words.map(word => `
                <tr>
                  <td>
                    <div style="font-weight: 500;">${escapeHtml(word.word)}</div>
                    ${word.phonetic ? `<div class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(word.phonetic)}</div>` : ''}
                  </td>
                  <td>${word.type ? `<span class="badge badge-secondary">${escapeHtml(word.type)}</span>` : '-'}</td>
                  <td>
                    <div>${escapeHtml(word.meaning)}</div>
                  </td>
                  <td>
                    <a href="#/sets/${word.set_id}" class="link">${escapeHtml(word.set_name)}</a>
                  </td>
                  <td>
                    <span class="badge badge-success">✅ Đã thuộc</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="padding: var(--spacing-4); border-top: 1px solid var(--border-color); text-align: right; color: var(--text-secondary); font-size: var(--font-size-sm);">
          Tổng cộng: <strong>${words.length}</strong> từ
        </div>
      </div>
    `;
  } catch (error) {
    document.getElementById('learned-words-content').innerHTML = `
      <div class="text-center text-error">
        Không thể tải dữ liệu: ${error.message}
      </div>
    `;
  }
}

function exportToExcel(words) {
  // Prepare data for Excel
  const data = words.map(word => ({
    'Từ vựng': word.word,
    'Phiên âm': word.phonetic || '',
    'Loại từ': word.type || '',
    'Nghĩa': word.meaning,
    'Bộ từ': word.set_name,
    'Ngày học': new Date().toLocaleDateString('vi-VN')
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const wscols = [
    {wch: 20}, // Từ vựng
    {wch: 15}, // Phiên âm
    {wch: 10}, // Loại từ
    {wch: 40}, // Nghĩa
    {wch: 25}, // Bộ từ
    {wch: 15}  // Ngày học
  ];
  ws['!cols'] = wscols;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Từ đã thuộc");

  // Generate Excel file
  XLSX.writeFile(wb, `tu-da-thuoc-${new Date().toISOString().split('T')[0]}.xlsx`);
}
