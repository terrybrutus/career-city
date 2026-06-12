import { CHAPTER_ONE, MISSIONS } from "@/game/missions";
import { useQuests } from "@/hooks/useQuests";
import { useMemo } from "react";

export default function JourneyGuide({
  mode = "tracker",
}: { mode?: "tracker" | "panel" }) {
  const { completedQuests } = useQuests();
  const completed = useMemo(
    () => new Set(completedQuests.map((quest) => quest.questId)),
    [completedQuests],
  );
  const firstIncomplete = CHAPTER_ONE.findIndex(
    (mission) => !completed.has(mission.id),
  );
  const active =
    CHAPTER_ONE[
      firstIncomplete < 0 ? CHAPTER_ONE.length - 1 : firstIncomplete
    ]!;
  const progress = Math.round(
    (CHAPTER_ONE.filter((mission) => completed.has(mission.id)).length /
      CHAPTER_ONE.length) *
      100,
  );

  if (mode === "panel") {
    return (
      <div className="journey-panel">
        <div className="journey-heading">
          <strong>CHAPTER 1</strong>
          <span>{progress}% COMPLETE</span>
        </div>
        <h3>{active.title}</h3>
        <p>{active.objective}</p>
        <div className="journey-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <ol>
          {CHAPTER_ONE.map((mission) => (
            <li
              className={
                completed.has(mission.id)
                  ? "done"
                  : mission.id === active.id
                    ? "current"
                    : ""
              }
              key={mission.id}
            >
              {mission.title}
            </li>
          ))}
        </ol>
        <h3>Optional Opportunities</h3>
        <ol>
          {MISSIONS.filter((mission) => mission.optional).map((mission) => (
            <li
              className={completed.has(mission.id) ? "done" : ""}
              key={mission.id}
            >
              {mission.title}
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
          {CHAPTER_ONE.filter((mission) => completed.has(mission.id)).length} /{" "}
          {CHAPTER_ONE.length}
        </span>
      </div>
      <div className="journey-tracker-detail">
        <strong>{active.title}</strong>
        <span>{active.objective}</span>
      </div>
    </aside>
  );
}
