# 🎧 Playify X — Neon Muse Stream

A premium music dashboard built with React, TypeScript, Vite, and TanStack Start. Playify X combines cinematic UI, neon glassmorphism, live theme customization, downloads, notifications, and advanced library navigation for a polished listening experience.

## ✨ Features

- 🎵 Modern music dashboard with Home, Discover, Search, Trending, Artists, Albums, Favorites, Playlists, Downloads, Settings, Theme, and Notifications views
- 🌈 Real-time theme customization with accent colors, font selection, and ambient effects
- 📥 Download queue and downloaded songs management
- 🔔 Notification center with read/clear controls and preference toggles
- 🎛️ Persistent app state via `localStorage` for profile, playback, audio, privacy, theme, downloads, and notifications
- 🚀 Smooth transitions using `framer-motion`
- 🧩 Responsive layout with polished glassmorphism UI

## 🧱 Tech Stack

- `react` / `react-dom`
- `typescript`
- `vite`
- `@tanstack/react-start`
- `@tanstack/react-router`
- `framer-motion`
- `lucide-react`
- `tailwindcss` + `@tailwindcss/vite`
- `@radix-ui` primitives
- `recharts` for charts
- `sonner` for notifications

## 🚀 Getting Started

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev -- --host
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint and format

```bash
npm run lint
npm run format
```

## 📁 Project Structure

- `src/routes/index.tsx` — main app shell, view routing, theme application, and UI page components
- `src/styles.css` — global theme variables and glassmorphism styles
- `src/lib/PlayerContext.tsx` — playback and library context helper functions
- `src/assets/` — images and media assets
- `src/components/` — UI primitives and shared components

## 💡 Notes

- The app uses a custom `usePersistedState` hook to save settings and UI state in localStorage.
- `ThemeView` updates CSS variables directly for live theme changes.
- `NotificationsView` supports category filtering, mark-as-read, delete, and preference toggles.
- Sidebar and top bar navigation switch views using a shared `View` state.

## 🧑‍💻 Author

Built in the `neon-muse-stream-main` workspace, with a polished premium UI and fast local development workflow.
