"use client";

import { useEffect, useState } from "react";

const referralOptions = ["Instagram", "Facebook", "Google Search", "WhatsApp", "Billboard / LED", "Apartment Advertisement", "Friend / Family", "Existing Customer", "Walk-in", "Other"];
const purposeOptions = ["Varamahalakshmi Shopping", "Wedding Shopping", "Bridal Shopping", "Gift Purchase", "Festive Shopping", "Personal Shopping", "Browsing Only", "Other"];

type FormState = {
  fullName: string; contactNumber: string; email: string; storeLocation: string;
  area: string; city: string; dateOfBirth: string; anniversary: string;
  referralSource: string; purposeOfVisit: string; website: string;
};

const initialForm: FormState = { fullName: "", contactNumber: "", email: "", storeLocation: "", area: "", city: "", dateOfBirth: "", anniversary: "", referralSource: "", purposeOfVisit: "", website: "" };

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    setQrUrl(`${window.location.origin}/`);
  }, []);

  function update(key: keyof FormState, value: string) { setForm((current) => ({ ...current, [key]: value })); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    try {
      const response = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error("Submission failed");
      setForm(initialForm); setStatus("success");
    } catch { setStatus("error"); }
  }

  return (
    <main className="page-shell">
      <header className="brand-header"><img src="/deepam-logo.png" alt="Deepam by Ananta" /></header>
      <section className="form-card" aria-labelledby="form-title">
        <div className="intro"><p className="eyebrow">DEEPAM BY ANANTA</p><h1 id="form-title">Tell us a little about yourself</h1><p>So we can make your visit more personal.</p></div>
        <form onSubmit={submit}>
          <fieldset><legend>Contact details</legend>
            <div className="field-grid">
              <label>Full Name <span>*</span><input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} /></label>
              <label>Contact Number <span>*</span><input required type="tel" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} /></label>
              <label>Email ID <em>(Optional)</em><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
              <label>Store location <span>*</span><select required value={form.storeLocation} onChange={(e) => update("storeLocation", e.target.value)}><option value="">Please select a store</option><option>MG Road</option><option>Jayanagar</option></select></label>
            </div>
          </fieldset>
          <fieldset><legend>Additional details <em>(Optional)</em></legend>
            <div className="field-grid">
              <label>Area<input value={form.area} onChange={(e) => update("area", e.target.value)} /></label><label>City<input value={form.city} onChange={(e) => update("city", e.target.value)} /></label>
              <label>Date of Birth<input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} /></label><label>Anniversary<input type="date" value={form.anniversary} onChange={(e) => update("anniversary", e.target.value)} /></label>
            </div>
          </fieldset>
          <fieldset><legend>How did you hear about us? <span>*</span></legend><label className="full-field"><select required value={form.referralSource} onChange={(e) => update("referralSource", e.target.value)}><option value="">Please select</option>{referralOptions.map((option) => <option key={option}>{option}</option>)}</select></label></fieldset>
          <fieldset><legend>Purpose of Visit <span>*</span></legend><label className="full-field"><select required value={form.purposeOfVisit} onChange={(e) => update("purposeOfVisit", e.target.value)}><option value="">Please select</option>{purposeOptions.map((option) => <option key={option}>{option}</option>)}</select></label></fieldset>
          <input className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => update("website", e.target.value)} />
          <button type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Submitting…" : "Submit"}</button>
          {status === "success" && <p className="notice success">Thank you. We look forward to welcoming you.</p>}{status === "error" && <p className="notice error">Something went wrong. Please try again.</p>}
        </form>
      </section>
      <aside className="qr-panel"><div><p className="eyebrow">SHARE THE EXPERIENCE</p><h2>Scan to fill the form</h2><p>Keep this QR code handy for your store visitors.</p></div><div className="qr-frame"><img src="/deepam-onboarding-qr.png" alt="QR code for the Deepam onboarding form" /></div><p className="qr-url">{qrUrl}</p></aside>
    </main>
  );
}
