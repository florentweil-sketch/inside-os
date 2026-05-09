// os/lib/claude.mjs
import "dotenv/config";

const API = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const RETRY_STATUSES = new Set([500, 529]);
const RETRY_DELAYS = [1000, 5000, 30000];

export function getApiKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ENV missing: ANTHROPIC_API_KEY");
  return key;
}

export async function claudeFetch({ model, max_tokens, messages, apiKey }) {
  const key = apiKey || getApiKey();
  let attempt = 0;

  while (true) {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (RETRY_STATUSES.has(res.status) && attempt < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[attempt++];
        console.warn(`  [claude] ${res.status} — retry ${attempt}/${RETRY_DELAYS.length} dans ${delay / 1000}s… (${body.slice(0, 120)})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw new Error(`Claude API ${res.status}: ${body}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text?.trim() || "";
  }
}
