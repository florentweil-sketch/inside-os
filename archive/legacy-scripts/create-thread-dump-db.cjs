require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ROOT_PAGE_ID = process.env.ROOT_PAGE_ID;

if (!NOTION_TOKEN) { console.error("ERROR: NOTION_TOKEN missing in .env"); process.exit(1); }
if (!ROOT_PAGE_ID) { console.error("ERROR: ROOT_PAGE_ID missing in .env"); process.exit(1); }

async function notion(path, method = 'GET', body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function main() {
  const payload = {
    parent: { type: "page_id", page_id: ROOT_PAGE_ID },
    title: [{ type: "text", text: { content: "thread_dump" } }],
    properties: {
      Name: { title: {} },
      id_dump: { rich_text: {} },
      source: { select: { options: [{name:'ChatGPT'},{name:'Email'},{name:'WhatsApp'},{name:'Notes'}] } },
      scope: { select: { options: [{name:'F&A Capital'},{name:'INSIDE OS'},{name:'Chantiers'},{name:'n8n'},{name:'Notion'},{name:'Legal/Finance'},{name:'Perso'}] } },
      status: { select: { options: [{name:'raw'},{name:'triage'},{name:'extracted'},{name:'archived'}] } },
      date_range_start: { date: {} },
      date_range_end: { date: {} },
      tags: { multi_select: { options: [] } },
      summary: { rich_text: {} },
      confidence: { select: { options: [{name:'high'},{name:'medium'},{name:'low'}] } }
    }
  };

  const db = await notion('/databases', 'POST', payload);
  console.log("DB created:");
  console.log(`thread_dump | id=${db.id} | url=${db.url}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
