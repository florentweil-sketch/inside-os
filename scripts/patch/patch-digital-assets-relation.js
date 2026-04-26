require("dotenv").config();

const DB_DIGITAL = "6ea73372-9458-4ad3-a659-a5bb8ddc7aa8";
const DB_ENTITIES = "8572adf5-e57d-49a2-abe4-54505b449f46";

async function run() {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB_DIGITAL}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        entity: {
          relation: {
            database_id: DB_ENTITIES,
            type: "single_property",
            single_property: {},
          },
        },
      },
    }),
  });

  const json = await res.json();
  console.log("HTTP:", res.status);
  console.log(JSON.stringify(json, null, 2));
}

run();