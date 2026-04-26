import fs from "fs";
import "dotenv/config";

const NOTION_API_KEY = process.env.NOTION_API_KEY;

const dbId = process.argv[2];
const outFile = process.argv[3];

async function main() {

  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2025-09-03"
    }
  });

  const data = await res.json();

  fs.mkdirSync("out/audit_full", { recursive: true });

  fs.writeFileSync(
    outFile,
    JSON.stringify(data, null, 2)
  );

  console.log("exported:", outFile);
}

main();
