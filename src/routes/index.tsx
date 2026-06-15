import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Compass, Search, TrendingUp, Mic2, Disc3, Heart, Clock, ListMusic,
  Download, Settings, Palette, Bell, BadgeCheck, Play, Pause, Shuffle,
  SkipBack, SkipForward, Repeat, Repeat1, MoreVertical, ChevronDown, Headphones,
  Volume2, VolumeX, Maximize2, MessageSquare, ListOrdered, Plus, Trash2, X,
  Scissors, Music2, Pencil,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import hero from "@/assets/hero-album.jpg";
import avatar from "@/assets/avatar.jpg";
import { tracks as ALL_TRACKS, albums, artists, getTrack, trendingIds, featured } from "@/lib/musicData";
import { usePlayer, formatTime } from "@/lib/PlayerContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Playify X — Premium Music Streaming" },
      { name: "description", content: "Stream music with cinematic UI, neon visuals, and a premium dashboard." },
    ],
  }),
  component: PlayifyApp,
});

type View = "Home" | "Discover" | "Search" | "Trending" | "Artists" | "Albums" | "Favorites" | "Recently Played" | "Playlists" | "Downloads" | "Settings" | "Theme" | "Notifications";

const nav: { icon: any; label: View }[] = [
  { icon: Home, label: "Home" },
  { icon: Compass, label: "Discover" },
  { icon: Search, label: "Search" },
  { icon: TrendingUp, label: "Trending" },
  { icon: Mic2, label: "Artists" },
  { icon: Disc3, label: "Albums" },
  { icon: Heart, label: "Favorites" },
];
const lib: { icon: any; label: View }[] = [
  { icon: Clock, label: "Recently Played" },
  { icon: ListMusic, label: "Playlists" },
  { icon: Download, label: "Downloads" },
];
const other: { icon: any; label: View }[] = [
  { icon: Bell, label: "Notifications" },
  { icon: Settings, label: "Settings" },
  { icon: Palette, label: "Theme" },
];

const THEME_MODES = [
  { name: "Dark Mode", label: "Dark Mode" },
  { name: "Midnight Black", label: "Midnight Black" },
  { name: "Neon Green", label: "Neon Green" },
  { name: "Purple Night", label: "Purple Night" },
  { name: "Ocean Blue", label: "Ocean Blue" },
] as const;
const ACCENT_OPTIONS = [
  { name: "Green", value: "#22ff88" },
  { name: "Blue", value: "#29b6f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#fb923c" },
  { name: "Cyan", value: "#22d3ee" },
] as const;
const FONT_OPTIONS = ["Inter", "Poppins", "Manrope", "Outfit"] as const;
const BACKGROUND_EFFECTS = ["Aurora Effects", "Glass Blur", "Floating Particles", "Glow Effects"] as const;
const AUDIO_QUALITIES = ["Low (128kbps)", "Medium (256kbps)", "High (320kbps)", "Lossless"] as const;
const NOTIFICATION_CATEGORIES = ["All", "Music", "System", "Recommendations", "Updates"] as const;

const STORAGE_KEYS = {
  profile: "playify.settings.profile",
  playback: "playify.settings.playback",
  audio: "playify.settings.audio",
  privacy: "playify.settings.privacy",
  theme: "playify.theme.settings",
  downloads: "playify.downloads.list",
  queue: "playify.downloads.queue",
  notifications: "playify.notifications.items",
  notificationPrefs: "playify.notifications.prefs",
};

type ThemeMode = (typeof THEME_MODES)[number]["name"];
type AccentColor = (typeof ACCENT_OPTIONS)[number]["name"];
type FontOption = (typeof FONT_OPTIONS)[number];
type BackgroundEffect = (typeof BACKGROUND_EFFECTS)[number];

type ProfileData = { avatar: string; username: string; displayName: string; email: string };
type PlaybackSettings = { autoplay: boolean; crossfade: boolean; gapless: boolean; rememberLastSong: boolean; autoResume: boolean };
type AudioSettings = { quality: (typeof AUDIO_QUALITIES)[number] };
type PrivacySettings = { showListeningActivity: boolean; publicProfile: boolean; showRecentlyPlayed: boolean; personalizedRecommendations: boolean };
type ThemeSettings = { mode: ThemeMode; accent: AccentColor; font: FontOption; effects: Record<BackgroundEffect, boolean> };
type DownloadStatus = "Downloading" | "Paused" | "Completed";
type DownloadQueueItem = { id: string; cover: string; title: string; artist: string; progress: number; speed: string; status: DownloadStatus };
type DownloadedSong = { id: string; cover: string; title: string; artist: string };
type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
type NotificationItem = { id: string; category: NotificationCategory; title: string; message: string; time: string; unread: boolean; icon: "music" | "system" | "recommendation" | "update" };
type NotificationPreferences = { newMusicAlerts: boolean; playlistRecommendations: boolean; downloadNotifications: boolean; systemUpdates: boolean; promotionalMessages: boolean };

function usePersistedState<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(fallback);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw) as T);
    } catch {}
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState] as const;
}

function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "");
  const bigint = parseInt(cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

function themePalette(mode: ThemeMode) {
  switch (mode) {
    case "Midnight Black":
      return { bg: "#02030a", bg2: "#070b18", card: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.08)" };
    case "Neon Green":
      return { bg: "#061008", bg2: "#0b1612", card: "rgba(20,50,32,0.72)", border: "rgba(34,255,136,0.15)" };
    case "Purple Night":
      return { bg: "#10051d", bg2: "#190a33", card: "rgba(255,255,255,0.06)", border: "rgba(124,77,255,0.18)" };
    case "Ocean Blue":
      return { bg: "#051324", bg2: "#08203d", card: "rgba(255,255,255,0.05)", border: "rgba(34,211,238,0.16)" };
    default:
      return { bg: "#050816", bg2: "#0a0f1f", card: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.08)" };
  }
}

function applyThemeSettings(theme: ThemeSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const palette = themePalette(theme.mode);
  root.style.setProperty("--background", palette.bg);
  root.style.setProperty("--background-2", palette.bg2);
  root.style.setProperty("--color-card", palette.card);
  root.style.setProperty("--color-border-soft", palette.border);
  root.style.setProperty("--color-neon", ACCENT_OPTIONS.find((opt) => opt.name === theme.accent)?.value ?? "#22ff88");
  root.style.setProperty("--color-neon-rgb", hexToRgb(ACCENT_OPTIONS.find((opt) => opt.name === theme.accent)?.value ?? "#22ff88"));
  root.style.setProperty("--font-sans", theme.font);
  const effectBlur = theme.effects["Glass Blur"] ? "24px" : "12px";
  root.style.setProperty("--glass-blur", effectBlur);
}

function PlayifyApp() {
  const [view, setView] = useState<View>("Home");
  const [query, setQuery] = useState("");
  const [profile, setProfile] = usePersistedState<ProfileData>(STORAGE_KEYS.profile, {
    avatar,
    username: "neon.rider",
    displayName: "Neon Voyager",
    email: "neon@playifyx.com",
  });
  const [playback, setPlayback] = usePersistedState<PlaybackSettings>(STORAGE_KEYS.playback, {
    autoplay: true,
    crossfade: true,
    gapless: true,
    rememberLastSong: true,
    autoResume: true,
  });
  const [audio, setAudio] = usePersistedState<AudioSettings>(STORAGE_KEYS.audio, {
    quality: "High (320kbps)",
  });
  const [privacy, setPrivacy] = usePersistedState<PrivacySettings>(STORAGE_KEYS.privacy, {
    showListeningActivity: true,
    publicProfile: true,
    showRecentlyPlayed: true,
    personalizedRecommendations: true,
  });
  const [themeSettings, setThemeSettings] = usePersistedState<ThemeSettings>(STORAGE_KEYS.theme, {
    mode: "Dark Mode",
    accent: "Green",
    font: "Inter",
    effects: {
      "Aurora Effects": true,
      "Glass Blur": true,
      "Floating Particles": true,
      "Glow Effects": true,
    },
  });
  const [downloadQueue, setDownloadQueue] = usePersistedState<DownloadQueueItem[]>(STORAGE_KEYS.queue, [
    { id: "dq1", cover: hero, title: "Neon Drive", artist: "Stellar Beats", progress: 72, speed: "3.2 MB/s", status: "Downloading" },
    { id: "dq2", cover: hero, title: "City Pulse", artist: "Luna Axis", progress: 44, speed: "2.6 MB/s", status: "Paused" },
    { id: "dq3", cover: hero, title: "Midnight Bloom", artist: "Echo Nova", progress: 100, speed: "1.8 MB/s", status: "Completed" },
  ]);
  const [downloadList, setDownloadList] = usePersistedState<DownloadedSong[]>(STORAGE_KEYS.downloads, [
    { id: "ds1", cover: hero, title: "Neon Drive", artist: "Stellar Beats" },
    { id: "ds2", cover: hero, title: "City Pulse", artist: "Luna Axis" },
    { id: "ds3", cover: hero, title: "Midnight Bloom", artist: "Echo Nova" },
  ]);
  const [notifications, setNotifications] = usePersistedState<NotificationItem[]>(STORAGE_KEYS.notifications, [
    { id: "n1", category: "Music", icon: "music", title: "New playlist generated for you.", message: "A curated mix is ready based on your recent favorites.", time: "2m ago", unread: true },
    { id: "n2", category: "Updates", icon: "update", title: "5 songs downloaded successfully.", message: "Your download queue finished in the background.", time: "12m ago", unread: true },
    { id: "n3", category: "Music", icon: "recommendation", title: "New release from your favorite artist.", message: "Listen now to the latest track from Solar Drift.", time: "38m ago", unread: false },
    { id: "n4", category: "System", icon: "system", title: "App update available.", message: "Playify X 2.1.0 includes improved player performance.", time: "1h ago", unread: false },
  ]);
  const [notificationPrefs, setNotificationPrefs] = usePersistedState<NotificationPreferences>(STORAGE_KEYS.notificationPrefs, {
    newMusicAlerts: true,
    playlistRecommendations: true,
    downloadNotifications: true,
    systemUpdates: true,
    promotionalMessages: false,
  });
  const [downloadView, setDownloadView] = useState<"grid" | "list">("grid");
  const [category, setCategory] = useState<NotificationCategory>("All");

  useEffect(() => applyThemeSettings(themeSettings), [themeSettings]);

  const appState = {
    profile,
    setProfile,
    playback,
    setPlayback,
    audio,
    setAudio,
    privacy,
    setPrivacy,
    themeSettings,
    setThemeSettings,
    downloadQueue,
    setDownloadQueue,
    downloadList,
    setDownloadList,
    notifications,
    setNotifications,
    notificationPrefs,
    setNotificationPrefs,
    downloadView,
    setDownloadView,
    category,
    setCategory,
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-white" style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#7c4dff]/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[var(--color-neon)]/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#00e5ff]/10 blur-[120px]" />
      </div>

      <div className="relative flex h-screen gap-4 p-4 pb-[126px]">
        <Sidebar view={view} setView={setView} />
        <main className="flex-1 min-w-0 flex flex-col gap-5">
          <TopBar query={query} setQuery={(q) => { setQuery(q); if (q) setView("Search"); }} setView={setView} />
          <div className="flex-1 min-w-0 overflow-y-auto pr-1 flex flex-col gap-7">
            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="flex flex-col gap-7">
                <ViewSwitcher view={view} setView={setView} query={query} setQuery={setQuery} appState={appState} />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <NowPlayingPanel />
      </div>
      <BottomPlayer />
    </div>
  );
}

/* ---------- View Router ---------- */
function ViewSwitcher({ view, setView, query, setQuery, appState }: { view: View; setView: (v: View) => void; query: string; setQuery: (q: string) => void; appState: {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  playback: PlaybackSettings;
  setPlayback: React.Dispatch<React.SetStateAction<PlaybackSettings>>;
  audio: AudioSettings;
  setAudio: React.Dispatch<React.SetStateAction<AudioSettings>>;
  privacy: PrivacySettings;
  setPrivacy: React.Dispatch<React.SetStateAction<PrivacySettings>>;
  themeSettings: ThemeSettings;
  setThemeSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  downloadQueue: DownloadQueueItem[];
  setDownloadQueue: React.Dispatch<React.SetStateAction<DownloadQueueItem[]>>;
  downloadList: DownloadedSong[];
  setDownloadList: React.Dispatch<React.SetStateAction<DownloadedSong[]>>;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  notificationPrefs: NotificationPreferences;
  setNotificationPrefs: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
  downloadView: "grid" | "list";
  setDownloadView: React.Dispatch<React.SetStateAction<"grid" | "list">>;
  category: NotificationCategory;
  setCategory: React.Dispatch<React.SetStateAction<NotificationCategory>>;
} }) {
  if (view === "Home" || view === "Discover") return <HomeView />;
  if (view === "Search") return <SearchView query={query} setQuery={setQuery} />;
  if (view === "Trending") return <TrendingView />;
  if (view === "Artists") return <ArtistsView />;
  if (view === "Albums") return <AlbumsView />;
  if (view === "Favorites") return <FavoritesView />;
  if (view === "Recently Played") return <RecentView />;
  if (view === "Playlists") return <PlaylistsView />;
  if (view === "Downloads") return <DownloadsView {...appState} />;
  if (view === "Settings") return <SettingsView {...appState} />;
  if (view === "Theme") return <ThemeView {...appState} />;
  if (view === "Notifications") return <NotificationsView {...appState} />;
  return <SimpleView title={view} message="Explore your music while the rest of the app stays premium." />;
}

function SimpleView({ title, message }: { title: string; message: string }) {
  return (
    <section className="glass rounded-2xl p-10">
      <h2 className="text-2xl font-bold" style={{ fontFamily: '"Sora", sans-serif' }}>{title}</h2>
      <p className="mt-2 text-white/60 text-sm">{message}</p>
    </section>
  );
}

function SettingsView({ profile, setProfile, playback, setPlayback, audio, setAudio, privacy, setPrivacy, downloadList }: {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  playback: PlaybackSettings;
  setPlayback: React.Dispatch<React.SetStateAction<PlaybackSettings>>;
  audio: AudioSettings;
  setAudio: React.Dispatch<React.SetStateAction<AudioSettings>>;
  privacy: PrivacySettings;
  setPrivacy: React.Dispatch<React.SetStateAction<PrivacySettings>>;
  downloadList: DownloadedSong[];
}) {
  const { favorites, playlists, recentlyPlayed } = usePlayer();
  const [storageUsage, setStorageUsage] = useState("0 KB");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = JSON.stringify(localStorage, null, 0);
    setStorageUsage(`${Math.max(1, Math.round(raw.length / 1024))} KB`);
  }, [profile, playback, audio, privacy]);

  return (
    <section className="glass rounded-3xl border border-[var(--color-border-soft)] p-6 md:p-8 backdrop-blur-[var(--glass-blur)] transition">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm tracking-[0.26em] text-white/40 uppercase">Settings</div>
          <h1 className="mt-2 text-3xl font-bold" style={{ fontFamily: '"Sora", sans-serif' }}>Profile & app preferences</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65">Fine tune your Playify X premium experience, from playback and privacy to downloads and theme behavior.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          App Version <span className="font-semibold text-white">2.1.0</span>
          <div className="mt-2">Build <span className="font-semibold text-white">310</span></div>
          <div className="mt-2">Last Update <span className="font-semibold text-white">June 12, 2026</span></div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6"> 
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Profile Settings</h2>
                <p className="text-sm text-white/60">Update your profile and account details.</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                Upload Photo
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <div className="relative h-36 w-36 rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                  <img src={profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setProfile((prev) => ({ ...prev, avatar: reader.result }));
                        setSaveState("saved");
                        window.setTimeout(() => setSaveState("idle"), 1200);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-sm text-white/70">Username</label>
                <input
                  value={profile.username}
                  onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition hover:border-white/20"
                />
                <label className="block text-sm text-white/70">Display Name</label>
                <input
                  value={profile.displayName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition hover:border-white/20"
                />
                <label className="block text-sm text-white/70">Email</label>
                <input
                  value={profile.email}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition hover:border-white/20"
                />
                <button
                  type="button"
                  onClick={() => setSaveState("saved")}
                  className="inline-flex items-center justify-center rounded-full bg-[var(--color-neon)] px-5 py-3 text-sm font-semibold text-[#04130a] glow-neon transition hover:brightness-110"
                >
                  {saveState === "saved" ? "Saved" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
            <SectionHeader title="Playback Settings" description="Control how music flows through the app." />
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Autoplay", key: "autoplay" },
                { label: "Crossfade", key: "crossfade" },
                { label: "Gapless Playback", key: "gapless" },
                { label: "Remember Last Song", key: "rememberLastSong" },
                { label: "Auto Resume", key: "autoResume" },
              ].map((item) => (
                <GlassToggle
                  key={item.key}
                  label={item.label}
                  enabled={playback[item.key as keyof PlaybackSettings] as boolean}
                  onChange={(value) => setPlayback((prev) => ({ ...prev, [item.key]: value }))}
                />
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
            <SectionHeader title="Audio Settings" description="Choose the streaming quality you prefer." />
            <div className="mt-4 flex flex-wrap gap-3">
              {AUDIO_QUALITIES.map((quality) => (
                <button
                  key={quality}
                  type="button"
                  onClick={() => setAudio({ quality })}
                  className={`rounded-3xl border px-4 py-3 text-sm transition ${audio.quality === quality ? "border-[var(--color-neon)] bg-[var(--color-neon)]/10 text-[var(--color-neon)]" : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"}`}
                >
                  {quality}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Active Quality</span>
                <span className="font-semibold text-white">{audio.quality}</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
            <SectionHeader title="Privacy Settings" description="Manage what others can see in your profile." />
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Show Listening Activity", key: "showListeningActivity" },
                { label: "Public Profile", key: "publicProfile" },
                { label: "Show Recently Played", key: "showRecentlyPlayed" },
                { label: "Personalized Recommendations", key: "personalizedRecommendations" },
              ].map((item) => (
                <GlassToggle
                  key={item.key}
                  label={item.label}
                  enabled={privacy[item.key as keyof PrivacySettings] as boolean}
                  onChange={(value) => setPrivacy((prev) => ({ ...prev, [item.key]: value }))}
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
            <SectionHeader title="Storage Information" description="Live app and library metrics." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <StatCard label="Total Favorites" value={favorites.length.toString()} />
              <StatCard label="Total Playlists" value={playlists.length.toString()} />
              <StatCard label="Downloaded Songs" value={downloadList.length.toString()} />
              <StatCard label="Recently Played" value={recentlyPlayed.length.toString()} />
            </div>
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Local Storage Usage</span>
                <span className="font-semibold text-white">{storageUsage}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ThemeView({ themeSettings, setThemeSettings }: {
  themeSettings: ThemeSettings;
  setThemeSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}) {
  return (
    <section className="glass rounded-3xl border border-[var(--color-border-soft)] p-6 backdrop-blur-[var(--glass-blur)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm tracking-[0.26em] text-white/40 uppercase">Theme Studio</div>
          <h1 className="mt-2 text-3xl font-bold" style={{ fontFamily: '"Sora", sans-serif' }}>Premium customization</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65">Change the look of Playify X with real-time theme controls, accent colors and effects.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl bg-white/5 p-4 text-sm text-white/70 border border-white/10">Mode: <span className="font-semibold text-white">{themeSettings.mode}</span></div>
          <div className="rounded-3xl bg-white/5 p-4 text-sm text-white/70 border border-white/10">Accent: <span className="font-semibold text-[var(--color-neon)]">{themeSettings.accent}</span></div>
          <div className="rounded-3xl bg-white/5 p-4 text-sm text-white/70 border border-white/10">Font: <span className="font-semibold text-white">{themeSettings.font}</span></div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
            <SectionHeader title="Theme Modes" description="Pick a premium color palette for the player." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {THEME_MODES.map((mode) => (
                <button
                  key={mode.name}
                  type="button"
                  onClick={() => setThemeSettings((prev) => ({ ...prev, mode: mode.name }))}
                  className={`rounded-3xl border p-5 text-left transition ${themeSettings.mode === mode.name ? "border-[var(--color-neon)] bg-[var(--color-neon)]/10 text-[var(--color-neon)]" : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"}`}
                >
                  <div className="text-sm font-semibold">{mode.label}</div>
                  <div className="mt-2 text-xs text-white/50">Premium appearance</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
            <SectionHeader title="Accent Colors" description="Choose your glow and action color." />
            <div className="mt-4 flex flex-wrap gap-3">
              {ACCENT_OPTIONS.map((accent) => (
                <button
                  key={accent.name}
                  type="button"
                  onClick={() => setThemeSettings((prev) => ({ ...prev, accent: accent.name }))}
                  className={`h-12 w-12 rounded-full border-2 transition ${themeSettings.accent === accent.name ? "border-white" : "border-white/10 hover:border-white/60"}`}
                  style={{ backgroundColor: accent.value }}
                  aria-label={accent.name}
                />
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
            <SectionHeader title="Background Effects" description="Toggle ambient visuals." />
            <div className="mt-4 grid gap-4">
              {BACKGROUND_EFFECTS.map((effect) => (
                <GlassToggle
                  key={effect}
                  label={effect}
                  enabled={themeSettings.effects[effect]}
                  onChange={(value) => setThemeSettings((prev) => ({ ...prev, effects: { ...prev.effects, [effect]: value } }))}
                />
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
            <SectionHeader title="Font Settings" description="Select the font used throughout the interface." />
            <select
              value={themeSettings.font}
              onChange={(event) => setThemeSettings((prev) => ({ ...prev, font: event.target.value as FontOption }))}
              className="mt-4 w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition hover:border-white/20"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
          <SectionHeader title="Theme Preview" description="See your current theme live in a mini mockup." />
          <div className="mt-6 rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-5 shadow-[0_30px_60px_-35px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between rounded-3xl bg-white/5 p-4">
              <div>
                <div className="h-2.5 w-20 rounded-full bg-white/20" />
                <div className="mt-2 h-2.5 w-14 rounded-full bg-white/10" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-neon)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
              </div>
            </div>
            <div className="mt-5 rounded-3xl bg-white/5 p-4">
              <div className="h-32 rounded-3xl bg-[var(--color-neon)]/10" />
              <div className="mt-4 h-3 rounded-full bg-white/10" />
              <div className="mt-2 h-3 w-5/6 rounded-full bg-white/10" />
              <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                <span>{themeSettings.mode}</span>
                <span className="font-semibold" style={{ color: ACCENT_OPTIONS.find((option) => option.name === themeSettings.accent)?.value }}>{themeSettings.accent}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DownloadsView({ downloadQueue, setDownloadQueue, downloadList, setDownloadList, downloadView, setDownloadView }: {
  downloadQueue: DownloadQueueItem[];
  setDownloadQueue: React.Dispatch<React.SetStateAction<DownloadQueueItem[]>>;
  downloadList: DownloadedSong[];
  setDownloadList: React.Dispatch<React.SetStateAction<DownloadedSong[]>>;
  downloadView: "grid" | "list";
  setDownloadView: React.Dispatch<React.SetStateAction<"grid" | "list">>;
}) {
  const stats = {
    totalDownloads: downloadList.length + downloadQueue.filter((item) => item.status === "Completed").length,
    downloadedAlbums: Math.max(1, Math.round(downloadList.length / 3)),
    downloadedPlaylists: Math.max(1, Math.round(downloadList.length / 4)),
    storageUsed: `${Math.max(1, downloadList.length * 12)} GB`,
  };

  const setQueueStatus = (status: DownloadStatus) => {
    setDownloadQueue((prev) => prev.map((item) => ({ ...item, status: item.status === "Completed" ? item.status : status })));
  };

  return (
    <section className="glass rounded-3xl border border-[var(--color-border-soft)] p-6 backdrop-blur-[var(--glass-blur)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm tracking-[0.26em] text-white/40 uppercase">Downloads</div>
          <h1 className="mt-2 text-3xl font-bold" style={{ fontFamily: '"Sora", sans-serif' }}>Offline library</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65">Manage downloads, monitor progress, and clear space instantly.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setQueueStatus("Paused")} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10">Pause All</button>
          <button type="button" onClick={() => setQueueStatus("Downloading")} className="rounded-full border border-white/10 bg-[var(--color-neon)]/10 px-4 py-2 text-sm text-[var(--color-neon)] hover:bg-[var(--color-neon)]/15">Resume All</button>
          <button type="button" onClick={() => setDownloadQueue((prev) => prev.filter((item) => item.status !== "Completed"))} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10">Clear Completed</button>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DownloadStatCard label="Total Downloads" value={stats.totalDownloads} />
        <DownloadStatCard label="Downloaded Albums" value={stats.downloadedAlbums} />
        <DownloadStatCard label="Downloaded Playlists" value={stats.downloadedPlaylists} />
        <DownloadStatCard label="Storage Used" value={stats.storageUsed} />
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Download Queue</h2>
              <p className="text-sm text-white/60">Track active downloads and their speed.</p>
            </div>
            <div className="text-sm text-white/50">{downloadQueue.length} items</div>
          </div>
          <div className="mt-6 space-y-4">
            {downloadQueue.map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-4">
                  <img src={item.cover} alt={item.title} className="h-16 w-16 rounded-3xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-white/50">{item.artist}</div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[var(--color-neon)] transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/50">
                    <div>{item.speed}</div>
                    <div className={`mt-1 inline-flex rounded-full px-2 py-1 ${item.status === "Completed" ? "bg-emerald-500/15 text-emerald-300" : item.status === "Paused" ? "bg-yellow-500/15 text-yellow-300" : "bg-[var(--color-neon)]/15 text-[var(--color-neon)]"}`}>{item.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Downloaded Songs</h2>
              <p className="text-sm text-white/60">Switch between grid and list view.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDownloadView("grid")} className={`rounded-full px-3 py-2 text-sm transition ${downloadView === "grid" ? "bg-[var(--color-neon)] text-[#04130a]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>Grid</button>
              <button onClick={() => setDownloadView("list")} className={`rounded-full px-3 py-2 text-sm transition ${downloadView === "list" ? "bg-[var(--color-neon)] text-[#04130a]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>List</button>
            </div>
          </div>
          <div className={`mt-6 grid gap-4 ${downloadView === "grid" ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            {downloadList.map((song) => (
              <div key={song.id} className="group flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20">
                <img src={song.cover} alt={song.title} className="h-16 w-16 rounded-3xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">{song.title}</div>
                  <div className="text-xs text-white/50">{song.artist}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setDownloadList((prev) => prev.filter((item) => item.id !== song.id))}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NotificationsView({ notifications, setNotifications, notificationPrefs, setNotificationPrefs, category, setCategory }: {
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  notificationPrefs: NotificationPreferences;
  setNotificationPrefs: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
  category: NotificationCategory;
  setCategory: React.Dispatch<React.SetStateAction<NotificationCategory>>;
}) {
  const filteredNotifications = category === "All" ? notifications : notifications.filter((item) => item.category === category);

  const markAsRead = (id: string) => setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, unread: false } : item));
  const deleteNotification = (id: string) => setNotifications((prev) => prev.filter((item) => item.id !== id));
  const markAllRead = () => setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  const clearAll = () => setNotifications([]);

  return (
    <section className="glass rounded-3xl border border-[var(--color-border-soft)] p-6 backdrop-blur-[var(--glass-blur)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm tracking-[0.26em] text-white/40 uppercase">Notifications</div>
          <h1 className="mt-2 text-3xl font-bold" style={{ fontFamily: '"Sora", sans-serif' }}>Notification center</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65">Stay on top of alerts, recommendations, downloads, and system updates.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={markAllRead} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Mark All Read</button>
          <button type="button" onClick={clearAll} className="rounded-full border border-white/10 bg-[var(--color-neon)]/10 px-4 py-2 text-sm text-[var(--color-neon)] hover:bg-[var(--color-neon)]/15">Clear All</button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 xl:flex-row">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {NOTIFICATION_CATEGORIES.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={`rounded-full px-4 py-2 text-sm transition ${category === tab ? "bg-[var(--color-neon)] text-[#04130a]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="glass rounded-3xl border border-white/10 p-6 text-center text-white/60">No notifications in this category.</div>
            ) : filteredNotifications.map((item) => (
              <div key={item.id} className={`rounded-3xl border p-5 transition ${item.unread ? "border-[var(--color-neon)]/45 bg-[var(--color-neon)]/10" : "border-white/10 bg-white/5"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-3xl bg-white/10 text-[var(--color-neon)]">{renderIcon(item.icon)}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-sm text-white/60">{item.message}</div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/50">
                    <div>{item.time}</div>
                    <div className="mt-2 rounded-full bg-white/5 px-2 py-1">{item.category}</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => markAsRead(item.id)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10">Mark as Read</button>
                  <button type="button" onClick={() => deleteNotification(item.id)} className="rounded-full border border-white/10 bg-[#ff4d72]/10 px-3 py-2 text-xs text-[#ff7a9a] hover:bg-[#ff4d72]/15">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="w-full xl:w-[320px] space-y-4">
          <div className="glass rounded-3xl border border-[var(--color-border-soft)] p-6">
            <SectionHeader title="Notification Preferences" description="Enable the alerts you want to receive." />
            <div className="mt-4 space-y-3">
              <GlassToggle label="New Music Alerts" enabled={notificationPrefs.newMusicAlerts} onChange={(value) => setNotificationPrefs((prev) => ({ ...prev, newMusicAlerts: value }))} />
              <GlassToggle label="Playlist Recommendations" enabled={notificationPrefs.playlistRecommendations} onChange={(value) => setNotificationPrefs((prev) => ({ ...prev, playlistRecommendations: value }))} />
              <GlassToggle label="Download Notifications" enabled={notificationPrefs.downloadNotifications} onChange={(value) => setNotificationPrefs((prev) => ({ ...prev, downloadNotifications: value }))} />
              <GlassToggle label="System Updates" enabled={notificationPrefs.systemUpdates} onChange={(value) => setNotificationPrefs((prev) => ({ ...prev, systemUpdates: value }))} />
              <GlassToggle label="Promotional Messages" enabled={notificationPrefs.promotionalMessages} onChange={(value) => setNotificationPrefs((prev) => ({ ...prev, promotionalMessages: value }))} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-white/60">{description}</p>
    </div>
  );
}

function GlassToggle({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:border-white/20"
    >
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-1 text-xs text-white/50">{enabled ? "Enabled" : "Disabled"}</div>
      </div>
      <span className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition ${enabled ? "bg-[var(--color-neon)]" : "bg-white/10"}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${enabled ? "translate-x-5" : "translate-x-1"}`} />
      </span>
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm text-white/60">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function DownloadStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm text-white/60">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function renderIcon(icon: NotificationItem["icon"]) {
  if (icon === "music") return <Music2 className="h-4 w-4" />;
  if (icon === "system") return <MessageSquare className="h-4 w-4" />;
  if (icon === "recommendation") return <BadgeCheck className="h-4 w-4" />;
  if (icon === "update") return <RefreshIcon className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
}

function RefreshIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4v6h6" />
      <path d="M20 20v-6h-6" />
      <path d="M5 19a9 9 0 1 1 14-7.5" />
    </svg>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 flex-col glass-strong rounded-2xl p-5">
      <div className="flex items-center gap-2 px-1 mb-7">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[#22ff88] to-[#0aa85a] glow-neon-soft">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#050816]" fill="currentColor"><path d="M5 3v18l4-3V6l10-2v12l-3 1V5L5 3z"/></svg>
        </div>
        <div className="text-xl tracking-tight" style={{ fontFamily: '"Sora", sans-serif', fontWeight: 800 }}>
          Playify <span className="text-[#22ff88]">X</span>
        </div>
      </div>

      <NavGroup items={nav} active={view} setActive={setView} />
      <Divider label="LIBRARY" />
      <NavGroup items={lib} active={view} setActive={setView} />
      <Divider label="OTHER" />
      <NavGroup items={other} active={view} setActive={setView} />

      <div className="mt-auto pt-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-2.5">
          <img src={avatar} alt="Saif Ali" className="h-10 w-10 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">Saif Ali</div>
            <div className="text-[11px] text-[#22ff88] font-medium">Premium</div>
          </div>
          <ChevronDown className="h-4 w-4 text-white/50" />
        </div>
      </div>
    </aside>
  );
}

function NavGroup({ items, active, setActive }: { items: { icon: any; label: View }[]; active: View; setActive: (s: View) => void; }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map(({ icon: Icon, label }) => {
        const isActive = active === label;
        return (
          <li key={label}>
            <button
              onClick={() => setActive(label)}
              className={`group relative w-full flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm transition-all ${
                isActive ? "bg-[#22ff88] text-[#04130a] font-semibold glow-neon" : "text-white/70 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Divider({ label }: { label: string }) {
  return <div className="px-3 pt-5 pb-2 text-[10px] font-bold tracking-[0.15em] text-white/35">{label}</div>;
}

/* ---------- Top bar ---------- */
function TopBar({ query, setQuery, setView }: { query: string; setQuery: (q: string) => void; setView: (v: View) => void }) {
  const { pushSearch } = usePlayer();
  return (
    <div className="flex items-center gap-3">
      <form
        onSubmit={(e) => { e.preventDefault(); if (query.trim()) pushSearch(query); }}
        className="flex-1 glass rounded-full h-14 flex items-center px-5 gap-3"
      >
        <Search className="h-5 w-5 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for songs, artists, albums..."
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/40"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
        <button type="button" onClick={() => setView("Notifications")} className="relative h-9 w-9 grid place-items-center rounded-full hover:bg-white/5">
          <Bell className="h-[18px] w-[18px] text-white/70" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#22ff88] glow-neon-soft" />
        </button>
      </form>
    </div>
  );
}

/* ---------- Home / Hero ---------- */
function HomeView() {
  return (
    <>
      <Hero />
      <Row title="Trending Now" trackIds={trendingIds.concat(["t6"])} />
      <PlaylistRow title="Made For You" />
    </>
  );
}

function Hero() {
  const { playQueue } = usePlayer();
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl aurora p-8 md:p-10 min-h-[360px] flex items-center"
    >
      {[...Array(14)].map((_, i) => (
        <span key={i} className="absolute h-1 w-1 rounded-full bg-white/60 floaty"
          style={{ left: `${(i * 53) % 100}%`, top: `${(i * 31) % 90 + 5}%`, animationDelay: `${i * 0.3}s`, opacity: 0.4 }} />
      ))}

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 items-center w-full">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-[11px] font-bold tracking-wider">
            <span className="grid h-5 w-5 place-items-center rounded bg-[#22ff88]/20 text-[#22ff88]"><BadgeCheck className="h-3.5 w-3.5" /></span>
            FEATURED ALBUM
          </div>
          <h1 className="mt-5 text-5xl md:text-6xl leading-[0.95] tracking-tight" style={{ fontFamily: '"Sora", sans-serif', fontWeight: 800 }}>
            Eternal<br />Horizons
          </h1>
          <div className="mt-5 flex items-center gap-2 text-lg">
            <span className="font-semibold">Ocean Avenue</span>
            <BadgeCheck className="h-5 w-5 text-[#22d3ee] fill-[#22d3ee]/20" />
          </div>
          <p className="mt-3 text-sm text-white/70 leading-relaxed max-w-md">
            A sonic journey through time and space.<br />Feel the rhythm of the universe.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => playQueue(ALL_TRACKS, 0)}
              className="inline-flex items-center gap-2 rounded-full bg-[#22ff88] text-[#04130a] px-6 py-3 text-sm font-bold glow-neon">
              <Play className="h-4 w-4 fill-current" /> Play Now
            </motion.button>
            <FavButton trackId={featured.id} variant="hero" />
          </div>
        </div>
        <div className="relative justify-self-center md:justify-self-end">
          <div className="relative h-[260px] w-[260px] rounded-2xl overflow-hidden shadow-2xl">
            <img src={hero} alt="Eternal Horizons" className="h-full w-full object-cover" />
            <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl" />
          </div>
          <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-fuchsia-500/20 blur-3xl -z-10" />
        </div>
      </div>
    </motion.section>
  );
}

function FavButton({ trackId, variant = "icon" }: { trackId: string; variant?: "icon" | "hero" }) {
  const { isFavorite, toggleFavorite } = usePlayer();
  const fav = isFavorite(trackId);
  if (variant === "hero") {
    return (
      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        onClick={() => toggleFavorite(trackId)}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur px-6 py-3 text-sm font-semibold hover:bg-white/10">
        <Heart className={`h-4 w-4 ${fav ? "fill-[#22ff88] text-[#22ff88]" : ""}`} /> {fav ? "Saved" : "Save Album"}
      </motion.button>
    );
  }
  return (
    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(trackId); }}>
      <Heart className={`h-4 w-4 transition ${fav ? "fill-[#22ff88] text-[#22ff88]" : "text-white/60 hover:text-white"}`} />
    </button>
  );
}

/* ---------- Rows / cards ---------- */
function Row({ title, trackIds }: { title: string; trackIds: string[] }) {
  const items = trackIds.map(getTrack).filter(Boolean) as any[];
  const { playTrack, addToQueue } = usePlayer();
  return (
    <section>
      <Header title={title} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((it) => (
          <motion.div key={it.id} whileHover={{ y: -4, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}
            onClick={() => playTrack(it, items)}
            className="group rounded-2xl bg-white/[0.04] border border-white/[0.05] p-3 hover:bg-white/[0.07] hover:border-white/10 cursor-pointer">
            <div className="relative aspect-square overflow-hidden rounded-xl">
              <img src={it.cover} alt={it.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
              <button className="absolute inset-0 m-auto h-11 w-11 grid place-items-center rounded-full bg-white/95 text-[#050816] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl">
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </button>
            </div>
            <div className="mt-3 flex items-start justify-between gap-2 px-1">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{it.title}</div>
                <div className="text-xs text-white/50 truncate">{it.artist}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); addToQueue(it); }} title="Add to queue">
                <Plus className="h-4 w-4 text-white/40 hover:text-[#22ff88]" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PlaylistRow({ title }: { title: string }) {
  const { playlists, playQueue } = usePlayer();
  return (
    <section className="pb-2">
      <Header title={title} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {playlists.slice(0, 6).map((p) => {
          const list = p.trackIds.map(getTrack).filter(Boolean) as any[];
          return (
            <motion.div key={p.id} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}
              onClick={() => playQueue(list, 0)}
              className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer">
              <img src={p.cover} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <button className="absolute bottom-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-white/95 text-[#050816] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl">
                <Play className="h-4 w-4 fill-current ml-0.5" />
              </button>
              <div className="absolute bottom-3 left-3 right-12">
                <div className="text-sm font-bold truncate">{p.name}</div>
                <div className="text-xs text-white/70 truncate">{p.description}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function Header({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: '"Sora", sans-serif' }}>{title}</h2>
      {action ?? <button className="text-xs text-[#22ff88] font-semibold hover:underline">See All</button>}
    </div>
  );
}

/* ---------- Track list ---------- */
function TrackList({ tracks, contextLabel }: { tracks: any[]; contextLabel?: string }) {
  const { playTrack, current, isPlaying, togglePlay, addToQueue, playlists, addToPlaylist, createPlaylist } = usePlayer();
  const [menuFor, setMenuFor] = useState<string | null>(null);

  if (!tracks.length) return <div className="glass rounded-2xl p-8 text-center text-white/50 text-sm">No tracks yet.</div>;
  return (
    <ul className="flex flex-col gap-1">
      {tracks.map((t, i) => {
        const isCurrent = current?.id === t.id;
        return (
          <li key={`${t.id}-${i}`} className={`group flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.04] ${isCurrent ? "bg-white/[0.04]" : ""}`}>
            <div className="w-6 text-center text-xs text-white/40">{i + 1}</div>
            <button onClick={() => (isCurrent ? togglePlay() : playTrack(t, tracks))} className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
              <img src={t.cover} alt={t.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                {isCurrent && isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </div>
            </button>
            <div className="min-w-0 flex-1">
              <div className={`text-sm truncate ${isCurrent ? "text-[#22ff88] font-semibold" : "font-medium"}`}>{t.title}</div>
              <div className="text-xs text-white/50 truncate">{t.artist} • {t.album}</div>
            </div>
            <div className="hidden md:block text-xs text-white/40 w-20 truncate">{t.genre}</div>
            <FavButton trackId={t.id} />
            <div className="relative">
              <button onClick={() => setMenuFor(menuFor === t.id + i ? null : t.id + i)} className="text-white/50 hover:text-white p-1">
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuFor === t.id + i && (
                <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl glass-strong p-2 text-sm shadow-xl">
                  <button onClick={() => { addToQueue(t); setMenuFor(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add to queue
                  </button>
                  <div className="text-[10px] uppercase tracking-wider text-white/40 px-3 pt-2">Add to playlist</div>
                  {playlists.map((p) => (
                    <button key={p.id} onClick={() => { addToPlaylist(p.id, t.id); setMenuFor(null); }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/5 truncate">{p.name}</button>
                  ))}
                  <button onClick={() => { const p = createPlaylist(`Playlist ${Date.now() % 1000}`); addToPlaylist(p.id, t.id); setMenuFor(null); }}
                    className="w-full text-left px-3 py-2 mt-1 rounded-lg hover:bg-white/5 text-[#22ff88]">
                    + New playlist
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Views ---------- */
function TrendingView() {
  return <section><Header title="Trending Now" action={<span />} /><TrackList tracks={ALL_TRACKS.slice(0, 12)} /></section>;
}

function FavoritesView() {
  const { favorites, playQueue } = usePlayer();
  const list = favorites.map(getTrack).filter(Boolean) as any[];
  return (
    <section>
      <Header title="Your Favorites" action={
        <button onClick={() => list.length && playQueue(list, 0)}
          className="inline-flex items-center gap-2 rounded-full bg-[#22ff88] text-[#04130a] px-4 py-2 text-xs font-bold glow-neon-soft disabled:opacity-40"
          disabled={!list.length}><Play className="h-3 w-3 fill-current" /> Play All</button>
      } />
      <TrackList tracks={list} />
    </section>
  );
}

function RecentView() {
  const { recentlyPlayed } = usePlayer();
  const list = recentlyPlayed.map(getTrack).filter(Boolean) as any[];
  return <section><Header title="Recently Played" action={<span />} /><TrackList tracks={list} /></section>;
}

function ArtistsView() {
  const { playQueue } = usePlayer();
  return (
    <section>
      <Header title="Artists" action={<span />} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {artists.map((a) => {
          const list = ALL_TRACKS.filter((t) => t.artist === a.name);
          return (
            <button key={a.id} onClick={() => list.length && playQueue(list, 0)} className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-white/[0.04]">
              <div className="relative h-32 w-32 rounded-full overflow-hidden ring-1 ring-white/10">
                <img src={a.cover} alt={a.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
              </div>
              <div className="text-sm font-semibold">{a.name}</div>
              <div className="text-xs text-white/50">{list.length} songs</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AlbumsView() {
  const { playQueue } = usePlayer();
  return (
    <section>
      <Header title="Albums" action={<span />} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {albums.map((a) => {
          const list = a.trackIds.map(getTrack).filter(Boolean) as any[];
          return (
            <div key={a.id} onClick={() => list.length && playQueue(list, 0)} className="group cursor-pointer rounded-2xl bg-white/[0.04] border border-white/[0.05] p-3 hover:bg-white/[0.07]">
              <div className="aspect-square overflow-hidden rounded-xl">
                <img src={a.cover} alt={a.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
              </div>
              <div className="mt-3 px-1">
                <div className="text-sm font-semibold truncate">{a.title}</div>
                <div className="text-xs text-white/50 truncate">{a.artist}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlaylistsView() {
  const { playlists, createPlaylist, deletePlaylist, renamePlaylist, removeFromPlaylist, playQueue } = usePlayer();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const open = playlists.find((p) => p.id === openId);
  if (open) {
    const list = open.trackIds.map(getTrack).filter(Boolean) as any[];
    return (
      <section>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setOpenId(null)} className="text-xs text-white/60 hover:text-white">← Back</button>
          <img src={open.cover} alt={open.name} className="h-20 w-20 rounded-xl object-cover" />
          <div className="flex-1">
            {editId === open.id ? (
              <form onSubmit={(e) => { e.preventDefault(); renamePlaylist(open.id, name || open.name); setEditId(null); }}>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={() => { renamePlaylist(open.id, name || open.name); setEditId(null); }}
                  className="bg-transparent border-b border-white/20 text-2xl font-bold outline-none" style={{ fontFamily: '"Sora", sans-serif' }} />
              </form>
            ) : (
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: '"Sora", sans-serif' }}>
                {open.name}
                {!open.builtin && <button onClick={() => { setEditId(open.id); setName(open.name); }}><Pencil className="h-4 w-4 text-white/50 hover:text-white" /></button>}
              </h2>
            )}
            <div className="text-xs text-white/50">{list.length} songs</div>
          </div>
          <button onClick={() => list.length && playQueue(list, 0)} className="inline-flex items-center gap-2 rounded-full bg-[#22ff88] text-[#04130a] px-4 py-2 text-xs font-bold glow-neon-soft disabled:opacity-40" disabled={!list.length}>
            <Play className="h-3 w-3 fill-current" /> Play
          </button>
          <button onClick={() => list.length && playQueue(list, 0, true)} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold hover:bg-white/5">
            <Shuffle className="h-3 w-3" /> Shuffle
          </button>
          {!open.builtin && (
            <button onClick={() => { deletePlaylist(open.id); setOpenId(null); }} className="text-white/40 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
          )}
        </div>
        <ul className="flex flex-col gap-1">
          {list.map((t, i) => (
            <li key={t.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.04]">
              <div className="w-6 text-center text-xs text-white/40">{i + 1}</div>
              <img src={t.cover} alt={t.title} className="h-10 w-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.title}</div>
                <div className="text-xs text-white/50 truncate">{t.artist}</div>
              </div>
              <FavButton trackId={t.id} />
              <button onClick={() => removeFromPlaylist(open.id, t.id)} className="text-white/40 hover:text-red-400 p-1"><X className="h-4 w-4" /></button>
            </li>
          ))}
          {!list.length && <li className="text-sm text-white/50 px-3 py-6">This playlist is empty. Add songs from any track menu.</li>}
        </ul>
      </section>
    );
  }

  return (
    <section>
      <Header title="Your Playlists" action={
        <button onClick={() => createPlaylist(`Playlist #${playlists.length + 1}`)}
          className="inline-flex items-center gap-2 rounded-full bg-[#22ff88] text-[#04130a] px-4 py-2 text-xs font-bold glow-neon-soft">
          <Plus className="h-3 w-3" /> New Playlist
        </button>
      } />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {playlists.map((p) => (
          <div key={p.id} onClick={() => setOpenId(p.id)} className="group cursor-pointer rounded-2xl bg-white/[0.04] border border-white/[0.05] p-3 hover:bg-white/[0.07]">
            <div className="aspect-square overflow-hidden rounded-xl">
              <img src={p.cover} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
            </div>
            <div className="mt-3 px-1 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="text-xs text-white/50 truncate">{p.trackIds.length} songs</div>
              </div>
              {!p.builtin && (
                <button onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }} className="text-white/40 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SearchView({ query, setQuery }: { query: string; setQuery: (q: string) => void }) {
  const { recentSearches, pushSearch, clearSearches, playlists, playQueue } = usePlayer();
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  const q = debounced.trim().toLowerCase();
  const matchingTracks = q ? ALL_TRACKS.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q) || t.genre.toLowerCase().includes(q)) : [];
  const matchingArtists = q ? artists.filter((a) => a.name.toLowerCase().includes(q)) : [];
  const matchingAlbums = q ? albums.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)) : [];
  const matchingPlaylists = q ? playlists.filter((p) => p.name.toLowerCase().includes(q)) : [];

  const suggestions = q
    ? Array.from(new Set([
        ...ALL_TRACKS.filter((t) => t.title.toLowerCase().startsWith(q)).slice(0, 4).map((t) => t.title),
        ...artists.filter((a) => a.name.toLowerCase().startsWith(q)).slice(0, 3).map((a) => a.name),
      ])).slice(0, 6)
    : [];

  useEffect(() => {
    if (!q) return;
    const id = setTimeout(() => pushSearch(q), 1000);
    return () => clearTimeout(id);
  }, [q, pushSearch]);

  if (!q) {
    return (
      <section className="flex flex-col gap-6">
        <Header title="Search" action={recentSearches.length ? <button onClick={clearSearches} className="text-xs text-white/50 hover:text-white">Clear</button> : <span />} />
        {recentSearches.length ? (
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Recent searches</div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((s) => (
                <button key={s} onClick={() => setQuery(s)} className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-10 text-center text-white/50 text-sm">Start typing to search across songs, artists, albums and playlists.</div>
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setQuery(s)} className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs">{s}</button>
          ))}
        </div>
      )}
      {matchingTracks.length > 0 && (
        <div>
          <Header title={`Songs (${matchingTracks.length})`} action={<span />} />
          <TrackList tracks={matchingTracks.slice(0, 8)} />
        </div>
      )}
      {matchingArtists.length > 0 && (
        <div>
          <Header title={`Artists (${matchingArtists.length})`} action={<span />} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {matchingArtists.map((a) => {
              const list = ALL_TRACKS.filter((t) => t.artist === a.name);
              return (
                <button key={a.id} onClick={() => playQueue(list, 0)} className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-white/[0.04]">
                  <img src={a.cover} alt={a.name} className="h-24 w-24 rounded-full object-cover" />
                  <div className="text-sm font-semibold">{a.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {matchingAlbums.length > 0 && (
        <div>
          <Header title={`Albums (${matchingAlbums.length})`} action={<span />} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {matchingAlbums.map((a) => {
              const list = a.trackIds.map(getTrack).filter(Boolean) as any[];
              return (
                <div key={a.id} onClick={() => playQueue(list, 0)} className="cursor-pointer rounded-2xl bg-white/[0.04] p-3 hover:bg-white/[0.07]">
                  <img src={a.cover} alt={a.title} className="aspect-square w-full object-cover rounded-xl" />
                  <div className="mt-2 text-sm font-semibold truncate">{a.title}</div>
                  <div className="text-xs text-white/50 truncate">{a.artist}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {matchingPlaylists.length > 0 && (
        <div>
          <Header title={`Playlists (${matchingPlaylists.length})`} action={<span />} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {matchingPlaylists.map((p) => {
              const list = p.trackIds.map(getTrack).filter(Boolean) as any[];
              return (
                <div key={p.id} onClick={() => playQueue(list, 0)} className="cursor-pointer rounded-2xl bg-white/[0.04] p-3 hover:bg-white/[0.07]">
                  <img src={p.cover} alt={p.name} className="aspect-square w-full object-cover rounded-xl" />
                  <div className="mt-2 text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-white/50 truncate">{p.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!matchingTracks.length && !matchingArtists.length && !matchingAlbums.length && !matchingPlaylists.length && (
        <div className="glass rounded-2xl p-10 text-center text-white/60 text-sm">No results for "{query}"</div>
      )}
    </section>
  );
}

/* ---------- Now Playing Panel ---------- */
function NowPlayingPanel() {
  const { current, isPlaying, togglePlay, prev, next, shuffle, toggleShuffle, repeat, cycleRepeat, progress, duration, seek, queue, queueIndex, clearQueue, cut, isFavorite, toggleFavorite } = usePlayer();
  const pct = duration ? (progress / duration) * 100 : 0;

  const cover = current?.cover ?? hero;
  const title = current?.title ?? "Nothing playing";
  const artist = current?.artist ?? "Pick a track to start";

  const upcoming = queue.slice(queueIndex);
  return (
    <aside className="hidden xl:flex w-[300px] shrink-0 flex-col glass-strong rounded-2xl p-5 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Now Playing</div>
        <MoreVertical className="h-4 w-4 text-white/50" />
      </div>

      <div className="relative mt-4 rounded-2xl overflow-hidden aspect-square">
        <img src={cover} alt={title} className="h-full w-full object-cover" />
        {isPlaying && (
          <div className="absolute bottom-2 right-2 flex items-end gap-[3px] h-12">
            {[0.6, 0.9, 0.45, 0.8, 0.55, 0.7, 0.4, 0.85].map((h, i) => (
              <span key={i} className="w-1 rounded-full bg-[#22ff88] eq-bar" style={{ height: `${h * 100}%`, animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-lg font-bold truncate" style={{ fontFamily: '"Sora", sans-serif' }}>{title}</div>
          <div className="text-sm text-white/60">{artist}</div>
        </div>
        {current && (
          <button onClick={() => toggleFavorite(current.id)}>
            <Heart className={`h-5 w-5 ${isFavorite(current.id) ? "text-[#22ff88] fill-[#22ff88]" : "text-white/50"}`} />
          </button>
        )}
      </div>

      <ProgressBar pct={pct} onSeek={(p) => duration && seek((p / 100) * duration)} />
      <div className="mt-2 flex justify-between text-[11px] text-white/50">
        <span>{formatTime(progress)}</span><span>{formatTime(duration)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={toggleShuffle} className={shuffle ? "text-[#22ff88]" : "text-white/60 hover:text-white"}><Shuffle className="h-[18px] w-[18px]" /></button>
        <button onClick={prev} className="text-white/80 hover:text-white"><SkipBack className="h-[20px] w-[20px] fill-current" /></button>
        <motion.button whileTap={{ scale: 0.92 }} onClick={togglePlay} className="h-12 w-12 grid place-items-center rounded-full bg-[#22ff88] text-[#04130a] glow-neon">
          {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
        </motion.button>
        <button onClick={next} className="text-white/80 hover:text-white"><SkipForward className="h-[20px] w-[20px] fill-current" /></button>
        <button onClick={cycleRepeat} className={repeat !== "off" ? "text-[#22ff88]" : "text-white/60 hover:text-white"}>
          {repeat === "one" ? <Repeat1 className="h-[18px] w-[18px]" /> : <Repeat className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-2"><Headphones className="h-4 w-4" /> AirPods Pro</div>
        {isPlaying && (
          <div className="flex items-end gap-[2px] h-4">
            {[3,5,2,6,4,7,3,5,2,4,6,3].map((h, i) => (
              <span key={i} className="w-[2px] bg-[#22ff88] wave-bar rounded-full" style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Queue</div>
        <div className="flex items-center gap-3">
          <button onClick={clearQueue} className="text-xs text-[#22ff88] font-semibold hover:underline">Clear</button>
          <button onClick={cut} className="text-xs text-white/70 hover:text-white hover:underline">Cut</button>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {upcoming.length === 0 && <li className="text-xs text-white/50 px-2 py-3">Queue is empty.</li>}
        {upcoming.slice(0, 8).map((q, i) => {
          const active = i === 0;
          return (
            <li key={`${q.id}-${i}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.04]">
              <img src={q.cover} alt={q.title} className="h-10 w-10 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className={`text-sm truncate ${active ? "text-[#22ff88] font-semibold" : "font-medium"}`}>{q.title}</div>
                <div className="text-xs text-white/50 truncate">{q.artist}</div>
              </div>
              {active && isPlaying && (
                <div className="flex items-end gap-[2px] h-4">
                  {[3,5,2,4].map((h, i2) => (
                    <span key={i2} className="w-[2px] bg-[#22ff88] eq-bar rounded-full" style={{ height: `${h * 3}px`, animationDelay: `${i2 * 0.15}s` }} />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/* ---------- Progress bar (clickable + draggable) ---------- */
function ProgressBar({ pct, onSeek }: { pct: number; onSeek: (pct: number) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const value = hover ?? pct;

  const compute = (e: React.PointerEvent | PointerEvent) => {
    const el = ref.current; if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setHover(compute(e));
    const up = (e: PointerEvent) => { onSeek(compute(e)); setHover(null); setDrag(false); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag, onSeek]);

  return (
    <div
      ref={ref}
      onPointerDown={(e) => { e.preventDefault(); setDrag(true); setHover(compute(e)); }}
      className="mt-4 relative h-1.5 rounded-full bg-white/10 cursor-pointer"
    >
      <div className="absolute inset-y-0 left-0 rounded-full bg-[#22ff88] glow-neon-soft" style={{ width: `${value}%` }} />
      <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-md" style={{ left: `${value}%` }} />
    </div>
  );
}

/* ---------- Bottom Player ---------- */
function BottomPlayer() {
  const {
    current, isPlaying, togglePlay, prev, next, progress, duration, seek,
    volume, setVolume, muted, toggleMute, shuffle, toggleShuffle, repeat, cycleRepeat,
    isFavorite, toggleFavorite, cancel,
  } = usePlayer();
  const pct = duration ? (progress / duration) * 100 : 0;

  const cover = current?.cover ?? hero;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 h-[100px] rounded-2xl glass-strong px-4 flex items-center gap-4">
      <div className="flex items-center gap-3 min-w-0 w-[260px]">
        <img src={cover} alt="track" className="h-14 w-14 rounded-xl object-cover" />
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{current?.title ?? "Not playing"}</div>
          <div className="text-xs text-white/50 truncate">{current?.artist ?? "—"}</div>
        </div>
        {current && (
          <button onClick={() => toggleFavorite(current.id)}>
            <Heart className={`h-4 w-4 shrink-0 ${isFavorite(current.id) ? "fill-[#22ff88] text-[#22ff88]" : "text-white/50"}`} />
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
        <div className="flex items-center gap-5">
          <button onClick={toggleShuffle} className={shuffle ? "text-[#22ff88]" : "text-white/60 hover:text-white"}><Shuffle className="h-4 w-4" /></button>
          <button onClick={prev} className="text-white/80 hover:text-white"><SkipBack className="h-5 w-5 fill-current" /></button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
            className="h-11 w-11 grid place-items-center rounded-full border-2 border-[#22ff88] text-[#22ff88] glow-neon-soft hover:bg-[#22ff88] hover:text-[#04130a] transition">
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </motion.button>
          <button onClick={next} className="text-white/80 hover:text-white"><SkipForward className="h-5 w-5 fill-current" /></button>
          <button onClick={cycleRepeat} className={repeat !== "off" ? "text-[#22ff88]" : "text-white/60 hover:text-white"}>
            {repeat === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
          </button>
        </div>
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] text-white/50 w-8 text-right">{formatTime(progress)}</span>
          <Waveform pct={pct} onSeek={(p) => duration && seek((p / 100) * duration)} />
          <span className="text-[11px] text-white/50 w-8">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 w-[260px] justify-end">
        <button className="text-white/60 hover:text-white" title="Queue"><ListOrdered className="h-[18px] w-[18px]" /></button>
        <button className="text-white/60 hover:text-white" title="Lyrics"><MessageSquare className="h-[18px] w-[18px]" /></button>
        <button onClick={cancel} className="text-white/60 hover:text-white" title="Cancel playback">
          <X className="h-[18px] w-[18px]" />
        </button>
        <button onClick={toggleMute} className="text-white/60 hover:text-white">
          {muted || volume === 0 ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
        </button>
        <VolumeSlider value={muted ? 0 : volume} onChange={setVolume} />
        <button className="text-white/60 hover:text-white"><Maximize2 className="h-[18px] w-[18px]" /></button>
      </div>
    </div>
  );
}

function Waveform({ pct, onSeek }: { pct: number; onSeek: (pct: number) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState(false);
  const compute = (e: React.PointerEvent | PointerEvent) => {
    const el = ref.current; if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
  };
  useEffect(() => {
    if (!drag) return;
    const up = (e: PointerEvent) => { onSeek(compute(e)); setDrag(false); };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [drag, onSeek]);

  const bars = useMemo(() => Array.from({ length: 80 }, (_, i) => 20 + Math.abs(Math.sin(i * 0.7)) * 80), []);
  return (
    <div ref={ref}
      onPointerDown={(e) => { setDrag(true); onSeek(compute(e)); }}
      className="flex-1 flex items-center gap-[2px] h-7 cursor-pointer"
    >
      {bars.map((h, i) => {
        const played = (i / bars.length) * 100 < pct;
        return <span key={i} className={`flex-1 rounded-full ${played ? "bg-[#22ff88]" : "bg-white/15"}`} style={{ height: `${h}%` }} />;
      })}
    </div>
  );
}

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState(false);
  const compute = (e: React.PointerEvent | PointerEvent) => {
    const el = ref.current; if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  };
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => onChange(compute(e));
    const up = () => setDrag(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag, onChange]);
  return (
    <div ref={ref}
      onPointerDown={(e) => { setDrag(true); onChange(compute(e)); }}
      className="relative h-1 w-24 rounded-full bg-white/10 cursor-pointer"
    >
      <div className="absolute inset-y-0 left-0 rounded-full bg-[#22ff88]" style={{ width: `${value * 100}%` }} />
      <div className="absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white" style={{ left: `${value * 100}%` }} />
    </div>
  );
}
