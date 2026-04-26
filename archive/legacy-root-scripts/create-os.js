require("dotenv").config();
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const ROOT_PAGE_ID = process.env.ROOT_PAGE_ID;

if (!ROOT_PAGE_ID) {
  console.error("ROOT_PAGE_ID manquant dans .env");
  process.exit(1);
}

const dbSpecs = {
  entities: {
    title: "entities",
    properties: {
      id_entity: { type: "rich_text", name: "id_entity" },
      status: {
        type: "select",
        name: "status",
        options: ["active", "in_project", "dormant", "to_close"],
      },
      strategic_role: {
        type: "select",
        name: "strategic_role",
        options: ["core", "production", "holding", "satellite"],
      },
      business_model: {
        type: "select",
        name: "business_model",
        options: ["renovation", "carpentry", "moe", "mixed", "holding"],
      },
      ca_current_eur: { type: "number", name: "ca_current_eur", format: "euro" },
      margin_current_pct: { type: "number", name: "margin_current_pct", format: "percent" },
      fixed_costs_eur: { type: "number", name: "fixed_costs_eur", format: "euro" },
      cashflow_current_eur: { type: "number", name: "cashflow_current_eur", format: "euro" },
      margin_target_pct: { type: "number", name: "margin_target_pct", format: "percent" },
      cashflow_target_eur: { type: "number", name: "cashflow_target_eur", format: "euro" },
      dependency_florent: {
        type: "select",
        name: "dependency_florent",
        options: ["low", "medium", "high"],
      },
      risk_level: { type: "select", name: "risk_level", options: ["low", "medium", "high"] },
      horizon: { type: "select", name: "horizon", options: ["short", "mid", "long"] },

      margin_gap_pct: {
        type: "formula",
        name: "margin_gap_pct",
        expression: 'prop("margin_target_pct") - prop("margin_current_pct")',
      },
      lost_profit_eur: {
        type: "formula",
        name: "lost_profit_eur",
        expression: 'prop("ca_current_eur") * prop("margin_gap_pct")',
      },
    },
  },

  projects_chantiers: {
    title: "projects_chantiers",
    properties: {
      id_chantier: { type: "rich_text", name: "id_chantier" },
      client_name: { type: "rich_text", name: "client_name" },
      chantier_type: {
        type: "select",
        name: "chantier_type",
        options: ["renovation", "carpentry", "moe", "mixed"],
      },
      status: {
        type: "select",
        name: "status",
        options: ["to_prepare", "in_progress", "waiting", "paused", "sav", "done"],
      },
      priority: { type: "select", name: "priority", options: ["high", "normal", "low"] },
      risk_level: { type: "select", name: "risk_level", options: ["none", "low", "medium", "high"] },
      blocked: { type: "checkbox", name: "blocked" },
      next_milestone_date: { type: "date", name: "next_milestone_date" },
      last_update_date: { type: "date", name: "last_update_date" },
      start_planned: { type: "date", name: "start_planned" },
      end_target: { type: "date", name: "end_target" },

      budget_initial_ht_eur: { type: "number", name: "budget_initial_ht_eur", format: "euro" },
      cost_forecast_eur: { type: "number", name: "cost_forecast_eur", format: "euro" },
      cost_real_eur: { type: "number", name: "cost_real_eur", format: "euro" },
      hours_planned: { type: "number", name: "hours_planned", format: "number" },
      hours_real: { type: "number", name: "hours_real", format: "number" },
      hourly_cost_real_eur: { type: "number", name: "hourly_cost_real_eur", format: "euro" },

      margin_forecast_eur: {
        type: "formula",
        name: "margin_forecast_eur",
        expression: 'prop("budget_initial_ht_eur") - prop("cost_forecast_eur")',
      },
      margin_forecast_pct: {
        type: "formula",
        name: "margin_forecast_pct",
        expression:
          'if(prop("budget_initial_ht_eur") == 0, 0, prop("margin_forecast_eur") / prop("budget_initial_ht_eur"))',
      },
      margin_real_eur: {
        type: "formula",
        name: "margin_real_eur",
        expression: 'prop("budget_initial_ht_eur") - prop("cost_real_eur")',
      },
      margin_real_pct: {
        type: "formula",
        name: "margin_real_pct",
        expression:
          'if(prop("budget_initial_ht_eur") == 0, 0, prop("margin_real_eur") / prop("budget_initial_ht_eur"))',
      },
      margin_delta_pct: {
        type: "formula",
        name: "margin_delta_pct",
        expression: 'prop("margin_forecast_pct") - prop("margin_real_pct")',
      },
      impact_financial_eur: {
        type: "formula",
        name: "impact_financial_eur",
        expression: 'prop("budget_initial_ht_eur") * prop("margin_delta_pct")',
      },
    },
  },

  projects_strategic: {
    title: "projects_strategic",
    properties: {
      id_project: { type: "rich_text", name: "id_project" },
      impact: {
        type: "select",
        name: "impact",
        options: ["margin", "structure", "image", "growth", "risk", "digital_transformation"],
      },
      status: {
        type: "select",
        name: "status",
        options: ["backlog", "in_progress", "blocked", "done", "abandoned"],
      },
      deadline: { type: "date", name: "deadline" },
      success_metric: { type: "rich_text", name: "success_metric" },
    },
  },

  decisions_structural: {
    title: "decisions_structural",
    properties: {
      id_decision: { type: "rich_text", name: "id_decision" },
      decision_date: { type: "date", name: "decision_date" },
      problem: { type: "rich_text", name: "problem" },
      options: { type: "rich_text", name: "options" },
      choice: { type: "rich_text", name: "choice" },
      rationale: { type: "rich_text", name: "rationale" },
      accepted_risk: { type: "select", name: "accepted_risk", options: ["low", "medium", "high"] },
      validation_metric: { type: "rich_text", name: "validation_metric" },
      review_date: { type: "date", name: "review_date" },
      status: { type: "select", name: "status", options: ["active", "to_review", "canceled"] },
    },
  },

  capital_performance: {
    title: "capital_performance",
    properties: {
      period: { type: "select", name: "period", options: ["2026", "2026_Q1", "2026_Q2", "2026_Q3", "2026_Q4"] },
      ca_eur: { type: "number", name: "ca_eur", format: "euro" },
      margin_pct: { type: "number", name: "margin_pct", format: "percent" },
      net_result_eur: { type: "number", name: "net_result_eur", format: "euro" },
      fixed_costs_eur: { type: "number", name: "fixed_costs_eur", format: "euro" },
      cash_eur: { type: "number", name: "cash_eur", format: "euro" },
      debt_eur: { type: "number", name: "debt_eur", format: "euro" },
      margin_target_pct: { type: "number", name: "margin_target_pct", format: "percent" },
      margin_gap_pct: {
        type: "formula",
        name: "margin_gap_pct",
        expression: 'prop("margin_target_pct") - prop("margin_pct")',
      },
    },
  },

  admin_architecture: {
    title: "admin_architecture",
    properties: {
      admin_type: {
        type: "select",
        name: "admin_type",
        options: ["telecom", "internet", "bank", "insurance", "lease", "critical_supplier", "legal", "other"],
      },
      holder: { type: "select", name: "holder", options: ["entity", "florent", "other"] },
      payer: { type: "select", name: "payer", options: ["entity", "florent", "other"] },
      compliant: { type: "select", name: "compliant", options: ["yes", "no"] },
      corrective_action: { type: "rich_text", name: "corrective_action" },
      due_date: { type: "date", name: "due_date" },
      status: { type: "select", name: "status", options: ["todo", "in_progress", "ok"] },
    },
  },

  lessons_learnings: {
    title: "lessons_learnings",
    properties: {
      lesson_type: { type: "select", name: "lesson_type", options: ["conflict", "margin_drift", "success", "hiring", "sav"] },
      fact: { type: "rich_text", name: "fact" },
      root_cause: { type: "rich_text", name: "root_cause" },
      new_rule: { type: "rich_text", name: "new_rule" },
    },
  },

  digital_assets: {
    title: "digital_assets",
    properties: {
      id_asset: { type: "rich_text", name: "id_asset" },
      asset_type: {
        type: "select",
        name: "asset_type",
        options: ["website", "social_media", "domain", "hosting", "ads_account", "analytics", "pixel", "whatsapp_business", "other"],
      },
      criticality: { type: "select", name: "criticality", options: ["low", "medium", "high"] },

      owner_legal: { type: "select", name: "owner_legal", options: ["entity", "florent", "other"] },
      admin_primary: { type: "rich_text", name: "admin_primary" },

      email_principal: { type: "rich_text", name: "email_principal" },
      admin_secondaire_configure: { type: "checkbox", name: "admin_secondaire_configure" },
      propriete_transferable: { type: "checkbox", name: "propriete_transferable" },
      complexite_migration: { type: "select", name: "complexite_migration", options: ["low", "medium", "high"] },

      hosting_provider: { type: "rich_text", name: "hosting_provider" },
      tech_stack: { type: "rich_text", name: "tech_stack" },
      annual_cost_eur: { type: "number", name: "annual_cost_eur", format: "euro" },
      renewal_date: { type: "date", name: "renewal_date" },
      backups_active: { type: "checkbox", name: "backups_active" },

      tracking_leads_enabled: { type: "checkbox", name: "tracking_leads_enabled" },
      tracking_method: { type: "rich_text", name: "tracking_method" },
      leads_monthly: { type: "number", name: "leads_monthly", format: "number" },
      performance_note: { type: "rich_text", name: "performance_note" },

      dependance_personnelle: {
        type: "formula",
        name: "dependance_personnelle",
        expression:
          'if(or(contains(prop("email_principal"), "gmail.com"), contains(prop("email_principal"), "yahoo.com"), contains(prop("email_principal"), "outlook.com"), prop("admin_secondaire_configure") == false, prop("propriete_transferable") == false), "high", "low")',
      },
      risque_structurel: {
        type: "formula",
        name: "risque_structurel",
        expression:
          'if(and(prop("criticality") == "high", prop("dependance_personnelle") == "high"), "critical", "ok")',
      },
    },
  },
};

function buildProperty(prop) {
  if (prop.type === "number") return { [prop.name]: { number: { format: prop.format || "number" } } };
  if (prop.type === "rich_text") return { [prop.name]: { rich_text: {} } };
  if (prop.type === "checkbox") return { [prop.name]: { checkbox: {} } };
  if (prop.type === "date") return { [prop.name]: { date: {} } };
  if (prop.type === "select")
    return {
      [prop.name]: {
        select: { options: (prop.options || []).map((n) => ({ name: n })) },
      },
    };
  if (prop.type === "formula") return { [prop.name]: { formula: { expression: prop.expression } } };
  throw new Error(`Type de propriété non supporté: ${prop.type}`);
}

async function createDatabase({ title, properties }) {
  const notionProps = {};
  for (const key of Object.keys(properties)) {
    Object.assign(notionProps, buildProperty(properties[key]));
  }

  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: ROOT_PAGE_ID },
    title: [{ type: "text", text: { content: title } }],
    properties: {
      Name: { title: {} }, // Notion exige un title property
      ...notionProps,
    },
  });

  return db;
}

async function run() {
  console.log("Création des bases dans INSIDE_OS_ROOT…");
  const created = {};

  for (const [key, spec] of Object.entries(dbSpecs)) {
    console.log(`→ Creating database: ${spec.title}`);
    const db = await createDatabase(spec);
    created[key] = db;
    console.log(`   OK: ${spec.title} (${db.id})`);
  }

  // Relations (2nd pass) : entities <-> projects_strategic, entities <-> projects_chantiers, etc.
  console.log("Ajout des relations (2nd pass)…");

  // entities -> projects_strategic
  await notion.databases.update({
    database_id: created.entities.id,
    properties: {
      related_strategic_projects: {
        relation: {
          database_id: created.projects_strategic.id,
          single_property: {},
        },
      },
    },
  });

  // projects_strategic -> entities
  await notion.databases.update({
    database_id: created.projects_strategic.id,
    properties: {
      entity: {
        relation: { database_id: created.entities.id, single_property: {} },
      },
      linked_decisions: {
        relation: { database_id: created.decisions_structural.id, single_property: {} },
      },
    },
  });

  // decisions_structural -> entities + projects_strategic
  await notion.databases.update({
    database_id: created.decisions_structural.id,
    properties: {
      entity: { relation: { database_id: created.entities.id, single_property: {} } },
      strategic_project: { relation: { database_id: created.projects_strategic.id, single_property: {} } },
    },
  });

  // projects_chantiers -> entities
  await notion.databases.update({
    database_id: created.projects_chantiers.id,
    properties: {
      entity: { relation: { database_id: created.entities.id, single_property: {} } },
    },
  });

  // capital_performance -> entities
  await notion.databases.update({
    database_id: created.capital_performance.id,
    properties: {
      entity: { relation: { database_id: created.entities.id, single_property: {} } },
    },
  });

  // admin_architecture -> entities
  await notion.databases.update({
    database_id: created.admin_architecture.id,
    properties: {
      entity: { relation: { database_id: created.entities.id, single_property: {} } },
    },
  });

  // lessons_learnings -> entities + projects_chantiers + decisions_structural
  await notion.databases.update({
    database_id: created.lessons_learnings.id,
    properties: {
      entity: { relation: { database_id: created.entities.id, single_property: {} } },
      chantier: { relation: { database_id: created.projects_chantiers.id, single_property: {} } },
      linked_decision: { relation: { database_id: created.decisions_structural.id, single_property: {} } },
    },
  });

  // digital_assets -> entities
  await notion.databases.update({
    database_id: created.digital_assets.id,
    properties: {
      entity: { relation: { database_id: created.entities.id, single_property: {} } },
    },
  });

  console.log("\n✅ Terminé.");
  console.log("Bases créées :");
  for (const [k, db] of Object.entries(created)) {
    console.log(`- ${k}: ${db.url}`);
  }
}

run().catch((e) => {
  console.error("Erreur:", e?.body || e);
  process.exit(1);
});