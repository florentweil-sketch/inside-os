require("dotenv").config();
const { rt, upsertByRichTextKey } = require("./upsert-lib");

const DB = {
  entities: "8572adf5-e57d-49a2-abe4-54505b449f46",
  digital_assets: "6ea73372-9458-4ad3-a659-a5bb8ddc7aa8",
};

function computeDependancePersonnelle({ email_principal, admin_secondaire_configure, propriete_transferable }) {
  const email = String(email_principal || "").toLowerCase();
  const isPersonal = email.includes("@gmail.com") || email.includes("@yahoo.") || email.includes("@outlook.");
  const missingBackupAdmin = admin_secondaire_configure === false;
  const notTransferable = propriete_transferable === false;
  return isPersonal || missingBackupAdmin || notTransferable ? "high" : "low";
}

function computeRisqueStructurel({ criticality, dependance_personnelle }) {
  return criticality === "high" && dependance_personnelle === "high" ? "critical" : "ok";
}

async function upsertEntityINSIDE() {
  return upsertByRichTextKey({
    database_id: DB.entities,
    key_property: "id_entity",
    key_value: "INSIDE",
    createProps: {
      Name: { title: rt("INSIDE SAS") },
      id_entity: { rich_text: rt("INSIDE") },
      status: { select: { name: "active" } },
      strategic_role: { select: { name: "core" } },
      business_model: { select: { name: "mixed" } },
      ca_current_eur: { number: 900000 },
      margin_current_pct: { number: 0.10 },
      fixed_costs_eur: { number: 408000 },
      cashflow_current_eur: { number: 0 },
      margin_target_pct: { number: 0.20 },
      cashflow_target_eur: { number: 0 },
      dependency_florent: { select: { name: "high" } },
      risk_level: { select: { name: "medium" } },
      horizon: { select: { name: "mid" } },
    },
    updateProps: {
      Name: { title: rt("INSIDE SAS") },
      status: { select: { name: "active" } },
      strategic_role: { select: { name: "core" } },
      business_model: { select: { name: "mixed" } },
      ca_current_eur: { number: 900000 },
      margin_current_pct: { number: 0.10 },
      fixed_costs_eur: { number: 408000 },
      margin_target_pct: { number: 0.20 },
      dependency_florent: { select: { name: "high" } },
      risk_level: { select: { name: "medium" } },
      horizon: { select: { name: "mid" } },
    },
  });
}

async function upsertEntityATELIER() {
  return upsertByRichTextKey({
    database_id: DB.entities,
    key_property: "id_entity",
    key_value: "ATELIER",
    createProps: {
      Name: { title: rt("ATELIER DE LA COLOMBE") },
      id_entity: { rich_text: rt("ATELIER") },
      status: { select: { name: "in_project" } },
      strategic_role: { select: { name: "production" } },
      business_model: { select: { name: "carpentry" } },
      ca_current_eur: { number: 0 },
      margin_current_pct: { number: 0 },
      fixed_costs_eur: { number: 0 },
      cashflow_current_eur: { number: 0 },
      margin_target_pct: { number: 0.20 },
      cashflow_target_eur: { number: 0 },
      dependency_florent: { select: { name: "high" } },
      risk_level: { select: { name: "medium" } },
      horizon: { select: { name: "mid" } },
    },
    updateProps: {
      Name: { title: rt("ATELIER DE LA COLOMBE") },
      status: { select: { name: "in_project" } },
      strategic_role: { select: { name: "production" } },
      business_model: { select: { name: "carpentry" } },
      margin_target_pct: { number: 0.20 },
      dependency_florent: { select: { name: "high" } },
      risk_level: { select: { name: "medium" } },
      horizon: { select: { name: "mid" } },
    },
  });
}

async function upsertAsset(a, insideId) {
  const dep = computeDependancePersonnelle(a);
  const risk = computeRisqueStructurel({ criticality: a.criticality, dependance_personnelle: dep });

  // IMPORTANT: relation entity -> INSIDE
  const entityRelation = insideId ? { relation: [{ id: insideId }] } : undefined;

  const createProps = {
    Name: { title: rt(a.name) },
    id_asset: { rich_text: rt(a.id_asset) },
    asset_type: { select: { name: a.asset_type } },
    criticality: { select: { name: a.criticality } },
    owner_legal: { select: { name: a.owner_legal } },
    admin_primary: { rich_text: rt(a.admin_primary) },
    email_principal: { rich_text: rt(a.email_principal) },
    admin_secondaire_configure: { checkbox: !!a.admin_secondaire_configure },
    propriete_transferable: { checkbox: !!a.propriete_transferable },
    complexite_migration: { select: { name: a.complexite_migration } },
    tracking_leads_enabled: { checkbox: !!a.tracking_leads_enabled },
    dependance_personnelle: { select: { name: dep } },
    risque_structurel: { select: { name: risk } },
    ...(entityRelation ? { entity: entityRelation } : {}),
  };

  if (a.hosting_provider) createProps.hosting_provider = { rich_text: rt(a.hosting_provider) };
  if (a.tech_stack) createProps.tech_stack = { rich_text: rt(a.tech_stack) };
  if (typeof a.annual_cost_eur === "number") createProps.annual_cost_eur = { number: a.annual_cost_eur };
  if (a.tracking_method) createProps.tracking_method = { rich_text: rt(a.tracking_method) };

  const updateProps = { ...createProps };
  delete updateProps.id_asset; // keep key stable / avoid accidental overwrite

  return upsertByRichTextKey({
    database_id: DB.digital_assets,
    key_property: "id_asset",
    key_value: a.id_asset,
    createProps,
    updateProps,
  });
}

async function run() {
  console.log("UPSERT ENTITIES…");
  const inside = await upsertEntityINSIDE();
  const atelier = await upsertEntityATELIER();
  console.log(" - INSIDE:", inside.action, inside.page.url);
  console.log(" - ATELIER:", atelier.action, atelier.page.url);

  const insideId = inside.page.id;

  console.log("UPSERT DIGITAL ASSETS…");

  const assets = [
    {
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
    },
    {
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
    },
    {
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
    },
  ];

  for (const a of assets) {
    const r = await upsertAsset(a, insideId);
    console.log(" -", a.id_asset, r.action, r.page.url);
  }

  console.log("\n✅ upsert terminé.");
}

run().catch((e) => {
  console.error("Erreur:", e?.body || e);
  process.exit(1);
});