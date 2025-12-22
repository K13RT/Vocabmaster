# VocabMaster - English Vocabulary Learning Application

VocabMaster is a comprehensive web application designed to facilitate English vocabulary acquisition through scientifically-proven methods, including Flashcards, Spaced Repetition Systems (SRS), and interactive assessments.

## Core Features

### For Students
- **Vocabulary Acquisition**: Interactive flashcards featuring definitions, phonetic transcriptions, usage examples, and audio pronunciation.
- **Spaced Repetition System**: An intelligent algorithm that schedules review sessions based on individual memory retention levels.
- **Interactive Assessments**: Multiple-choice and fill-in-the-blank quizzes to validate knowledge retention.
- **Performance Analytics**: Visual data representations to track learning progress over time.
- **Personalized Vocabulary Sets**: Tools for users to create, organize, and manage their own study materials.
- **Competitive Leaderboard**: An adaptive ranking system that encourages consistent learning through peer comparison.

### For Administrators
- **Management Dashboard**: A centralized overview of system-wide statistics and user activity.
- **User Administration**: Comprehensive tools for managing user accounts and permissions.
- **Content Curation**: Capabilities to develop and distribute standardized vocabulary sets to the community.
- **Assignment System**: Functionality to create and assign specific assessments to students.

## Advanced Features (Version 1.5.0)

- **Adaptive Leaderboard**: A dynamic ranking system that incorporates simulated competitors to maintain user engagement. The system adapts difficulty based on user activity and performance.
- **User-Configurable AI**: Integration with Groq AI for automated vocabulary generation. Users can provide their own API keys through the application settings for personalized content creation.
- **Persistent Data Storage**: Implementation of automated database migration to the user's local AppData directory, ensuring data persistence across application updates and re-installations.

## Technical Architecture

### Frontend
- **Core**: Vanilla JavaScript (ES Modules) for high performance and minimal overhead.
- **Build System**: Vite for optimized production builds and a rapid development environment.
- **Styling**: Modern CSS3 utilizing custom properties (variables), Flexbox, and Grid for a responsive, theme-aware interface.
- **Data Visualization**: Chart.js for rendering complex progress statistics.

### Backend
- **Runtime Environment**: Node.js
- **Web Framework**: Express.js
- **Design Pattern**: Repository Pattern for clean separation of concerns and database abstraction.
- **Security**: Stateless authentication using JSON Web Tokens (JWT) and secure HTTP-only cookies.

### Database
- **Engine**: SQLite (via sql.js) for a lightweight, serverless database solution.
- **Persistence**: Automated synchronization between memory and the local file system.

### Quality Assurance
- **End-to-End Testing**: Playwright for automated verification of critical user workflows.

## Project Structure

```
VocabMaster/
├── client/                 # Frontend source code
│   ├── css/                # Stylesheets (global, components, variables)
│   ├── js/                 # JavaScript logic
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-specific logic
│   │   ├── utils/          # Utility functions
│   │   ├── main.js         # Application entry point
│   │   └── router.js       # Client-side routing engine
│   └── index.html          # Main HTML template
│
├── server/                 # Backend source code
│   ├── config/             # Database and environment configuration
│   ├── data/               # SQLite database storage
│   ├── middleware/         # Authentication and validation logic
│   ├── repositories/       # Data access layer
│   ├── routes/             # API endpoint definitions
│   └── index.js            # Server entry point
│
├── tests/                  # Automated test suites
└── package.json            # Dependency management and scripts
```

## Installation and Deployment

### Prerequisites
- Node.js (Version 18 or higher)
- NPM (Node Package Manager)

### Setup Instructions

1. **Install Dependencies**:
   Execute the following command to install all necessary packages for both client and server:
   ```bash
   npm run install-all
   ```

2. **Development Mode**:
   Launch both the backend server and the frontend development environment simultaneously:
   ```bash
   npm run dev
   ```
   The application will be accessible at: `http://localhost:5173`

3. **Production Build (Electron)**:
   To package the application as a standalone Windows executable:
   ```bash
   npm run dist
   ```

## Default Credentials

- **Administrator**:
  - Username: `admin`
  - Password: `admin123`
- **Standard User**: New accounts can be created via the registration interface.

## Primary API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User authentication |
| POST | `/api/auth/register` | Account creation |
| GET/POST | `/api/sets` | Vocabulary set management |
| GET/POST | `/api/words` | Word management |
| GET | `/api/quiz/multiple-choice/:setId` | Assessment retrieval |
| POST | `/api/progress/review` | Learning progress synchronization |
| PUT | `/api/auth/settings` | User configuration (AI API Keys) |

## Configuration
Server-side configurations are managed via the `server/.env` file, allowing for customization of network ports, security secrets, and other environmental parameters.
