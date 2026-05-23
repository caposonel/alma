import { signOut } from "@/auth";

/**
 * Logout page. Renders a tiny confirmation form that calls NextAuth's
 * `signOut` server action and bounces back to `/admin`.
 *
 * We do not auto-sign-out on visit so accidentally landing here from a stale
 * link or back button doesn't kick the user out.
 */
export default function AdminLogoutPage() {
  async function doLogout() {
    "use server";
    await signOut({ redirectTo: "/admin" });
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Sign out
      </h1>
      <p style={{ color: "#5A4F4A", marginBottom: 24 }}>
        End your admin session?
      </p>
      <form action={doLogout}>
        <button
          type="submit"
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
          Yes, sign out
        </button>
      </form>
    </div>
  );
}
