import { GameBridge } from "@/game/GameBridge";
import { loadCareerProgress } from "@/game/careerProgress";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "career_city_journey_stage";

const STEPS = [
  [
    "Meet the Town Guide",
    "Find Sam on the bench and press E, Enter, or Space to talk.",
  ],
  ["Enter Vera's Workshop", "Walk upward through the Resume Tailor door."],
  [
    "Craft Your First Credential",
    "Talk to Vera inside and complete a resume tailoring session.",
  ],
  ["Visit Felix", "Enter the Item Shop and speak with Felix."],
  ["Choose a Power-Up", "Spend XP on one item in Felix's shop."],
  [
    "Train With Chad",
    "Enter the Interview Coach building and answer one question.",
  ],
  [
    "Report to the Recruiter",
    "Return to Town Square and talk to Ed to finish this chapter.",
  ],
  [
    "Chapter Complete",
    "Career City is open. Explore side quests and sharpen your skills.",
  ],
] as const;

function loadStage(): number {
  const stored = Number.parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
  return Number.isFinite(stored)
    ? Math.min(Math.max(stored, 0), STEPS.length - 1)
    : 0;
}

export default function JourneyGuide() {
  const [stage, setStage] = useState(loadStage);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const advanceTo = (next: number) => {
      setStage((current) => {
        if (next <= current) return current;
        localStorage.setItem(STORAGE_KEY, String(next));
        return next;
      });
    };

    const unsubs = [
      GameBridge.on("dialogueOpened", (data) => {
        const npc = data as { id?: string };
        if (npc?.id === "sam_sage") advanceTo(1);
      }),
      GameBridge.on("interiorEntered", (data) => {
        const payload = data as { locationId?: string };
        if (payload?.locationId === "resume_tailor") advanceTo(2);
        if (payload?.locationId === "item_shop" && loadStage() >= 3)
          advanceTo(4);
      }),
      GameBridge.on("xpGained", (data) => {
        const payload = data as { reason?: string };
        if (payload?.reason === "resume_tailored") advanceTo(3);
        if (payload?.reason === "interview_answer") advanceTo(6);
      }),
      GameBridge.on("shopItemPurchased", () => advanceTo(5)),
      GameBridge.on("careerProgressUpdated", () => {
        if (loadCareerProgress().chapterComplete) advanceTo(7);
      }),
    ];

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  const progress = useMemo(
    () => Math.round((stage / (STEPS.length - 1)) * 100),
    [stage],
  );

  return (
    <aside
      aria-label="Current journey objective"
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 1000,
        width: collapsed ? 48 : "min(340px, calc(100vw - 90px))",
        background: "rgba(4,4,20,0.96)",
        border: "2px solid rgba(255,170,0,0.8)",
        boxShadow: "0 0 16px rgba(255,170,0,0.2)",
        color: "#f4f0ff",
        fontFamily: '"Space Grotesk", sans-serif',
        pointerEvents: "auto",
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
        aria-label={
          collapsed ? "Show journey objective" : "Hide journey objective"
        }
        style={{
          width: "100%",
          minHeight: 44,
          padding: collapsed ? 0 : "8px 12px",
          background: "transparent",
          border: "none",
          color: "#ffaa00",
          font: "inherit",
          fontWeight: 700,
          cursor: "pointer",
          textAlign: collapsed ? "center" : "left",
        }}
      >
        {collapsed ? "!" : `CHAPTER 1  ${stage + 1}/${STEPS.length}`}
      </button>
      {!collapsed && (
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
            {STEPS[stage][0]}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.45, color: "#d8d4e8" }}>
            {STEPS[stage][1]}
          </div>
          <div
            aria-label={`${progress}% chapter progress`}
            style={{
              height: 5,
              background: "#252238",
              marginTop: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "#ffaa00",
              }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
