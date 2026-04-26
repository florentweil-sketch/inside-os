import "dotenv/config";
import { Client } from "@notionhq/client";

if (!process.env.NOTION_API_KEY) {
  throw new Error("Missing env var: NOTION_API_KEY");
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const REQUIRED = {
  THREAD_DUMP_DS_ID: [
    "id_dump",
    "raw_text",
    "extraction_status",
    "extraction_json",
  ],
  DECISIONS_DS_ID: [
    "uid",
    "decision",
    "decision_status",
    "source_thread",
  ],
  LESSONS_DS_ID: [
    "uid",
    "lesson",
    "source_thread",
  ],
};

async function getDataSourceOrFail(envKey) {
  const id = process.env[envKey];
  if (!id) {
    throw new Error(`Missing env var: ${envKey}`);
  }

  try {
    const ds = await notion.dataSources.retrieve({ data_source_id: id });
    return { id, ds };
  } catch (err) {
    throw new Error(`${envKey} invalid as data_source_id: ${err.message}`);
  }
}

function getPropertyMap(dataSource) {
  return dataSource.properties || {};
}

function assertProperties(envKey, propertyMap, requiredProps) {
  const missing = requiredProps.filter((name) => !propertyMap[name]);
  if (missing.length) {
    throw new Error(`${envKey} missing properties: ${missing.join(", ")}`);
  }
}

async function main() {
  for (const [envKey, requiredProps] of Object.entries(REQUIRED)) {
    const { id, ds } = await getDataSourceOrFail(envKey);
    const propertyMap = getPropertyMap(ds);

    console.log(`OK data source: ${envKey} -> ${id}`);
    assertProperties(envKey, propertyMap, requiredProps);
    console.log(`OK properties: ${requiredProps.join(", ")}`);
  }

  console.log("validate-schema: OK");
}

main().catch((err) => {
  console.error("validate-schema: FAIL");
  console.error(err.message);
  process.exit(1);
});