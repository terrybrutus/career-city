import { GameBridge } from "@/game/GameBridge";
import { loadCareerProgress } from "@/game/careerProgress";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "career_city_journey_stage";
const STEPS = [
  [
    "Meet Sam, Your Guide",
    "Find Sam by the bench. Talk to him to learn your first goal.",
  ],
  ["Enter Vera's Workshop", "Walk through the Resume Tailor door."],
  [
    "Craft Your First Credential",
    "Talk to Vera and complete a resume tailoring session.",
  ],
  ["Visit Felix", "Enter the Item Shop and speak with Felix."],
  ["Choose a Power-Up", "Spend XP on one item in Felix's shop."],
  ["Train With Chad", "Enter the Interview Coach and answer one question."],
  [
    "Report to Ed",
    "Return to Town Square and talk to Ed to finish the chapter.",
  ],
  [
    "Chapter Complete",
    "Explore side activities and keep sharpening your skills.",
  ],
] as const;

function loadStage(): number {
  return Math.min(
    Math.max(
      Number.parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0,
      0,
    ),
    STEPS.length - 1,
  );
}

export default function JourneyGuide({
  mode = "tracker",
}: { mode?: "tracker" | "panel" }) {
  const [stage, setStage] = useState(loadStage);
  useEffect(() => {
    const advanceTo = (next: number) =>
      setStage((current) => {
        if (next <= current) return current;
        localStorage.setItem(STORAGE_KEY, String(next));
        return next;
      });
    const unsubs = [
      GameBridge.on("dialogueOpened", (data) => {
        if ((data as { id?: string })?.id === "sam_sage") advanceTo(1);
      }),
      GameBridge.on("interiorEntered", (data) => {
        const id = (data as { locationId?: string })?.locationId;
        if (id === "resume_tailor") advanceTo(2);
        if (id === "item_shop" && loadStage() >= 3) advanceTo(4);
      }),
      GameBridge.on("xpGained", (data) => {
        const reason = (data as { reason?: string })?.reason;
        if (reason === "resume_tailored") advanceTo(3);
        if (reason === "interview_answer") advanceTo(6);
      }),
      GameBridge.on("shopItemPurchased", () => advanceTo(5)),
      GameBridge.on("careerProgressUpdated", () => {
        if (loadCareerProgress().chapterComplete) advanceTo(7);
      }),
    ];
    return () => {
      for (const unsubscribe of unsubs) unsubscribe();
    };
  }, []);
  const progress = useMemo(
    () => Math.round((stage / (STEPS.length - 1)) * 100),
    [stage],
  );

  if (mode === "panel") {
    return (
      <div className="journey-panel">
        <div className="journey-heading">
          <strong>CHAPTER 1</strong>
          <span>
            STEP {stage + 1} OF {STEPS.length}
          </span>
        </div>
        <h3>{STEPS[stage][0]}</h3>
        <p>{STEPS[stage][1]}</p>
        <div className="journey-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <ol>
          {STEPS.map((step, index) => (
            <li
              className={
                index === stage ? "current" : index < stage ? "done" : ""
              }
              key={step[0]}
            >
              {step[0]}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <aside className="journey-guide" aria-label="Current journey objective">
      <div className="journey-heading">
        <strong>CHAPTER 1</strong>
        <span>
          STEP {stage + 1} OF {STEPS.length}
        </span>
      </div>
      <div className="journey-tracker-detail">
        <strong>{STEPS[stage][0]}</strong>
        <span>{STEPS[stage][1]}</span>
      </div>
    </aside>
  );
}
