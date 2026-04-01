# Quiz App

A full-stack cross-platform quiz platform with:

- `frontend`: React + Vite web app
- `mobile`: React Native + Expo mobile app
- `backend`: Express API for push notifications
- `supabase`: authentication, database, and storage

## Features

- Role-based authentication for users and admins
- Quiz creation and publishing
- Timed quiz gameplay
- Score tracking and result history
- Leaderboard
- Notifications
- Image and video support for quiz questions
- Web PWA support

## Monorepo Structure

```text
quiz_app/
├── frontend/   # Web app
├── mobile/     # Expo mobile app
├── backend/    # Express backend
└── README.md
```

## Tech Stack

- React
- React Native
- Expo
- TypeScript
- Supabase
- Express
- Vite
- Tailwind CSS

## Getting Started

### 1. Install dependencies

Install dependencies inside each app:

```bash
cd frontend && npm install
cd ../backend && npm install
cd ../mobile && npm install
```

### 2. Configure environment variables

Create local `.env` files as needed for each app.

Typical variables used in this repo include:

```bash
# frontend
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=
VITE_VAPID_PUBLIC_KEY=

# mobile
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_BACKEND_URL=

# backend
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
VITE_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
PORT=
```

Do not commit real `.env` files. The repo is configured to ignore them.

### 3. Run the apps

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
npm run dev
```

Mobile:

```bash
cd mobile
npm start
```

## Main Workflows

### User

- Sign up and log in
- Browse published quizzes
- Attempt timed quizzes
- View score history
- Check leaderboard
- Receive notifications

### Admin

- Create quizzes with questions, options, images, and videos
- Publish or delete quizzes
- View registered users
- Send push notifications

## Notes

- Both web and mobile apps use Supabase directly for core data access.
- The backend is primarily used for push notification subscription and delivery.
- Mobile push support is partially wired through Expo.

