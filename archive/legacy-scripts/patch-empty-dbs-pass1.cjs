require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
if (!NOTION_TOKEN) { console.error("ERROR: NOTION_TOKEN missing in .env"); process.exit(1); }

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

const DB = {
  projects_strategic: '6ed8559d-6358-4450-b97e-6c940a96782a',
  decisions_structural: '1054c068-9b91-4215-af70-4c1a3945a83a',
  capital_performance: 'd28b5770-ba14-4d77-9171-060a303cc69a',
  admin_architecture: '56ecc31c-ba79-4f38-97d2-b5b05ad5bdae',
  lessons_learnings: 'dabb137f-28b1-4e59-9290-03a21a7694de',
};

// Minimal “OS-grade” schemas (pass1 only)
const PATCHES = {
  projects_strategic: {
    properties: {
      id_project: { rich_text: {} },
      status: { select: { options: [{name:'idea'},{name:'active'},{name:'paused'},{name:'done'}] } },
      horizon: { select: { options: [{name:'0-3m'},{name:'3-12m'},{name:'12-24m'},{name:'24m+'}] } },
      owner: { rich_text: {} },
      goal: { rich_text: {} },
      kpi_primary: { rich_text: {} },
      kpi_target: { rich_text: {} },
      notes: { rich_text: {} },
      created_at: { date: {} },
      updated_at: { date: {} },
    }
  },

  decisions_structural: {
    properties: {
      id_decision: { rich_text: {} },
      scope: { select: { options: [{name:'F&A Capital'},{name:'INSIDE OS'},{name:'Chantiers'},{name:'Notion'},{name:'n8n'},{name:'Legal/Finance'}] } },
      status: { select: { options: [{name:'proposed'},{name:'accepted'},{name:'deprecated'}] } },
      decision: { rich_text: {} },
      rationale: { rich_text: {} },
      consequences: { rich_text: {} },
      owner: { rich_text: {} },
      decided_at: { date: {} },
      source_thread: { rich_text: {} },
    }
  },

  capital_performance: {
    properties: {
      id_metric: { rich_text: {} },
      period: { select: { options: [{name:'monthly'},{name:'quarterly'},{name:'yearly'}] } },
      entity: { rich_text: {} },  // later: relation to entities if you want
      revenue_eur: { number: { format: "euro" } },
      gross_margin_pct: { number: { format: "percent" } },
      fixed_costs_eur: { number: { format: "euro" } },
      cashflow_eur: { number: { format: "euro" } },
      risk_level: { select: { options: [{name:'low'},{name:'medium'},{name:'high'},{name:'critical'}] } },
      notes: { rich_text: {} },
      as_of: { date: {} },
    }
  },

  admin_architecture: {
    properties: {
      id_item: { rich_text: {} },
      area: { select: { options: [{name:'Legal'},{name:'Finance'},{name:'HR'},{name:'IT'},{name:'Ops'},{name:'Governance'}] } },
      status: { select: { options: [{name:'todo'},{name:'in_progress'},{name:'blocked'},{name:'done'}] } },
      owner: { rich_text: {} },
      description: { rich_text: {} },
      due_date: { date: {} },
      links: { rich_text: {} },
      notes: { rich_text: {} },
    }
  },

  lessons_learnings: {
    properties: {
      id_lesson: { rich_text: {} },
      scope: { select: { options: [{name:'Chantiers'},{name:'Clients'},{name:'Sous-traitants'},{name:'Process'},{name:'Tech'},{name:'Finance'}] } },
      severity: { select: { options: [{name:'low'},{name:'medium'},{name:'high'}] } },
      lesson: { rich_text: {} },
      what_happened: { rich_text: {} },
      fix: { rich_text: {} },
      prevention: { rich_text: {} },
      date: { date: {} },
      source_thread: { rich_text: {} },
    }
  },
};

async function main() {
  for (const [key, id] of Object.entries(DB)) {
    console.log(`Patching ${key}...`);
    await notion(`/databases/${id}`, 'PATCH', PATCHES[key]);
    console.log(`OK ${key}`);
  }
  console.log("All patches applied.");
}

main().catch(e => { console.error(e.message); process.exit(1); });
