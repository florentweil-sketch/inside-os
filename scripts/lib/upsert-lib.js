require("dotenv").config();
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

function rt(text) {
  return [{ type: "text", text: { content: String(text ?? "") } }];
}

async function dbQueryHTTP({ database_id, filter }) {
  const res = await fetch(`https://api.notion.com/v1/databases/${database_id}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      page_size: 1,
      filter,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json?.message || "Query failed";
    throw new Error(`Notion DB query failed (${res.status}): ${msg}`);
  }
  return json;
}

async function findByRichTextEquals({ database_id, property, value }) {
  const filter = {
    property,
    rich_text: { equals: String(value ?? "") },
  };

  const json = await dbQueryHTTP({ database_id, filter });
  return json.results?.[0] || null;
}

async function upsertByRichTextKey({ database_id, key_property, key_value, createProps, updateProps }) {
  const existing = await findByRichTextEquals({
    database_id,
    property: key_property,
    value: key_value,
  });

  if (!existing) {
    const created = await notion.pages.create({
      parent: { database_id },
      properties: createProps,
    });
    return { action: "created", page: created };
  }

  const updated = await notion.pages.update({
    page_id: existing.id,
    properties: updateProps,
  });
  return { action: "updated", page: updated };
}

module.exports = { notion, rt, upsertByRichTextKey };