import 'dotenv/config';

const NOTION_TOKEN = process.env.NOTION_TOKEN;

if (!NOTION_TOKEN) {
  console.error("ERROR: NOTION_TOKEN missing in .env");
  process.exit(1);
}

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
  const dbId = process.argv[2];
  if (!dbId) throw new Error('Usage: node scripts/inspect-db-http.js <db_id>');

  const db = await notion(`/databases/${dbId}`, 'GET');
  const props = db.properties || {};

  console.log(`DB title: ${(db.title?.[0]?.plain_text) ?? '(no title)'}`);
  console.log(`DB id: ${db.id}`);
  console.log('Properties:');

  for (const [name, def] of Object.entries(props)) {
    console.log(`- ${name}: ${def.type}`);
    if (def.type === 'relation') {
      console.log(`  -> relation database_id: ${def.relation?.database_id ?? '(unknown)'}`);
    }
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
