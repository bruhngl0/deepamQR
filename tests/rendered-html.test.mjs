import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("includes the fixed deployed onboarding URL and QR asset", async () => {
  const page = await source("app/page.tsx");

  await access(new URL("public/deepam-onboarding-qr.png", root));
  assert.match(page, /https:\/\/deepam-onboarding-form\.adityashrm500\.workers\.dev\//);
  assert.match(page, /src="\/deepam-onboarding-qr\.png"/);
  assert.doesNotMatch(page, /window\.location\.origin/);
});

test("keeps the onboarding form and submission contract aligned", async () => {
  const [page, route, schema] = await Promise.all([
    source("app/page.tsx"),
    source("app/api/submissions/route.ts"),
    source("db/neon-schema.sql"),
  ]);

  for (const field of [
    "fullName",
    "contactNumber",
    "email",
    "storeLocation",
    "area",
    "city",
    "dateOfBirth",
    "anniversary",
    "referralSource",
    "purposeOfVisit",
  ]) {
    assert.match(page, new RegExp(`\\b${field}\\b`));
    assert.match(route, new RegExp(`\\b${field}\\b`));
  }

  assert.match(route, /POST\(request: Request\)/);
  assert.match(route, /NEON_DATABASE_URL/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS onboarding_submissions/);
  assert.match(schema, /created_at TIMESTAMPTZ/);
});

test("contains server-side request protections", async () => {
  const route = await source("app/api/submissions/route.ts");

  assert.match(route, /MAX_BODY_BYTES/);
  assert.match(route, /application\/json/);
  assert.match(route, /Invalid request origin/);
  assert.match(route, /Too many submissions/);
  assert.match(route, /JSON\.parse/);
  assert.match(route, /validateSubmission/);
  assert.match(route, /catch \(error\)/);
});

test("contains Worker security headers", async () => {
  const worker = await source("worker/index.ts");

  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /Strict-Transport-Security/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(worker, /X-Frame-Options/);
  assert.match(worker, /Referrer-Policy/);
});

test("deploys the existing Worker without changing the QR destination", async () => {
  const workflow = await source(".github/workflows/deploy.yml");
  const page = await source("app/page.tsx");

  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /--name deepam-onboarding-form/);
  assert.match(workflow, /CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /CLOUDFLARE_ACCOUNT_ID/);
  assert.match(page, /deepam-onboarding-form\.adityashrm500\.workers\.dev/);
});
