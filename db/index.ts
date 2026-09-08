import { env } from "cloudflare:workers";
export function getDatabase() {
  if (!env.DB) throw new Error("Waitlist database unavailable");
  return env.DB;
}
