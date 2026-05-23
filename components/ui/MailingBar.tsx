"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, X } from "lucide-react";
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
              "bg-paper-warm/95 backdrop-blur-sm",
              "border-t border-blush-200",
              "shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
            )}
            role="region"
            aria-label={t("prompt")}
            data-mailing-bar="bar"
          >
            {/* Dismiss button — top-end so it overlaps the bar nicely. */}
            <button
              type="button"
              onClick={() => persistDismissed(true)}
              aria-label={t("closeLabel")}
              className="absolute top-1 end-2 rounded-full p-1 text-ink-soft transition-colors hover:bg-blush-100 hover:text-blush-500"
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
            className="fixed bottom-4 end-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-paper-warm/95 text-blush-500 shadow-md ring-1 ring-blush-200 backdrop-blur-sm hover:text-blush-600"
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
  onTogglePlay: () => void;
  /** Seek target in SECONDS (Spotify's controller.seek expects seconds). */
  onSeek: (seconds: number) => void;
  playLabel: string;
  pauseLabel: string;
  nowPlayingLabel: string;
}

function MiniPlayer({
  title,
  isPaused,
  positionMs,
  durationMs,
  onTogglePlay,
  onSeek,
  playLabel,
  pauseLabel,
  nowPlayingLabel,
}: MiniPlayerProps) {
  const percent = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  /* Click anywhere on the progress track to seek there. We can't use the
   * native <input type=range> because we need a paper-style bar that
   * matches the rest of the mailing-bar aesthetic — and Spotify's seek
   * accepts seconds, not a 0-1 ratio, so we do the math ourselves. */
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

  return (
    <div className="mx-auto flex max-w-6xl items-center gap-3">
      {/* Play / pause button */}
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPaused ? playLabel : pauseLabel}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-blush-400 bg-blush-500 text-white shadow-sm transition-colors hover:border-blush-600 hover:bg-blush-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-300"
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
          <span className="hidden flex-shrink-0 font-mono text-[10px] tabular-nums text-ink-soft sm:inline">
            {formatTime(positionMs)} / {formatTime(durationMs)}
          </span>
        </div>

        {/* Progress track — button so it's natively clickable + keyboard-friendly */}
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
