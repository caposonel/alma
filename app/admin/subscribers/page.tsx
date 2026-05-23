import { getSubscribers } from "@/lib/admin-store";
import { EmptyState } from "../_components";
import { ExportButton } from "./ExportButton";
import { deleteSubscriber } from "./actions";

/**
 * Subscriber list view — server component. Subscribers are stored
 * newest-first in KV, so we render them in the order returned.
 */
export default async function AdminSubscribersPage() {
  const subscribers = await getSubscribers();

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            Subscribers
          </h1>
          <span
            style={{
              fontSize: 12,
              background: "#F5EBE0",
              padding: "2px 10px",
              borderRadius: 999,
              color: "#5A4F4A",
            }}
          >
            {subscribers.length} total
          </span>
        </div>
        {subscribers.length > 0 && <ExportButton />}
      </header>

      {subscribers.length === 0 ? (
        <EmptyState message="No subscribers yet. When someone joins from the mailing bar, they'll show up here." />
      ) : (
        <div
          style={{
            background: "white",
            border: "1px solid #F0E4D3",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#FFFBF5",
                  borderBottom: "1px solid #F0E4D3",
                }}
              >
                <Th>Email</Th>
                <Th>Country</Th>
                <Th>Subscribed</Th>
                <Th style={{ width: 100, textAlign: "end" }}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: "1px solid #F8F0E4" }}
                >
                  <Td>
                    <span style={{ fontWeight: 500 }}>{s.email}</span>
                  </Td>
                  <Td style={{ color: "#5A4F4A" }}>{s.country ?? "—"}</Td>
                  <Td style={{ color: "#7A6F69", whiteSpace: "nowrap" }}>
                    {formatDate(s.subscribedAt)}
                  </Td>
                  <Td style={{ textAlign: "end" }}>
                    <form action={deleteSubscriber} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        style={{
                          padding: "4px 10px",
                          background: "transparent",
                          color: "#B85959",
                          border: "1px solid #E5A0A0",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={{
        textAlign: "start",
        padding: "10px 16px",
        fontWeight: 600,
        fontSize: 12,
        color: "#5A4F4A",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: "12px 16px",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = diffMs / 1000 / 60;
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${Math.floor(diffMin)}m ago`;
  const diffHr = diffMin / 60;
  if (diffHr < 24) return `${Math.floor(diffHr)}h ago`;
  const diffDay = diffHr / 24;
  if (diffDay < 7) return `${Math.floor(diffDay)}d ago`;
  return date.toISOString().slice(0, 10);
}
