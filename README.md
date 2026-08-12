# ⚡ MeshX — Next-Gen Real-Time Messaging & Calling Platform

<p align="center">

  <a href="https://github.com/tayabawan19/MeshX"><img src="https://img.shields.io/badge/MeshX-v1.0.0-7C3AED?style=for-the-badge&logo=react&logoColor=white" alt="MeshX Version"></a>
  <a href="https://expo.dev"><img src="https://img.shields.io/badge/Expo-SDK%2054-000000?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 54"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-v20-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"></a>
  <a href="https://mongodb.com"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Atlas"></a>
  <a href="https://socket.io"><img src="https://img.shields.io/badge/Socket.io-v4-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io"></a>
</p>

---

## 🌟 Overview

**MeshX** is a feature-rich, high-performance real-time messaging, status stories, and voice/video calling platform designed with state-of-the-art UI/UX, vibrant gradient aesthetics, glassmorphism components, and robust privacy controls.

Built with **React Native (Expo SDK 54)** on the frontend and a **TypeScript Node.js Express + MongoDB** backend architecture, MeshX delivers instantaneous Socket.io messaging, Cloudinary media processing, Agora RTC voice/video calling, and Firebase FCM offline push notifications.

---

## ✨ Features

### 🔐 1. Authentication & Security
- **Email & Phone Verification**: Transactional 6-digit OTP verification powered by **Brevo API**.
- **JWT Dual Token Pattern**: Short-lived access tokens with secure refresh token rotation.
- **Password Protection**: Salted password hashing with `bcryptjs`.

### 💬 2. Real-Time Bubble Messaging
- **Live Socket.io Engine**: Instant message delivery and bi-directional status updates.
- **Receipts & Typing Status**: Real-time typing indicators and delivered/read checkmarks (✓✓).
- **Emoji Reactions & Replies**: Quick inline emoji reactions and quote reply previews.
- **Search & Contact Management**: Exact email/phone lookup, instant adding, and direct chat creation.

### 📷 3. Rich Media Messages
- **Cloudinary CDN Integration**: Fast delivery of image, voice, and document uploads.
- **Voice Notes**: In-app audio recording with native duration formatting.
- **Documents & Media Viewer**: Full-screen preview modal with zoom and document inspection.

### ⭕ 4. 24-Hour Disappearing Stories
- **Status Updates**: Post image, video, or custom gradient text stories.
- **Segmented Progress Bars**: 5-second automatic story segments with tap navigation (Next/Prev/Hold to pause).
- **Interactive Avatar Rings**: Vibrant animated gradient rings for unviewed stories vs muted gray for viewed stories.
- **Viewers List & TTL Cleanup**: Owner bottom sheet displaying viewer list with timestamps, backed by native MongoDB 24h TTL auto-deletion (`expiresAt`).

### 📞 5. Voice & Video Calling
- **Agora RTC Integration**: High-definition voice and video calls with low latency.
- **Socket.io Signaling**: Real-time `call_initiate`, `call_accept`, `call_decline`, and `call_end` handshake.
- **Incoming Call Overlay**: Pulsing green Accept / red Decline action screen.
- **Active Call Controls**: HD video PIP preview, mute mic, speaker toggle, flip camera, and live duration counter.
- **Calls History**: Call log tracking with redial support and missed call indicators.

### 🔔 6. Offline Push Notifications
- **Firebase Cloud Messaging (FCM)**: Background push notifications for offline messages, new stories, and urgent incoming calls.
- **Smart Mute Suppression**: Suppresses push notifications for muted conversations.

### 🎨 7. Settings, Customization & Privacy
- **Appearance & Themes**: Instant Light / Dark / System mode toggle.
- **Per-Chat Customization**: Curated bubble gradient swatches and custom chat wallpapers.
- **Disappearing Messages**: Configure 24h or 7-day auto-expiring chat messages.
- **Privacy & Security**: Toggle last seen visibility, read receipts, manage blocked users, and destructive account deletion.

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend Framework** | React Native, Expo (SDK 54), TypeScript |
| **State Management** | Zustand |
| **Styling & UI** | Vanilla CSS/StyleSheet, Expo Linear Gradient, Lucide React Native Icons |
| **Media & Audio** | Expo AV, Expo Image Picker, Expo Document Picker |
| **Backend Runtime** | Node.js, Express, TypeScript |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Real-Time Engine** | Socket.io |
| **Push Notifications** | Firebase Admin SDK (FCM) |
| **Calling Engine** | Agora RTC SDK |
| **Transactional Email**| Brevo (Sendinblue) REST API |
| **Media Hosting** | Cloudinary CDN |

---

## 📁 Project Architecture

```
MeshX/
├── backend/
│   ├── src/
│   │   ├── config/             # DB & Cloudinary connection setup
│   │   ├── controllers/        # Auth, User, Chat, Story, Call controllers
│   │   ├── middleware/         # JWT authentication & validation middleware
│   │   ├── models/             # User, Chat, Message, Story, Call, Otp models
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Brevo email, Cloudinary media, FCM services
│   │   ├── sockets/            # Socket.io real-time chat & call signaling
│   │   └── server.ts           # Server entry point
│   ├── .env.example
│   └── package.json
├── src/
│   ├── components/             # Reusable UI cards, chat bubbles, avatar rows
│   ├── config/                 # API client & Socket.io client setup
│   ├── navigation/             # App navigation stack & bottom tabs
│   ├── screens/                # Main app screens & overlay modals
│   ├── store/                  # Zustand stores (useAuthStore, useChatStore, useThemeStore)
│   ├── theme/                  # Color palettes & bubble themes
│   └── utils/                  # Date formatting, haptics, mock fallbacks
├── app.json
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on mobile device or iOS/Android Emulator

### 1. Clone Repository
```bash
git clone https://github.com/tayabawan19/MeshX.git
cd MeshX
```

### 2. Configure Backend Environment
Navigate to `backend/` and create a `.env` file based on `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/meshx?retryWrites=true&w=majority
JWT_SECRET=your_jwt_super_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=no-reply@meshx.app
BREVO_SENDER_NAME=MeshX

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
FIREBASE_SERVICE_ACCOUNT=your_firebase_service_account_json_path_or_string
```

### 3. Install Dependencies

#### Install Root Frontend Dependencies:
```bash
npm install
```

#### Install Backend Dependencies:
```bash
cd backend
npm install
cd ..
```

### 4. Run Development Servers

#### Start Backend API & Socket Server:
```bash
npm run backend:dev
```

#### Start Expo Frontend Development Server:
```bash
npm run dev
```

---

## 🧪 Verification & Build Commands

- **Backend TypeScript Build**:
  ```bash
  cd backend && npm run build
  ```
- **Frontend Typecheck**:
  ```bash
  npx tsc --noEmit
  ```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Developed with ❤️ for **MeshX**. Connect, chat, forever.
