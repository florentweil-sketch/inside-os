import "dotenv/config";

export function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`ENV missing: ${name}`);
  return v;
}

export const CFG = {
  NOTION_API_KEY: env("NOTION_API_KEY"),
  THREAD_DUMP_DS_ID: env("THREAD_DUMP_DS_ID"),
  DECISIONS_DS_ID: env("DECISIONS_DS_ID"),
  LESSONS_DS_ID: env("LESSONS_DS_ID"),
};
