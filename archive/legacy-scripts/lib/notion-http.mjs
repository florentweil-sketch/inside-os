// scripts/lib/notion-http.mjs
import crypto from "crypto";

const NOTION_VERSION = "2025-09-03";
const BASE_URL = "https://api.notion.com/v1";

const dataSourceCache = new Map();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function sha16(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

export function normalizeText(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”"']/g, "")
    .replace(/[^\p{L}\p{N}\s\-.,;:!?]/gu, "");
}

export function makeUid({ type, title, owner, dumpId, dateStart, dateEnd }) {
  const window = (dateStart || dateEnd)
    ? `${dateStart || ""}-${dateEnd || ""}`
    : (dumpId || "");
  const key = `${type}|${normalizeText(title)}|${normalizeText(owner)}|${window}`;
  return `${type}:${sha16(key)}`;
}

export async function notionFetch(path, { method = "GET", body = null, token } = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
      const wait = 400 * Math.pow(2, attempt);
      await sleep(wait);
      continue;
    }

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      const msg = json?.message || json?.raw || `HTTP ${res.status}`;
      throw new Error(`Notion API error: ${msg}`);
    }

    return json;
  }

  throw new Error("Notion API error: retries exhausted");
}

async function resolveDataSourceId({ token, identifier }) {
  if (!identifier) {
    throw new Error("resolveDataSourceId: identifier manquant");
  }

  if (dataSourceCache.has(identifier)) {
    return dataSourceCache.get(identifier);
  }

  // 1) Essayer directement comme data_source_id
  try {
    const ds = await notionFetch(`/data_sources/${identifier}`, { token });
    const resolved = ds.id;
    dataSourceCache.set(identifier, resolved);
    return resolved;
  } catch {
    // continue
  }

  // 2) Sinon considérer que c'est un database_id
  const db = await notionFetch(`/databases/${identifier}`, { token });

  const ids = Array.isArray(db.data_sources)
    ? db.data_sources.map(ds => ds.id).filter(Boolean)
    : [];

  if (!ids.length) {
    throw new Error(`Aucune data source trouvée pour database ${identifier}`);
  }

  // Convention pratique :
  // on prend la première data source, qui est ta canonique ds1 dans tes bases utiles.
  const resolved = ids[0];
  dataSourceCache.set(identifier, resolved);
  return resolved;
}

export async function queryDatabase({
  token,
  databaseId,
  filter,
  sorts,
  pageSize = 10,
  startCursor,
} = {}) {
  const dataSourceId = await resolveDataSourceId({ token, identifier: databaseId });

  return notionFetch(`/data_sources/${dataSourceId}/query`, {
    token,
    method: "POST",
    body: {
      page_size: pageSize,
      start_cursor: startCursor,
      filter,
      sorts,
    },
  });
}

export async function createPage({ token, databaseId, properties } = {}) {
  const dataSourceId = await resolveDataSourceId({ token, identifier: databaseId });

  return notionFetch(`/pages`, {
    token,
    method: "POST",
    body: {
      parent: { data_source_id: dataSourceId },
      properties,
    },
  });
}

export async function updatePage({ token, pageId, properties } = {}) {
  return notionFetch(`/pages/${pageId}`, {
    token,
    method: "PATCH",
    body: { properties },
  });
}

export async function getResolvedDataSourceId({ token, identifier } = {}) {
  return resolveDataSourceId({ token, identifier });
}
