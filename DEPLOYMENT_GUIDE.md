# 🚀 JobPilot AI — Complete Deployment & Mobile App Guide

This guide walks you through running the mobile app on your phone, building a standalone Android APK, and deploying the full-stack system (FastAPI backend + React frontend + Supabase database) to production.

---

## 📱 Part 1: Mobile App (React Native + Expo)

The mobile application is located in `apps/mobile/`. It features the exact design system (Mehroon `#641E32`, Jet Black `#171717`, Warm `#F6F3F4` background) with 5 main screens:
1. **Overview Dashboard** — Quota usage meter, active discovery triggers, tasks, and regional breakdown.
2. **Discover Jobs** — Search, regional tabs (Pakistan, Europe, Asia, Arab Region, USA), match scores, and 1-click apply.
3. **Tracker** — Applications status (Interview, Applied, Pending, Rejected), conversion rates.
4. **Resumes** — 4 Regional Safety Gate CV cards with active status verification.
5. **Settings** — Candidate profile, live backend API host switcher, daily quota cap, emergency pause switch.

---

### Method A: Run Live on Your Phone in 1 Minute (Expo Go)
1. Install the **Expo Go** app on your phone:
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
2. Open terminal in the project:
   ```bash
   cd apps/mobile
   npm start
   ```
3. A large QR code will appear in your terminal.
4. Open **Expo Go** on Android (or Camera on iPhone) and **scan the QR code**.
5. The JobPilot AI mobile app will load instantly on your phone with live reload!

> **💡 Connecting to Backend from Phone:**  
> In the mobile app, go to the **Settings** tab. In the "Backend Server Connection" input, enter your PC's local WiFi IP (e.g., `http://192.168.1.15:8000`) and tap **Connect**.

---

### Method B: Build a Permanent Standalone `.apk` File (Expo EAS)
You can build a direct Android `.apk` installable file in the cloud (no Android Studio required on your machine):

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log in or create a free Expo account:
   ```bash
   eas login
   ```
3. Run the APK build command from `apps/mobile`:
   ```bash
   cd apps/mobile
   eas build -p android --profile preview
   ```
4. EAS will compile the APK on Expo's cloud servers. In ~10 minutes, you will receive a direct download link and QR code to download and install the `.apk` on your Android phone!

---

## 🌐 Part 2: Web Frontend Deployment (Vercel — 100% Free)

Vercel provides instant global CDN hosting, automatic SSL, and zero configuration:

1. Push your repository to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set the following project settings:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**. Your web dashboard is live at `https://your-app.vercel.app`!

---

## 🐍 Part 3: Backend Deployment (FastAPI + APScheduler)

The backend handles AI evaluation, job collectors (LinkedIn, Indeed, Rozee.pk, NaukriGulf), and the 6-hour discovery scheduler.

### Option A: Railway.app (Recommended & Easiest)
1. Go to [railway.app](https://railway.app) and select **New Project** -> **Deploy from GitHub repo**.
2. Select the repository.
3. In **Settings**:
   - Set **Root Directory** to `/` or use the included `Dockerfile`.
   - Add Environment Variables:
     ```env
     PORT=8000
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     DATABASE_URL=postgresql://postgres:...
     DRY_RUN_MODE=true
     EMAIL_AUTOMATION_MODE=approval
     ```
4. Railway will automatically build and assign a public domain (e.g. `https://jobpilot-api.up.railway.app`).

### Option B: Render.com
1. Go to [render.com](https://render.com).
2. Connect your repo using the included `render.yaml` blueprint.
3. Render automatically provisions the web service running Python 3.12 and Uvicorn.

---

## 🗄️ Part 4: Database (Supabase PostgreSQL)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the **Project URL**, **Anon Key**, and **Service Role Key** from `Project Settings -> API`.
3. In the SQL Editor, execute the migration script located at `database-verification.sql`.
4. Add the database connection string to your backend's `.env`.

---

## 🛠️ Verification & Health Check

- **Local Backend API:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Local Web Frontend:** [http://localhost:5173](http://localhost:5173)
- **Local Mobile App:** `cd apps/mobile && npm start`
