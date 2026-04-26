import "dotenv/config";

const NOTION_API_KEY = process.env.NOTION_API_KEY;

async function fetchPage(start_cursor) {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filter: { property: "object", value: "database" },
      page_size: 100,
      ...(start_cursor ? { start_cursor } : {})
    })
  });
  return await res.json();
}

async function main() {
  let cursor = undefined;

  for (;;) {
    const data = await fetchPage(cursor);

    for (const db of data.results || []) {
      const title = (db.title || []).map(t => t.plain_text).join("");
      console.log(title);
      console.log("ID:", db.id);
      console.log("------------------------------------------------");
    }

    if (!data.has_more) break;
    cursor = data.next_cursor;
  }
}

main().catch(err => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
