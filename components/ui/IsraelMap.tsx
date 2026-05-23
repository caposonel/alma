"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface MapShow {
  id: string;
  city: string;
  venue: string;
  date: string;
  coords: { x: number; y: number };
  ticketUrl?: string;
}

interface IsraelMapProps {
  shows: MapShow[];
  className?: string;
  /** Externally controlled: highlight all pins matching this city name */
  highlightCity?: string | null;
  /** Called when a pin is clicked — passes the city name */
  onCityClick?: (city: string) => void;
  /** Called when the tooltip close button is clicked */
  onClose?: () => void;
}

// Combined Israel + Gaza + West Bank projection (GADM 4.1)
// All three territories projected to SVG viewBox "0 0 300 700"
const CITY_COORDS: Record<string, { x: number; y: number }> = {
  "תל אביב-יפו": { x: 104, y: 244 },
  "תל אביב": { x: 104, y: 244 },
  "ירושלים": { x: 174, y: 295 },
  "חיפה": { x: 138, y: 130 },
  "באר שבע": { x: 106, y: 379 },
  "הרצליה": { x: 105, y: 232 },
  "גבעתיים": { x: 109, y: 247 },
  "זכרון יעקב": { x: 132, y: 166 },
  "נתניה": { x: 116, y: 206 },
  "אילת": { x: 132, y: 653 },
  "טבריה": { x: 225, y: 130 },
  "פתח תקווה": { x: 121, y: 244 },
  "ראשון לציון": { x: 107, y: 263 },
  "אשדוד": { x: 83, y: 291 },
  "נצרת": { x: 188, y: 145 },
  "עכו": { x: 152, y: 108 },
  "אשקלון": { x: 70, y: 312 },
  "עזה": { x: 40, y: 358 },
  "רמאללה": { x: 160, y: 260 },
  "שכם": { x: 166, y: 218 },
  "חברון": { x: 162, y: 320 },
  "בית לחם": { x: 170, y: 302 },
  "ג'נין": { x: 164, y: 181 },
};

function getCoordsForCity(city: string): { x: number; y: number } {
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    if (city.includes(name) || name.includes(city)) return coords;
  }
  return { x: 150, y: 250 };
}

// SINGLE unified outer boundary path (GADM 4.1, RDP simplified)
// Traces the complete outer edge of Israel + Gaza + West Bank as ONE country.
// Constructed by walking Israel's outline and splicing in:
//   - Gaza's Mediterranean coastline (replacing Israel-Gaza shared border)
//   - West Bank's Jordan Valley / eastern border (replacing Israel-WB shared border)
// Result: ZERO internal borders. One path, one fill, one stroke.
const UNIFIED_PATH =
  // Part 1: Eilat → west coast → Gaza junction
  "M 119.9 669.6 L 116.2 658.2 L 118.6 649.1 L 114.8 641.4 L 115 633.3 L 74.9 529.2 L 63.2 522.6 L 62.8 517.5 L 66.2 509 L 59 501.6 L 59.5 492.5 L 54.6 475 L 39.9 448.3 L 16.5 384.7 " +
  // Part 2: Gaza external coast (Mediterranean side, replaces Israel-Gaza shared border)
  "L 10 366.1 L 31.5 347.2 L 47 330.9 L 53.5 322.5 " +
  // Part 3: Mediterranean coast north → northern border → heading southeast toward WB
  "L 70.4 299.6 L 78.6 285.2 L 78.4 282.3 L 78.6 284.9 L 78.8 282.8 L 81 282.3 L 92 259.5 L 96.6 245.7 L 99 243.1 L 112.1 204.6 L 119.2 176.8 L 116.8 175.7 L 119.7 175.7 L 120.4 173.1 L 126.7 138.3 L 130.2 131.1 L 131.4 116.4 L 136.1 114.4 L 141.9 116 L 137.6 115.8 L 144.5 119 L 143.5 117.9 L 146.9 116.2 L 151 110.1 L 152.9 102.2 L 150.2 100.3 L 156 78.6 L 156.3 71.3 L 173.7 72.2 L 174.4 70.4 L 182.7 70.7 L 188.3 69 L 192.6 70.1 L 193.4 73.4 L 195.4 75.1 L 196.8 73.8 L 199.1 77.6 L 211.1 76.1 L 213.6 71.9 L 223.3 71.5 L 223.1 68 L 226 67.6 L 228 64.7 L 227.1 63.8 L 229.8 53.9 L 229 48.1 L 233.4 41.4 L 233.5 38.8 L 237 41.2 L 238 39.8 L 239.1 40.6 L 243.5 46.5 L 251.1 45.4 L 262.3 34.8 L 265.7 33.8 L 276 26.1 L 277.1 26.6 L 275.3 29.1 L 281.7 33 L 276 39.2 L 281.5 44.7 L 281 51.7 L 283.7 54.1 L 284.5 57.5 L 280.1 66.6 L 285.7 70 L 287.3 91.4 L 289.5 93.2 L 290 97.4 L 283.8 104.7 L 282 113.9 L 269.7 128.7 L 267.1 129.4 L 265.8 133 L 243.1 141.2 L 242.4 144.6 L 236.2 148.6 L 236.3 153.3 L 238.3 155.7 L 237.4 158.9 L 239.1 161.9 L 236.9 163.8 L 234.8 163.4 L 236.1 165.9 L 233.1 167.8 L 237.6 171.3 L 235.2 176.1 L 237.2 178 L 235.4 179.3 L 235.8 181.5 L 233.9 182.1 L 234.3 185.8 L 232.6 187 L 234.2 189.3 " +
  // Part 4: West Bank eastern border — Jordan Valley (replaces Israel-WB shared border)
  "L 232.8 189.2 L 232.5 192.2 L 234.2 194.5 L 233 199.5 L 234.4 202.5 L 233.5 205.7 L 234.6 208.1 L 234 211.8 L 235.5 220.1 L 233.6 224 L 231.4 234.5 L 229.1 237.2 L 227.1 242.5 L 227.5 249.7 L 229.6 252.7 L 228.1 254.6 L 230.9 259.9 L 229.8 265.8 L 226.8 268.3 L 228.4 275.4 L 231.3 277 L 229.7 279.7 L 231.4 282.1 L 230.1 285.3 L 232.2 295.1 L 227.9 301.6 L 219.2 325.9 L 218.8 340.3 " +
  // Part 5: Eastern border south → Dead Sea → Negev → back to Eilat
  "L 218.7 351.8 L 215.3 361.9 L 204.4 381.2 L 213.8 393.4 L 215.9 399.3 L 213.9 409.3 L 207.5 417.8 L 208.6 430.7 L 199.4 436.5 L 194.9 445.1 L 194.9 454.2 L 189.2 457.8 L 187.7 468.2 L 180.3 483.1 L 172.9 493.4 L 168.7 511.4 L 164.6 519.5 L 171.2 531.6 L 167 537.1 L 166.5 543.4 L 163.3 549.5 L 168.5 569.7 L 155.6 585.8 L 152.1 597.9 L 152.6 611 L 147.7 619.6 L 144.1 639 L 144.6 651.5 L 136.8 658.3 L 133.4 665.5 L 131.6 665.1 L 124.8 673.6 Z";

export function IsraelMap({ shows, className = "", highlightCity, onCityClick, onClose }: IsraelMapProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Resolve which pin key is active purely from the controlled highlightCity prop.
  // Single source of truth lives in the parent (e.g. ShowsMapClient) so that
  // a click-outside-to-close handler in the parent can reliably dismiss the tooltip.
  function findKeyForCity(city: string): string | null {
    for (const show of shows) {
      if (show.city === city || show.city.includes(city) || city.includes(show.city)) {
        const coords =
          show.coords.x === 0 && show.coords.y === 0
            ? getCoordsForCity(show.city)
            : show.coords;
        return `${coords.x}-${coords.y}`;
      }
    }
    return null;
  }
  const resolvedActiveKey = highlightCity ? findKeyForCity(highlightCity) : null;

  const mappedShows: MapShow[] = shows.map((show) => ({
    ...show,
    coords:
      show.coords.x === 0 && show.coords.y === 0
        ? getCoordsForCity(show.city)
        : show.coords,
  }));

  // Group shows by city location
  const cityGroups = new Map<string, MapShow[]>();
  for (const show of mappedShows) {
    const key = `${show.coords.x}-${show.coords.y}`;
    if (!cityGroups.has(key)) cityGroups.set(key, []);
    cityGroups.get(key)!.push(show);
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 300 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[220px] mx-auto"
        role="img"
        aria-label="מפת הופעות בישראל"
      >
        {/* Single unified country outline — one path, zero internal borders */}
        <path
          d={UNIFIED_PATH}
          fill="#fbf6f0"
          stroke="#d4a0a0"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Mediterranean coast waves */}
        <path
          d="M 57 150 C 50 165, 48 180, 54 195"
          stroke="#c0d4e0"
          strokeWidth="0.8"
          opacity="0.25"
          fill="none"
        />
        <path
          d="M 47 250 C 40 265, 38 280, 44 295"
          stroke="#c0d4e0"
          strokeWidth="0.8"
          opacity="0.25"
          fill="none"
        />

        {/* Dotted route line */}
        {mappedShows.length > 1 && (
          <path
            d={mappedShows
              .map((s, i) =>
                `${i === 0 ? "M" : "L"} ${s.coords.x} ${s.coords.y}`
              )
              .join(" ")}
            stroke="#e5a0a0"
            strokeWidth="1.2"
            strokeDasharray="5 4"
            fill="none"
            opacity="0.4"
          />
        )}

        {/* City pins */}
        {Array.from(cityGroups.entries()).map(([key, groupShows]) => {
          const { coords } = groupShows[0];
          const isActive = resolvedActiveKey === key;
          const count = groupShows.length;

          return (
            <g
              key={key}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                // Parent owns state — just notify; parent toggles highlightCity.
                if (onCityClick) {
                  onCityClick(groupShows[0].city);
                }
              }}
            >
              {/* Pulse ring — only after mount to avoid hydration mismatch */}
              {mounted && !prefersReduced && (
                <motion.circle
                  cx={coords.x}
                  cy={coords.y}
                  r={6}
                  fill="none"
                  stroke="#e5a0a0"
                  strokeWidth="1"
                  animate={{
                    r: [6, 14, 6],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              {/* Pin */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={isActive ? 7 : 5.5}
                fill={isActive ? "#d97777" : "#e5a0a0"}
                stroke="#d97777"
                strokeWidth="1.5"
              />
              <circle
                cx={coords.x}
                cy={coords.y}
                r="2"
                fill="white"
                opacity="0.7"
              />

              {/* Count badge */}
              {count > 1 && (
                <>
                  <circle
                    cx={coords.x + 8}
                    cy={coords.y - 8}
                    r="6"
                    fill="#d97777"
                    stroke="white"
                    strokeWidth="1"
                  />
                  <text
                    x={coords.x + 8}
                    y={coords.y - 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="7"
                    fontWeight="bold"
                  >
                    {count}
                  </text>
                </>
              )}

              {/* City label */}
              <text
                x={coords.x}
                y={coords.y + 16}
                textAnchor="middle"
                fill="#5a4f4a"
                fontSize="9"
                fontFamily="sans-serif"
              >
                {groupShows[0].city}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {resolvedActiveKey && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-2 start-0 end-0 mx-auto w-52 rounded-xl border border-blush-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm z-10"
          >
            {cityGroups.get(resolvedActiveKey!)?.map((show) => (
              <div key={show.id} className="mb-3 last:mb-0">
                <p className="text-sm font-semibold text-ink">{show.venue}</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {new Date(show.date).toLocaleDateString("he-IL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {show.ticketUrl && (
                  <a
                    href={show.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block text-sm font-medium text-blush-600 hover:text-blush-700 hover:underline"
                  >
                    לכרטיסים &larr;
                  </a>
                )}
              </div>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              className="mt-2 text-xs font-medium text-ink-soft hover:text-ink transition-colors"
            >
              סגור
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
