/**
 * Hash an admin password for the /admin panel.
 *
 * Usage (either form works — both avoid the Windows cmd paste issue):
 *   npm run admin:password -- MyPassword123
 *   ADMIN_PW="MyPassword123" npm run admin:password
 *
 * If neither is provided, falls back to an interactive prompt (which can be
 * flaky on Windows classic cmd because Node's readline doesn't always accept
 * paste). Prefer the CLI-arg or env-var form on Windows.
 */
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import readline from "node:readline/promises";

async function getPassword(): Promise<string> {
  const argv = process.argv.slice(2);
  if (argv.length > 0 && argv[0].trim()) return argv[0].trim();
  if (process.env.ADMIN_PW) return process.env.ADMIN_PW.trim();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const pw = await rl.question("Enter admin password: ");
  rl.close();
  return pw.trim();
}

async function main() {
  const password = await getPassword();
  if (!password) {
    console.error("\n❌ Empty password. Aborting.\n");
    console.error("   Try: npm run admin:password -- YourPassword\n");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("\n❌ Password must be at least 8 characters.\n");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const hashB64 = Buffer.from(hash, "utf8").toString("base64");
  const secret = randomBytes(32).toString("hex");

  console.log("\nPaste these into .env.local:\n");
  console.log(`ADMIN_USERNAME=alma`);
  // Use the base64-encoded variant — Next.js's env loader runs dotenv-expand
  // on values and the `$2b`/`$10` segments of an unencoded bcrypt hash get
  // silently eaten as undefined `$VAR` references (even single-quoting the
  // value doesn't help — Next strips the quotes as delimiters before
  // expanding). Base64 has no `$` so it survives the loader intact, and
  // `auth.ts` decodes it back at runtime.
  console.log(`ADMIN_PASSWORD_HASH_B64=${hashB64}`);
  console.log(`AUTH_SECRET=${secret}`);
  console.log(`NEXTAUTH_URL=http://localhost:3000\n`);
  console.log("Decoded hash (for reference, do NOT put this in .env.local):");
  console.log(`  ${hash}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
