require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.THREAD_DUMP_DB_ID;

if (!NOTION_TOKEN || !DB_ID) {
  console.error("Missing NOTION_TOKEN or THREAD_DUMP_DB_ID");
  process.exit(1);
}

async function notion(path, method='GET', body) {
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
    properties: {
      extraction_json: { rich_text: {} },
      extraction_status: {
        select: { options: [{ name: 'pending' }, { name: 'done' }, { name: 'error' }] }
      },
      extraction_model: {
        select: { options: [{ name: 'gpt-4o-mini' }, { name: 'gpt-4.1' }] }
      },
      review_required: { checkbox: {} }
    }
  };

  const updated = await notion(`/databases/${DB_ID}`, 'PATCH', payload);
  console.log("PATCH OK:", updated.title?.[0]?.plain_text, "props=", Object.keys(updated.properties||{}).length);
}

main().catch(e => { console.error(e.message); process.exit(1); });
