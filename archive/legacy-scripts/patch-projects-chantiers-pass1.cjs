require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;

const DB_PROJECTS_CHANTIERS = '1eec3cd0-add0-4611-8efa-82329760813d';
const DB_ENTITIES = '8572adf5-e57d-49a2-abe4-54505b449f46';

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
  const payload = {
    properties: {
      id_chantier: { rich_text: {} },

      entity: {
        relation: {
          database_id: DB_ENTITIES,
          single_property: {}
        }
      },

      status: {
        select: {
          options: [
            { name: "à préparer" },
            { name: "en cours" },
            { name: "en attente" },
            { name: "en pause" },
            { name: "SAV" },
            { name: "terminé" }
          ]
        }
      },

      priority: {
        select: {
          options: [
            { name: "haute" },
            { name: "normale" },
            { name: "basse" }
          ]
        }
      },

      ca_devis_eur: { number: { format: "euro" } },

      start_date: { date: {} },
      end_date: { date: {} }
    }
  };

  const updated = await notion(`/databases/${DB_PROJECTS_CHANTIERS}`, 'PATCH', payload);

  console.log("PATCH OK");
  console.log(`DB: ${(updated.title && updated.title[0] && updated.title[0].plain_text) ? updated.title[0].plain_text : '(no title)'}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
