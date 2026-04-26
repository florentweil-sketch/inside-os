require("dotenv").config();
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const DB_ID = "8572adf5-e57d-49a2-abe4-54505b449f46";

async function run() {
  console.log("Patching schema: entities", DB_ID);

  await notion.databases.update({
    database_id: DB_ID,
    properties: {
      id_entity: { rich_text: {} },

      status: {
        select: { options: ["active", "in_project", "dormant", "to_close"].map((name) => ({ name })) },
      },
      strategic_role: {
        select: { options: ["core", "production", "holding", "satellite"].map((name) => ({ name })) },
      },
      business_model: {
        select: { options: ["renovation", "carpentry", "moe", "mixed", "holding"].map((name) => ({ name })) },
      },

      ca_current_eur: { number: { format: "euro" } },
      margin_current_pct: { number: { format: "percent" } },
      fixed_costs_eur: { number: { format: "euro" } },
      cashflow_current_eur: { number: { format: "euro" } },
      margin_target_pct: { number: { format: "percent" } },
      cashflow_target_eur: { number: { format: "euro" } },

      dependency_florent: {
        select: { options: ["low", "medium", "high"].map((name) => ({ name })) },
      },
      risk_level: { select: { options: ["low", "medium", "high"].map((name) => ({ name })) } },
      horizon: { select: { options: ["short", "mid", "long"].map((name) => ({ name })) } },

      // Formulas
      margin_gap_pct: {
        formula: { expression: 'prop("margin_target_pct") - prop("margin_current_pct")' },
      },
      lost_profit_eur: {
        formula: { expression: 'prop("ca_current_eur") * prop("margin_gap_pct")' },
      },
    },
  });

  console.log("✅ entities patched.");
}

run().catch((e) => {
  console.error("Erreur:", e?.body || e);
  process.exit(1);
});