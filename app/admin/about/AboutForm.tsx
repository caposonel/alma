"use client";

import { useState } from "react";
import {
  adminInputStyle,
  adminLabelStyle,
  adminTextareaStyle,
  PrimaryButton,
} from "../_components";
import type { AdminAbout } from "@/lib/admin-store";

interface Props {
  initial: AdminAbout;
  action: (formData: FormData) => void | Promise<void>;
}

interface Section {
  key: keyof AdminAbout;
  title: string;
  blurb: string;
}

const SECTIONS: Section[] = [
  {
    key: "bioParagraphs",
    title: "Bio paragraphs",
    blurb:
      "Each paragraph is a separate string. They render in order on the About page.",
  },
  {
    key: "funFacts",
    title: "Fun facts",
    blurb: "Short single-line items shown in a scrapbook-style grid.",
  },
  {
    key: "milestones",
    title: "Milestones",
    blurb: "Year + short description, shown in a timeline.",
  },
  {
    key: "influences",
    title: "Musical influences",
    blurb: "Name + emoji or short icon.",
  },
  {
    key: "pressQuotes",
    title: "Press quotes",
    blurb: "Quote + source (e.g. Galgalatz). Optional URL turns the source into a link.",
  },
];

/**
 * Single-page editor for the About page content. All five sections live in one
 * AdminAbout object and are saved atomically.
 *
 * The form serializes its state into a single hidden `about` JSON field on
 * submit. This sidesteps the FormData array-name fiddling and keeps the server
 * action tiny (it just JSON.parses one field and writes to KV).
 */
export function AboutForm({ initial, action }: Props) {
  const [bioParagraphs, setBioParagraphs] = useState<string[]>(
    initial.bioParagraphs.length > 0 ? initial.bioParagraphs : [""]
  );
  const [funFacts, setFunFacts] = useState<string[]>(
    initial.funFacts.length > 0 ? initial.funFacts : [""]
  );
  const [milestones, setMilestones] = useState<
    { year: string; text: string }[]
  >(
    initial.milestones.length > 0
      ? initial.milestones
      : [{ year: "", text: "" }]
  );
  const [influences, setInfluences] = useState<
    { name: string; icon: string }[]
  >(
    initial.influences.length > 0
      ? initial.influences
      : [{ name: "", icon: "" }]
  );
  const [pressQuotes, setPressQuotes] = useState<
    { quote: string; source: string; sourceUrl?: string }[]
  >(
    initial.pressQuotes.length > 0
      ? initial.pressQuotes
      : [{ quote: "", source: "", sourceUrl: "" }]
  );

  function buildPayload(): string {
    const next: AdminAbout = {
      bioParagraphs: bioParagraphs.map((s) => s.trim()).filter((s) => s.length > 0),
      funFacts: funFacts.map((s) => s.trim()).filter((s) => s.length > 0),
      milestones: milestones
        .map((m) => ({ year: m.year.trim(), text: m.text.trim() }))
        .filter((m) => m.year.length > 0 || m.text.length > 0),
      influences: influences
        .map((i) => ({ name: i.name.trim(), icon: i.icon.trim() }))
        .filter((i) => i.name.length > 0 || i.icon.length > 0),
      pressQuotes: pressQuotes
        .map((q) => ({
          quote: q.quote.trim(),
          source: q.source.trim(),
          sourceUrl: q.sourceUrl?.trim() || undefined,
        }))
        .filter((q) => q.quote.length > 0 || q.source.length > 0),
    };
    return JSON.stringify(next);
  }

  return (
    <form action={action}>
      {/* Hidden serialized payload — populated on submit */}
      <input
        type="hidden"
        name="about"
        value={buildPayload()}
        readOnly
      />

      <SectionCard
        section={SECTIONS[0]}
        onAdd={() => setBioParagraphs((p) => [...p, ""])}
      >
        {bioParagraphs.map((para, idx) => (
          <RowFrame
            key={`bio-${idx}`}
            onRemove={() =>
              setBioParagraphs((p) => p.filter((_, i) => i !== idx))
            }
          >
            <label>
              <span style={adminLabelStyle}>Paragraph {idx + 1}</span>
              <textarea
                value={para}
                onChange={(e) =>
                  setBioParagraphs((prev) =>
                    prev.map((v, i) => (i === idx ? e.target.value : v))
                  )
                }
                dir="auto"
                style={{ ...adminTextareaStyle, minHeight: 120 }}
              />
            </label>
          </RowFrame>
        ))}
      </SectionCard>

      <SectionCard
        section={SECTIONS[1]}
        onAdd={() => setFunFacts((p) => [...p, ""])}
      >
        {funFacts.map((fact, idx) => (
          <RowFrame
            key={`fact-${idx}`}
            onRemove={() =>
              setFunFacts((p) => p.filter((_, i) => i !== idx))
            }
          >
            <label>
              <span style={adminLabelStyle}>Fun fact</span>
              <input
                type="text"
                value={fact}
                onChange={(e) =>
                  setFunFacts((prev) =>
                    prev.map((v, i) => (i === idx ? e.target.value : v))
                  )
                }
                dir="auto"
                style={adminInputStyle}
              />
            </label>
          </RowFrame>
        ))}
      </SectionCard>

      <SectionCard
        section={SECTIONS[2]}
        onAdd={() => setMilestones((p) => [...p, { year: "", text: "" }])}
      >
        {milestones.map((ms, idx) => (
          <RowFrame
            key={`ms-${idx}`}
            onRemove={() =>
              setMilestones((p) => p.filter((_, i) => i !== idx))
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 12,
              }}
            >
              <label>
                <span style={adminLabelStyle}>Year</span>
                <input
                  type="text"
                  value={ms.year}
                  onChange={(e) =>
                    setMilestones((prev) =>
                      prev.map((v, i) =>
                        i === idx ? { ...v, year: e.target.value } : v
                      )
                    )
                  }
                  placeholder="2024"
                  style={adminInputStyle}
                />
              </label>
              <label>
                <span style={adminLabelStyle}>Description</span>
                <input
                  type="text"
                  value={ms.text}
                  onChange={(e) =>
                    setMilestones((prev) =>
                      prev.map((v, i) =>
                        i === idx ? { ...v, text: e.target.value } : v
                      )
                    )
                  }
                  dir="auto"
                  style={adminInputStyle}
                />
              </label>
            </div>
          </RowFrame>
        ))}
      </SectionCard>

      <SectionCard
        section={SECTIONS[3]}
        onAdd={() => setInfluences((p) => [...p, { name: "", icon: "" }])}
      >
        {influences.map((inf, idx) => (
          <RowFrame
            key={`inf-${idx}`}
            onRemove={() =>
              setInfluences((p) => p.filter((_, i) => i !== idx))
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: 12,
              }}
            >
              <label>
                <span style={adminLabelStyle}>Icon</span>
                <input
                  type="text"
                  value={inf.icon}
                  onChange={(e) =>
                    setInfluences((prev) =>
                      prev.map((v, i) =>
                        i === idx ? { ...v, icon: e.target.value } : v
                      )
                    )
                  }
                  placeholder="🎵"
                  style={adminInputStyle}
                />
              </label>
              <label>
                <span style={adminLabelStyle}>Name</span>
                <input
                  type="text"
                  value={inf.name}
                  onChange={(e) =>
                    setInfluences((prev) =>
                      prev.map((v, i) =>
                        i === idx ? { ...v, name: e.target.value } : v
                      )
                    )
                  }
                  dir="auto"
                  style={adminInputStyle}
                />
              </label>
            </div>
          </RowFrame>
        ))}
      </SectionCard>

      <SectionCard
        section={SECTIONS[4]}
        onAdd={() =>
          setPressQuotes((p) => [
            ...p,
            { quote: "", source: "", sourceUrl: "" },
          ])
        }
      >
        {pressQuotes.map((q, idx) => (
          <RowFrame
            key={`pq-${idx}`}
            onRemove={() =>
              setPressQuotes((p) => p.filter((_, i) => i !== idx))
            }
          >
            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={adminLabelStyle}>Quote</span>
              <textarea
                value={q.quote}
                onChange={(e) =>
                  setPressQuotes((prev) =>
                    prev.map((v, i) =>
                      i === idx ? { ...v, quote: e.target.value } : v
                    )
                  )
                }
                dir="auto"
                style={{ ...adminTextareaStyle, minHeight: 80 }}
              />
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <label>
                <span style={adminLabelStyle}>Source</span>
                <input
                  type="text"
                  value={q.source}
                  onChange={(e) =>
                    setPressQuotes((prev) =>
                      prev.map((v, i) =>
                        i === idx ? { ...v, source: e.target.value } : v
                      )
                    )
                  }
                  dir="auto"
                  placeholder="Galgalatz"
                  style={adminInputStyle}
                />
              </label>
              <label>
                <span style={adminLabelStyle}>Source URL (optional)</span>
                <input
                  type="url"
                  value={q.sourceUrl ?? ""}
                  onChange={(e) =>
                    setPressQuotes((prev) =>
                      prev.map((v, i) =>
                        i === idx ? { ...v, sourceUrl: e.target.value } : v
                      )
                    )
                  }
                  placeholder="https://..."
                  style={adminInputStyle}
                />
              </label>
            </div>
          </RowFrame>
        ))}
      </SectionCard>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid #F0E4D3",
        }}
      >
        <PrimaryButton>Save about</PrimaryButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

function SectionCard({
  section,
  children,
  onAdd,
}: {
  section: Section;
  children: React.ReactNode;
  onAdd: () => void;
}) {
  return (
    <section
      style={{
        marginBottom: 32,
        padding: 20,
        background: "#FAF3EB",
        border: "1px solid #F0E4D3",
        borderRadius: 8,
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          {section.title}
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "#5A4F4A",
            margin: "4px 0 0",
          }}
        >
          {section.blurb}
        </p>
      </header>
      {children}
      <button
        type="button"
        onClick={onAdd}
        style={{
          padding: "8px 16px",
          background: "transparent",
          border: "1px dashed #E5A0A0",
          borderRadius: 4,
          color: "#B85959",
          fontSize: 13,
          cursor: "pointer",
          marginTop: 8,
        }}
      >
        + Add row
      </button>
    </section>
  );
}

function RowFrame({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        background: "white",
        border: "1px solid #F0E4D3",
        borderRadius: 6,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {children}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 12,
        }}
      >
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove row"
          style={{
            background: "transparent",
            border: 0,
            color: "#B85959",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          × Remove
        </button>
      </div>
    </div>
  );
}
