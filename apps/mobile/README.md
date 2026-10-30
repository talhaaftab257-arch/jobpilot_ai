# JobPilot ERP Mobile Application (React Native / Expo)

Cross-platform recruitment CRM, client pipeline, and automated AI candidate application application built for Android and iOS.

---

## Features
- **Dashboard Overview**: Daily application quotas (14/30 used), job scrape counts, and pipeline commission revenue.
- **Jobs Feed**: Multi-regional search (Pakistan, Europe, Asia, Arab Region) with AI match percentage badges (≥85% score) and 1-tap apply.
- **Corporate CRM Leads**: Recruiter & talent executive contacts with one-tap dial and personalized outreach.
- **Deal Stages & Pipeline**: Visual Kanban pipeline (Sourcing → Screening → Interview → Offer → Placed) with live commission tracking.
- **Profile & SaaS ERP Controls**: Pro Agency plan management, team seat quota utilization, and emergency stop toggle.

---

## Tech Stack & Color Palette
- **Framework**: React Native with Expo SDK 51
- **Styling**: Mehroon (`#641E32`), Jet Black (`#171717`), and Clean Slate (`#F6F3F4`)
- **Backend API**: Connects to FastAPI backend (`/api/v1`) with offline demo fallback

---

## How to Run Locally

### 1. Install Dependencies
```bash
cd apps/mobile
npm install
```

### 2. Start the Development Server
```bash
npx expo start
```

### 3. Run on Device / Simulator
- **Android Emulator**: Press `a` in the terminal or run `npm run android`
- **iOS Simulator (macOS)**: Press `i` in the terminal or run `npm run ios`
- **Physical Device**: Install **Expo Go** from Google Play Store or Apple App Store and scan the QR code printed in the terminal.

---

## Production Build (APK / IPA)
To generate standalone installable builds using EAS (Expo Application Services):
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview # Generates Android .apk
eas build --platform ios --profile preview     # Generates iOS build
```
