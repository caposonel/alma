import Link from "next/link";
import { getMessages } from "@/lib/admin-store";
import { EmptyState } from "../_components";
import { markAllRead } from "./actions";

/**
 * Inbox list view — server component. Messages are stored newest-first in KV,
 * so we render them in the order returned.
 */
export default async function AdminMessagesPage() {
  const messages = await getMessages();
  const unreadCount = messages.filter((m) => !m.read).length;

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
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Messages</h1>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                background: "#B85959",
                color: "white",
                padding: "2px 10px",
                borderRadius: 999,
              }}
            >
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button
              type="submit"
              style={{
                padding: "8px 14px",
                background: "transparent",
                color: "#5A4F4A",
                border: "1px solid #E5D7C8",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Mark all read
            </button>
          </form>
        )}
      </header>

      {messages.length === 0 ? (
        <EmptyState message="No messages yet. When someone submits the contact form, it'll show up here." />
      ) : (
        <div>
          {messages.map((m) => (
            <Link
              key={m.id}
              href={`/admin/messages/${m.id}`}
              style={{
                display: "block",
                padding: "14px 16px",
                background: m.read ? "white" : "#FFFBF5",
                border: `1px solid ${m.read ? "#F0E4D3" : "#E8D5C0"}`,
                borderRadius: 4,
                textDecoration: "none",
                color: "inherit",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  {!m.read && (
                    <span
                      aria-label="unread"
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "#B85959",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontWeight: m.read ? 500 : 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.name}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#7A6F69",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    &lt;{m.email}&gt;
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "#7A6F69",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {formatDate(m.receivedAt)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#2A2A2A",
                  fontWeight: m.read ? 400 : 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {m.subject}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#5A4F4A",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {m.body}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
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

