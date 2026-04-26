require("dotenv").config();

const DB_ID = process.argv[2];
if (!DB_ID) {
  console.log("Usage: node inspect-db-http.js <database_id>");
  process.exit(1);
}

async function run() {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
    },
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("GET failed:", json);
    process.exit(1);
  }

  const title = json.title?.[0]?.plain_text || "(no title)";
  const props = json.properties || {};
  console.log("\nDB TITLE:", title);
  console.log("DB ID:", json.id);
  console.log("\nPROPERTIES (" + Object.keys(props).length + "):");
  for (const [name, p] of Object.entries(props)) {
    console.log(`- ${name} [type=${p.type}]`);
  }
}

run().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
