import { cn } from "@/lib/utils";
import { Heart, Daisy, Star, Butterfly } from "@/components/decorative";

interface DoodleScatterProps {
  className?: string;
  seed?: string;
}

const doodles = [Heart, Daisy, Star, Butterfly];

function seededPositions(seed: string, count: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const positions: { top: string; start: string; rotate: number; idx: number }[] = [];
  for (let i = 0; i < count; i++) {
    hash = (hash * 16807 + 1) | 0;
    const top = 10 + (Math.abs(hash) % 80);
    hash = (hash * 16807 + 1) | 0;
    const start = 5 + (Math.abs(hash) % 90);
    hash = (hash * 16807 + 1) | 0;
    const rotate = -20 + (Math.abs(hash) % 40);
    hash = (hash * 16807 + 1) | 0;
    const idx = Math.abs(hash) % doodles.length;
    positions.push({ top: `${top}%`, start: `${start}%`, rotate, idx });
  }
  return positions;
}

export function DoodleScatter({
  className,
  seed = "scatter",
}: DoodleScatterProps) {
  const positions = seededPositions(seed, 4);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {positions.map((pos, i) => {
        const Doodle = doodles[pos.idx];
        return (
          <div
            key={i}
            className="absolute"
            style={{
              top: pos.top,
              insetInlineStart: pos.start,
              transform: `rotate(${pos.rotate}deg)`,
            }}
          >
            <Doodle className="h-4 w-4 opacity-40" />
          </div>
        );
      })}
    </div>
  );
}
