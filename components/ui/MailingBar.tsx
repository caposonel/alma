"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Heart, Guitar, Butterfly } from "@/components/decorative";
import { cn } from "@/lib/utils";
import { subscribeAction } from "@/app/[locale]/(site)/_mailing/subscribe";
import { useMusicPlayer } from "@/lib/music-player-context";

/**
 * Sticky bottom "newsletter" bar. Stores subscribers via `subscribeAction`
 * (which writes to `lib/admin-store`). No external service.
 *
 * Behavior:
 *  - Slides up after a small delay on first paint.
 *  - User can dismiss with the × button; choice is remembered in
 *    localStorage so the bar stays hidden across page navigations and
 *    sessions until the floating Heart restore button is clicked.
 *  - Hidden country selector — we default everyone to "Israel" rather than
 *    cluttering the compact bar with a dropdown. The country column on the
 *    admin page is still typed and present for future expansion.
 */

const DISMISS_STORAGE_KEY = "mailingBarDismissed";
const DEFAULT_COUNTRY = "Israel";

const errorInputClasses =
  "border-red-400 focus:border-red-400 focus:ring-red-200 focus:shadow-[0_0_0_2px_rgba(248,113,113,0.18)]";

export function MailingBar() {
  const t = useTranslations("mailingBar");
  /* Mini-player labels — hardcoded rather than going through
   * useTranslations("miniPlayer"), because next-intl can throw at hydration
   * time if the namespace lookup races with the messages module loading.
   * The MailingBar lives in the layout and runs before the page's data has
   * resolved, so we keep its label set as small and self-contained as
   * possible to keep hydration deterministic. Hebrew-only site, so no
   * locale branch. */
  const playerLabels = {
    play: "הפעלה",
    pause: "השהיה",
    nowPlaying: "מנגן עכשיו",
  };
  // The bar renders on the server (so it's present in the initial HTML)
  // and then on the client we may hide it if the user previously dismissed
  // it (state stored in localStorage). The initial render is the
  // "not dismissed" path so SSR/CSR markup matches; the localStorage check
  // happens inside an effect.
  const [dismissed, setDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  /* Global music-player state — populated by `MusicPlayerSection` on `/music`.
   * Null elsewhere, so the mini-player row simply doesn't render off that
   * page. See `lib/music-player-context.tsx` for the wiring. */
  const player = useMusicPlayer();
  const showMiniPlayer = !!(
    player?.controller && player?.currentTrack && player?.durationMs > 0
  );

  // Build the schema with translated error messages, mirroring ContactForm.
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("errorValidation")),
        // Honeypot — must be empty. Real users never see this field.
        website: z.string().max(0).optional(),
      }),
    [t]
  );
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Read the persisted dismissed state after mount. There's a brief moment
  // where the bar can flash before localStorage is consulted — acceptable
  // trade-off vs. blocking SSR rendering entirely (which would hide the
  // bar from the initial HTML).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DISMISS_STORAGE_KEY);
      if (stored === "1") {
        setDismissed(true);
      }
    } catch {
      // localStorage can be disabled (Safari private, embedded contexts).
      // Default to "not dismissed" — the bar will simply re-appear each visit.
    }
  }, []);

  function persistDismissed(value: boolean) {
    setDismissed(value);
    try {
      if (value) {
        window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
      } else {
        window.localStorage.removeItem(DISMISS_STORAGE_KEY);
      }
    } catch {
      // Best-effort; state still updates in memory.
    }
  }

  async function onSubmit(data: FormData) {
    setServerError("");
    try {
      const result = await subscribeAction({
        ...data,
        country: DEFAULT_COUNTRY,
      });
      if (result.ok) {
        setSubmitted(true);
        reset();
        return;
      }
      switch (result.error) {
        case "validation":
          setServerError(t("errorValidation"));
          break;
        case "rate-limit":
          setServerError(t("errorRateLimit"));
          break;
        case "storage":
          setServerError(t("errorStorage"));
          break;
        default:
          setServerError(t("errorStorage"));
      }
    } catch {
      setServerError(t("errorStorage"));
    }
  }

  return (
    <>
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            key="mailing-bar"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 180, delay: 0.6 }}
            className={cn(
              "fixed bottom-0 start-0 end-0 z-30",
              "min-h-[70px] py-3 px-6",
              // `backdrop-blur` is GPU-expensive on mid-tier phones when
              // stacked with other fixed surfaces (header + this bar +
              // mini-player). Limit it to ≥md so mobile gets a solid
              // (still translucent) background without the blur.
              "bg-paper-warm/95 md:backdrop-blur-sm",
              "border-t border-blush-200",
              "shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
            )}
            role="region"
            aria-label={t("prompt")}
            data-mailing-bar="bar"
          >
            {/* Dismiss button — top-end so it overlaps the bar nicely.
                Larger padding (`p-3`) gives the 16×16 icon a 40×40 hit-
                box, comfortable for thumb taps. */}
            <button
              type="button"
              onClick={() => persistDismissed(true)}
              aria-label={t("closeLabel")}
              className="absolute top-0 end-0 rounded-full p-3 text-ink-soft transition-colors hover:bg-blush-100 hover:text-blush-500"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Mini music-player row — renders only on `/music` when a Spotify
                track is loaded. Sits above the newsletter row so the bar
                grows taller (rather than competing with the email form).
                NOTE: deliberately NOT wrapped in <AnimatePresence> because
                nesting it inside the outer bar's AnimatePresence was
                interfering with the bar's own entrance animation (the bar
                stayed at its initial opacity:0 translateY(100px) state on
                page load). A plain conditional render is fine — the
                mini-player simply appears/disappears, no slide animation. */}
            {showMiniPlayer && player && (
              <div className="mb-3 overflow-hidden" data-mailing-bar="mini-player">
                <MiniPlayer
                  title={player.currentTrack!.title}
                  isPaused={player.isPaused}
                  positionMs={player.positionMs}
                  durationMs={player.durationMs}
                  volume={player.volume}
                  onTogglePlay={() => {
                    try {
                      player.controller?.togglePlay();
                    } catch {
                      /* controller may be mid-destroy during route nav */
                    }
                  }}
                  onSeek={(seconds) => {
                    try {
                      player.controller?.seek(seconds);
                    } catch {
                      /* same — see above */
                    }
                  }}
                  onVolumeChange={(v) => player.setVolume(v)}
                  playLabel={playerLabels.play}
                  pauseLabel={playerLabels.pause}
                  nowPlayingLabel={playerLabels.nowPlaying}
                />
              </div>
            )}

            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              {/* Right (start in RTL): guitar + handwritten text */}
              <div className="hidden items-center gap-2 md:flex">
                <Guitar className="h-10 w-5 opacity-60" />
                <span className="font-display text-2xl text-ink/80 md:text-3xl">
                  {t("sideTextStart")}
                </span>
              </div>

              {/* Center: prompt + inline form (or thank-you message) */}
              <div className="flex flex-1 items-center justify-center">
                {submitted ? (
                  <p className="font-display text-base text-blush-600">
                    {t("thanks")}
                  </p>
                ) : (
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    // items-center keeps all three children (prompt / input / button)
                    // vertically centered on the same baseline — fixes the prior
                    // visual offset where the button looked smaller and floated above.
                    className="flex w-full max-w-xl flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3"
                  >
                    {/* Honeypot — visually offscreen so bots fill it. */}
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      {...register("website")}
                      style={{
                        position: "absolute",
                        left: "-9999px",
                        width: "1px",
                        height: "1px",
                        opacity: 0,
                      }}
                    />

                    <span className="hidden whitespace-nowrap text-base font-medium text-ink md:inline">
                      {t("prompt")}
                    </span>

                    {/* Email input column. Error message is absolutely positioned
                        ABOVE the bar so it doesn't push the input out of vertical
                        alignment with the prompt + button. */}
                    <div className="relative flex w-full flex-1 sm:max-w-xs">
                      <input
                        {...register("email")}
                        type="email"
                        dir="ltr"
                        aria-invalid={errors.email ? "true" : undefined}
                        placeholder={t("emailPlaceholder")}
                        // Matched 1:1 to the submit button below — same h-11,
                        // same rounded-full, same border-2 thickness, same
                        // px-6. Only the color treatment differs.
                        className={cn(
                          "box-border block h-11 w-full rounded-full border-2 border-blush-200 bg-paper px-6 text-end text-base text-ink transition-colors placeholder:text-ink-soft/50 focus:border-blush-400 focus:outline-none focus:shadow-[0_0_0_2px_rgba(217,119,119,0.15)]",
                          errors.email && errorInputClasses
                        )}
                      />
                      {(errors.email || serverError) && (
                        <p
                          className="absolute -top-7 start-0 end-0 truncate text-center text-xs text-red-500"
                          role="alert"
                        >
                          {errors.email?.message ?? serverError}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      // Matched 1:1 to the input above — same h-11, rounded-full,
                      // border-2 thickness, px-6.
                      className="box-border inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border-2 border-blush-500 bg-blush-500 px-6 text-base font-semibold text-white transition-colors hover:border-blush-600 hover:bg-blush-600 disabled:opacity-50"
                    >
                      {isSubmitting ? t("submitting") : t("submit")}
                    </button>
                  </form>
                )}
              </div>

              {/* Left (end in RTL): butterfly + handwritten text */}
              <div className="hidden items-center gap-2 md:flex">
                <span className="font-display text-2xl text-ink/80 md:text-3xl">
                  {t("sideTextEnd")}
                </span>
                <Butterfly className="h-8 w-9 opacity-60" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini-player subcomponent is defined below the main export. */}

      {/* Floating restore button when dismissed. */}
      <AnimatePresence>
        {dismissed && (
          <motion.button
            key="mailing-bar-restore"
            type="button"
            onClick={() => {
              persistDismissed(false);
              setSubmitted(false);
              setServerError("");
            }}
            aria-label={t("showFormLabel")}
            data-mailing-bar="restore"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", damping: 18 }}
            className="fixed bottom-4 end-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-paper-warm/95 text-blush-500 shadow-md ring-1 ring-blush-200 md:backdrop-blur-sm hover:text-blush-600"
          >
            <Heart className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini-player — rendered inside the mailing bar when a Spotify       */
/*  track is loaded on `/music`. Lives in the same file because it's   */
/*  only ever used here.                                               */
/* ------------------------------------------------------------------ */

interface MiniPlayerProps {
  title: string;
  isPaused: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  onTogglePlay: () => void;
  /** Seek target in SECONDS (Spotify's controller.seek expects seconds). */
  onSeek: (seconds: number) => void;
  /** New volume value, 0..1. */
  onVolumeChange: (volume: number) => void;
  playLabel: string;
  pauseLabel: string;
  nowPlayingLabel: string;
}

function MiniPlayer({
  title,
  isPaused,
  positionMs,
  durationMs,
  volume,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  playLabel,
  pauseLabel,
  nowPlayingLabel,
}: MiniPlayerProps) {
  /* `durationMs <= 0` is a transient state during a track switch:
   * MusicPlayerSection resets both position and duration to 0 the
   * moment a new track is selected, then Spotify's playback_update
   * event fires (some hundreds of ms later) with the real duration.
   * In that gap we suppress the time-display and pin the progress bar
   * to 0% — otherwise the bar shows nonsense like "3:01 / 0:00" or
   * "3:56 / 1:58" (stale position vs zero-or-shorter duration). */
  const isReady = durationMs > 0;
  const safePosition = Math.min(positionMs, Math.max(durationMs, 0));
  const percent = isReady ? Math.min(100, (safePosition / durationMs) * 100) : 0;

  /* Click anywhere on the progress track to seek there. */
  const handleTrackClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (durationMs <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    // The progress track is rendered LTR but the bar can be in an RTL
    // context. When RTL, the visual "0%" sits on the right, so we mirror
    // the ratio so a click on the right seeks to the start.
    const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const finalRatio = isRtl ? 1 - ratio : ratio;
    onSeek(((durationMs * finalRatio) / 1000));
  };

  /* Speaker icon picks intensity based on level — same convention as macOS,
   * Spotify desktop, etc. */
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="mx-auto flex max-w-6xl items-center gap-3">
      {/* Play / pause button. 44×44 on mobile (WCAG touch target),
          36×36 on desktop (more compact mouse target). */}
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPaused ? playLabel : pauseLabel}
        className="flex h-11 w-11 md:h-9 md:w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-blush-400 bg-blush-500 text-white shadow-sm transition-colors hover:border-blush-600 hover:bg-blush-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-300"
      >
        {isPaused ? (
          <Play className="h-3.5 w-3.5 fill-current translate-x-[1px]" aria-hidden="true" />
        ) : (
          <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        )}
      </button>

      {/* Title + progress (expands to fill) */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm">
            <span className="font-display text-ink-soft me-1.5 text-xs uppercase tracking-wider">
              {nowPlayingLabel}
            </span>
            <span className="font-medium text-ink">{title}</span>
          </p>
          {/* Show the timer ONLY when we have a valid positive duration.
              Both values are clamped: position floors to 0 and caps at
              duration. The `data-debug-*` attributes expose the raw
              values for DOM inspection — if the display ever looks
              wrong, right-click the timer, "Inspect", and check the
              attributes to see what positionMs/durationMs are actually
              being passed in. */}
          {durationMs > 0 && (
            <span
              /* `dir="ltr"` is REQUIRED. The site is Hebrew (RTL), so
               * without forcing LTR on this span the segments "0:38",
               * " / ", "3:16" flow right-to-left → visually reads
               * "3:16 / 0:38" even though the source order is
               * current/total. This was the actual root cause of every
               * "timer values look swapped" complaint — the math
               * upstream was correct all along, just the visual order
               * was getting flipped by the parent's `dir="rtl"`. */
              dir="ltr"
              className="hidden flex-shrink-0 font-mono text-[10px] tabular-nums text-ink-soft sm:inline"
              data-debug-position-ms={positionMs}
              data-debug-duration-ms={durationMs}
            >
              {formatTime(Math.max(0, Math.min(positionMs, durationMs)))} / {formatTime(durationMs)}
            </span>
          )}
        </div>

        {/* Progress track */}
        <button
          type="button"
          onClick={handleTrackClick}
          aria-label={`${nowPlayingLabel}: ${title}`}
          className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-blush-100"
          style={{ direction: "ltr" }}
        >
          <span
            className="block h-full rounded-full bg-blush-500 transition-[width] duration-150 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </button>
      </div>

      {/* Volume control. Spotify's IFrame API doesn't officially expose
       *  setVolume on the embedded widget format we use — the slider may
       *  or may not actually affect audio depending on which build of
       *  Spotify's API is currently served. The setVolume call in
       *  music-player-context tries multiple methods (controller method
       *  + iframe postMessage) to maximise the chance one sticks.
       *  Hidden on mobile to keep the bar compact. */}
      <div
        className="hidden flex-shrink-0 items-center gap-2 sm:flex"
        style={{ direction: "ltr" }}
      >
        <button
          type="button"
          onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
          aria-label={volume === 0 ? "ביטול השתקה" : "השתק"}
          /* Inflate the tap target with `-m-2 p-2` (invisible padding that
             extends the click area to 32×32 around the 16×16 icon — still
             below the 44px guideline, but the volume widget is sm:+ only
             where mouse is primary). */
          className="-m-2 p-2 text-ink-soft transition-colors hover:text-blush-500 focus:outline-none focus-visible:text-blush-500"
        >
          <VolumeIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label="עוצמת קול"
          className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-blush-100 accent-blush-500
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blush-500 [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:transition-colors
            [&::-webkit-slider-thumb]:hover:bg-blush-600
            [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blush-500
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-sm"
        />
      </div>
    </div>
  );
}

/** Format `ms` as `M:SS`. Returns `0:00` for non-finite or negative values. */
function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
