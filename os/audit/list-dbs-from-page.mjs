import "dotenv/config";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PAGE_ID = process.argv[2];

if (!NOTION_API_KEY) {
  console.error("ERROR: NOTION_API_KEY missing in .env");
  process.exit(1);
}

if (!PAGE_ID) {
  console.error("Usage: node os/audit/list-dbs-from-page.mjs <PAGE_ID>");
  process.exit(1);
}

async function notionGet(path) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2025-09-03"
    }
  });

  const txt = await res.text();
  let data;
  try {
    data = JSON.parse(txt);
  } catch {
    data = { raw: txt };
  }

  if (!res.ok) {
    console.error("HTTP ERROR:", res.status, JSON.stringify(data, null, 2));
    process.exit(1);
  }

  return data;
}

async function main() {
  const data = await notionGet(`/blocks/${PAGE_ID}/children?page_size=100`);

  if (!Array.isArray(data.results)) {
    console.error("Unexpected response:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  for (const block of data.results) {
    if (block.type === "child_database") {
      console.log(block.child_database.title);
      console.log("DB_ID:", block.id);
      console.log("----------------------------");
    } else if (block.type === "child_page") {
      console.log("[child_page]", block.id);
      console.log("----------------------------");
    }
  }
}

main().catch(err => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
