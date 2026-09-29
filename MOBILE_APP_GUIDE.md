# Community Power Share — Mobile App & Store Release Guide

This codebase is configured with **Capacitor** to build native packages for **Android (APK / AAB)** and **iOS (Apple App Store)**, as well as the **Web version**.

---

## 🛡️ Architecture & Security Segregation
- **Regular Users (Web & Mobile Apps):**
  - **Zero Admin Indication:** There are NO admin buttons, NO "Administrator Portal" cards, NO "Authenticate Passkey" buttons, and NO platform flags shown anywhere in Settings, Navigation, or Header.
  - The application appears 100% clean and consumer-ready for standard users, Google Play Store reviewers, and Apple App Store reviewers.

- **Master Administrator Secret Web Link:**
  - The Admin Panel is accessed **only** by you via a secret web URL:
    - `https://your-domain.com/#admin`
    - or `https://your-domain.com/?admin=portal`
  - Opening this secret link opens the **Master Passkey Modal** (Passkey: `992811`).
  - Upon unlocking, you enter the Master Admin Control Room.
  - When you exit or lock the session, the app immediately locks, hides admin tools, and clears the URL back to normal.

---

## 📱 How to Build the Mobile App Packages

### Step 1: Clone or Download the Code
Clone your repository or download the ZIP to your computer:
```bash
git clone <YOUR_REPO_URL>
cd <PROJECT_FOLDER>
npm install
```

### Step 2: Build & Sync Mobile Assets
Run the pre-configured mobile preparation command:
```bash
npm run mobile:prepare
```
*(This compiles the React code with `VITE_APP_PLATFORM=mobile` and synchronizes assets directly into `/android` and `/ios` folders).*

---

### Step 3A: Building Android (APK for testing, AAB for Google Play Store)
1. Open the project in **Android Studio**:
   ```bash
   npm run cap:android
   # Or directly: npx cap open android
   ```
2. In Android Studio:
   - **For Testing on Android Phone (.apk):**
     Click `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
   - **For Google Play Store Release (.aab):**
     Click `Build` > `Generate Signed Bundle / APK` > choose **Android App Bundle (.aab)** > select your release keystore > Click **Create**.
3. Upload the generated `.aab` file to **Google Play Console**.

---

### Step 3B: Building iOS (Apple App Store)
1. On a Mac, open the project in **Xcode**:
   ```bash
   npm run cap:ios
   # Or directly: npx cap open ios
   ```
2. In Xcode:
   - Select your **Signing Team** in `App` > `Signing & Capabilities`.
   - Choose `Product` > `Archive`.
   - Click **Distribute App** to upload directly to **App Store Connect / TestFlight**.

---

## 🌐 How to Deploy / Update the Web Version on your VPS
1. On your VPS:
   ```bash
   cd /var/www/your-app
   git pull
   npm install
   npm run build
   pm2 restart all
   ```
2. Your VPS serves the full web platform where you can access the **Master Admin Panel** via passkey `992811`.
