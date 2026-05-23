import { getAbout, type AdminAbout } from "@/lib/admin-store";
import { ImportPlaceholdersButton } from "../_components/ImportPlaceholdersButton";
import { importAboutPlaceholders } from "../_actions/import-placeholders";
import { AboutForm } from "./AboutForm";
import { saveAbout } from "./actions";

const EMPTY_ABOUT: AdminAbout = {
  bioParagraphs: [],
  funFacts: [],
  milestones: [],
  influences: [],
  pressQuotes: [],
};

export default async function AdminAboutPage() {
  const about = (await getAbout()) ?? EMPTY_ABOUT;
  const isEmpty =
    about.bioParagraphs.length === 0 &&
    about.funFacts.length === 0 &&
    about.milestones.length === 0 &&
    about.influences.length === 0 &&
    about.pressQuotes.length === 0;

  return (
    <div style={{ maxWidth: 820 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          About page
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#5A4F4A",
            margin: "4px 0 0",
          }}
        >
          Bio paragraphs, fun facts, milestones, influences and press quotes
          shown on the public <code>/about</code> page. Leave any section empty
          to fall back to the built-in static content.
        </p>
      </header>

      {isEmpty && (
        <ImportPlaceholdersButton
          action={importAboutPlaceholders}
          sectionLabel="about"
        />
      )}

      <AboutForm initial={about} action={saveAbout} />
    </div>
  );
}
