import {
  adminInputStyle,
  adminLabelStyle,
  adminTextareaStyle,
  DangerButton,
  FieldRow,
  PrimaryButton,
} from "../_components";
import type { AdminLyric } from "@/lib/admin-store";

interface Props {
  lyric?: AdminLyric;
  action: (formData: FormData) => void | Promise<void>;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  /** When true, the slug input is read-only (slug is the natural ID). */
  slugLocked?: boolean;
}

export function LyricForm({ lyric, action, deleteAction, slugLocked }: Props) {
  return (
    <form action={action}>
      <FieldRow>
        <label>
          <span style={adminLabelStyle}>
            Slug (URL fragment under /lyrics/—must be unique)
          </span>
          <input
            name="slug"
            type="text"
            required
            defaultValue={lyric?.slug ?? ""}
            placeholder="my-song"
            readOnly={slugLocked}
            style={{
              ...adminInputStyle,
              ...(slugLocked
                ? {
                    background: "#F5EBE0",
                    color: "#5A4F4A",
                    cursor: "not-allowed",
                  }
                : {}),
            }}
          />
          {slugLocked && (
            <small
              style={{
                display: "block",
                marginTop: 4,
                fontSize: 11,
                color: "#5A4F4A",
              }}
            >
              The slug is the page URL — to change it, delete this entry and
              create a new one.
            </small>
          )}
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Hebrew title</span>
          <input
            name="titleHe"
            type="text"
            required
            defaultValue={lyric?.titleHe ?? ""}
            dir="rtl"
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Hebrew lyrics</span>
          <textarea
            name="lyricsHe"
            required
            defaultValue={lyric?.lyricsHe ?? ""}
            dir="rtl"
            style={{
              ...adminTextareaStyle,
              minHeight: 320,
              textAlign: "start",
            }}
          />
          <small
            style={{
              display: "block",
              marginTop: 6,
              fontSize: 11,
              lineHeight: 1.5,
              color: "#5A4F4A",
            }}
          >
            <strong>Plain text:</strong> renders statically next to the embed
            (no karaoke highlight).
            <br />
            <strong>LRC format:</strong> if every line is prefixed with
            <code style={{ background: "#f4ece4", padding: "0 4px", borderRadius: 2 }}>
              [mm:ss.xx]
            </code>
            (e.g. <code style={{ background: "#f4ece4", padding: "0 4px", borderRadius: 2 }}>
              [00:12.40]שיר ורוד על השפתיים
            </code>), the player will auto-detect and karaoke-highlight the
            active line. Generate an LRC file with{" "}
            <a
              href="https://lrcgenerator.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#9c4848" }}
            >
              lrcgenerator.com
            </a>{" "}
            or any LRC editor.
          </small>
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Spotify track ID (optional)</span>
          <input
            name="spotifyTrackId"
            type="text"
            defaultValue={lyric?.spotifyTrackId ?? ""}
            placeholder="06rEa14xVbsmU6xrUDM5jR"
            style={adminInputStyle}
          />
          <small
            style={{
              display: "block",
              marginTop: 6,
              fontSize: 11,
              lineHeight: 1.5,
              color: "#5A4F4A",
            }}
          >
            Paste the track from Spotify&apos;s share menu → Copy Link, then
            take the 22-character ID after <code>/track/</code>. E.g. for{" "}
            <code>https://open.spotify.com/track/06rEa14xVbsmU6xrUDM5jR?si=xxx</code>
            {" "}the ID is <code>06rEa14xVbsmU6xrUDM5jR</code>. When this
            matches a song the visitor plays in the Music-page embed, this
            song&apos;s lyrics will appear automatically below the player.
          </small>
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Release title (optional)</span>
          <input
            name="releaseTitle"
            type="text"
            defaultValue={lyric?.releaseTitle ?? ""}
            dir="auto"
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <FieldRow>
        <label>
          <span style={adminLabelStyle}>Release date (optional)</span>
          <input
            name="releaseDate"
            type="date"
            defaultValue={lyric?.releaseDate ?? ""}
            style={adminInputStyle}
          />
        </label>
      </FieldRow>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid #F0E4D3",
        }}
      >
        <PrimaryButton>Save</PrimaryButton>
        {deleteAction && (
          <DangerButton formAction={deleteAction}>Delete</DangerButton>
        )}
      </div>
    </form>
  );
}
