require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
if (!NOTION_TOKEN) { console.error("ERROR: NOTION_TOKEN missing in .env"); process.exit(1); }

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

const DBS = [
  { key: 'entities', id: '8572adf5-e57d-49a2-abe4-54505b449f46' },
  { key: 'projects_chantiers', id: '1eec3cd0-add0-4611-8efa-82329760813d' },
  { key: 'projects_strategic', id: '6ed8559d-6358-4450-b97e-6c940a96782a' },
  { key: 'decisions_structural', id: '1054c068-9b91-4215-af70-4c1a3945a83a' },
  { key: 'capital_performance', id: 'd28b5770-ba14-4d77-9171-060a303cc69a' },
  { key: 'admin_architecture', id: '56ecc31c-ba79-4f38-97d2-b5b05ad5bdae' },
  { key: 'lessons_learnings', id: 'dabb137f-28b1-4e59-9290-03a21a7694de' },
  { key: 'digital_assets', id: '6ea73372-9458-4ad3-a659-a5bb8ddc7aa8' },
];

async function main() {
  for (const db of DBS) {
    const d = await notion(`/databases/${db.id}`, 'GET');
    const title = d.title?.[0]?.plain_text ?? '(no title)';
    const propCount = d.properties ? Object.keys(d.properties).length : 0;
    console.log(`${db.key} | ${title} | props=${propCount} | id=${d.id}`);
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
