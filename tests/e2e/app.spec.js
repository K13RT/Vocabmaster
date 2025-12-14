const { test, expect, request: playwrightRequest } = require('@playwright/test');

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const ADMIN_CREDENTIALS = {
  username: process.env.E2E_USER || 'admin',
  password: process.env.E2E_PASS || 'admin123'
};

async function apiLogin(request) {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: {
      username: ADMIN_CREDENTIALS.username,
      password: ADMIN_CREDENTIALS.password
    }
  });
  const data = await res.json();
  if (!res.ok()) {
    throw new Error(`Login failed: ${data.error || res.status()}`);
  }
  return { token: data.token, user: data.user };
}

async function seedSetWithWords(request) {
  const { token, user } = await apiLogin(request);
  const authHeaders = { Authorization: `Bearer ${token}` };
  const setName = `E2E Set ${Date.now()}`;

  const setRes = await request.post(`${API_URL}/sets`, {
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    data: { name: setName, topic: 'E2E', description: 'E2E seeded set', is_public: true }
  });
  const setData = await setRes.json();
  if (!setRes.ok()) {
    throw new Error(`Create set failed: ${setData.error || setRes.status()}`);
  }

  const setId = setData.set.id;
  const wordIds = [];

  for (let i = 0; i < 4; i++) {
    const wordRes = await request.post(`${API_URL}/words`, {
      headers: authHeaders,
      multipart: {
        set_id: String(setId),
        word: `word-${i}`,
        meaning: `meaning-${i}`
      }
    });
    const wordData = await wordRes.json();
    if (!wordRes.ok()) {
      throw new Error(`Create word failed: ${wordData.error || wordRes.status()}`);
    }
    wordIds.push(wordData.word.id);

    // Mark as learned to make quiz available
    await request.post(`${API_URL}/progress/review`, {
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      data: { word_id: wordData.word.id, remembered: true, quality: 4 }
    });
  }

  return { setId, setName, wordIds, user };
}

async function seedAdminTestAssignment(request) {
  const { token, user } = await apiLogin(request);
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const manualWords = [
    { word: 'alpha', meaning: 'α' },
    { word: 'beta', meaning: 'β' },
    { word: 'gamma', meaning: 'γ' },
    { word: 'delta', meaning: 'δ' }
  ];

  const testRes = await request.post(`${API_URL}/admin-tests/manual`, {
    headers: authHeaders,
    data: {
      title: `E2E Manual Test ${Date.now()}`,
      description: 'Seeded for E2E assignment',
      words: manualWords
    }
  });
  const testData = await testRes.json();
  if (!testRes.ok()) {
    throw new Error(`Create manual test failed: ${testData.error || testRes.status()}`);
  }

  const assignRes = await request.post(`${API_URL}/admin-tests/${testData.testId}/assign`, {
    headers: authHeaders,
    data: { userIds: [user.id] }
  });
  if (!assignRes.ok()) {
    const body = await assignRes.json();
    throw new Error(`Assign test failed: ${body.error || assignRes.status()}`);
  }

  return { testId: testData.testId, title: `E2E Manual Test ${Date.now()}` };
}

async function loginUI(page) {
  await page.goto(`${APP_URL}/#/login`);
  await page.fill('#username', ADMIN_CREDENTIALS.username);
  await page.fill('#password', ADMIN_CREDENTIALS.password);
  await page.click('#login-btn');
  await expect(page.locator('.main-content')).toBeVisible({ timeout: 10000 });
}

test.describe('Vocabulary app E2E', () => {
  test('Flashcard study flow works with seeded set', async ({ page, request }) => {
    const { setId } = await seedSetWithWords(request);

    await loginUI(page);
    await page.goto(`${APP_URL}/#/flashcards?setId=${setId}`);

    await expect(page.locator('#flashcard-viewer .flashcard-word')).toBeVisible();
    await page.click('#remembered');
    await expect(page.locator('#flashcard-viewer .flashcard-counter')).toContainText('/');
  });

  test('Quiz flow finishes and shows result', async ({ page, request }) => {
    const { setId } = await seedSetWithWords(request);

    await loginUI(page);
    await page.goto(`${APP_URL}/#/quiz?setId=${setId}`);

    await expect(page.locator('.quiz-option').first()).toBeVisible();

    // Answer all questions
    while (await page.locator('.quiz-option').count()) {
      await page.locator('.quiz-option').first().click();
      await page.waitForTimeout(200);
      if (await page.locator('.quiz-result').count()) break;
    }

    await expect(page.locator('.quiz-result')).toBeVisible({ timeout: 15000 });
  });

  test('Admin test assignment appears on home', async ({ page, request }) => {
    await seedAdminTestAssignment(request);
    await loginUI(page);

    await page.goto(`${APP_URL}/#/`);
    const assignedCard = page.locator('#assigned-tests-card');
    await expect(assignedCard).toBeVisible({ timeout: 10000 });
  });
});

