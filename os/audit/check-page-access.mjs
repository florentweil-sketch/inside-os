import "dotenv/config";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PAGE_ID = process.argv[2];

if (!NOTION_API_KEY || !PAGE_ID) {
  console.error("Usage: node os/audit/check-page-access.mjs <PAGE_ID>");
  process.exit(1);
}

async function main() {
  const res = await fetch(`https://api.notion.com/v1/pages/${PAGE_ID}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2025-09-03"
    }
  });

  const txt = await res.text();
  console.log(txt);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
