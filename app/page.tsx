"use client";

import Image from "next/image";
import { useState } from "react";
import { purposeOptions, referralOptions, storeLocations } from "./form-options";

const onboardingUrl = "https://deepam-onboarding-form.adityashrm500.workers.dev/";

type FormState = {
  fullName: string;
  contactNumber: string;
  email: string;
  storeLocation: string;
  area: string;
  city: string;
  dateOfBirth: string;
  anniversary: string;
  referralSource: string;
  purposeOfVisit: string;
  website: string;
};

const initialForm: FormState = {
  fullName: "",
  contactNumber: "",
  email: "",
  storeLocation: "",
  area: "",
  city: "",
  dateOfBirth: "",
  anniversary: "",
  referralSource: "",
  purposeOfVisit: "",
  website: "",
};

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const isComplete = status === "success";

  function update(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Unable to save your submission.");
      setForm(initialForm);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <header className="site-header">
        <a href="https://www.deepam.com/" aria-label="Deepam by Ananta home">
          <Image src="/deepam-logo-horizontal.png" alt="Deepam by Ananta" width={4500} height={1734} priority />
        </a>
      </header>

      <main className="onboarding-section">
        <div className="onboarding-intro reading-width">
          <h1><strong>Deepam By Ananta</strong></h1>
          <p>Tell us a little about yourself so we can make your visit more personal.</p>
        </div>

        <div className="onboarding-card reading-width">
          <form onSubmit={submit} aria-describedby="form-status">
            <fieldset hidden={isComplete}>
              <legend>Contact details</legend>
              <div className="form-grid">
                <div className="span-all">
                  <label htmlFor="full-name">Full Name <span aria-hidden="true">*</span></label>
                  <input id="full-name" name="fullName" type="text" autoComplete="name" maxLength={100} required value={form.fullName} onChange={(event) => update("fullName", event.target.value)} />
                </div>
                <div>
                  <label htmlFor="contact-number">Contact Number <span aria-hidden="true">*</span></label>
                  <input id="contact-number" name="contactNumber" type="tel" autoComplete="tel" maxLength={25} required value={form.contactNumber} onChange={(event) => update("contactNumber", event.target.value)} />
                </div>
                <div>
                  <label htmlFor="email">Email ID <span>(Optional)</span></label>
                  <input id="email" name="email" type="email" autoComplete="email" maxLength={254} value={form.email} onChange={(event) => update("email", event.target.value)} />
                </div>
                <div>
                  <label htmlFor="store-location">Store location <span aria-hidden="true">*</span></label>
                  <select id="store-location" name="storeLocation" required value={form.storeLocation} onChange={(event) => update("storeLocation", event.target.value)}>
                    <option value="" disabled>Please select a store</option>
                    {storeLocations.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset hidden={isComplete}>
              <legend>Additional details <span>(Optional)</span></legend>
              <div className="form-grid">
                <div>
                  <label htmlFor="area">Area</label>
                  <input id="area" name="area" type="text" autoComplete="address-level3" maxLength={100} value={form.area} onChange={(event) => update("area", event.target.value)} />
                </div>
                <div>
                  <label htmlFor="city">City</label>
                  <input id="city" name="city" type="text" autoComplete="address-level2" maxLength={100} value={form.city} onChange={(event) => update("city", event.target.value)} />
                </div>
                <div>
                  <label htmlFor="date-of-birth">Date of Birth</label>
                  <input id="date-of-birth" name="dateOfBirth" type="date" autoComplete="bday" value={form.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} />
                </div>
                <div>
                  <label htmlFor="anniversary">Anniversary</label>
                  <input id="anniversary" name="anniversary" type="date" autoComplete="off" value={form.anniversary} onChange={(event) => update("anniversary", event.target.value)} />
                </div>
              </div>
            </fieldset>

            <fieldset hidden={isComplete}>
              <legend>How did you hear about us? <span aria-hidden="true">*</span></legend>
              <div>
                <label htmlFor="referral-source">Select an option</label>
                <select id="referral-source" name="referralSource" required value={form.referralSource} onChange={(event) => update("referralSource", event.target.value)}>
                  <option value="" disabled>Please select</option>
                  {referralOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </fieldset>

            <fieldset hidden={isComplete}>
              <legend>Purpose of Visit <span aria-hidden="true">*</span></legend>
              <div>
                <label htmlFor="purpose-of-visit">Select an option</label>
                <select id="purpose-of-visit" name="purposeOfVisit" required value={form.purposeOfVisit} onChange={(event) => update("purposeOfVisit", event.target.value)}>
                  <option value="" disabled>Please select</option>
                  {purposeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </fieldset>

            <div className="honeypot" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} />
            </div>
            <input type="hidden" name="formName" value="Onboarding form" />

            <p id="form-status" className={`form-status${status === "error" ? " is-error" : ""}`} role="status" aria-live="polite" hidden={status !== "success" && status !== "error"}>
              {status === "success" ? "Your details have been submitted successfully." : "Unable to save your submission. Please try again."}
            </p>
            <button className="submit-button" type="submit" disabled={status === "submitting"} hidden={isComplete}>
              {status === "submitting" ? "Submitting…" : "Submit"}
            </button>
          </form>
        </div>

        <a className="visually-hidden" href={onboardingUrl}>Open the Deepam onboarding form</a>
      </main>
    </>
  );
}
