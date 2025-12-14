// API Client
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.ok) {
      return data;
    }

    // Handle expired token once
    if (response.status === 401 && data?.code === 'token_expired' && !options._retry) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request(endpoint, { ...options, _retry: true });
      }
    }

    if (response.status === 401) {
      this.setToken(null);
      window.location.hash = '#/login';
    }

    throw new Error(data.error || 'Request failed');
  }

  async tryRefresh() {
    if (this.isRefreshing) return this.refreshPromise;

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const resp = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Refresh failed');
        this.setToken(data.token);
        return true;
      } catch (e) {
        console.error('Token refresh failed:', e);
        this.setToken(null);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Auth
  async register(username, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  }

  // Sets
  async getSets(page = 1) {
    return this.request(`/sets?page=${page}`);
  }

  async getSet(id) {
    return this.request(`/sets/${id}`);
  }

  async createSet(name, topic, description, isPublic = false) {
    return this.request('/sets', {
      method: 'POST',
      body: JSON.stringify({ name, topic, description, is_public: isPublic })
    });
  }

  async generateVocabularyWithAI(topic, level, count = 20) {
    return this.request('/ai/generate-vocabulary', {
      method: 'POST',
      body: JSON.stringify({ topic, level, count })
    });
  }

  async updateSet(id, data) {
    return this.request(`/sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteSet(id) {
    return this.request(`/sets/${id}`, { method: 'DELETE' });
  }

  async importSet(id) {
    return this.request(`/sets/import/${id}`, {
      method: 'POST'
    });
  }

  async importExcelSet(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/sets/import-excel', {
      method: 'POST',
      body: formData
    });
  }

  // Words
  async getWords(setId) {
    return this.request(`/words/set/${setId}`);
  }

  async searchWords(query) {
    return this.request(`/words/search?q=${encodeURIComponent(query)}`);
  }

  async createWord(setId, wordData) {
    const formData = new FormData();
    formData.append('set_id', setId);
    formData.append('word', wordData.word);
    formData.append('meaning', wordData.meaning);
    if (wordData.example) formData.append('example', wordData.example);
    if (wordData.phonetic) formData.append('phonetic', wordData.phonetic);
    if (wordData.type) formData.append('type', wordData.type);
    if (wordData.explain) formData.append('explain', wordData.explain);
    if (wordData.example_vietnamese) formData.append('example_vietnamese', wordData.example_vietnamese);
    if (wordData.audio) formData.append('audio', wordData.audio);

    // We use raw fetch here to handle FormData correctly with our custom request wrapper
    return this.request('/words', {
      method: 'POST',
      body: formData
    });
  }

  async updateWord(id, wordData) {
    const formData = new FormData();
    if (wordData.word) formData.append('word', wordData.word);
    if (wordData.meaning) formData.append('meaning', wordData.meaning);
    if (wordData.example !== undefined) formData.append('example', wordData.example);
    if (wordData.phonetic !== undefined) formData.append('phonetic', wordData.phonetic);
    if (wordData.type !== undefined) formData.append('type', wordData.type);
    if (wordData.explain !== undefined) formData.append('explain', wordData.explain);
    if (wordData.example_vietnamese !== undefined) formData.append('example_vietnamese', wordData.example_vietnamese);
    if (wordData.audio) formData.append('audio', wordData.audio);

    return this.request(`/words/${id}`, {
      method: 'PUT',
      body: formData
    });
  }

  async deleteWord(id) {
    return this.request(`/words/${id}`, { method: 'DELETE' });
  }

  // Progress
  async getStats() {
    return this.request('/progress/stats');
  }

  async getDueWords(limit = 20) {
    return this.request(`/progress/due?limit=${limit}`);
  }

  async getDifficultWords() {
    return this.request('/progress/difficult');
  }

  async getLearnedWords() {
    return this.request('/progress/learned');
  }

  async getSetsProgress() {
    return this.request('/progress/sets');
  }

  async reviewWord(wordId, remembered, quality = 3) {
    return this.request('/progress/review', {
      method: 'POST',
      body: JSON.stringify({ word_id: wordId, remembered, quality })
    });
  }

  async toggleFavorite(wordId) {
    return this.request('/progress/favorite', {
      method: 'POST',
      body: JSON.stringify({ word_id: wordId })
    });
  }

  async resetProgress(wordId) {
    return this.request(`/progress/reset/${wordId}`, {
      method: 'DELETE'
    });
  }

  // Quiz
  async getMultipleChoiceQuiz(setId, limit = 10) {
    return this.request(`/quiz/multiple-choice/${setId}?limit=${limit}`);
  }

  async getFillBlankQuiz(setId, limit = 10) {
    return this.request(`/quiz/fill-blank/${setId}?limit=${limit}`);
  }

  async submitQuiz(setId, quizType, score, totalQuestions, timeTaken) {
    return this.request('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({
        set_id: setId,
        quiz_type: quizType,
        score,
        total_questions: totalQuestions,
        time_taken: timeTaken
      })
    });
  }

  async getQuizHistory(limit = 20) {
    return this.request(`/quiz/history?limit=${limit}`);
  }

  // Admin
  async getUsers(page = 1, search = '') {
    return this.request(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
  }

  async getUserDetails(id) {
    return this.request(`/admin/users/${id}`);
  }

  async updateUser(id, data) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async createUser(data) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteUser(id) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  }

  async getAdminOverview() {
    return this.request('/admin/stats/overview');
  }

  async getWeeklyStats() {
    return this.request('/admin/stats/weekly');
  }

  async getMonthlyStats() {
    return this.request('/admin/stats/monthly');
  }

  async getYearlyStats() {
    return this.request('/admin/stats/yearly');
  }

  async getTopUsers(limit = 10) {
    return this.request(`/admin/stats/top-users?limit=${limit}`);
  }

  async getHardestWords(limit = 10) {
    return this.request(`/admin/stats/hardest-words?limit=${limit}`);
  }

  async getUserSets(userId, page = 1) {
    return this.request(`/admin/users/${userId}/sets?page=${page}`);
  }

  async createUserSet(userId, data) {
    return this.request(`/admin/users/${userId}/sets`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Admin Tests
  async getAdminTests() {
    return this.request('/admin-tests');
  }

  async getAdminTestResults(testId) {
    return this.request(`/admin-tests/${testId}/results`);
  }

  async createTestFromSet(title, description, setId, wordCount) {
    return this.request('/admin-tests/from-set', {
      method: 'POST',
      body: JSON.stringify({ title, description, setId, wordCount })
    });
  }

  async createTestManual(title, description, words) {
    return this.request('/admin-tests/manual', {
      method: 'POST',
      body: JSON.stringify({ title, description, words })
    });
  }

  async assignTest(testId, userIds) {
    return this.request(`/admin-tests/${testId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userIds })
    });
  }

  async getAssignedTests() {
    return this.request('/admin-tests/assigned');
  }

  async getTestForTaking(testId) {
    return this.request(`/admin-tests/${testId}/take`);
  }

  async submitTest(testId, score, totalQuestions) {
    return this.request(`/admin-tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ score, totalQuestions })
    });
  }

  async getTestUsers() {
    return this.request('/admin-tests/users');
  }

  async deleteAdminTest(testId) {
    return this.request(`/admin-tests/${testId}`, {
      method: 'DELETE'
    });
  }
}

export const api = new ApiClient();
