import "./globals.css";

// The root layout is intentionally minimal — html/body and lang/dir attributes
// are set in app/[locale]/layout.tsx so they can vary per locale.
// Next.js requires app/layout.tsx to exist, so we pass children through.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
