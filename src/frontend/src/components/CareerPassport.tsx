import { createActor } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { CREDENTIALS, useCareerProgress } from "@/game/careerProgress";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useProfile } from "@/hooks/useProfile";
import { useQuests } from "@/hooks/useQuests";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

export default function CareerPassport({ onClose }: { onClose: () => void }) {
  const progress = useCareerProgress();
  const { data: profile } = useProfile();
  const { completedQuests } = useQuests();
  const completed = new Set(completedQuests.map((quest) => quest.questId));
  const { actor } = useActor(createActor);
  const { data: journal } = useQuery({
    queryKey: ["career-journal"],
    enabled: Boolean(actor),
    queryFn: async () => {
      if (!actor) return { resumes: [], letters: [], interviews: [] };
      const [resumes, letters, interviews] = await Promise.all([
        actor.listResumes(),
        actor.listCoverLetters(),
        actor.listInterviewNotes(),
      ]);
      return { resumes, letters, interviews };
    },
  });
  const credentials = Object.values(CREDENTIALS);
  const modalRef = useRef<HTMLElement>(null);
  useModalFocus(modalRef, onClose);
  const copyShareLink = (path: string) =>
    navigator.clipboard
      .writeText(`${window.location.origin}${path}`)
      .catch(() =>
        window.alert("Copy failed. Please copy the URL from the address bar."),
      );

  return (
    <div className="game-modal-backdrop" data-ocid="passport.dialog">
      <section
        ref={modalRef}
        className="game-modal passport-panel"
        aria-label="Career Passport"
      >
        <button className="modal-close" type="button" onClick={onClose}>
          Close
        </button>
        <p className="eyebrow">CAREER CITY RECORD</p>
        <h1>CAREER PASSPORT</h1>
        <p className="modal-lede">
          Your choices now leave a trail. Build skills, earn credentials, and
          restore the Career Compass.
        </p>

        <div className="passport-grid">
          <PassportSection title="Credentials">
            {credentials.map((credential) => (
              <div
                className={`passport-chip ${progress.credentials.includes(credential) ? "earned" : ""}`}
                key={credential}
              >
                {progress.credentials.includes(credential) ? "CHECK " : "LOCK "}
                {credential}
              </div>
            ))}
          </PassportSection>

          <PassportSection title="Skill Tree">
            {Object.entries(progress.skills).map(([skill, rank]) => (
              <div className="skill-row" key={skill}>
                <span>{skill.replace(/([A-Z])/g, " $1")}</span>
                <span aria-label={`${rank} of 3`}>
                  {[0, 1, 2].map((slot) => (slot < rank ? "■" : "□")).join(" ")}
                </span>
              </div>
            ))}
          </PassportSection>

          <PassportSection title="Backpack">
            <p>
              {profile?.inventory.length
                ? profile.inventory
                    .map((item) => item.replaceAll("_", " "))
                    .join(", ")
                : "Your backpack is ready for preparation tools."}
            </p>
            <p>
              Saved work travels with you: resumes, cover letters, and interview
              notes are available to the next workshop.
            </p>
          </PassportSection>

          <PassportSection title="Career Journal">
            <p>
              {journal
                ? `${journal.resumes.length} saved resume${journal.resumes.length === 1 ? "" : "s"}, ${journal.letters.length} cover letter${journal.letters.length === 1 ? "" : "s"}, and ${journal.interviews.length} interview note${journal.interviews.length === 1 ? "" : "s"}.`
                : "Your saved work will appear here."}
            </p>
            <div className="path-buttons">
              {journal?.resumes.at(-1) && (
                <button
                  type="button"
                  onClick={() =>
                    void copyShareLink(
                      `/share/resume/${journal.resumes.at(-1)!.shareToken}`,
                    )
                  }
                >
                  Copy latest resume share link
                </button>
              )}
              {journal?.letters.at(-1) && (
                <button
                  type="button"
                  onClick={() =>
                    void copyShareLink(
                      `/share/cover-letter/${journal.letters.at(-1)!.shareToken}`,
                    )
                  }
                >
                  Copy latest cover-letter share link
                </button>
              )}
            </div>
          </PassportSection>

          <PassportSection title="Opportunity Board">
            <p>
              {progress.chapterComplete
                ? "Choose any role path to replay the workshops with a different career-story focus."
                : "Complete Chapter 1 to unlock replayable role paths."}
            </p>
            <div className="path-buttons">
              {[
                ["path_engineering", "Engineering"],
                ["path_product", "Product"],
                ["path_operations", "Operations"],
              ].map(([missionId, label]) => (
                <button
                  type="button"
                  className={completed.has(missionId!) ? "selected" : ""}
                  disabled={!progress.chapterComplete}
                  key={missionId}
                  onClick={() =>
                    GameBridge.emit("missionCompleted", {
                      missionId: missionId as
                        | "path_engineering"
                        | "path_product"
                        | "path_operations",
                    })
                  }
                >
                  {completed.has(missionId!) ? "Selected: " : ""}
                  {label}
                </button>
              ))}
            </div>
          </PassportSection>

          <PassportSection title="Career Stories">
            <p>
              {completed.has("meet_everyone")
                ? "Collected: Preparation creates options. Evidence makes your impact memorable. Feedback is information, not a penalty."
                : "Meet every mentor to collect Career City's first story."}
            </p>
          </PassportSection>

          <PassportSection title="Chapter Status">
            <p className={progress.chapterComplete ? "success-text" : ""}>
              {progress.chapterComplete
                ? "Career Compass restored. District Two role paths are unlocked on the Opportunity Board."
                : "Earn the Tailored Resume and Interview Badge, then report to Ed."}
            </p>
          </PassportSection>
        </div>
      </section>
    </div>
  );
}

function PassportSection({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div className="passport-section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
