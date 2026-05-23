import { notFound } from "next/navigation";
import { getMessages, setMessages } from "@/lib/admin-store";
import { FormHeader, DangerButton } from "../../_components";
import { deleteMessage } from "../actions";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Message detail view. Auto-marks as read on first view (friendlier than a
 * manual button). Provides Reply (mailto) and Delete actions.
 *
 * The auto-mark mutation happens inline (not via revalidatePath, which
 * Next.js disallows during render) — instead we mutate the KV store and rely
 * on the dashboard/sidebar to re-fetch on the next navigation.
 */
export default async function MessageDetailPage({ params }: Props) {
  const { id } = await params;
  const messages = await getMessages();
  const message = messages.find((m) => m.id === id);
  if (!message) notFound();

  // Auto-mark on view. Mutate directly — revalidatePath during render is a
  // Next.js error. The sidebar/dashboard are server components and will
  // re-fetch fresh data on the next nav, so the badge updates naturally.
  if (!message.read) {
    const updated = messages.map((m) =>
      m.id === id ? { ...m, read: true } : m
    );
    await setMessages(updated);
    message.read = true;
  }

  const deleteAction = async (): Promise<void> => {
    "use server";
    await deleteMessage(id);
  };

  const mailtoHref = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`;

  return (
    <div style={{ maxWidth: 720 }}>
      <FormHeader
        title={message.subject}
        backHref="/admin/messages"
        backLabel="Back to messages"
      />

      <div
        style={{
          background: "white",
          border: "1px solid #F0E4D3",
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 16,
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: "1px solid #F0E4D3",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>
              {message.name}
            </div>
            <a
              href={`mailto:${message.email}`}
              dir="ltr"
              style={{
                fontSize: 13,
                color: "#B85959",
                textDecoration: "none",
              }}
            >
              {message.email}
            </a>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#7A6F69",
              whiteSpace: "nowrap",
            }}
          >
            {formatFullDate(message.receivedAt)}
          </div>
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "#2A2A2A",
          }}
        >
          {message.body}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <a
          href={mailtoHref}
          style={{
            padding: "10px 20px",
            background: "#B85959",
            color: "white",
            border: 0,
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Reply via email
        </a>
        <form action={deleteAction}>
          <DangerButton>Delete</DangerButton>
        </form>
      </div>
    </div>
  );
}

function formatFullDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
