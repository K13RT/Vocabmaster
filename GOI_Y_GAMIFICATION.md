# 🎮 GỢI Ý TÍNH NĂNG GAMIFICATION CHO WEBAPP HỌC TIẾNG ANH

## 📋 MỤC LỤC
1. [Streak System (Chuỗi ngày học)](#streak-system)
2. [Achievements & Badges](#achievements--badges)
3. [Leaderboard](#leaderboard)
4. [Các tính năng bổ sung](#các-tính-năng-bổ-sung)
5. [Thiết kế Database](#thiết-kế-database)
6. [API Endpoints đề xuất](#api-endpoints-đề-xuất)

---

## 🔥 STREAK SYSTEM (Chuỗi ngày học)

### 1. **Daily Streak (Chuỗi ngày học liên tiếp)**
- **Mô tả**: Đếm số ngày học liên tiếp của người dùng
- **Cách tính**: 
  - Mỗi ngày người dùng học ít nhất X từ (ví dụ: 5 từ) → streak +1
  - Nếu bỏ qua 1 ngày → streak reset về 0
  - Có thể có "streak freeze" (bảo vệ 1 lần) khi mua bằng điểm
- **Hiển thị**: 
  - Badge trên profile: "🔥 7 ngày liên tiếp"
  - Animation khi đạt milestone (7, 30, 100 ngày)
  - Thông báo: "Bạn đang có chuỗi 7 ngày! Học hôm nay để không mất streak!"

### 2. **Weekly Streak (Chuỗi tuần)**
- Đếm số tuần học liên tiếp (mỗi tuần học ít nhất 3 ngày)
- Milestone: 4 tuần, 12 tuần, 52 tuần

### 3. **Monthly Challenge (Thử thách tháng)**
- Mục tiêu: Học X từ trong tháng
- Progress bar hiển thị tiến độ
- Phần thưởng khi hoàn thành

### 4. **Perfect Week**
- Học đủ 7/7 ngày trong tuần → Badge "Perfect Week"

---

## 🏆 ACHIEVEMENTS & BADGES

### **A. Achievements về Số lượng từ**

#### 1. **Beginner Achievements**
- 🥉 **First Steps**: Học từ đầu tiên
- 🥈 **Getting Started**: Học 10 từ
- 🥇 **On the Way**: Học 50 từ
- ⭐ **Word Collector**: Học 100 từ
- ⭐⭐ **Vocabulary Builder**: Học 250 từ
- ⭐⭐⭐ **Word Master**: Học 500 từ
- ⭐⭐⭐⭐ **Lexicon Expert**: Học 1,000 từ
- ⭐⭐⭐⭐⭐ **Vocabulary Legend**: Học 5,000 từ

#### 2. **Perfect Scores**
- 🎯 **Perfect Quiz**: Đạt 100% trong 1 quiz
- 🎯🎯 **Perfect Streak**: 5 quiz liên tiếp đạt 100%
- 🎯🎯🎯 **Quiz Master**: 10 quiz liên tiếp đạt 100%

#### 3. **Review Achievements**
- 🔄 **Daily Reviewer**: Ôn tập 10 từ trong 1 ngày
- 🔄🔄 **Consistent Learner**: Ôn tập 7 ngày liên tiếp
- 🔄🔄🔄 **Review Champion**: Ôn tập 100 từ trong 1 tuần

### **B. Achievements về Thời gian**

#### 4. **Time-based**
- ⏰ **Early Bird**: Học trước 7h sáng
- 🌙 **Night Owl**: Học sau 10h tối
- ⏰⏰ **Dedicated Learner**: Học 30 phút liên tục
- ⏰⏰⏰ **Marathon Learner**: Học 2 giờ liên tục

#### 5. **Streak Achievements**
- 🔥 **Week Warrior**: 7 ngày liên tiếp
- 🔥🔥 **Month Master**: 30 ngày liên tiếp
- 🔥🔥🔥 **Century Club**: 100 ngày liên tiếp
- 🔥🔥🔥🔥 **Year Champion**: 365 ngày liên tiếp

### **C. Achievements về Kỹ năng**

#### 6. **Flashcard Mastery**
- 📚 **Flashcard Novice**: Học 50 flashcard
- 📚📚 **Flashcard Expert**: Học 500 flashcard
- 📚📚📚 **Flashcard Master**: Học 2,000 flashcard

#### 7. **Quiz Achievements**
- 🎲 **Quiz Starter**: Hoàn thành 5 quiz
- 🎲🎲 **Quiz Enthusiast**: Hoàn thành 25 quiz
- 🎲🎲🎲 **Quiz Master**: Hoàn thành 100 quiz
- 🎲🎲🎲🎲 **Quiz Legend**: Hoàn thành 500 quiz

#### 8. **Set Achievements**
- 📖 **Set Explorer**: Hoàn thành 1 bộ từ (100% từ đã nhớ)
- 📖📖 **Set Collector**: Hoàn thành 5 bộ từ
- 📖📖📖 **Set Master**: Hoàn thành 20 bộ từ

### **D. Achievements đặc biệt**

#### 9. **Social Achievements**
- 👥 **Sharing is Caring**: Chia sẻ 1 bộ từ công khai
- 👥👥 **Community Builder**: Chia sẻ 5 bộ từ công khai
- 💬 **Helper**: Giúp đỡ người khác (tương lai: comment, like)

#### 10. **Special Achievements**
- 🎁 **Lucky Learner**: Học vào ngày sinh nhật
- 🎄 **Holiday Learner**: Học vào ngày lễ
- 🌟 **Speed Demon**: Hoàn thành quiz trong < 30 giây
- 🧠 **Memory Master**: Nhớ 10 từ liên tiếp không sai

### **E. Badge Categories**

#### **Rarity Levels (Độ hiếm)**
- 🥉 **Common** (Thường): Màu xám
- 🥈 **Rare** (Hiếm): Màu xanh lá
- 🥇 **Epic** (Cực hiếm): Màu tím
- 💎 **Legendary** (Huyền thoại): Màu vàng/cam
- 🌟 **Mythic** (Thần thoại): Màu đỏ/hồng

#### **Badge Display**
- Hiển thị trên profile
- Collection page: Xem tất cả badges đã đạt
- Badge animation khi unlock
- Share badge lên social media

---

## 🏅 LEADERBOARD

### 1. **Global Leaderboard (Bảng xếp hạng toàn cầu)**

#### **Categories:**
- 📊 **Total Words Learned**: Tổng số từ đã nhớ
- 🔥 **Longest Streak**: Chuỗi ngày học dài nhất
- ⚡ **This Week**: Top người học nhiều nhất tuần này
- 📈 **This Month**: Top người học nhiều nhất tháng này
- 🎯 **Quiz Score**: Điểm quiz trung bình cao nhất
- ⏰ **Time Spent**: Thời gian học nhiều nhất

#### **Features:**
- Top 100 người dùng
- Hiển thị rank của bạn
- Filter theo: All time, This week, This month
- Pagination cho bảng xếp hạng

### 2. **Friends Leaderboard (Bảng xếp hạng bạn bè)**
- So sánh với bạn bè (nếu có tính năng follow/friend)
- Private leaderboard chỉ hiển thị bạn bè

### 3. **Set-specific Leaderboard**
- Leaderboard cho từng bộ từ cụ thể
- Ai học nhanh nhất, điểm cao nhất

### 4. **Weekly/Monthly Challenges**
- Challenge: "Học nhiều từ nhất tuần này"
- Top 10 nhận phần thưởng đặc biệt

---

## 🎁 CÁC TÍNH NĂNG BỔ SUNG

### 1. **Points System (Hệ thống điểm)**

#### **Earn Points:**
- Học 1 từ mới: +10 điểm
- Ôn tập 1 từ: +5 điểm
- Hoàn thành quiz: +20 điểm
- Đạt 100% quiz: +50 điểm bonus
- Duy trì streak: +5 điểm/ngày
- Unlock achievement: +100 điểm

#### **Spend Points:**
- Streak freeze: 500 điểm
- Unlock premium sets: 1000 điểm
- Custom themes: 200 điểm
- Avatar customization: 300 điểm

### 2. **Level System (Hệ thống cấp độ)**

#### **Levels:**
- Level 1-10: Beginner (0-500 từ)
- Level 11-20: Intermediate (500-2000 từ)
- Level 21-30: Advanced (2000-5000 từ)
- Level 31-40: Expert (5000-10000 từ)
- Level 41-50: Master (10000+ từ)

#### **Features:**
- Progress bar hiển thị XP đến level tiếp theo
- Unlock features mới khi lên level
- Title hiển thị level (ví dụ: "Advanced Learner Level 25")

### 3. **Daily Challenges (Thử thách hàng ngày)**

#### **Types:**
- 🎯 **Daily Goal**: Học 20 từ hôm nay
- ⚡ **Speed Challenge**: Hoàn thành quiz trong 2 phút
- 🎲 **Perfect Challenge**: Đạt 100% trong quiz
- 📚 **Review Challenge**: Ôn tập 15 từ

#### **Rewards:**
- Hoàn thành → Nhận điểm, XP, hoặc badge đặc biệt
- Streak bonus nếu hoàn thành 7 ngày liên tiếp

### 4. **Progress Visualization**

#### **Visual Elements:**
- 🗺️ **Learning Map**: Bản đồ hành trình học tập
- 📊 **Progress Tree**: Cây phát triển theo tiến độ
- 🏆 **Trophy Case**: Tủ trưng bày achievements
- 📈 **Stats Dashboard**: Dashboard chi tiết với charts

### 5. **Social Features (Tương lai)**

- 👥 **Follow friends**: Theo dõi bạn bè
- 💬 **Share achievements**: Chia sẻ thành tích
- 🎁 **Send gifts**: Gửi quà cho bạn bè
- 🏅 **Compare progress**: So sánh tiến độ

---

## 💾 THIẾT KẾ DATABASE

### **1. Bảng `user_streaks`**
```sql
CREATE TABLE user_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  streak_freeze_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **2. Bảng `achievements`**
```sql
CREATE TABLE achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, -- e.g., 'first_word', 'perfect_quiz'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary, mythic
  points_reward INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 0
);
```

### **3. Bảng `user_achievements`**
```sql
CREATE TABLE user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  progress INTEGER DEFAULT 0, -- for progress-based achievements
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id),
  UNIQUE(user_id, achievement_id)
);
```

### **4. Bảng `user_stats`**
```sql
CREATE TABLE user_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total_words_learned INTEGER DEFAULT 0,
  total_quizzes_completed INTEGER DEFAULT 0,
  total_quiz_score INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- in seconds
  current_level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  perfect_quizzes_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **5. Bảng `daily_challenges`**
```sql
CREATE TABLE daily_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  challenge_date DATE NOT NULL,
  challenge_type TEXT NOT NULL, -- 'daily_goal', 'speed', 'perfect', 'review'
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, challenge_date, challenge_type)
);
```

---

## 🔌 API ENDPOINTS ĐỀ XUẤT

### **Streak APIs**
```
GET    /api/gamification/streak          - Lấy thông tin streak hiện tại
POST   /api/gamification/streak/update    - Cập nhật streak (tự động khi học)
POST   /api/gamification/streak/freeze    - Sử dụng streak freeze
```

### **Achievement APIs**
```
GET    /api/gamification/achievements           - Lấy danh sách tất cả achievements
GET    /api/gamification/achievements/user    - Lấy achievements đã unlock
POST   /api/gamification/achievements/check   - Kiểm tra và unlock achievements mới
GET    /api/gamification/achievements/:id     - Chi tiết 1 achievement
```

### **Leaderboard APIs**
```
GET    /api/gamification/leaderboard/global?type=words&period=all_time
GET    /api/gamification/leaderboard/weekly
GET    /api/gamification/leaderboard/monthly
GET    /api/gamification/leaderboard/set/:setId
GET    /api/gamification/leaderboard/my-rank
```

### **Stats & Points APIs**
```
GET    /api/gamification/stats                - Lấy stats tổng hợp
GET    /api/gamification/points               - Lấy số điểm hiện tại
POST   /api/gamification/points/add            - Thêm điểm (internal)
POST   /api/gamification/points/spend          - Tiêu điểm
GET    /api/gamification/level                 - Lấy level và XP
```

### **Daily Challenge APIs**
```
GET    /api/gamification/challenges/today      - Lấy challenges hôm nay
POST   /api/gamification/challenges/complete   - Hoàn thành challenge
GET    /api/gamification/challenges/history    - Lịch sử challenges
```

---

## 🎨 UI/UX SUGGESTIONS

### **1. Profile Page Enhancements**
- Hiển thị streak counter nổi bật với animation
- Badge collection gallery
- Level progress bar
- Points balance
- Recent achievements với animation

### **2. Home Dashboard**
- Streak widget: "🔥 Bạn đã học 7 ngày liên tiếp!"
- Daily challenge card
- Achievement notification: "🎉 Bạn vừa unlock: Word Collector!"
- Leaderboard preview: "Bạn đang xếp #42 toàn cầu"

### **3. Achievement Unlock Animation**
- Modal popup khi unlock achievement
- Confetti animation
- Sound effect (optional)
- Share button

### **4. Leaderboard Page**
- Top 3 với podium animation
- Highlight rank của bạn
- Filter và search
- Pagination

### **5. Stats Page**
- Visual progress charts
- Achievement progress bars
- Streak calendar view
- Learning journey timeline

---

## 📱 IMPLEMENTATION PRIORITY

### **Phase 1: Core Gamification (Ưu tiên cao)**
1. ✅ Daily Streak System
2. ✅ Basic Achievements (10-15 achievements phổ biến)
3. ✅ Points System
4. ✅ Level System
5. ✅ Global Leaderboard (Total Words)

### **Phase 2: Enhanced Features (Ưu tiên trung bình)**
6. ✅ Weekly/Monthly Challenges
7. ✅ More Achievements (30-50 total)
8. ✅ Badge Collection Page
9. ✅ Detailed Stats Dashboard
10. ✅ Achievement Animations

### **Phase 3: Advanced Features (Ưu tiên thấp)**
11. ✅ Friends Leaderboard
12. ✅ Social Sharing
13. ✅ Gift System
14. ✅ Custom Themes (unlock bằng points)
15. ✅ Seasonal Events & Special Achievements

---

## 💡 BEST PRACTICES

### **1. Engagement**
- Thông báo streak sắp mất để khuyến khích học
- Daily challenges đa dạng, không nhàm chán
- Achievements có mục tiêu rõ ràng và đạt được

### **2. Balance**
- Không quá dễ → mất hứng thú
- Không quá khó → nản lòng
- Có achievements ngắn hạn và dài hạn

### **3. Motivation**
- Celebrate milestones lớn (7, 30, 100 ngày)
- Visual feedback rõ ràng
- Progress tracking chi tiết

### **4. Performance**
- Cache leaderboard data
- Lazy load achievement images
- Optimize streak calculation

---

## 🎯 KẾT LUẬN

Với các tính năng gamification trên, webapp sẽ:
- ✅ Tăng engagement và retention
- ✅ Tạo động lực học tập hàng ngày
- ✅ Tạo cảm giác thành tựu và tiến bộ
- ✅ Thêm yếu tố cạnh tranh lành mạnh
- ✅ Làm cho việc học trở nên vui vẻ và thú vị hơn

**Khuyến nghị bắt đầu với Phase 1** để có impact nhanh nhất với effort hợp lý!

