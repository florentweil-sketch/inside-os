require("dotenv").config();
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Database IDs (from your output)
const DB = {
  entities: "8572adf5-e57d-49a2-abe4-54505b449f46",
  digital_assets: "6ea73372-9458-4ad3-a659-a5bb8ddc7aa8",
};

function rt(text) {
  return [{ type: "text", text: { content: String(text ?? "") } }];
}

async function createEntity({
  name,
  id_entity,
  status,
  strategic_role,
  business_model,
  ca,
  margin,
  fixed,
  cashflow,
  margin_target,
  cashflow_target,
  dependency,
  risk,
  horizon,
}) {
  return notion.pages.create({
    parent: { database_id: DB.entities },
    properties: {
      Name: { title: rt(name) },
      id_entity: { rich_text: rt(id_entity) },
      status: { select: { name: status } },
      strategic_role: { select: { name: strategic_role } },
      business_model: { select: { name: business_model } },
      ca_current_eur: { number: ca },
      margin_current_pct: { number: margin },
      fixed_costs_eur: { number: fixed },
      cashflow_current_eur: { number: cashflow },
      margin_target_pct: { number: margin_target },
      cashflow_target_eur: { number: cashflow_target },
      dependency_florent: { select: { name: dependency } },
      risk_level: { select: { name: risk } },
      horizon: { select: { name: horizon } },
    },
  });
}

function computeDependancePersonnelle({
  email_principal,
  admin_secondaire_configure,
  propriete_transferable,
}) {
  const email = String(email_principal || "").toLowerCase();
  const isPersonal =
    email.includes("@gmail.com") || email.includes("@yahoo.") || email.includes("@outlook.");
  const missingBackupAdmin = admin_secondaire_configure === false;
  const notTransferable = propriete_transferable === false;

  return isPersonal || missingBackupAdmin || notTransferable ? "high" : "low";
}

function computeRisqueStructurel({ criticality, dependance_personnelle }) {
  return criticality === "high" && dependance_personnelle === "high" ? "critical" : "ok";
}

async function createDigitalAsset({
  name,
  id_asset,
  asset_type,
  criticality,
  owner_legal,
  admin_primary,
  email_principal,
  admin_secondaire_configure,
  propriete_transferable,
  complexite_migration,
  hosting_provider,
  tech_stack,
  annual_cost_eur,
  tracking_leads_enabled,
  tracking_method,
}) {
  const dependance_personnelle = computeDependancePersonnelle({
    email_principal,
    admin_secondaire_configure,
    propriete_transferable,
  });
  const risque_structurel = computeRisqueStructurel({ criticality, dependance_personnelle });

  const props = {
    Name: { title: rt(name) },
    id_asset: { rich_text: rt(id_asset) },
    asset_type: { select: { name: asset_type } },
    criticality: { select: { name: criticality } },
    owner_legal: { select: { name: owner_legal } },
    admin_primary: { rich_text: rt(admin_primary) },
    email_principal: { rich_text: rt(email_principal) },
    admin_secondaire_configure: { checkbox: !!admin_secondaire_configure },
    propriete_transferable: { checkbox: !!propriete_transferable },
    complexite_migration: { select: { name: complexite_migration } },
    tracking_leads_enabled: { checkbox: !!tracking_leads_enabled },

    // champs calculés (select)
    dependance_personnelle: { select: { name: dependance_personnelle } },
    risque_structurel: { select: { name: risque_structurel } },
  };

  if (hosting_provider) props.hosting_provider = { rich_text: rt(hosting_provider) };
  if (tech_stack) props.tech_stack = { rich_text: rt(tech_stack) };
  if (typeof annual_cost_eur === "number") props.annual_cost_eur = { number: annual_cost_eur };
  if (tracking_method) props.tracking_method = { rich_text: rt(tracking_method) };

  return notion.pages.create({
    parent: { database_id: DB.digital_assets },
    properties: props,
  });
}

async function run() {
  console.log("Seeding ENTITIES…");

  const inside = await createEntity({
    name: "INSIDE SAS",
    id_entity: "INSIDE",
    status: "active",
    strategic_role: "core",
    business_model: "mixed",
    ca: 900000,
    margin: 0.10,
    fixed: 408000,
    cashflow: 0,
    margin_target: 0.20,
    cashflow_target: 0,
    dependency: "high",
    risk: "medium",
    horizon: "mid",
  });

  const atelier = await createEntity({
    name: "ATELIER DE LA COLOMBE",
    id_entity: "ATELIER",
    status: "in_project",
    strategic_role: "production",
    business_model: "carpentry",
    ca: 0,
    margin: 0,
    fixed: 0,
    cashflow: 0,
    margin_target: 0.20,
    cashflow_target: 0,
    dependency: "high",
    risk: "medium",
    horizon: "mid",
  });

  console.log("✅ Entities created:", inside.url, atelier.url);

  console.log("Seeding DIGITAL ASSETS…");

  const site = await createDigitalAsset({
    name: "Site web INSIDE",
    id_asset: "DA-001",
    asset_type: "website",
    criticality: "high",
    owner_legal: "entity",
    admin_primary: "Florent",
    email_principal: "florent.weil@gmail.com",
    admin_secondaire_configure: false,
    propriete_transferable: true,
    complexite_migration: "medium",
    hosting_provider: "Hostinger",
    tech_stack: "WordPress",
    annual_cost_eur: 0,
    tracking_leads_enabled: true,
    tracking_method: "Formulaire + email",
  });

  const insta = await createDigitalAsset({
    name: "Instagram INSIDE",
    id_asset: "DA-002",
    asset_type: "social_media",
    criticality: "medium",
    owner_legal: "entity",
    admin_primary: "Florent",
    email_principal: "florent.weil@gmail.com",
    admin_secondaire_configure: false,
    propriete_transferable: true,
    complexite_migration: "medium",
    annual_cost_eur: 0,
    tracking_leads_enabled: true,
    tracking_method: "DM / lien bio vers WhatsApp",
  });

  const fb = await createDigitalAsset({
    name: "Facebook Page INSIDE",
    id_asset: "DA-003",
    asset_type: "social_media",
    criticality: "low",
    owner_legal: "entity",
    admin_primary: "Florent",
    email_principal: "florent.weil@gmail.com",
    admin_secondaire_configure: false,
    propriete_transferable: true,
    complexite_migration: "low",
    annual_cost_eur: 0,
    tracking_leads_enabled: false,
    tracking_method: "",
  });

  console.log("✅ Digital assets created:", site.url, insta.url, fb.url);
  console.log("\nSeed terminé.");
}

run().catch((e) => {
  console.error("Erreur:", e?.body || e);
  process.exit(1);
});