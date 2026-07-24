import { neon } from "@neondatabase/serverless";
import { env } from "cloudflare:workers";

type Submission = { fullName?: string; contactNumber?: string; email?: string; storeLocation?: string; area?: string; city?: string; dateOfBirth?: string; anniversary?: string; referralSource?: string; purposeOfVisit?: string; website?: string };

export async function POST(request: Request) {
  const body = await request.json() as Submission;
  if (body.website) return Response.json({ ok: true });
  if (!body.fullName || !body.contactNumber || !body.storeLocation || !body.referralSource || !body.purposeOfVisit) return Response.json({ error: "Missing required fields" }, { status: 400 });
  const databaseUrl = (env as unknown as { NEON_DATABASE_URL?: string }).NEON_DATABASE_URL;
  if (!databaseUrl) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const sql = neon(databaseUrl);
  await sql`INSERT INTO onboarding_submissions (full_name, contact_number, email, store_location, area, city, date_of_birth, anniversary, referral_source, purpose_of_visit) VALUES (${body.fullName}, ${body.contactNumber}, ${body.email || null}, ${body.storeLocation}, ${body.area || null}, ${body.city || null}, ${body.dateOfBirth || null}, ${body.anniversary || null}, ${body.referralSource}, ${body.purposeOfVisit})`;
  return Response.json({ ok: true });
}
