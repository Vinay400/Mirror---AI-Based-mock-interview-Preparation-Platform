# 🎯 Mock AI — AI-Powered Mock Interview Platform

Mock AI is a full-stack web application that simulates realistic technical interviews using AI. It generates role-specific interview questions, records spoken answers via webcam, transcribes them with Azure Speech, executes and evaluates coding solutions with a self-hosted Judge0 instance, and delivers an AI-generated performance report.

## ✨ Features

- **AI Interview Generation** — Gemini generates technical, coding, and HR questions tailored to the candidate's role, experience level, difficulty, and skills
- **Two Interview Modes**
  - **Custom Interview** — configure job role, experience, difficulty, question count, and additional skills
  - **Curated Interview** — start instantly from curated presets and a question bank
- **Spoken Question Evaluation** — answers are recorded as audio, uploaded to Cloudinary, converted to WAV with FFmpeg, transcribed with Azure Speech-to-Text, and evaluated by Gemini
- **Coding Question Evaluation**
  - **Algorithm questions (Judge0)** — write code in the Monaco editor and run it against test cases on a self-hosted Judge0 instance supporting C, C++, Go, Java, JavaScript, and Python
  - **Framework questions** — React, Vue, Angular, Flutter, etc. code is reviewed qualitatively by Gemini
- **Performance Dashboard** — review past interviews, scores, and AI feedback
- **Authentication** — JWT-based register/login with bcrypt password hashing

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS 4, React Router 7, Monaco Editor, React Webcam, React Markdown |
| **Backend** | Node.js, Express 5, Mongoose (MongoDB), JWT, Multer |
| **AI** | Google Gemini (`@google/genai`) — question generation & answer evaluation |
| **Speech** | Azure Cognitive Services Speech SDK (en-IN), FFmpeg audio conversion |
| **Code Execution** | Self-hosted Judge0 (Docker containerized) |
| **Storage** | Cloudinary (audio uploads), MongoDB (application data) |

## 📁 Project Structure

```
mock-ai/
├── docker-compose.yml     # Full-stack container orchestration
├── backend/
│   ├── Dockerfile         # Node.js + FFmpeg backend container
│   ├── config/            # DB, Gemini AI, Cloudinary configuration
│   ├── controller/        # Auth, interview, and code controllers
│   ├── middleware/        # JWT auth, file upload
│   ├── models/            # User, Interview, InterviewPreset, InterviewQuestion, Audio
│   ├── routes/            # /api/auth, /api/interview, /api/code
│   ├── services/          # aiService, judge0Service, speechService, cloudinaryService
│   └── server.js          # Express app entry point
└── frontend/
    ├── Dockerfile         # Vite build + Nginx static server
    ├── nginx.conf         # Nginx API reverse proxy configuration
    └── src/
        ├── api/           # Axios client & API wrappers
        ├── components/    # Shared + interview components (CodingEditor, InterviewActive, ...)
        ├── context/       # Auth context
        ├── pages/         # Home, Login, Register, Dashboard, CreateInterview,
        │                  # InterviewSession, Results, NotFound
        └── routes/        # App routing
```

## 🚀 How to Run the Project

You can run the entire platform either using **Docker Compose** (recommended for quick zero-dependency setup) or **Manual Local Setup** (recommended for active development).

---

### Method 1: Docker Compose (Recommended)

Run the full stack (Frontend, Express Backend, MongoDB, Redis, PostgreSQL, Judge0, and Judge0 Worker) in isolated containers with a single command.

#### Step 1: Clone the Repository
```bash
git clone https://github.com/Vinay400/Mirror---AI-Based-mock-interview-Preparation-Platform.git
cd Mirror---AI-Based-mock-interview-Preparation-Platform
```

#### Step 2: Configure Environment Variables
Copy the sample environment file for the backend and fill in your API keys:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your API credentials:
```env
PORT=3000
MONGO_URI=mongodb://mongo:27017/mockai
JWT_SECRET=your_jwt_secret_key
Gemini_API_Key=your_google_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region
```

#### Step 3: Build & Start All Services
```bash
docker compose up --build
```
*(To run in background mode, add `-d` flag: `docker compose up --build -d`)*

#### Step 4: Access the Application
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`
- **Judge0 Engine**: `http://localhost:2358`

#### Useful Docker Commands
```bash
# View logs from all containers
docker compose logs -f

# View status of running containers
docker compose ps

# Stop all services
docker compose down

# Stop and remove persistent database volumes (fresh reset)
docker compose down -v
```

---

### Method 2: Manual Local Setup

Ideal if you are actively modifying backend or frontend source code.

#### Prerequisites
- **Node.js**: v18 or later
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI
- **FFmpeg**: Installed and available on your system `PATH` (required for WAV audio conversion)
- **Judge0**: Self-hosted Judge0 instance running at `http://localhost:2358`

#### Step 1: Configure Backend Environment
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env` with your database connection and API keys:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/mockai
JWT_SECRET=your_jwt_secret
Gemini_API_Key=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=centralindia
CORS_ORIGIN=http://localhost:5173
JUDGE0_URL=http://localhost:2358
```

#### Step 2: Install Backend Dependencies & Start Server
```bash
# Inside backend/ directory
npm install
npm start
```
The backend will start listening at `http://localhost:3000`.

#### Step 3: Install Frontend Dependencies & Start Dev Server
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The Vite dev server will start at `http://localhost:5173`.

---

### 🧪 Verifying the Installation

1. Open your browser and navigate to `http://localhost:5173`.
2. Click **Register** to create a new user account.
3. Start a **Curated Interview** or **Custom Interview**.
4. In coding questions, write a solution in the Monaco editor and click **Run Code** to verify Judge0 execution.
5. In spoken questions, grant microphone/webcam permissions, record an answer, and submit to test Azure Speech transcription and Gemini evaluation.



## 🔌 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Log in |
| `GET` | `/api/auth/check` | Verify session (JWT) |
| `GET` | `/api/interview/presets` | List curated interview presets |
| `GET` | `/api/interview/questions` | Browse the question bank |
| `POST` | `/api/interview/start` | Generate & start a custom interview |
| `POST` | `/api/interview/start-curated` | Start a curated interview |
| `GET` | `/api/interview` | List the user's interviews |
| `GET` | `/api/interview/:id` | Get a single interview |
| `POST` | `/api/interview/:id/submit` | Submit answers for evaluation |
| `POST` | `/api/interview/upload-audio` | Upload a recorded answer (webm) |
| `POST` | `/api/code/run` | Execute code on Judge0 |
| `POST` | `/api/code/evaluate` | Evaluate code against test cases |

## 🧠 How It Works

1. **Setup** — the candidate configures a custom interview or picks a curated preset
2. **Generation** — Gemini generates questions tagged as `technical`, `coding` (judge0 or framework), or `hr`
3. **Session** — spoken questions are answered via webcam audio; coding questions are solved in the Monaco editor
4. **Evaluation**
   - Spoken answers → Azure transcription → Gemini review
   - Algorithm code → reference solution generates expected outputs on Judge0 → candidate code is run against test cases
   - Framework code → qualitative Gemini review
5. **Results** — a per-question and overall AI evaluation is stored and shown on the dashboard

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the ISC License.
