require("dotenv").config();

const DB_ID = "8572adf5-e57d-49a2-abe4-54505b449f46";

async function patch(payload, label) {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  console.log(label, "HTTP status:", res.status);

  if (!res.ok) {
    console.log(label, "PATCH failed:");
    console.log(JSON.stringify(json, null, 2));
    process.exit(1);
  }

  console.log(label, "✅ OK. Properties:", Object.keys(json.properties || {}).length);
}

async function run() {
  // PASS 1: base fields (NO formulas)
  await patch(
    {
      properties: {
        id_entity: { rich_text: {} },

        status: { select: { options: ["active","in_project","dormant","to_close"].map(name => ({ name })) } },
        strategic_role: { select: { options: ["core","production","holding","satellite"].map(name => ({ name })) } },
        business_model: { select: { options: ["renovation","carpentry","moe","mixed","holding"].map(name => ({ name })) } },

        ca_current_eur: { number: { format: "euro" } },
        margin_current_pct: { number: { format: "percent" } },
        fixed_costs_eur: { number: { format: "euro" } },
        cashflow_current_eur: { number: { format: "euro" } },
        margin_target_pct: { number: { format: "percent" } },
        cashflow_target_eur: { number: { format: "euro" } },

        dependency_florent: { select: { options: ["low","medium","high"].map(name => ({ name })) } },
        risk_level: { select: { options: ["low","medium","high"].map(name => ({ name })) } },
        horizon: { select: { options: ["short","mid","long"].map(name => ({ name })) } },
      },
    },
    "[PASS1]"
  );

  // PASS 2: formulas (typed to avoid Notion percent type tantrums)
  await patch(
    {
      properties: {
        margin_gap_pct: {
          formula: {
            expression:
              'toNumber(prop("margin_target_pct")) - toNumber(prop("margin_current_pct"))',
          },
        },
        lost_profit_eur: {
          formula: {
            expression:
              'toNumber(prop("ca_current_eur")) * (toNumber(prop("margin_target_pct")) - toNumber(prop("margin_current_pct")))',
          },
        },
      },
    },
    "[PASS2]"
  );
}

run().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
