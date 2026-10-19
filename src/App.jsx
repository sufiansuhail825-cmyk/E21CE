import React, { useState, useCallback } from "react";
import preAssessmentData from "./data/preAssessment.json";
import scenarioData from "./data/scenarioAssessment.json";
import {
  computePreAssessmentScores,
  computeScenarioScores,
  buildComparison,
} from "./utils/scoring.js";
import Welcome from "./components/Welcome.jsx";
import ProfileForm from "./components/ProfileForm.jsx";
import PreAssessment from "./components/PreAssessment.jsx";
import ScenarioAssessment from "./components/ScenarioAssessment.jsx";
import Report from "./components/Report.jsx";
import "./styles/app.css";

const STAGES = {
  WELCOME:    "welcome",
  PROFILE:    "profile",
  PRE_ASSESS: "pre_assessment",
  SCENARIO:   "scenario_assessment",
  REPORT:     "report",
};

export default function App() {
  const [stage, setStage] = useState(STAGES.WELCOME);

  const [profile, setProfile] = useState({
    name:           "",
    organisation:   "",
    role:           "",
    yearsExperience:"",
    teachingLevels: [],
  });

  // Pre-assessment responses: { [strand.id]: 1|2|3|4|"na" }
  const [preResponses, setPreResponses] = useState({});

  // Scenario responses: { [questionId]: 0|1|2|3 }
  const [scenarioResponses, setScenarioResponses] = useState({});

  const [submitted, setSubmitted] = useState(false);

  const updatePreResponse = useCallback((strandId, value) => {
    setPreResponses((prev) => ({ ...prev, [strandId]: value }));
  }, []);

  const updateScenarioResponse = useCallback((questionId, value) => {
    setScenarioResponses((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const goTo = (s) => {
    setStage(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Compute results only when on the report stage
  const preResults =
    stage === STAGES.REPORT
      ? computePreAssessmentScores(preAssessmentData, preResponses)
      : null;

  const scenarioResults =
    stage === STAGES.REPORT
      ? computeScenarioScores(scenarioData, scenarioResponses)
      : null;

  const comparison =
    preResults && scenarioResults
      ? buildComparison(preResults, scenarioResults)
      : null;

  return (
    <div className="app-shell">
      {stage === STAGES.WELCOME && (
        <Welcome onStart={() => goTo(STAGES.PROFILE)} />
      )}

      {stage === STAGES.PROFILE && (
        <ProfileForm
          profile={profile}
          setProfile={setProfile}
          onNext={() => goTo(STAGES.PRE_ASSESS)}
          onBack={() => goTo(STAGES.WELCOME)}
        />
      )}

      {stage === STAGES.PRE_ASSESS && (
        <PreAssessment
          preAssessmentData={preAssessmentData}
          responses={preResponses}
          updateResponse={updatePreResponse}
          onComplete={() => goTo(STAGES.SCENARIO)}
          onBack={() => goTo(STAGES.PROFILE)}
        />
      )}

      {stage === STAGES.SCENARIO && (
        <ScenarioAssessment
          scenarioData={scenarioData}
          responses={scenarioResponses}
          updateResponse={updateScenarioResponse}
          onComplete={() => goTo(STAGES.REPORT)}
          onBack={() => goTo(STAGES.PRE_ASSESS)}
        />
      )}

      {stage === STAGES.REPORT && preResults && scenarioResults && comparison && (
        <Report
          profile={profile}
          preResults={preResults}
          scenarioResults={scenarioResults}
          comparison={comparison}
          submitted={submitted}
          setSubmitted={setSubmitted}
        />
      )}
    </div>
  );
}
