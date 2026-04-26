// os/lib/uid.mjs
import crypto from "crypto";

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function makeUid({ type, dumpId, title, owner }) {
  const base = `${type}|${norm(dumpId)}|${norm(title)}|${norm(owner)}`;
  const h = crypto.createHash("sha1").update(base).digest("hex").slice(0, 16);
  return `${type}:${h}`;
}
