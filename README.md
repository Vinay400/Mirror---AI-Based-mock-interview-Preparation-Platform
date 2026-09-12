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
| **Code Execution** | Self-hosted Judge0 (expected at `http://localhost:2358`) |
| **Storage** | Cloudinary (audio uploads), MongoDB (application data) |

## 📁 Project Structure

```
mock-ai/
├── backend/
│   ├── config/            # DB, Gemini AI, Cloudinary configuration
│   ├── controller/        # Auth, interview, and code controllers
│   ├── middleware/        # JWT auth, file upload
│   ├── models/            # User, Interview, InterviewPreset, InterviewQuestion, Audio
│   ├── routes/            # /api/auth, /api/interview, /api/code
│   ├── services/          # aiService, judge0Service, speechService, cloudinaryService
│   └── server.js          # Express app entry point
└── frontend/
    └── src/
        ├── api/           # Axios client & API wrappers
        ├── components/    # Shared + interview components (CodingEditor, InterviewActive, ...)
        ├── context/       # Auth context
        ├── pages/         # Home, Login, Register, Dashboard, CreateInterview,
        │                  # InterviewSession, Results, NotFound
        └── routes/        # App routing
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- FFmpeg installed and available on PATH
- A running [Judge0](https://github.com/judge0/judge0) instance (default: `http://localhost:2358`)
- API keys for Google Gemini, Cloudinary, and Azure Speech

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in your values
npm start
```

The API server starts on the port defined in `.env` (default `3000`).

#### Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `Gemini_API_Key` | Google Gemini API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `AZURE_SPEECH_KEY` | Azure Speech service key |
| `AZURE_SPEECH_REGION` | Azure Speech region (e.g. `centralindia`) |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` (the backend's CORS whitelist expects this origin).

### 3. Judge0

Run a self-hosted Judge0 instance, e.g. with Docker:

```bash
wget https://raw.githubusercontent.com/judge0/judge0/master/docker-compose.yml
docker-compose up -d
```

See the [Judge0 docs](https://github.com/judge0/judge0) for full setup instructions.

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
