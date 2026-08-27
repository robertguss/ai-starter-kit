#!/usr/bin/env node
// Idempotent Clerk + Convex auth setup for the Next.js starter kit.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const CONVEX_JWT_TEMPLATE = {
  name: "convex",
  claims: {
    aud: "convex",
    name: "{{user.full_name}}",
    nickname: "{{user.username}}",
    picture: "{{user.image_url}}",
    given_name: "{{user.first_name}}",
    family_name: "{{user.last_name}}",
    email: "{{user.primary_email_address}}",
    phone_number: "{{user.primary_phone_number}}",
    email_verified: "{{user.email_verified}}",
    phone_number_verified: "{{user.phone_number_verified}}",
    updated_at: "{{user.updated_at}}",
  },
  lifetime: 3600,
};

let appId = "";
let appName = "";
let envFile = ".env.local";
let skipConvexEnv = false;
let tmpDir = "";

function usage() {
  return `Usage: ./scripts/setup-clerk-auth.sh [options]

Options:
  --app <id>           Link an existing Clerk application
  --app-name <name>    Name a newly created Clerk application
  --env-file <path>    Env file to write (default: .env.local)
  --skip-convex-env    Do not set CLERK_JWT_ISSUER_DOMAIN on Convex
  -h, --help           Show this help

Environment:
  CLERK_SECRET_KEY                    Reuse an existing Clerk secret key
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   Reuse an existing publishable key
  CLERK_PLATFORM_API_KEY              Headless Clerk Platform API auth
  CLERK_MODE=agent                    Force non-interactive Clerk CLI behavior`;
}

function fail(message) {
  console.error(`  \x1b[0;31m✗\x1b[0m ${message}`);
  process.exit(1);
}

function success(message) {
  console.log(`  \x1b[0;32m✓\x1b[0m ${message}`);
}

function info(message) {
  console.log(`  \x1b[0;36mℹ\x1b[0m ${message}`);
}

function step(message) {
  console.log(`\n\x1b[0;34m▶\x1b[0m \x1b[1m${message}\x1b[0m`);
}

function parseArgs(argv) {
  const args = [...argv];
  while (args.length > 0) {
    const flag = args.shift();
    switch (flag) {
      case "--app":
        appId = needValue(flag, args.shift());
        break;
      case "--app-name":
        appName = needValue(flag, args.shift());
        break;
      case "--env-file":
        envFile = needValue(flag, args.shift());
        break;
      case "--skip-convex-env":
        skipConvexEnv = true;
        break;
      case "-h":
      case "--help":
        console.log(usage());
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${flag}`);
        console.error(usage());
        process.exit(2);
    }
  }
}

function needValue(flag, value) {
  if (!value) {
    console.error(`Missing value for ${flag}`);
    process.exit(2);
  }
  return value;
}

function envPath() {
  return path.resolve(ROOT_DIR, envFile);
}

function readEnvFile() {
  if (!existsSync(envPath())) return "";
  return readFileSync(envPath(), "utf8");
}

function envValue(key) {
  const line = readEnvFile()
    .split("\n")
    .find((entry) => entry.startsWith(`${key}=`));
  if (!line) return "";
  return line.slice(key.length + 1).replace(/^["']|["']$/g, "");
}

function upsertEnv(key, value) {
  const file = envPath();
  const current = existsSync(file) ? readFileSync(file, "utf8") : "";
  const lines = current.length > 0 ? current.split("\n") : [];
  let replaced = false;
  const next = lines.map((line) => {
    if (!replaced && line.startsWith(`${key}=`)) {
      replaced = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!replaced) {
    if (next.length > 0 && next[next.length - 1] !== "") next.push("");
    next.push(`${key}=${value}`);
  }
  writeFileSync(file, `${next.join("\n").replace(/\n+$/, "")}\n`);
}

function hasClerkKey(value, kind) {
  return Boolean(
    value &&
    value.length >= 30 &&
    (value.startsWith(`${kind}_test_`) || value.startsWith(`${kind}_live_`)),
  );
}

function hasKey(key) {
  const value = envValue(key);
  return key.includes("PUBLISHABLE")
    ? hasClerkKey(value, "pk")
    : hasClerkKey(value, "sk");
}

function migrateLegacyKeys() {
  const mappings = [
    ["VITE_CLERK_PUBLISHABLE_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"],
    ["VITE_CONVEX_URL", "NEXT_PUBLIC_CONVEX_URL"],
  ];
  for (const [from, to] of mappings) {
    const value = envValue(from);
    if (value && !envValue(to)) {
      upsertEnv(to, value);
      success(`Migrated ${from} to ${to}`);
    }
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function clerkCommand() {
  const local = spawnSync("clerk", ["--version"], { stdio: "ignore" });
  return local.status === 0 ? ["clerk"] : ["pnpm", "dlx", "clerk@latest"];
}

function runClerk(args, options = {}) {
  const [command, ...prefix] = clerkCommand();
  const result = spawnSync(command, [...prefix, ...args], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: { ...process.env, CLERK_MODE: process.env.CLERK_MODE ?? "agent" },
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (!options.allowFail && result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return result;
}

async function clerkApi(pathname, init = {}) {
  const cliArgs = ["api", pathname];
  if (init.bodyFile) {
    cliArgs.push("--file", init.bodyFile, "--yes");
  }

  const cli = runClerk(cliArgs, { allowFail: true, capture: true });
  if (cli.status === 0) {
    return { ok: true, text: cli.stdout ?? "" };
  }

  const secret = envValue("CLERK_SECRET_KEY");
  if (!secret) return { ok: false, text: "" };

  const response = await fetch(`https://api.clerk.com/v1${pathname}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body,
  });

  return { ok: response.ok, text: await response.text() };
}

function jsonRows(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray(value.data)) {
    return value.data;
  }
  return [];
}

function applicationIdFromUnknown(value) {
  if (!value || typeof value !== "object") return "";
  const record = value;
  return String(
    record.application_id ||
      record.applicationId ||
      record.app_id ||
      record.appId ||
      record.id ||
      (record.application && typeof record.application === "object"
        ? record.application.id || record.application.application_id
        : "") ||
      "",
  );
}

function prepareEnv() {
  if (!existsSync(envPath())) writeFileSync(envPath(), "");
  migrateLegacyKeys();
  upsertEnv("NEXT_PUBLIC_CLERK_SIGN_IN_URL", "/sign-in");
  upsertEnv("NEXT_PUBLIC_CLERK_SIGN_UP_URL", "/sign-up");
  upsertEnv("NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL", "/dashboard");
  upsertEnv("NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL", "/dashboard");
  success("Next.js Clerk route defaults are present");
}

function adoptEnvironmentKeys() {
  if (process.env.CLERK_SECRET_KEY && !hasKey("CLERK_SECRET_KEY")) {
    upsertEnv("CLERK_SECRET_KEY", process.env.CLERK_SECRET_KEY);
    success("Adopted CLERK_SECRET_KEY from the environment");
  }

  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (publishableKey && !hasKey("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")) {
    upsertEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);
    success("Adopted the Clerk publishable key from the environment");
  }
}

async function ensureAppAndKeys() {
  adoptEnvironmentKeys();
  if (
    hasKey("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") &&
    hasKey("CLERK_SECRET_KEY")
  ) {
    success("Clerk keys are already present");
    return;
  }

  const whoami = runClerk(["whoami"], { allowFail: true, capture: true });
  if (whoami.status !== 0) {
    info("Run: pnpm dlx clerk@latest auth login");
    fail("Clerk CLI is not authenticated");
  }

  if (!appId) {
    const identified = runClerk(["whoami", "--json"], {
      allowFail: true,
      capture: true,
    });
    appId = applicationIdFromUnknown(parseJson(identified.stdout ?? ""));
  }

  if (!appId) {
    appName ||= path.basename(ROOT_DIR);
    ensureTmpDir();
    const resultPath = path.join(tmpDir, "clerk-app.json");
    const created = runClerk(["apps", "create", appName, "--json"], {
      capture: true,
    });
    writeFileSync(resultPath, created.stdout ?? "");
    appId = applicationIdFromUnknown(parseJson(created.stdout ?? ""));
    if (!appId) fail("Could not determine the new Clerk application ID");
  }

  runClerk(["link", "--app", appId]);
  runClerk(["env", "pull", "--file", envFile]);
  migrateLegacyKeys();

  if (
    !hasKey("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") ||
    !hasKey("CLERK_SECRET_KEY")
  ) {
    fail("Clerk keys are missing after env pull");
  }
  success("Clerk application linked and keys written");
}

async function ensureJwtTemplate() {
  step("Ensuring the Clerk Convex JWT template");
  const listed = await clerkApi("/jwt_templates");
  if (!listed.ok) fail("Could not list Clerk JWT templates");

  const templates = jsonRows(parseJson(listed.text));
  if (templates.some((template) => template?.name === "convex")) {
    success('JWT template "convex" already exists');
    return;
  }

  ensureTmpDir();
  const bodyPath = path.join(tmpDir, "convex-template.json");
  writeFileSync(bodyPath, `${JSON.stringify(CONVEX_JWT_TEMPLATE, null, 2)}\n`);

  const created = await clerkApi("/jwt_templates", {
    body: JSON.stringify(CONVEX_JWT_TEMPLATE),
    bodyFile: bodyPath,
    method: "POST",
  });
  if (!created.ok) fail('Could not create the Clerk JWT template "convex"');
  success('Created JWT template "convex"');
}

async function frontendApiUrl() {
  const fromEnv = envValue("CLERK_FRONTEND_API_URL");
  if (/^https:\/\/\S+$/.test(fromEnv)) return fromEnv;

  const listed = await clerkApi("/domains");
  if (!listed.ok) return "";
  const rows = jsonRows(parseJson(listed.text));
  const domain =
    rows.find((item) => item?.is_primary || item?.primary) ?? rows[0];
  return String(
    domain?.frontend_api_url ||
      domain?.frontendApiUrl ||
      (domain?.name ? `https://${domain.name}` : ""),
  );
}

async function setConvexIssuer() {
  if (skipConvexEnv) {
    info("Skipped the Convex issuer (--skip-convex-env)");
    return;
  }

  step("Setting the Clerk issuer on Convex");
  const issuer = await frontendApiUrl();
  if (!issuer) fail("Could not determine CLERK_JWT_ISSUER_DOMAIN");

  const result = spawnSync(
    "pnpm",
    ["exec", "convex", "env", "set", "CLERK_JWT_ISSUER_DOMAIN", issuer],
    { cwd: ROOT_DIR, stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  success("CLERK_JWT_ISSUER_DOMAIN is configured");
}

function ensureTmpDir() {
  if (!tmpDir) tmpDir = mkdtempSync(path.join(tmpdir(), "setup-clerk-auth-"));
}

function cleanup() {
  if (tmpDir) rmSync(tmpDir, { force: true, recursive: true });
}

function requireCommands() {
  if (spawnSync("node", ["--version"], { stdio: "ignore" }).status !== 0) {
    fail("Node.js is required");
  }
  if (spawnSync("pnpm", ["--version"], { stdio: "ignore" }).status !== 0) {
    fail("pnpm is required");
  }
}

parseArgs(process.argv.slice(2));
process.chdir(ROOT_DIR);
process.on("exit", cleanup);

requireCommands();
step(`Preparing ${envFile}`);
prepareEnv();
step("Resolving the Clerk application and keys");
await ensureAppAndKeys();
await ensureJwtTemplate();
await setConvexIssuer();

console.log("\n\x1b[0;32m\x1b[1mClerk auth setup complete.\x1b[0m");
console.log("Routes: /sign-in and /sign-up → /dashboard");
console.log(
  "Sign out fully and sign back in after first enabling the JWT template.",
);
