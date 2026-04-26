// scripts/patch-add-audit-props.mjs
import "dotenv/config";

const NOTION_TOKEN = process.env.NOTION_TOKEN;

if (!NOTION_TOKEN) {
  console.error("ERROR: NOTION_TOKEN missing");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");

// Mets ici les variables d'env qui contiennent des IDs de databases
// (ajoute/enlève selon ton OS)
const DB_ENV_KEYS = [
  "THREAD_DUMP_DB_ID",
  "DECISIONS_DB_ID",
  "LESSONS_DB_ID",
  "DATA_CEMETERY_DB_ID",
  // ajoute d’autres DBs ici si tu en as
];

function normId(id) {
  // accepte ID avec ou sans tirets
  return (id || "").trim().replace(/-/g, "");
}

async function notion(path, method = "GET", body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${text}`);
  return JSON.parse(text);
}

function auditPropsPayload() {
  return {
    properties: {
      created_time: { created_time: {} },
      created_by: { created_by: {} },
      last_edited_time: { last_edited_time: {} },
      last_edited_by: { last_edited_by: {} },
    },
  };
}

async function ensureAuditProps(dbId) {
  // 1) get schema
  const db = await notion(`/databases/${dbId}`, "GET");
  const existing = db.properties || {};

  // 2) build patch only for missing props (idempotent)
  const wanted = auditPropsPayload().properties;
  const toAdd = {};
  for (const [name, def] of Object.entries(wanted)) {
    if (!existing[name]) toAdd[name] = def;
  }

  if (Object.keys(toAdd).length === 0) {
    console.log("  ↳ OK (déjà présent)");
    return;
  }

  const payload = { properties: toAdd };

  console.log("  ↳ Ajout:", Object.keys(toAdd).join(", "));
  if (DRY_RUN) {
    console.log("  ↳ DRY_RUN (pas de PATCH)");
    return;
  }

  await notion(`/databases/${dbId}`, "PATCH", payload);
  console.log("  ↳ PATCH OK");
}

async function main() {
  const ids = DB_ENV_KEYS
    .map((k) => [k, normId(process.env[k])])
    .filter(([_, v]) => v);

  if (!ids.length) {
    console.error("ERROR: aucun DB id trouvé dans .env (DB_ENV_KEYS vide ou variables absentes)");
    process.exit(1);
  }

  console.log(`Mode: ${DRY_RUN ? "DRY_RUN" : "LIVE"}`);
  for (const [key, id] of ids) {
    console.log(`\n== ${key} ==`);
    console.log(`db_id: ${id}`);
    try {
      await ensureAuditProps(id);
    } catch (e) {
      console.error("  ↳ ERROR:", e.message);
    }
  }

  console.log("\n✅ DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
