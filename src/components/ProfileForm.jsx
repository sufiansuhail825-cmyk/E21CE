import React from "react";

const TEACHING_LEVELS = [
  "Early Years / Pre-Primary",
  "Primary (Grades 1-5)",
  "Middle School (Grades 6-8)",
  "Secondary / High School (Grades 9-12)",
  "Higher Education",
  "Vocational / Technical",
  "Special Education",
  "Other",
];

const YEARS_OPTIONS = [
  "Less than 1 year",
  "1-3 years",
  "4-6 years",
  "7-10 years",
  "11-15 years",
  "16-20 years",
  "More than 20 years",
];

export default function ProfileForm({ profile, setProfile, onNext, onBack }) {
  const update = (field, value) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const toggleLevel = (level) => {
    const current = profile.teachingLevels || [];
    if (current.includes(level)) {
      update("teachingLevels", current.filter((l) => l !== level));
    } else {
      update("teachingLevels", [...current, level]);
    }
  };

  const isValid =
    profile.name.trim() &&
    profile.organisation.trim() &&
    profile.role.trim() &&
    profile.yearsExperience &&
    (profile.teachingLevels || []).length > 0;

  return (
    <div className="stage-container">
      <div className="stage-header">
        <div className="stage-label">Before We Begin</div>
        <h1 className="stage-title">Your Professional Profile</h1>
        <p className="stage-intro">
          This information provides context for your report. It is only shared with
          the Centre for Advanced Learning (CAL) alongside your assessment results.
        </p>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Full Name <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            className="form-input"
            value={profile.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="organisation">
            Institution / Organisation <span className="required">*</span>
          </label>
          <input
            id="organisation"
            type="text"
            className="form-input"
            value={profile.organisation}
            onChange={(e) => update("organisation", e.target.value)}
            placeholder="School, college, or institution name"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="role">
            Role / Designation <span className="required">*</span>
          </label>
          <input
            id="role"
            type="text"
            className="form-input"
            value={profile.role}
            onChange={(e) => update("role", e.target.value)}
            placeholder="e.g. Class Teacher, Head of Department, Lecturer"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="yearsExperience">
            Years of Teaching Experience <span className="required">*</span>
          </label>
          <select
            id="yearsExperience"
            className="form-select"
            value={profile.yearsExperience}
            onChange={(e) => update("yearsExperience", e.target.value)}
          >
            <option value="">Select...</option>
            {YEARS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Level(s) at Which You Primarily Teach <span className="required">*</span>
          </label>
          <p className="form-hint">Select all that apply.</p>
          <div className="checkbox-grid">
            {TEACHING_LEVELS.map((level) => {
              const checked = (profile.teachingLevels || []).includes(level);
              return (
                <label key={level} className={`checkbox-option ${checked ? "checked" : ""}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLevel(level)}
                  />
                  <span>{level}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="stage-nav">
        <button className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!isValid}
        >
          Continue to Self-Assessment
        </button>
      </div>
    </div>
  );
}
