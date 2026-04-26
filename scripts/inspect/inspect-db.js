require("dotenv").config();
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const DB_ID = process.argv[2];

if (!DB_ID) {
  console.log("Usage: node inspect-db.js <database_id>");
  process.exit(1);
}

async function run() {
  const db = await notion.databases.retrieve({ database_id: DB_ID });

  console.log("\nDB TITLE:", db.title?.[0]?.plain_text || "(no title)");
  console.log("DB ID:", db.id);

  const props = db.properties || {};
  console.log("\nPROPERTIES (" + Object.keys(props).length + "):");
  for (const [name, p] of Object.entries(props)) {
    console.log(`- ${name}  [type=${p.type}]`);
  }
}

run().catch((e) => {
  console.error("Erreur:", e?.body || e);
  process.exit(1);
});