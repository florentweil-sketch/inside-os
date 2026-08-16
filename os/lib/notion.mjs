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

const RETRY_STATUSES = new Set([502, 503, 504]);
const RETRY_DELAYS = [1000, 5000, 30000];

async function notionFetch(path, { method = "GET", body, token } = {}) {
  let attempt = 0;
  while (true) {
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
      if (RETRY_STATUSES.has(res.status) && attempt < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[attempt++];
        console.warn(`  [notion] ${res.status} — retry ${attempt}/${RETRY_DELAYS.length} dans ${delay / 1000}s…`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      const msg = typeof json === "object" ? JSON.stringify(json) : String(txt);
      throw new Error(`Notion ${res.status}: ${msg}`);
    }

    return json;
  }
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

// Page (non-database) helpers — pages living under a plain parent page, not
// a data source. Used by os/scripts/docs-sync.mjs for the doctrine mirror.

export async function createChildPage(parentPageId, titleText, children = []) {
  return notionFetch(`/pages`, {
    method: "POST",
    body: {
      parent: { page_id: parentPageId },
      properties: {
        title: { title: [{ text: { content: String(titleText).slice(0, 2000) } }] },
      },
      children: children.slice(0, 100),
    },
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

export async function appendBlockChildren(blockId, children) {
  return notionFetch(`/blocks/${blockId}/children`, {
    method: "PATCH",
    body: { children },
  });
}

// Batches children in groups of <=100 (Notion API limit per request).
export async function appendBlockChildrenBatched(blockId, children) {
  for (let i = 0; i < children.length; i += 100) {
    await appendBlockChildren(blockId, children.slice(i, i + 100));
  }
}

export async function deleteBlock(blockId) {
  return notionFetch(`/blocks/${blockId}`, { method: "DELETE" });
}

// Archive (delete) every direct child block of a page/block — used to clear
// a mirror page's content before re-writing it fresh (no duplication across
// runs). Fail-loud: a failed delete throws and stops the run.
export async function clearBlockChildren(blockId) {
  const children = await listAllBlockChildren(blockId);
  for (const child of children) {
    await deleteBlock(child.id);
  }
  return children.length;
}

// Trouve une sous-page par titre exact parmi les enfants directs de parentPageId.
// Retourne l'ID de la page (== l'ID du bloc child_page) ou null si absente.
export async function findChildPageByTitle(parentPageId, titleText) {
  const children = await listAllBlockChildren(parentPageId);
  const match = children.find(
    (b) => b.type === "child_page" && b.child_page?.title === titleText
  );
  return match ? match.id : null;
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