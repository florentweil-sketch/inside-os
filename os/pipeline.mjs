#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const STEPS = [
  {
    name: "ingest",
    script: path.join(ROOT_DIR, "os", "ingest", "ingest-thread-dump.mjs"),
  },
  {
    name: "extract",
    script: path.join(ROOT_DIR, "os", "extract", "extract-thread-dump.mjs"),
  },
  {
    name: "inject",
    script: path.join(ROOT_DIR, "os", "inject", "inject-decisions-lessons.mjs"),
  },
];

function parseArgs(argv) {
  const parsed = {
    only: undefined,
    step: undefined,
    force: false,
    passthrough: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--only") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --only");
      }
      parsed.only = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--only=")) {
      parsed.only = arg.slice("--only=".length);
      if (!parsed.only) {
        throw new Error("Missing value for --only");
      }
      continue;
    }

    if (arg === "--step") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --step");
      }
      parsed.step = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--step=")) {
      parsed.step = arg.slice("--step=".length);
      if (!parsed.step) {
        throw new Error("Missing value for --step");
      }
      continue;
    }

    if (arg === "--force") {
      parsed.force = true;
      continue;
    }

    parsed.passthrough.push(arg);
  }

  return parsed;
}

function buildStepArgs(parsed) {
  const args = [];

  if (parsed.only) {
    args.push("--only", parsed.only);
  }

  if (parsed.force) {
    args.push("--force");
  }

  if (parsed.passthrough.length > 0) {
    args.push(...parsed.passthrough);
  }

  return args;
}

function formatCommand(command, args) {
  return [command, ...args]
    .map((part) => {
      if (/[\s"]/u.test(part)) {
        return JSON.stringify(part);
      }
      return part;
    })
    .join(" ");
}

function formatDurationMs(durationMs) {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function runNodeScript(step, forwardedArgs) {
  return new Promise((resolve, reject) => {
    const command = process.execPath;
    const args = [step.script, ...forwardedArgs];
    const startedAt = Date.now();

    console.log(`\n[os:pipeline] START ${step.name}`);
    console.log(`[os:pipeline] exec> ${formatCommand(command, args)}`);

    const child = spawn(command, args, {
      cwd: ROOT_DIR,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `[os:pipeline] Failed to start step "${step.name}": ${error.message}`
        )
      );
    });

    child.on("exit", (code, signal) => {
      const durationMs = Date.now() - startedAt;

      if (signal) {
        reject(
          new Error(
            `[os:pipeline] FAIL ${step.name} (${formatDurationMs(
              durationMs
            )}) terminated by signal ${signal}`
          )
        );
        return;
      }

      if (code !== 0) {
        reject(
          new Error(
            `[os:pipeline] FAIL ${step.name} (${formatDurationMs(
              durationMs
            )}) exit code ${code}`
          )
        );
        return;
      }

      console.log(
        `[os:pipeline] DONE ${step.name} (${formatDurationMs(durationMs)})`
      );

      resolve();
    });
  });
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const parsed = parseArgs(rawArgs);

  if (parsed.step && !STEPS.some((s) => s.name === parsed.step)) {
    throw new Error(`Invalid value for --step: ${parsed.step}`);
  }

  const forwardedArgs = buildStepArgs(parsed);

  console.log("[os:pipeline] starting");
  console.log(
    `[os:pipeline] step filter: ${parsed.step ? parsed.step : "(all)"}`
  );
  console.log(
    `[os:pipeline] forwarded args: ${
      forwardedArgs.length > 0 ? forwardedArgs.join(" ") : "(none)"
    }`
  );

  const stepsToRun = parsed.step
    ? STEPS.filter((s) => s.name === parsed.step)
    : STEPS;

  for (const step of stepsToRun) {
    await runNodeScript(step, forwardedArgs);
  }

  console.log("\n[os:pipeline] done");
}

main().catch((error) => {
  console.error(`\n[os:pipeline] ERROR: ${error.message}`);
  process.exit(1);
});