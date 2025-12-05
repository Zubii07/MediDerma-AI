# MediDerma AI – Developer Quickstart

## Prerequisites
- **Node.js 18+** and npm
- **Expo CLI** (`npm install -g expo-cli`) or use `npx expo`
- **Python 3.10+** with `pip`
- **Git** and a device/emulator for testing (Expo Go, Android Studio, Xcode)

## 1. Frontend (Expo App)
```bash
# install dependencies
npm install

# launch Expo dev server (Metro)
npx expo start

# platform helpers
npm run android   # open Android emulator
npm run ios       # open iOS simulator (macOS only)
npm run web       # run in browser
```

### Environment Variables
1. Copy `.env.example` to `.env` at the repo root:
   ```bash
   cp .env.example .env           # macOS/Linux
   copy .env.example .env         # Windows PowerShell
   ```
2. Fill in each value (Firebase keys, API URL, etc.).

Create a `.env` file at the project root with Expo public keys:
```
EXPO_PUBLIC_API_BASE_URL=http://<backend-host>:8000
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
EXPO_PUBLIC_AUTH_TOKEN_KEY=auth-token
EXPO_PUBLIC_AUTH_USER_KEY=auth-user
```

**API URL tips (line 1 in `.env`):**
- Use `http://10.0.2.2:8000` when testing from an Android emulator, `http://127.0.0.1:8000` for iOS simulator, or your laptop’s LAN IP (e.g., `http://192.168.1.x:8000`) for physical devices connected via Expo Go.
- The backend CORS list is controlled through `ALLOWED_ORIGINS` in `backend/.env`. Make sure the value you use for `EXPO_PUBLIC_API_BASE_URL` is present there, otherwise uploads and weather calls will fail with CORS errors.

**What the last two keys do (lines 12–13 in `.env`):**
- `EXPO_PUBLIC_AUTH_TOKEN_KEY` – storage key used by `AsyncStorage` to cache the Firebase auth token locally. Change it if you want to invalidate older installs or avoid collisions with other apps on the same device.
- `EXPO_PUBLIC_AUTH_USER_KEY` – storage key for the serialized Firebase user profile cached on-device. Keep it consistent across environments so sign-in state survives reloads; swap it if you ever need to force users to log in again.

For the Firebase variables above, copy the values directly from your Firebase project settings → “General” → “Your apps”. Make sure the storage bucket matches the one referenced in Firebase Storage security rules.

> **Tip:** Whenever credentials change, update `.env.example` too so teammates know which values are required, then rerun `npx expo start -c` to ensure Metro picks up the new values.

## 2. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# configure backend/.env (see backend/README before deletion):
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
GEMINI_API_KEY=...
WEATHER_API_KEY=...
MODEL_DEVICE=cpu          # or cuda
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006

# run API
python -m app.main
# or
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 3. Firebase Setup
Update `app.config.js` / `.env` with Firebase web credentials and be sure Firestore/Storage security rules suit your environment. The mobile app expects:
- Email/password auth enabled
- Collections:
  - `users/{uid}/scans`
  - `users/{uid}/ancestralData`

## 4. Linting & Type Checks
The repo currently uses ESLint 9+, but no `eslint.config.js` is present after recent cleanup. Create one before running `npm run lint`. Type checking still works via:
```bash
npm run type-check
```

## 5. Typical Workflow
1. Start backend (`python -m app.main`).
2. Start Expo (`npx expo start --tunnel` if testing on physical device).
3. Sign up/login inside the app (Firebase).
4. Upload scans → backend inference → Gemini enrichment → Firestore history.
5. Use the Notifications tab for weather-based alerts (requires location permission + weather API key).

## Troubleshooting
- Check `.env` values on both frontend and backend if requests fail.
- Use `backend/test_api.py` or Expo’s built-in network inspector to verify API connectivity.
- If lint command fails, add an `eslint.config.js` following the ESLint v9 migration guide.

