import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";

/**
 * Admin login page.
 *
 * If a session already exists, redirect straight to the dashboard. Otherwise
 * render the username/password form. The form posts to a server action that
 * calls NextAuth's `signIn` with the Credentials provider, then redirects to
 * the dashboard on success.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/admin/dashboard");
  }

  const params = (await searchParams) ?? {};
  const error = params.error;

  async function loginAction(formData: FormData) {
    "use server";
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await signIn("credentials", {
        username,
        password,
        redirectTo: "/admin/dashboard",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        // CredentialsSignin → bad password / user. Bounce back with ?error.
        redirect("/admin?error=CredentialsSignin");
      }
      // Anything else (a NEXT_REDIRECT, etc.) rethrow.
      throw err;
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "white",
          padding: 32,
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          border: "1px solid #F0E4D3",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 4,
            color: "#2A2A2A",
          }}
        >
          Alma Gov — Admin
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#5A4F4A",
            marginBottom: 24,
          }}
        >
          Sign in to edit the site.
        </p>

        {error === "CredentialsSignin" && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              background: "#FDF2F2",
              border: "1px solid #E5A0A0",
              borderRadius: 4,
              color: "#B85959",
              fontSize: 13,
            }}
          >
            Wrong username or password.
          </div>
        )}

        <form action={loginAction}>
          <Field label="Username" name="username" type="text" defaultValue="alma" />
          <Field label="Password" name="password" type="password" />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px 16px",
              marginTop: 8,
              background: "#B85959",
              color: "white",
              border: 0,
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue?: string;
}) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 500,
          marginBottom: 4,
          color: "#5A4F4A",
        }}
      >
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #E5D7C8",
          borderRadius: 4,
          fontSize: 14,
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}
