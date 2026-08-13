# Zyricon AI — Production Deployment Guide

Zyricon AI is configured with a modern decoupled full-stack architecture:
- **Frontend**: React + Vite SPA (Hosted on **Vercel**)
- **Backend**: Express API Server (Hosted on **Render**)
- **Database & Auth**: Firebase Realtime Database & Firebase Authentication

---

## 📁 Repository Structure

```
zyricon-ai/
├── frontend/             # React + Vite Client Application
│   ├── src/              # React Source Code
│   ├── public/           # Static Assets
│   ├── package.json      # Frontend Dependencies & Scripts
│   ├── vite.config.ts    # Vite Configuration
│   └── index.html        # HTML Entry Point
│
├── backend/              # Node.js + Express API Backend
│   ├── server/           # Backend DB, Routes, Services & Middleware
│   │   ├── db.ts         # Firebase Realtime Database Client
│   │   ├── types.ts      # Shared Server Types
│   │   ├── middleware/   # Auth & Rate Limiting Middleware
│   │   ├── routes/       # API Routes (auth, chat, admin, user, etc.)
│   │   └── services/     # AI Credits & Gemini Stream Engine
│   ├── server.ts         # Express Application Entry Point
│   ├── package.json      # Backend Dependencies & Build Scripts
│   └── tsconfig.json     # Backend TypeScript Configuration
│
├── .gitignore            # Excluded build artifacts & environment secrets
└── README.md             # Production Deployment Documentation
```

---

## 🚀 Step-by-Step Deployment Instructions

### STEP 1: Deploy Backend to Render

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set the following Build Settings:
   - **Name**: `zyricon-ai-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, configure:
   - `PORT`: `3000` (or leave default assigned by Render)
   - `JWT_SECRET`: Generate a random secure key (e.g. `openssl rand -hex 32`)
   - `AICREDITS_API_KEY` (or `GEMINI_API_KEY`): Your AI provider key
   - `FRONTEND_URL`: `https://your-app-name.vercel.app` (Add your Vercel URL here after Step 2)
6. Click **Create Web Service**.
7. Copy your backend's live URL (e.g., `https://zyricon-ai-backend.onrender.com`).

---

## 🚀 STEP 2: Deploy Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Click **Edit** next to Root Directory and select `frontend`)
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://zyricon-ai-backend.onrender.com` (Your Render backend URL from Step 1)
6. Click **Deploy**.

---

## 🔒 Security Summary

- The frontend contains **zero** server-side secrets or API keys.
- All AI API calls flow exclusively through the Express backend on Render.
- CORS on the Render backend strictly permits requests from your Vercel domain.
- Render server cold-starts (502/503) are gracefully handled by client-side retry messaging.

---

## 🛠 Local Development

```bash
# Backend (Port 3000)
cd backend
npm install
npm run dev

# Frontend (Port 5173 / 3000)
cd frontend
npm install
npm run dev
```
