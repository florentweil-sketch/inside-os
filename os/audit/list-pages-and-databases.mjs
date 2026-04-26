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
      page_size: 100
    })
  });

  const data = await res.json();

  for (const item of data.results) {
    const objectType = item.object;

    let title = "";

    if (objectType === "database") {
      title = (item.title || []).map(t => t.plain_text).join("");
    } else if (objectType === "page") {
      const props = item.properties || {};
      const titleProp = Object.values(props).find(p => p.type === "title");
      title = titleProp?.title?.map(t => t.plain_text).join("") || "(untitled page)";
    }

    console.log("TYPE :", objectType);
    console.log("TITLE:", title);
    console.log("ID   :", item.id);
    console.log("URL  :", item.url);
    console.log("------------------------------------------------");
  }
}

main().catch(err => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
