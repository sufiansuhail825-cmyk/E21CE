import React, { useState, useCallback } from "react";
import questionsData from "./data/questions.json";
import { computeScores, completionStats } from "./utils/scoring.js";
import Welcome from "./components/Welcome.jsx";
import ProfileForm from "./components/ProfileForm.jsx";
import PreReflection from "./components/PreReflection.jsx";
import Assessment from "./components/Assessment.jsx";
import PostReflection from "./components/PostReflection.jsx";
import Report from "./components/Report.jsx";
import "./styles/app.css";

const STAGES = {
  WELCOME: "welcome",
  PROFILE: "profile",
  PRE_REFLECTION: "pre_reflection",
  ASSESSMENT: "assessment",
  POST_REFLECTION: "post_reflection",
  REPORT: "report",
};

export default function App() {
  const [stage, setStage] = useState(STAGES.WELCOME);
  const [profile, setProfile] = useState({
    name: "",
    organisation: "",
    department: "",
    yearsExperience: "",
    levelOfDelivery: "",
    curriculum: "",
    modeOfDelivery: "",
  });
  const [preReflection, setPreReflection] = useState({ b1: "", b2: "", b3: "", b4: "" });
  const [postReflection, setPostReflection] = useState({ h1: "", h2: "", h3: "", h4: "", h5: "" });
  const [responses, setResponses] = useState({}); // { questionId: value }
  const [submitted, setSubmitted] = useState(false);

  const updateResponse = useCallback((questionId, value) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const goTo = (s) => {
    setStage(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stats = completionStats(questionsData, responses);
  const results = stage === STAGES.REPORT ? computeScores(questionsData, responses) : null;

  return (
    <div className="app-shell">
      {stage === STAGES.WELCOME && (
        <Welcome onStart={() => goTo(STAGES.PROFILE)} />
      )}

      {stage === STAGES.PROFILE && (
        <ProfileForm
          profile={profile}
          setProfile={setProfile}
          onNext={() => goTo(STAGES.PRE_REFLECTION)}
          onBack={() => goTo(STAGES.WELCOME)}
        />
      )}

      {stage === STAGES.PRE_REFLECTION && (
        <PreReflection
          values={preReflection}
          setValues={setPreReflection}
          onNext={() => goTo(STAGES.ASSESSMENT)}
          onBack={() => goTo(STAGES.PROFILE)}
        />
      )}

      {stage === STAGES.ASSESSMENT && (
        <Assessment
          domains={questionsData}
          responses={responses}
          updateResponse={updateResponse}
          stats={stats}
          onComplete={() => goTo(STAGES.POST_REFLECTION)}
          onBack={() => goTo(STAGES.PRE_REFLECTION)}
        />
      )}

      {stage === STAGES.POST_REFLECTION && (
        <PostReflection
          values={postReflection}
          setValues={setPostReflection}
          onNext={() => goTo(STAGES.REPORT)}
          onBack={() => goTo(STAGES.ASSESSMENT)}
        />
      )}

      {stage === STAGES.REPORT && results && (
        <Report
          profile={profile}
          preReflection={preReflection}
          postReflection={postReflection}
          results={results}
          domains={questionsData}
          submitted={submitted}
          setSubmitted={setSubmitted}
        />
      )}
    </div>
  );
}
