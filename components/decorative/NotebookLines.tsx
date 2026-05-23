import { cn } from "@/lib/utils";

interface NotebookLinesProps {
  children: React.ReactNode;
  className?: string;
  /** Line spacing in pixels — default 28 */
  lineSpacing?: number;
  /** Line color — default is a subtle blush */
  lineColor?: string;
  /** Whether to show the red margin line */
  showMargin?: boolean;
}

/**
 * Wraps content in a ruled-notebook-paper background.
 * Pure CSS gradients — no images.
 *
 * Inspired by "Peak Journal" 2026 trend and "Aimee's Papercraft World"
 * notebook-paper aesthetic from research.
 */
export function NotebookLines({
  children,
  className,
  lineSpacing = 28,
  lineColor = "rgba(229, 160, 160, 0.15)",
  showMargin = false,
}: NotebookLinesProps) {
  const backgroundImage = [
    // Horizontal ruled lines
    `repeating-linear-gradient(
      to bottom,
      transparent,
      transparent ${lineSpacing - 1}px,
      ${lineColor} ${lineSpacing - 1}px,
      ${lineColor} ${lineSpacing}px
    )`,
    // Optional margin line
    ...(showMargin
      ? [
          `linear-gradient(
            to left,
            transparent calc(100% - 60px),
            rgba(220, 100, 100, 0.2) calc(100% - 60px),
            rgba(220, 100, 100, 0.2) calc(100% - 59px),
            transparent calc(100% - 59px)
          )`,
        ]
      : []),
  ].join(", ");

  return (
    <div
      className={cn("relative", className)}
      style={{
        backgroundImage,
        backgroundSize: `100% ${lineSpacing}px${showMargin ? ", 100% 100%" : ""}`,
        backgroundPosition: "0 8px",
      }}
    >
      {children}
    </div>
  );
}
