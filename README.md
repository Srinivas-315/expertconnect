# ExpertConnect 🔗

A full-stack platform to connect users with domain experts — inspired by Infollion.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React (Vite) + Tailwind CSS + Axios |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT (JSON Web Tokens) |
| CI/CD | GitHub Actions |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Project Structure

```
expertconnect/
├── client/          ← React frontend
├── server/          ← Node.js backend
└── .github/         ← GitHub Actions CI
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/expertconnect.git
cd expertconnect
```

### 2. Setup Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret
npm install
npm run dev
```

### 3. Setup Frontend

```bash
cd client
# Edit .env — set VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | ❌ | Register user/expert |
| POST | `/auth/login` | ❌ | Login |
| GET | `/auth/me` | ✅ | Get current user |
| GET | `/experts` | ❌ | List all experts |
| GET | `/experts/:id` | ❌ | Get expert by ID |
| POST | `/experts/create` | ✅ Expert | Create expert profile |
| POST | `/booking/request` | ✅ | Request a booking |
| GET | `/booking/my` | ✅ | Get my bookings |

---

## Deployment

### Backend → Render

1. Push `server/` to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Set environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-vercel-app.vercel.app`
4. Set start command: `node index.js`

### Frontend → Vercel

1. Push `client/` to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Set env var: `VITE_API_URL=https://your-render-app.onrender.com`
4. Deploy!

---

## Features

- 🔐 JWT Authentication (Register / Login)
- 👤 Role-based access (User / Expert)
- 🔍 Expert listing with search & filters
- 📋 Expert profile creation
- 📅 Booking request system
- 📊 User dashboard with booking history
- 🚀 GitHub Actions CI/CD pipeline

---

Made with ❤️ | ExpertConnect
