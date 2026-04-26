require('dotenv').config();
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_PROJECTS = '1eec3cd0-add0-4611-8efa-82329760813d';
const DB_ENTITIES = '8572adf5-e57d-49a2-abe4-54505b449f46';

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

async function findEntityById(idEntity) {
  const res = await notion(`/databases/${DB_ENTITIES}/query`, 'POST', {
    filter: {
      property: 'id_entity',
      rich_text: { equals: idEntity }
    }
  });
  return res.results[0] || null;
}

async function findProjectById(idChantier) {
  const res = await notion(`/databases/${DB_PROJECTS}/query`, 'POST', {
    filter: {
      property: 'id_chantier',
      rich_text: { equals: idChantier }
    }
  });
  return res.results[0] || null;
}

function buildProperties(row, entityPageId) {
  return {
    Name: {
      title: [{ text: { content: row.name } }]
    },
    id_chantier: {
      rich_text: [{ text: { content: row.id_chantier } }]
    },
    entity: {
      relation: [{ id: entityPageId }]
    },
    status: {
      select: { name: row.status }
    },
    priority: {
      select: { name: row.priority }
    },
    ca_devis_eur: {
      number: row.ca_devis_eur ? Number(row.ca_devis_eur) : null
    },
    start_date: row.start_date
      ? { date: { start: row.start_date } }
      : { date: null },
    end_date: row.end_date
      ? { date: { start: row.end_date } }
      : { date: null }
  };
}

async function main() {
  const csv = fs.readFileSync('data/projects_chantiers.csv', 'utf8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });

  let created = 0;
  let updated = 0;

  for (const row of records) {
    const entity = await findEntityById(row.id_entity);
    if (!entity) {
      console.error(`Entity not found: ${row.id_entity}`);
      continue;
    }

    const existing = await findProjectById(row.id_chantier);
    const properties = buildProperties(row, entity.id);

    if (!existing) {
      await notion('/pages', 'POST', {
        parent: { database_id: DB_PROJECTS },
        properties
      });
      console.log(`Created ${row.id_chantier}`);
      created++;
    } else {
      await notion(`/pages/${existing.id}`, 'PATCH', {
        properties
      });
      console.log(`Updated ${row.id_chantier}`);
      updated++;
    }
  }

  console.log('---');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
