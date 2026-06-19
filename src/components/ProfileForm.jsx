import React from "react";

const LEVELS = ["Primary", "Middle School", "High School", "Higher Education", "Mixed / Other"];
const CURRICULA = ["CBSE", "IB MYP / DP", "IGCSE / Cambridge", "State Board", "University UG / PG"];
const MODES = ["In-Person", "Online / Remote", "Blended / Hybrid"];

function ChipGroup({ options, value, onChange, label }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="option-grid">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`option-chip ${value === opt ? "option-chip--selected" : ""}`}
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProfileForm({ profile, setProfile, onNext, onBack }) {
  const set = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.value }));
  const setChip = (key) => (val) => setProfile((p) => ({ ...p, [key]: val }));

  const canProceed = profile.name.trim().length > 0 && profile.organisation.trim().length > 0;

  return (
    <div className="page">
      <header className="topbar" style={{ marginLeft: -28, marginRight: -28, marginBottom: 36 }}>
        <div className="topbar__logo-frame">
          <img src="/cal-logo-mark.png" alt="Centre for Advanced Learning, Manav Rachna University" className="topbar__logo" />
        </div>
      </header>

      <p className="eyebrow">Step 1 of 4</p>
      <h2 style={{ fontSize: 30, marginTop: 10, marginBottom: 8 }}>Tell us about yourself</h2>
      <p style={{ color: "var(--text-mid)", marginBottom: 32 }}>
        This information appears on your Educator Competency Report and helps CAL recommend the right professional development pathway.
      </p>

      <div className="field">
        <label htmlFor="name">Full Name *</label>
        <input id="name" type="text" value={profile.name} onChange={set("name")} placeholder="e.g. Suffian Suhail" />
      </div>

      <div className="field">
        <label htmlFor="organisation">Organisation / Institution *</label>
        <input id="organisation" type="text" value={profile.organisation} onChange={set("organisation")} placeholder="e.g. Manav Rachna International School, Sector 51" />
      </div>

      <div className="field">
        <label htmlFor="department">Department / Subject Area</label>
        <input id="department" type="text" value={profile.department} onChange={set("department")} placeholder="e.g. Design Technology, IB MYP" />
      </div>

      <div className="field">
        <label htmlFor="years">Years of Teaching Experience</label>
        <input id="years" type="number" min="0" value={profile.yearsExperience} onChange={set("yearsExperience")} placeholder="e.g. 8" style={{ maxWidth: 160 }} />
      </div>

      <ChipGroup label="Level of Delivery" options={LEVELS} value={profile.levelOfDelivery} onChange={setChip("levelOfDelivery")} />
      <ChipGroup label="Curriculum Context" options={CURRICULA} value={profile.curriculum} onChange={setChip("curriculum")} />
      <ChipGroup label="Mode of Delivery" options={MODES} value={profile.modeOfDelivery} onChange={setChip("modeOfDelivery")} />

      <div className="nav-row">
        <button className="btn btn--ghost" onClick={onBack}>← Back</button>
        <button className="btn btn--primary" onClick={onNext} disabled={!canProceed}>
          Continue to reflection →
        </button>
      </div>
    </div>
  );
}
