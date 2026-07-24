import { neon } from "@neondatabase/serverless";
// Cloudflare injects this virtual module at Worker build time.
// @ts-expect-error The module is provided by the Cloudflare runtime.
import { env } from "cloudflare:workers";
import { purposeOptions, referralOptions, storeLocations } from "../../form-options";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimit = new Map<string, { startedAt: number; count: number }>();

type Submission = Record<string, unknown>;
type CleanSubmission = {
  fullName: string;
  contactNumber: string;
  email: string | null;
  storeLocation: string;
  area: string | null;
  city: string | null;
  dateOfBirth: string | null;
  anniversary: string | null;
  referralSource: string;
  purposeOfVisit: string;
};

export async function POST(request: Request) {
  const responseHeaders = { "Cache-Control": "no-store" };
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: { ...responseHeaders, Allow: "POST" } });

  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return Response.json({ error: "Content-Type must be application/json" }, { status: 415, headers: responseHeaders });

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin" }, { status: 403, headers: responseHeaders });

  const clientKey = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (!isAllowedRequest(clientKey)) return Response.json({ error: "Too many submissions. Please try again later." }, { status: 429, headers: { ...responseHeaders, "Retry-After": "3600" } });

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return Response.json({ error: "Request is too large" }, { status: 413, headers: responseHeaders });

  let body: Submission;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid body");
    body = parsed as Submission;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: responseHeaders });
  }

  if (typeof body.website === "string" && body.website.trim()) return Response.json({ ok: true }, { headers: responseHeaders });
  const submission = validateSubmission(body);
  if (!submission) return Response.json({ error: "Invalid submission data" }, { status: 400, headers: responseHeaders });

  const databaseUrl = (env as unknown as { NEON_DATABASE_URL?: string }).NEON_DATABASE_URL;
  if (!databaseUrl) return Response.json({ error: "Service temporarily unavailable" }, { status: 503, headers: responseHeaders });

  try {
    const sql = neon(databaseUrl);
    await sql`INSERT INTO onboarding_submissions (full_name, contact_number, email, store_location, area, city, date_of_birth, anniversary, referral_source, purpose_of_visit) VALUES (${submission.fullName}, ${submission.contactNumber}, ${submission.email}, ${submission.storeLocation}, ${submission.area}, ${submission.city}, ${submission.dateOfBirth}, ${submission.anniversary}, ${submission.referralSource}, ${submission.purposeOfVisit})`;
  } catch (error) {
    console.error("Failed to store onboarding submission", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Service temporarily unavailable" }, { status: 503, headers: responseHeaders });
  }

  return Response.json({ ok: true }, { headers: responseHeaders });
}

function isAllowedRequest(key: string): boolean {
  const now = Date.now();
  const current = rateLimit.get(key);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimit.set(key, { startedAt: now, count: 1 });
    if (rateLimit.size > 10_000) for (const [entryKey, entry] of rateLimit) if (now - entry.startedAt >= RATE_LIMIT_WINDOW_MS) rateLimit.delete(entryKey);
    return true;
  }
  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

function validateSubmission(body: Submission): CleanSubmission | null {
  const fullName = cleanText(body.fullName, 100);
  const contactNumber = cleanText(body.contactNumber, 25);
  const email = cleanText(body.email, 254);
  const storeLocation = cleanText(body.storeLocation, 30);
  const area = cleanText(body.area, 100);
  const city = cleanText(body.city, 100);
  const dateOfBirth = cleanDate(body.dateOfBirth);
  const anniversary = cleanDate(body.anniversary);
  const referralSource = cleanText(body.referralSource, 40);
  const purposeOfVisit = cleanText(body.purposeOfVisit, 40);

  if (!fullName || !contactNumber || !storeLocation || !referralSource || !purposeOfVisit) return null;
  if (hasValue(body.email) && !email) return null;
  if (hasValue(body.area) && !area) return null;
  if (hasValue(body.city) && !city) return null;
  if (hasValue(body.dateOfBirth) && !dateOfBirth) return null;
  if (hasValue(body.anniversary) && !anniversary) return null;
  if (!/^[+()\d\s-]{7,25}$/.test(contactNumber) || contactNumber.replace(/\D/g, "").length < 7) return null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!storeLocations.includes(storeLocation as (typeof storeLocations)[number])) return null;
  if (!referralOptions.includes(referralSource as (typeof referralOptions)[number])) return null;
  if (!purposeOptions.includes(purposeOfVisit as (typeof purposeOptions)[number])) return null;

  return { fullName, contactNumber, email, storeLocation, area, city, dateOfBirth, anniversary, referralSource, purposeOfVisit };
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength || /[\u0000-\u001F\u007F]/.test(cleaned)) return null;
  return cleaned;
}

function cleanDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : null;
}
