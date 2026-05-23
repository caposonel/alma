import Link from "next/link";

/**
 * Shared inline-styled building blocks used across the admin editors.
 *
 * Function over form — these are vanilla server components with style objects
 * so the admin tree stays self-contained and doesn't depend on the public
 * site's Tailwind v4 + design system.
 */

export const adminInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #E5D7C8",
  borderRadius: 4,
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
  background: "white",
};

export const adminTextareaStyle: React.CSSProperties = {
  ...adminInputStyle,
  fontFamily: "var(--font-heebo), monospace",
  fontSize: 13,
  lineHeight: 1.6,
  minHeight: 160,
  resize: "vertical",
};

export const adminLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 4,
  color: "#5A4F4A",
};

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 16 }}>{children}</div>;
}

export function FormHeader({
  title,
  backHref,
  backLabel,
}: {
  title: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <header style={{ marginBottom: 24 }}>
      <Link
        href={backHref}
        style={{
          fontSize: 13,
          color: "#B85959",
          textDecoration: "none",
          marginBottom: 8,
          display: "inline-block",
        }}
      >
        ← {backLabel}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{title}</h1>
    </header>
  );
}

export function PrimaryButton({
  children,
  type = "submit",
}: {
  children: React.ReactNode;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      style={{
        padding: "10px 20px",
        background: "#B85959",
        color: "white",
        border: 0,
        borderRadius: 4,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  formAction,
  name,
  value,
}: {
  children: React.ReactNode;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      name={name}
      value={value}
      style={{
        padding: "10px 20px",
        background: "transparent",
        color: "#B85959",
        border: "1px solid #E5A0A0",
        borderRadius: 4,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function ListRow({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: "white",
        border: "1px solid #F0E4D3",
        borderRadius: 4,
        textDecoration: "none",
        color: "inherit",
        marginBottom: 8,
      }}
    >
      <span style={{ fontWeight: 500 }}>{title}</span>
      {meta && (
        <span style={{ fontSize: 12, color: "#5A4F4A" }}>{meta}</span>
      )}
    </Link>
  );
}

export function PageHeader({
  title,
  newHref,
  newLabel,
}: {
  title: string;
  newHref?: string;
  newLabel?: string;
}) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{title}</h1>
      {newHref && newLabel && (
        <Link
          href={newHref}
          style={{
            padding: "8px 16px",
            background: "#B85959",
            color: "white",
            borderRadius: 4,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          + {newLabel}
        </Link>
      )}
    </header>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: 32,
        textAlign: "center",
        color: "#5A4F4A",
        background: "white",
        border: "1px dashed #E5D7C8",
        borderRadius: 8,
      }}
    >
      {message}
    </div>
  );
}
