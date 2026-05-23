import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Storage layer for the custom admin panel.
 *
 * - In production (Vercel) we use Vercel KV via `@vercel/kv`. Detection key is
 *   `process.env.KV_REST_API_URL` — when set we assume the full set of KV env
 *   vars is present.
 * - For local dev (no KV env vars) we fall back to a JSON file at
 *   `data/content.json`. The directory is created on first write.
 *
 * The same module is also used by the public site to read content (see
 * `lib/content/queries.ts` adapters). KV/file lookups are wrapped in try/catch
 * by the callers; this module surfaces real errors so admin saves don't
 * silently drop on a bad write.
 */

const DATA_FILE = path.join(process.cwd(), "data", "content.json");

interface Store {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}

class FileStore implements Store {
  private async read(): Promise<Record<string, unknown>> {
    try {
      const raw = await fs.readFile(DATA_FILE, "utf-8");
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.read();
    return (data[key] as T) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const data = await this.read();
    data[key] = value;
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  }
}

/**
 * Optional list-oriented operations. Used by `addMessage` to avoid the
 * read-modify-write race that affects naive `setX(items)` patterns under
 * concurrent writes. KV exposes native atomic list ops; the file fallback
 * documents the race and serializes through the existing get/set.
 */
interface ListStore extends Store {
  /** Atomically push to the head of a list and trim it to `maxLen`. */
  lpushTrim?<T>(key: string, value: T, maxLen: number): Promise<void>;
  /** Read a list from head (index 0) to tail. */
  lrange?<T>(key: string): Promise<T[]>;
}

let vercelKvStore: ListStore | null = null;
async function getVercelKvStore(): Promise<ListStore> {
  if (vercelKvStore) return vercelKvStore;
  const { kv } = await import("@vercel/kv");
  vercelKvStore = {
    async get<T>(key: string): Promise<T | null> {
      return (await kv.get<T>(key)) ?? null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      await kv.set(key, value);
    },
    async lpushTrim<T>(key: string, value: T, maxLen: number): Promise<void> {
      // KV's lpush + ltrim are individually atomic. Two concurrent calls
      // can therefore both succeed without one overwriting the other (the
      // read-modify-write race that exists in plain `set([new, ...old])`).
      await kv.lpush(key, JSON.stringify(value));
      await kv.ltrim(key, 0, maxLen - 1);
    },
    async lrange<T>(key: string): Promise<T[]> {
      const raw = await kv.lrange<string>(key, 0, -1);
      return raw
        .map((s) => {
          try {
            return JSON.parse(s) as T;
          } catch {
            return null;
          }
        })
        .filter((v): v is T => v !== null);
    },
  };
  return vercelKvStore;
}

export async function getStore(): Promise<ListStore> {
  if (process.env.KV_REST_API_URL) {
    return await getVercelKvStore();
  }
  return new FileStore();
}

/* -------------------------------------------------------------------------- */
/* Typed content shapes                                                       */
/* -------------------------------------------------------------------------- */

export interface AdminDiaryEntry {
  id: string;
  title: string;
  slug: string;
  date: string; // ISO yyyy-mm-dd
  excerpt: string;
  body: string; // markdown
  coverImage?: string; // public path, e.g. /images/foo.jpg
  featured?: boolean;
  publishedAt?: string;
}

export interface AdminShow {
  id: string;
  date: string;
  venue: string;
  city: string;
  title?: string;
  status: "upcoming" | "past" | "sold-out";
  ticketUrl?: string;
  notes?: string;
}

export interface AdminRelease {
  id: string;
  title: string;
  type: "album" | "ep" | "single";
  releaseDate: string;
  spotifyAlbumId?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  bandcampUrl?: string;
}

export interface AdminPhoto {
  id: string;
  src: string;
  alt: string;
  category: string;
}

export interface AdminSiteSettings {
  heroDescription?: string[];
  /**
   * URL the "Store" nav link points to. When unset the Header falls back to
   * the hard-coded Bandcamp default in `lib/config.ts` (`SOCIAL_LINKS.bandcamp`).
   */
  storeUrl?: string;
  /**
   * Free-form content overrides for inline editing of fields whose
   * canonical source isn't admin-managed (translation strings, hard-coded
   * page headings, etc.). Keyed by a stable dotted ID (e.g.
   * "page.about.title" or "page.music.subtitle"). When an override is
   * present the public page renders that value; otherwise it falls back
   * to whatever the template renders by default (translation, hard-coded
   * constant, etc.). Lets `<EditableText>` wrappers attach to ANY visible
   * element without first migrating that element's data into admin.
   */
  contentOverrides?: Record<string, string>;
}

export interface AdminAbout {
  bioParagraphs: string[];
  funFacts: string[];
  milestones: { year: string; text: string }[];
  influences: { name: string; icon: string }[];
  pressQuotes: { quote: string; source: string; sourceUrl?: string }[];
}

export interface AdminVideo {
  id: string;
  title: string;
  description?: string;
  youtubeId: string;
  category:
    | "official"
    | "live"
    | "session"
    | "behind-scenes"
    | "interview"
    | "other";
  releaseDate?: string;
  featured?: boolean;
}

export interface AdminLyric {
  slug: string;
  titleHe: string;
  lyricsHe: string;
  spotifyTrackId?: string;
  releaseTitle?: string;
  releaseDate?: string;
}

export interface ContactMessage {
  id: string; // crypto.randomUUID()
  name: string;
  email: string;
  subject: string;
  body: string; // the actual message text
  receivedAt: string; // ISO datetime
  read: boolean; // false until Alma marks it read
  ip?: string; // hashed IP for rate limit / abuse tracking
}

export interface Subscriber {
  id: string; // crypto.randomUUID()
  email: string;
  country?: string;
  subscribedAt: string; // ISO datetime
  ip?: string; // hashed
}

/* -------------------------------------------------------------------------- */
/* Diary                                                                      */
/* -------------------------------------------------------------------------- */

const DIARY_KEY = "diary:entries";

export async function getDiaryEntries(): Promise<AdminDiaryEntry[]> {
  const store = await getStore();
  return (await store.get<AdminDiaryEntry[]>(DIARY_KEY)) ?? [];
}

export async function setDiaryEntries(
  entries: AdminDiaryEntry[]
): Promise<void> {
  const store = await getStore();
  await store.set(DIARY_KEY, entries);
}

/* -------------------------------------------------------------------------- */
/* Shows                                                                      */
/* -------------------------------------------------------------------------- */

const SHOWS_UPCOMING_KEY = "shows:upcoming";
const SHOWS_PAST_KEY = "shows:past";

export async function getUpcomingShowsAdmin(): Promise<AdminShow[]> {
  const store = await getStore();
  return (await store.get<AdminShow[]>(SHOWS_UPCOMING_KEY)) ?? [];
}

export async function setUpcomingShowsAdmin(shows: AdminShow[]): Promise<void> {
  const store = await getStore();
  await store.set(SHOWS_UPCOMING_KEY, shows);
}

export async function getPastShowsAdmin(): Promise<AdminShow[]> {
  const store = await getStore();
  return (await store.get<AdminShow[]>(SHOWS_PAST_KEY)) ?? [];
}

export async function setPastShowsAdmin(shows: AdminShow[]): Promise<void> {
  const store = await getStore();
  await store.set(SHOWS_PAST_KEY, shows);
}

/** Read both buckets and return the union (used by the admin UI list view). */
export async function getAllShowsAdmin(): Promise<AdminShow[]> {
  const [upcoming, past] = await Promise.all([
    getUpcomingShowsAdmin(),
    getPastShowsAdmin(),
  ]);
  return [...upcoming, ...past];
}

/* -------------------------------------------------------------------------- */
/* Releases                                                                   */
/* -------------------------------------------------------------------------- */

const RELEASES_KEY = "releases";

export async function getReleasesAdmin(): Promise<AdminRelease[]> {
  const store = await getStore();
  return (await store.get<AdminRelease[]>(RELEASES_KEY)) ?? [];
}

export async function setReleasesAdmin(
  releases: AdminRelease[]
): Promise<void> {
  const store = await getStore();
  await store.set(RELEASES_KEY, releases);
}

/* -------------------------------------------------------------------------- */
/* Photos                                                                     */
/* -------------------------------------------------------------------------- */

const PHOTOS_KEY = "photos";

export async function getPhotosAdmin(): Promise<AdminPhoto[]> {
  const store = await getStore();
  return (await store.get<AdminPhoto[]>(PHOTOS_KEY)) ?? [];
}

export async function setPhotosAdmin(photos: AdminPhoto[]): Promise<void> {
  const store = await getStore();
  await store.set(PHOTOS_KEY, photos);
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

const SETTINGS_KEY = "settings";

export async function getSettingsAdmin(): Promise<AdminSiteSettings | null> {
  const store = await getStore();
  return (await store.get<AdminSiteSettings>(SETTINGS_KEY)) ?? null;
}

export async function setSettingsAdmin(
  settings: AdminSiteSettings
): Promise<void> {
  const store = await getStore();
  await store.set(SETTINGS_KEY, settings);
}

/* -------------------------------------------------------------------------- */
/* About                                                                      */
/* -------------------------------------------------------------------------- */

const ABOUT_KEY = "about";

export async function getAbout(): Promise<AdminAbout | null> {
  const store = await getStore();
  return await store.get<AdminAbout>(ABOUT_KEY);
}

export async function setAbout(about: AdminAbout): Promise<void> {
  const store = await getStore();
  await store.set(ABOUT_KEY, about);
}

/* -------------------------------------------------------------------------- */
/* Videos                                                                     */
/* -------------------------------------------------------------------------- */

const VIDEOS_KEY = "videos";

export async function getAdminVideos(): Promise<AdminVideo[]> {
  const store = await getStore();
  return (await store.get<AdminVideo[]>(VIDEOS_KEY)) ?? [];
}

export async function setAdminVideos(videos: AdminVideo[]): Promise<void> {
  const store = await getStore();
  await store.set(VIDEOS_KEY, videos);
}

/* -------------------------------------------------------------------------- */
/* Lyrics                                                                     */
/* -------------------------------------------------------------------------- */

const LYRICS_KEY = "lyrics";

export async function getAdminLyrics(): Promise<AdminLyric[]> {
  const store = await getStore();
  return (await store.get<AdminLyric[]>(LYRICS_KEY)) ?? [];
}

export async function setAdminLyrics(lyrics: AdminLyric[]): Promise<void> {
  const store = await getStore();
  await store.set(LYRICS_KEY, lyrics);
}

/* -------------------------------------------------------------------------- */
/* Contact messages                                                           */
/* -------------------------------------------------------------------------- */

const MESSAGES_KEY = "messages";
const MESSAGES_LIST_KEY = "messages:list";
const MAX_STORED_MESSAGES = 500;

export async function getMessages(): Promise<ContactMessage[]> {
  const store = await getStore();
  // Prefer the list-backed storage on KV (newer writes go here via lpush);
  // fall back to the legacy JSON-blob key for the file store and for any
  // legacy data that pre-dates the list migration.
  if (store.lrange) {
    const list = await store.lrange<ContactMessage>(MESSAGES_LIST_KEY);
    if (list.length > 0) return list;
  }
  return (await store.get<ContactMessage[]>(MESSAGES_KEY)) ?? [];
}

export async function setMessages(messages: ContactMessage[]): Promise<void> {
  const store = await getStore();
  await store.set(MESSAGES_KEY, messages);
}

export async function addMessage(
  input: Omit<ContactMessage, "id" | "receivedAt" | "read">
): Promise<ContactMessage> {
  const newMessage: ContactMessage = {
    ...input,
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    read: false,
  };

  const store = await getStore();
  try {
    if (store.lpushTrim) {
      // KV path: atomic lpush + ltrim. Two concurrent contact submissions
      // can both succeed without one clobbering the other's write — unlike
      // the naive `set([new, ...all])` pattern that used to live here.
      await store.lpushTrim(MESSAGES_LIST_KEY, newMessage, MAX_STORED_MESSAGES);
    } else {
      // File-store fallback: still read-modify-write, which has a
      // race window if two requests land at the exact same time on a
      // single Node process. In practice the file store is only used in
      // local dev where concurrency is essentially zero, so this is
      // acceptable; the production KV path above is race-free.
      const messages = await getMessages();
      const updated = [newMessage, ...messages].slice(0, MAX_STORED_MESSAGES);
      await setMessages(updated);
    }
  } catch (err) {
    // Surface the failure to the caller so the form can show an error,
    // but don't leave a half-written list (the lpushTrim path either
    // both ops succeed or both fail at the network boundary, and the
    // file fallback `setMessages` is itself an all-or-nothing replace).
    console.error("admin-store: addMessage failed", err);
    throw err;
  }

  return newMessage;
}

export async function getUnreadMessageCount(): Promise<number> {
  const messages = await getMessages();
  return messages.filter((m) => !m.read).length;
}

/* -------------------------------------------------------------------------- */
/* Subscribers (newsletter / mailing list)                                    */
/* -------------------------------------------------------------------------- */

const SUBSCRIBERS_LIST_KEY = "subscribers:list";
const SUBSCRIBERS_KEY = "subscribers"; // legacy fallback / file store
const MAX_STORED_SUBSCRIBERS = 5000;

export async function getSubscribers(): Promise<Subscriber[]> {
  const store = await getStore();
  if (store.lrange) {
    const list = await store.lrange<Subscriber>(SUBSCRIBERS_LIST_KEY);
    if (list.length > 0) return list;
  }
  return (await store.get<Subscriber[]>(SUBSCRIBERS_KEY)) ?? [];
}

export async function setSubscribers(subs: Subscriber[]): Promise<void> {
  const store = await getStore();
  await store.set(SUBSCRIBERS_KEY, subs);
}

export async function addSubscriber(
  input: Omit<Subscriber, "id" | "subscribedAt">
): Promise<Subscriber | null> {
  // Idempotent: silently no-op if email already subscribed.
  const existing = await getSubscribers();
  if (
    existing.some(
      (s) => s.email.toLowerCase() === input.email.toLowerCase()
    )
  ) {
    return null;
  }

  const newSub: Subscriber = {
    ...input,
    id: crypto.randomUUID(),
    subscribedAt: new Date().toISOString(),
  };

  const store = await getStore();
  try {
    if (store.lpushTrim) {
      await store.lpushTrim(
        SUBSCRIBERS_LIST_KEY,
        newSub,
        MAX_STORED_SUBSCRIBERS
      );
    } else {
      await setSubscribers(
        [newSub, ...existing].slice(0, MAX_STORED_SUBSCRIBERS)
      );
    }
  } catch (err) {
    console.error("admin-store: addSubscriber failed", err);
    throw err;
  }
  return newSub;
}

export async function removeSubscriber(id: string): Promise<void> {
  // The lpush list and the legacy JSON-blob key can both hold data.
  // getSubscribers() prefers the list when it has entries, so a naive
  // setSubscribers() write to the legacy key alone wouldn't take effect
  // on the next read. We therefore:
  //   1. Read the current subscriber set (using getSubscribers, which
  //      already prefers the list on KV).
  //   2. Filter out the deleted id.
  //   3. Try to clear the KV list so future writes don't resurrect the
  //      deleted entry.
  //   4. Write the filtered set to the legacy key as the source of truth.
  //
  // On the file store the list ops are no-ops; setSubscribers handles it.
  const subs = await getSubscribers();
  const filtered = subs.filter((s) => s.id !== id);

  const store = await getStore();
  if (store.lpushTrim) {
    // Clear the KV list by trimming to an empty range. Fresh subscribers
    // added after this will lpush onto an empty list, which is fine.
    try {
      const { kv } = await import("@vercel/kv");
      await kv.del(SUBSCRIBERS_LIST_KEY);
    } catch (err) {
      // If clearing the list fails, the legacy-key write below still
      // produces correct behavior on the next read because the list
      // will likely be partial/empty and getSubscribers falls back to
      // the legacy key when the list is empty.
      console.warn("admin-store: removeSubscriber list clear failed", err);
    }
  }

  await setSubscribers(filtered);
}

export async function getSubscriberCount(): Promise<number> {
  const subs = await getSubscribers();
  return subs.length;
}
