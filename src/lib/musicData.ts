import c1 from "@/assets/cover1.jpg";
import c2 from "@/assets/cover2.jpg";
import c3 from "@/assets/cover3.jpg";
import c4 from "@/assets/cover4.jpg";
import c5 from "@/assets/cover5.jpg";
import c6 from "@/assets/cover6.jpg";
import c7 from "@/assets/cover7.jpg";
import c8 from "@/assets/cover8.jpg";
import c9 from "@/assets/cover9.jpg";
import c10 from "@/assets/cover10.jpg";
import c11 from "@/assets/cover11.jpg";
import hero from "@/assets/hero-album.jpg";
import nowPlaying from "@/assets/now-playing.jpg";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  cover: string;
  url: string;
  duration: number; // seconds (estimate; real value comes from audio)
};

const covers = [hero, nowPlaying, c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11];
const sh = (n: number) =>
  `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

const titles = [
  ["Eternal Horizons", "Ocean Avenue", "Eternal Horizons", "Synthwave"],
  ["Electric Love", "BØRNS", "Dopamine", "Indie Pop"],
  ["Moonlight", "Kali Uchis", "Isolation", "R&B"],
  ["Blinding Lights", "The Weeknd", "After Hours", "Synthwave"],
  ["Dancing In The Dark", "Bruce Springsteen", "Born in the U.S.A.", "Rock"],
  ["Levitating", "Dua Lipa", "Future Nostalgia", "Pop"],
  ["After Hours", "The Weeknd", "After Hours", "R&B"],
  ["Heat Waves", "Glass Animals", "Dreamland", "Indie"],
  ["Another Love", "Tom Odell", "Long Way Down", "Alt"],
  ["Sweater Weather", "The Neighbourhood", "I Love You.", "Indie"],
  ["Fix You", "Coldplay", "X&Y", "Rock"],
  ["Yellow", "Coldplay", "Parachutes", "Rock"],
  ["Midnight City", "M83", "Hurry Up, We're Dreaming", "Electronic"],
  ["Take On Me", "a-ha", "Hunting High and Low", "Synthpop"],
  ["Redbone", "Childish Gambino", "Awaken, My Love!", "Funk"],
  ["Dreams", "Fleetwood Mac", "Rumours", "Rock"],
  ["Lost in Tokyo", "Neon Drive", "Night Run", "Synthwave"],
  ["Skyline", "Arc Pulse", "Skyline", "Electronic"],
  ["Velvet Sun", "Aria Cole", "Velvet", "R&B"],
  ["Aurora", "Stellar Wave", "Aurora", "Ambient"],
];

export const tracks: Track[] = titles.map((t, i) => ({
  id: `t${i + 1}`,
  title: t[0],
  artist: t[1],
  album: t[2],
  genre: t[3],
  cover: covers[i % covers.length],
  url: sh((i % 16) + 1),
  duration: 0,
}));

export const featured = tracks[0];

export type Album = { id: string; title: string; artist: string; cover: string; trackIds: string[] };
export const albums: Album[] = Array.from(
  new Map(tracks.map((t) => [t.album, { artist: t.artist, cover: t.cover }])).entries()
)
  .slice(0, 10)
  .map(([album, info], i) => ({
    id: `al${i + 1}`,
    title: album,
    artist: info.artist,
    cover: info.cover,
    trackIds: tracks.filter((t) => t.album === album).map((t) => t.id),
  }));

export type Artist = { id: string; name: string; cover: string };
export const artists: Artist[] = Array.from(
  new Map(tracks.map((t) => [t.artist, t.cover])).entries()
)
  .slice(0, 10)
  .map(([name, cover], i) => ({ id: `ar${i + 1}`, name, cover }));

export type Playlist = {
  id: string;
  name: string;
  description: string;
  cover: string;
  trackIds: string[];
  builtin?: boolean;
};

export const defaultPlaylists: Playlist[] = [
  { id: "pl1", name: "Daily Mix 1", description: "Your daily favorites", cover: c3, trackIds: tracks.slice(0, 8).map((t) => t.id), builtin: true },
  { id: "pl2", name: "Chill Vibes", description: "Relax and unwind", cover: c4, trackIds: tracks.slice(2, 10).map((t) => t.id), builtin: true },
  { id: "pl3", name: "Workout", description: "Beast Mode", cover: c5, trackIds: tracks.slice(4, 12).map((t) => t.id), builtin: true },
  { id: "pl4", name: "Lo-Fi Beats", description: "Focus & Study", cover: c6, trackIds: tracks.slice(6, 14).map((t) => t.id), builtin: true },
  { id: "pl5", name: "Night Drive", description: "Feel the night", cover: c7, trackIds: tracks.slice(8, 16).map((t) => t.id), builtin: true },
  { id: "pl6", name: "Romantic Mix", description: "Love & Feelings", cover: c8, trackIds: tracks.slice(10, 18).map((t) => t.id), builtin: true },
];

export const getTrack = (id: string) => tracks.find((t) => t.id === id);
export const trendingIds = ["t3", "t4", "t5", "t2", "t7", "t8"];
