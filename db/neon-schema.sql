CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  store_location TEXT NOT NULL,
  area TEXT,
  city TEXT,
  date_of_birth DATE,
  anniversary DATE,
  referral_source TEXT NOT NULL,
  purpose_of_visit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS onboarding_submissions_created_at_idx ON onboarding_submissions (created_at DESC);
