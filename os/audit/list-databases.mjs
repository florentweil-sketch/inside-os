import "dotenv/config";

const NOTION_API_KEY = process.env.NOTION_API_KEY;

async function main() {

  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filter: {
        property: "object",
        value: "database"
      },
      page_size: 100
    })
  });

  const data = await res.json();

  for (const db of data.results) {
    const title = (db.title || []).map(t => t.plain_text).join("");
    console.log(title);
    console.log("ID:", db.id);
    console.log("------------------------------------------------");
  }

}

main();
