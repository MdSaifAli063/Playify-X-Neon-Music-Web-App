import {
  createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode,
} from "react";
import { tracks as ALL_TRACKS, defaultPlaylists, getTrack, type Track, type Playlist } from "./musicData";

type RepeatMode = "off" | "all" | "one";

type Ctx = {
  // playback
  current: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  queue: Track[];
  queueIndex: number;
  // controls
  playTrack: (track: Track, contextQueue?: Track[]) => void;
  playQueue: (list: Track[], startIndex?: number, shuffle?: boolean) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (s: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (t: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  cancel: () => void;
  cut: () => void;
  reorderQueue: (from: number, to: number) => void;
  // library
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  recentlyPlayed: string[];
  playlists: Playlist[];
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  // search
  recentSearches: string[];
  pushSearch: (q: string) => void;
  clearSearches: () => void;
};

const PlayerCtx = createContext<Ctx | null>(null);

const LS = {
  state: "playify.state",
  favs: "playify.favorites",
  recent: "playify.recent",
  playlists: "playify.playlists",
  searches: "playify.searches",
};

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}
function saveJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (typeof window !== "undefined" && !audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }

  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");

  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>(defaultPlaylists);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const current = queue[queueIndex] ?? null;

  // Hydrate from localStorage
  useEffect(() => {
    setFavorites(loadJSON<string[]>(LS.favs, []));
    setRecentlyPlayed(loadJSON<string[]>(LS.recent, []));
    setRecentSearches(loadJSON<string[]>(LS.searches, []));
    const pls = loadJSON<Playlist[] | null>(LS.playlists, null);
    if (pls) setPlaylists(pls);
    const st = loadJSON<any>(LS.state, null);
    if (st) {
      const restoredQueue: Track[] = (st.queueIds || [])
        .map((id: string) => getTrack(id))
        .filter(Boolean) as Track[];
      if (restoredQueue.length) {
        setQueue(restoredQueue);
        setQueueIndex(Math.min(st.queueIndex ?? 0, restoredQueue.length - 1));
      }
      if (typeof st.volume === "number") setVolumeState(st.volume);
      if (typeof st.muted === "boolean") setMuted(st.muted);
      if (typeof st.shuffle === "boolean") setShuffle(st.shuffle);
      if (st.repeat) setRepeat(st.repeat);
      if (typeof st.progress === "number") setProgress(st.progress);
    }
  }, []);

  // Persist
  useEffect(() => { saveJSON(LS.favs, favorites); }, [favorites]);
  useEffect(() => { saveJSON(LS.recent, recentlyPlayed); }, [recentlyPlayed]);
  useEffect(() => { saveJSON(LS.playlists, playlists); }, [playlists]);
  useEffect(() => { saveJSON(LS.searches, recentSearches); }, [recentSearches]);
  useEffect(() => {
    saveJSON(LS.state, {
      queueIds: queue.map((t) => t.id),
      queueIndex, volume, muted, shuffle, repeat, progress,
    });
  }, [queue, queueIndex, volume, muted, shuffle, repeat, progress]);

  // Audio listeners
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime);
    const onDur = () => setDuration(a.duration || 0);
    const onEnd = () => handleEnded();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("durationchange", onDur);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("durationchange", onDur);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  });

  // Apply volume/mute
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    a.muted = muted;
  }, [volume, muted]);

  // Load src when track changes
  const lastSrc = useRef<string>("");
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (lastSrc.current !== current.url) {
      a.src = current.url;
      lastSrc.current = current.url;
      a.load();
      if (isPlaying) a.play().catch(() => setIsPlaying(false));
    }
    // recently played
    setRecentlyPlayed((r) => [current.id, ...r.filter((x) => x !== current.id)].slice(0, 30));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const handleEnded = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (repeat === "one") {
      a.currentTime = 0;
      a.play().catch(() => {});
      return;
    }
    next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeat, queue, queueIndex, shuffle]);

  const playTrack = useCallback((track: Track, contextQueue?: Track[]) => {
    const q = contextQueue && contextQueue.length ? contextQueue : [track];
    const idx = Math.max(0, q.findIndex((t) => t.id === track.id));
    setQueue(q);
    setQueueIndex(idx);
    setIsPlaying(true);
    setTimeout(() => {
      const a = audioRef.current;
      if (a) a.play().catch(() => setIsPlaying(false));
    }, 0);
  }, []);

  const playQueue = useCallback((list: Track[], startIndex = 0, sh = false) => {
    if (!list.length) return;
    let q = list.slice();
    let idx = startIndex;
    if (sh) {
      const start = q[startIndex];
      q = q.slice().sort(() => Math.random() - 0.5);
      idx = q.findIndex((t) => t.id === start.id);
      setShuffle(true);
    }
    setQueue(q);
    setQueueIndex(idx);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play().catch(() => setIsPlaying(false)), 0);
  }, []);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [current]);

  const next = useCallback(() => {
    if (!queue.length) return;
    let nextIdx: number;
    if (shuffle) {
      if (queue.length === 1) nextIdx = 0;
      else {
        do { nextIdx = Math.floor(Math.random() * queue.length); }
        while (nextIdx === queueIndex);
      }
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeat === "all") nextIdx = 0;
        else {
          setIsPlaying(false);
          audioRef.current?.pause();
          return;
        }
      }
    }
    setQueueIndex(nextIdx);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play().catch(() => {}), 0);
  }, [queue, queueIndex, shuffle, repeat]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.currentTime > 3) { a.currentTime = 0; return; }
    if (!queue.length) return;
    const i = queueIndex - 1;
    setQueueIndex(i < 0 ? (repeat === "all" ? queue.length - 1 : 0) : i);
    setTimeout(() => a.play().catch(() => {}), 0);
  }, [queue, queueIndex, repeat]);

  const seek = useCallback((s: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = s;
    setProgress(s);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
    if (v > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() =>
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")), []);

  const addToQueue = useCallback((t: Track) => setQueue((q) => [...q, t]), []);
  const removeFromQueue = useCallback((index: number) => {
    setQueue((q) => q.filter((_, i) => i !== index));
    setQueueIndex((i) => (index < i ? i - 1 : i));
  }, []);
  const clearQueue = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
      a.src = "";
    }
    setQueue([]);
    setQueueIndex(0);
    setProgress(0);
    setDuration(0);
    setIsPlaying(false);
  }, []);
  const cancel = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
      a.src = "";
    }
    setQueue([]);
    setQueueIndex(0);
    setProgress(0);
    setDuration(0);
    setIsPlaying(false);
  }, []);
  const cut = useCallback(() => {
    setQueue((q) => {
      if (!q.length || queueIndex >= q.length) {
        cancel();
        return [];
      }

      const nextQueue = q.filter((_, i) => i !== queueIndex);
      if (!nextQueue.length) {
        cancel();
        return [];
      }

      return nextQueue;
    });

    setQueueIndex((idx) => Math.min(idx, queue.length - 2));
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play().catch(() => setIsPlaying(false)), 0);
  }, [cancel, queueIndex, queue.length]);
  const reorderQueue = useCallback((from: number, to: number) => {
    setQueue((q) => {
      const c = q.slice();
      const [m] = c.splice(from, 1);
      c.splice(to, 0, m);
      return c;
    });
  }, []);

  // Library
  const toggleFavorite = useCallback((id: string) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [id, ...f])), []);
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const createPlaylist = useCallback((name: string) => {
    const p: Playlist = {
      id: `pl_${Date.now()}`,
      name: name || "New Playlist",
      description: "Custom playlist",
      cover: ALL_TRACKS[Math.floor(Math.random() * ALL_TRACKS.length)].cover,
      trackIds: [],
    };
    setPlaylists((ps) => [...ps, p]);
    return p;
  }, []);
  const deletePlaylist = useCallback((id: string) =>
    setPlaylists((ps) => ps.filter((p) => p.id !== id || p.builtin)), []);
  const renamePlaylist = useCallback((id: string, name: string) =>
    setPlaylists((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p))), []);
  const addToPlaylist = useCallback((playlistId: string, trackId: string) =>
    setPlaylists((ps) => ps.map((p) => p.id === playlistId && !p.trackIds.includes(trackId)
      ? { ...p, trackIds: [...p.trackIds, trackId] } : p)), []);
  const removeFromPlaylist = useCallback((playlistId: string, trackId: string) =>
    setPlaylists((ps) => ps.map((p) => p.id === playlistId
      ? { ...p, trackIds: p.trackIds.filter((t) => t !== trackId) } : p)), []);

  const pushSearch = useCallback((q: string) => {
    const v = q.trim();
    if (!v) return;
    setRecentSearches((s) => [v, ...s.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 8));
  }, []);
  const clearSearches = useCallback(() => setRecentSearches([]), []);

  const value = useMemo<Ctx>(() => ({
    current, isPlaying, progress, duration, volume, muted, shuffle, repeat, queue, queueIndex,
    playTrack, playQueue, togglePlay, next, prev, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat,
    addToQueue, removeFromQueue, clearQueue, cancel, cut, reorderQueue,
    favorites, toggleFavorite, isFavorite, recentlyPlayed, playlists,
    createPlaylist, deletePlaylist, renamePlaylist, addToPlaylist, removeFromPlaylist,
    recentSearches, pushSearch, clearSearches,
  }), [current, isPlaying, progress, duration, volume, muted, shuffle, repeat, queue, queueIndex,
    favorites, recentlyPlayed, playlists, recentSearches,
    playTrack, playQueue, togglePlay, next, prev, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat,
    addToQueue, removeFromQueue, clearQueue, reorderQueue, toggleFavorite, isFavorite,
    createPlaylist, deletePlaylist, renamePlaylist, addToPlaylist, removeFromPlaylist,
    pushSearch, clearSearches]);

  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export function formatTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
