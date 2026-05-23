"use client";

import {
  Heart,
  Daisy,
  Star,
  Butterfly,
  Guitar,
  Squiggle,
  Tape,
} from "@/components/decorative";
import {
  Button,
  PolaroidFrame,
  HandwrittenUnderline,
  TicketStub,
  DoodleScatter,
} from "@/components/ui";

const colors = [
  { name: "paper", hex: "#FBF6F0", cls: "bg-paper" },
  { name: "paper-warm", hex: "#F5EBE0", cls: "bg-paper-warm" },
  { name: "ink", hex: "#2A2A2A", cls: "bg-ink" },
  { name: "ink-soft", hex: "#5A4F4A", cls: "bg-ink-soft" },
  { name: "blush-50", hex: "#FDF2F2", cls: "bg-blush-50" },
  { name: "blush-100", hex: "#F9DCDC", cls: "bg-blush-100" },
  { name: "blush-200", hex: "#F5C2C2", cls: "bg-blush-200" },
  { name: "blush-300", hex: "#F0AFAF", cls: "bg-blush-300" },
  { name: "blush-400", hex: "#E89595", cls: "bg-blush-400" },
  { name: "blush-500", hex: "#D97777", cls: "bg-blush-500" },
  { name: "blush-600", hex: "#B85959", cls: "bg-blush-600" },
  { name: "pink-doodle", hex: "#E5A0A0", cls: "bg-pink-doodle" },
];

export default function StyleguidePage() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-10 font-display text-4xl text-ink">
        מדריך עיצוב — Styleguide
      </h1>

      {/* Colors */}
      <section className="mb-16">
        <h2 className="mb-6 font-display text-2xl text-ink">צבעים</h2>
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
          {colors.map((c) => (
            <div key={c.name} className="text-center">
              <div
                className={`${c.cls} mb-2 h-16 w-full rounded-md border border-blush-100 shadow-sm`}
              />
              <p className="text-xs font-medium text-ink">{c.name}</p>
              <p className="text-xs text-ink-soft">{c.hex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-16">
        <h2 className="mb-6 font-display text-2xl text-ink">טיפוגרפיה</h2>
        <div className="space-y-4">
          <p className="font-display text-6xl text-ink">
            עלמה גוב — Display 6xl
          </p>
          <p className="font-display text-4xl text-ink">כותרת — Display 4xl</p>
          <p className="font-display text-2xl text-ink">
            כותרת משנית — Display 2xl
          </p>
          <p className="font-display text-xl text-ink">Display xl</p>
          <hr className="border-blush-100" />
          <p className="text-lg text-ink">טקסט גוף גדול — Body lg (Heebo)</p>
          <p className="text-base text-ink">
            טקסט גוף רגיל — Body base. זהו טקסט לדוגמה בעברית כדי לראות איך
            הפונט נראה בפיסקה ארוכה יותר. השירים שלה הם מכתבים לעצמה ולקהל.
          </p>
          <p className="text-sm text-ink-soft">טקסט קטן — Body sm</p>
          <p className="text-xs text-ink-soft">טקסט זעיר — Body xs</p>
        </div>
      </section>

      {/* Decorative SVGs */}
      <section className="mb-16">
        <h2 className="mb-6 font-display text-2xl text-ink">קישוטים (SVG)</h2>
        <div className="flex flex-wrap items-end gap-8">
          {[
            { name: "Heart", el: <Heart /> },
            { name: "Heart lg", el: <Heart className="h-10 w-10" /> },
            { name: "Daisy", el: <Daisy /> },
            { name: "Daisy lg", el: <Daisy className="h-10 w-10" /> },
            { name: "Star outline", el: <Star /> },
            { name: "Star filled", el: <Star variant="filled" /> },
            {
              name: "Star lg",
              el: <Star className="h-10 w-10" variant="filled" />,
            },
            { name: "Butterfly", el: <Butterfly /> },
            { name: "Butterfly lg", el: <Butterfly className="h-12 w-14" /> },
            { name: "Guitar", el: <Guitar /> },
            { name: "Guitar lg", el: <Guitar className="h-16 w-6" /> },
            { name: "Tape", el: <Tape /> },
            { name: "Tape lg", el: <Tape className="h-8 w-28" /> },
          ].map((item) => (
            <div key={item.name} className="text-center">
              <div className="mb-2 flex items-center justify-center">
                {item.el}
              </div>
              <p className="text-xs text-ink-soft">{item.name}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <p className="mb-2 text-sm text-ink-soft">Squiggle (full-width):</p>
          <Squiggle />
          <Squiggle className="mt-2 h-3 w-48" />
        </div>
      </section>

      {/* Buttons */}
      <section className="mb-16">
        <h2 className="mb-6 font-display text-2xl text-ink">כפתורים</h2>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">קטן</Button>
            <Button size="md">רגיל</Button>
            <Button size="lg">גדול</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="/music">קישור כפתור</Button>
            <Button variant="ghost" href="/shows">
              Ghost קישור
            </Button>
          </div>
        </div>
      </section>

      {/* PolaroidFrame */}
      <section className="mb-16">
        <h2 className="mb-6 font-display text-2xl text-ink">מסגרת פולארויד</h2>
        <div className="flex flex-wrap items-start gap-8">
          <PolaroidFrame
            src="/images/placeholder.jpg"
            alt="תמונה לדוגמה"
            width={200}
            height={200}
          />
          <PolaroidFrame
            src="/images/placeholder.jpg"
            alt="תמונה עם כיתוב"
            caption="רגע מהופעה"
            rotation={3}
            width={200}
            height={200}
          />
          <PolaroidFrame
            src="/images/placeholder.jpg"
            alt="תמונה מעוטרת"
            caption="עם קישוטים"
            decorate
            rotation={-2}
            width={200}
            height={200}
          />
        </div>
      </section>

      {/* HandwrittenUnderline */}
      <section className="mb-16">
        <h2 className="mb-6 font-display text-2xl text-ink">קו תחתון בכתב יד</h2>
        <p className="text-2xl">
          <HandwrittenUnderline>
            <span className="font-display">יומן / מכתבים</span>
          </HandwrittenUnderline>
        </p>
        <p className="mt-6 text-lg">
          <HandwrittenUnderline>טקסט עם קישוט</HandwrittenUnderline>
        </p>
      </section>

      {/* TicketStub */}
      <section className="mb-16">
        <h2 className="mb-6 font-display text-2xl text-ink">כרטיס הופעה</h2>
        <TicketStub className="max-w-sm">
          <p className="font-display text-lg text-ink">צוללת צהובה, ירושלים</p>
          <p className="text-sm text-ink-soft">15.06.2026 · 21:00</p>
          <Button size="sm" className="mt-3">
            כרטיסים
          </Button>
        </TicketStub>
      </section>

      {/* DoodleScatter */}
      <section className="mb-16">
        <h2 className="mb-6 font-display text-2xl text-ink">פיזור קישוטים</h2>
        <div className="relative h-48 rounded-md border border-blush-100 bg-paper-warm">
          <DoodleScatter seed="styleguide-demo" />
          <p className="flex h-full items-center justify-center text-sm text-ink-soft">
            קישוטים מפוזרים ברקע (opacity נמוך)
          </p>
        </div>
      </section>
    </main>
  );
}
