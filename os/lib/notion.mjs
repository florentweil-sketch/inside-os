// os/lib/notion.mjs
import "dotenv/config";

const NOTION_VERSION = "2025-09-03";
const API = "https://api.notion.com/v1";

function mustEnv(...names) {
  for (const name of names) {
    const v = process.env[name];
    if (v) return v;
  }
  throw new Error(`ENV missing: ${names.join(" or ")}`);
}

export function getToken() {
  return mustEnv("NOTION_API_KEY");
}

async function notionFetch(path, { method = "GET", body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${token || getToken()}`,
      "Notion-Version": NOTION_VERSION,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const txt = await res.text();
  let json;
  try {
    json = txt ? JSON.parse(txt) : {};
  } catch {
    json = { raw: txt };
  }

  if (!res.ok) {
    const msg = typeof json === "object" ? JSON.stringify(json) : String(txt);
    throw new Error(`Notion ${res.status}: ${msg}`);
  }

  return json;
}

// Data source helpers (DS_ID = data_source_id Notion)

export async function getDataSource(dataSourceId) {
  return notionFetch(`/data_sources/${dataSourceId}`, { method: "GET" });
}

export async function queryDataSource(dataSourceId, payload) {
  return notionFetch(`/data_sources/${dataSourceId}/query`, {
    method: "POST",
    body: payload,
  });
}

// Page helpers

export async function createPage(dataSourceId, properties) {
  return notionFetch(`/pages`, {
    method: "POST",
    body: {
      parent: { data_source_id: dataSourceId },
      properties,
    },
  });
}

export async function updatePage(pageId, properties) {
  return notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: { properties },
  });
}

// Blocks helpers

export async function listBlockChildren(blockId, startCursor) {
  const qs = new URLSearchParams();
  if (startCursor) qs.set("start_cursor", startCursor);
  qs.set("page_size", "100");

  return notionFetch(`/blocks/${blockId}/children?` + qs.toString(), {
    method: "GET",
  });
}

export async function listAllBlockChildren(blockId) {
  let cursor = undefined;
  const all = [];

  while (true) {
    const r = await listBlockChildren(blockId, cursor);
    all.push(...(r.results || []));
    if (!r.has_more) break;
    cursor = r.next_cursor;
  }

  return all;
}

// Property helpers

export function rt(content = "") {
  return {
    rich_text: [
      {
        text: {
          content: String(content).slice(0, 2000),
        },
      },
    ],
  };
}

export function title(content = "") {
  return {
    title: [
      {
        text: {
          content: String(content).slice(0, 2000),
        },
      },
    ],
  };
}

export function getPropText(page, propName) {
  const p = page.properties?.[propName];
  if (!p) return "";

  if (p.type === "rich_text") {
    return (p.rich_text || []).map((t) => t.plain_text).join("");
  }

  if (p.type === "title") {
    return (p.title || []).map((t) => t.plain_text).join("");
  }

  if (p.type === "select") {
    return p.select?.name || "";
  }

  return "";
}