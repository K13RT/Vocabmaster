// API Client
// API Client
// API Client
import { supabase } from './utils/supabase.js';

let BASE_URL = import.meta.env.VITE_API_URL || '';
BASE_URL = BASE_URL.replace(/\/$/, '').replace(/\/api$/, '');
const API_BASE = `${BASE_URL}/api`;

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  // Helper for backend API calls (AI, Admin, etc.)
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
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

    throw new Error(data.error || 'Request failed');
  }

  // Auth (Handled by Supabase SDK directly in UI, but kept for compatibility if needed)
  async getMe() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return { user: { id: user.id, email: user.email, role: user.user_metadata?.role || 'user' } };
  }

  logout() {
    supabase.auth.signOut();
    this.setToken(null);
  }

  // Sets (Direct Supabase)
  async getSets(page = 1) {
    const limit = 20;
    const from = (page - 1) * limit;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const { data, error, count } = await supabase
      .from('vocabulary_sets')
      .select('*, words(count)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;

    const sets = data.map(s => ({
      ...s,
      word_count: s.words?.[0]?.count || 0
    }));

    return { sets, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async getSet(id) {
    const { data, error } = await supabase
      .from('vocabulary_sets')
      .select('*, words(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { set: data, words: data.words };
  }

  async createSet(name, topic, description, isPublic = false) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('vocabulary_sets')
      .insert({
        user_id: user.id,
        name,
        topic,
        description,
        is_public: isPublic
      })
      .select()
      .single();

    if (error) throw error;
    return { set: data };
  }

  async updateSet(id, data) {
    const { data: updated, error } = await supabase
      .from('vocabulary_sets')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { set: updated };
  }

  async deleteSet(id) {
    const { error } = await supabase
      .from('vocabulary_sets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Deleted successfully' };
  }

  // Words (Direct Supabase)
  async getWords(setId) {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('set_id', setId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createWord(setId, wordData) {
    // Handle file upload if audio is a File object?
    // For now, assuming audio is a URL or we skip upload logic here (complex).
    // If audio is a File, we need to upload to Storage first.
    // Let's assume for now user enters text or URL.
    // If we need upload, we need a separate upload function.
    
    const { data, error } = await supabase
      .from('words')
      .insert({
        set_id: setId,
        word: wordData.word,
        meaning: wordData.meaning,
        example: wordData.example,
        phonetic: wordData.phonetic,
        type: wordData.type,
        explain: wordData.explain,
        example_vietnamese: wordData.example_vietnamese,
        audio_path: wordData.audio // Assuming URL
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateWord(id, wordData) {
    const { data, error } = await supabase
      .from('words')
      .update({
        word: wordData.word,
        meaning: wordData.meaning,
        example: wordData.example,
        phonetic: wordData.phonetic,
        type: wordData.type,
        explain: wordData.explain,
        example_vietnamese: wordData.example_vietnamese,
        audio_path: wordData.audio
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWord(id) {
    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Deleted successfully' };
  }

  // AI Generation (Keep on Backend)
  async generateVocabularyWithAI(topic, level, count = 20) {
    return this.request('/ai/generate-vocabulary', {
      method: 'POST',
      body: JSON.stringify({ topic, level, count })
    });
  }

  // Import Excel (Keep on Backend for parsing)
  async importExcelSet(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/sets/import-excel', {
      method: 'POST',
      body: formData
    });
  }

  // Progress (Keep on Backend or refactor later)
  async getStats() {
    return this.request('/progress/stats');
  }
  async getDueWords(limit = 20) {
    return this.request(`/progress/due?limit=${limit}`);
  }
  async reviewWord(wordId, remembered, quality = 3) {
    return this.request('/progress/review', {
      method: 'POST',
      body: JSON.stringify({ word_id: wordId, remembered, quality })
    });
  }

  // Admin (Keep on Backend)
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
