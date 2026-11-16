"use client";

import { useEffect, useRef, useState } from "react";
import { IsraelMap } from "@/components/ui/IsraelMap";

interface ShowData {
  id: string;
  date: string;
  venue: string;
  city: string;
  title?: string;
  notes?: string;
}

/* Parse YYYY-MM-DD as local-noon to dodge the timezone trap: when Vercel
 * (UTC) renders a string parsed via `new Date("2026-06-12")` (parsed as
 * UTC midnight), then asks for the calendar day in IDT (UTC+3), the value
 * can flip to the previous day at the day boundary. Anchoring on T12:00
 * keeps us a full 12h away from either side's midnight. */
function parseShowDate(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return new Date(dateStr);
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
}

export function ShowsMapClient({ shows }: { shows: ShowData[] }) {
  const [highlightCity, setHighlightCity] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click-anywhere-outside closes the popup + clears the row highlight.
  // The container ref includes both the list and the map, so clicks INSIDE
  // (on a row, on a pin, on the tooltip itself) are exempt.
  useEffect(() => {
    if (!highlightCity) return;

    function handleOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setHighlightCity(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHighlightCity(null);
        setExpandedId(null);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [highlightCity]);

  function toggleCity(city: string) {
    setHighlightCity((current) => (current === city ? null : city));
  }

  function toggleRow(show: ShowData) {
    toggleCity(show.city);
    setExpandedId((current) => (current === show.id ? null : show.id));
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row md:gap-10 md:items-start"
    >
      {/* Past shows list */}
      <div className="flex-1">
        <h3 className="mb-4 text-center font-display text-xl text-ink-soft md:text-start">
          הופעות שעברו
        </h3>
        <div className="space-y-2">
          {shows.map((show) => (
            <div key={show.id}>
              <button
                type="button"
                onClick={() => toggleRow(show)}
                className={`flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-blush-100 py-3 text-sm transition-colors text-start sm:flex-nowrap ${
                  highlightCity === show.city
                    ? "bg-blush-50/60 text-ink"
                    : "text-ink-soft hover:bg-blush-50/30"
                }`}
              >
                <span className="tabular-nums">
                  {parseShowDate(show.date).toLocaleDateString("he-IL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
                <span className="flex-1">
                  {show.city}, {show.venue}
                </span>
                {(show.title || show.notes) && (
                  // Shown on phones too (it used to be hidden there), on its
                  // own line under the venue.
                  <span className="basis-full text-xs text-ink-soft sm:basis-auto">
                    {show.title || show.notes}
                  </span>
                )}
              </button>
              {expandedId === show.id && (
                <div className="md:hidden border-b border-blush-100 bg-blush-50/30 px-3 py-3 text-sm text-ink-soft">
                  <p className="font-medium text-ink">
                    {show.title || show.venue}
                  </p>
                  <p className="mt-1 text-xs">
                    {parseShowDate(show.date).toLocaleDateString("he-IL", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-xs">
                    {show.venue}, {show.city}
                  </p>
                  {show.notes && (
                    <p className="mt-2 text-xs italic opacity-80">{show.notes}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive tour map */}
      <div className="hidden md:block md:w-52 flex-shrink-0 mt-6 md:mt-0">
        <IsraelMap
          shows={shows.map((s) => ({
            id: s.id,
            city: s.city,
            venue: s.venue,
            date: s.date,
            coords: { x: 0, y: 0 },
          }))}
          highlightCity={highlightCity}
          onCityClick={toggleCity}
          onClose={() => setHighlightCity(null)}
        />
      </div>
    </div>
  );
}
