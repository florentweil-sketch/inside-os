require("dotenv").config();

const DB_ID = "6ea73372-9458-4ad3-a659-a5bb8ddc7aa8";

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
  await patch(
    {
      properties: {
        id_asset: { rich_text: {} },

        asset_type: {
          select: {
            options: [
              "website",
              "social_media",
              "domain",
              "hosting",
              "ads_account",
              "analytics",
              "pixel",
              "whatsapp_business",
              "other",
            ].map((name) => ({ name })),
          },
        },
        criticality: { select: { options: ["low", "medium", "high"].map((name) => ({ name })) } },

        owner_legal: { select: { options: ["entity", "florent", "other"].map((name) => ({ name })) } },
        admin_primary: { rich_text: {} },

        email_principal: { rich_text: {} },
        admin_secondaire_configure: { checkbox: {} },
        propriete_transferable: { checkbox: {} },
        complexite_migration: { select: { options: ["low", "medium", "high"].map((name) => ({ name })) } },

        hosting_provider: { rich_text: {} },
        tech_stack: { rich_text: {} },
        annual_cost_eur: { number: { format: "euro" } },
        renewal_date: { date: {} },
        backups_active: { checkbox: {} },

        tracking_leads_enabled: { checkbox: {} },
        tracking_method: { rich_text: {} },
        leads_monthly: { number: { format: "number" } },
        performance_note: { rich_text: {} },

        // À la place des formules (trop instables via API)
        dependance_personnelle: { select: { options: ["low", "medium", "high"].map((name) => ({ name })) } },
        risque_structurel: { select: { options: ["ok", "critical"].map((name) => ({ name })) } },
      },
    },
    "[PATCH]"
  );
}

run().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
