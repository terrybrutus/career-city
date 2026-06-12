import { CREDENTIALS, useCareerProgress } from "@/game/careerProgress";
import { useProfile } from "@/hooks/useProfile";

const NPC_NAMES: Record<string, string> = {
  sam_sage: "Sam",
  ed_recruiter: "Ed",
  vera_hr: "Vera",
  chad_coach: "Chad",
  penny_writer: "Penny",
  felix_shop: "Felix",
};

const LOCATION_NAMES: Record<string, string> = {
  town_square: "Town Square",
  resume_tailor: "Resume Tailor",
  cover_letter_corner: "Cover Letter Corner",
  interview_coach: "Interview Coach",
  item_shop: "Item Shop",
};

export default function CareerPassport({ onClose }: { onClose: () => void }) {
  const progress = useCareerProgress();
  const { data: profile } = useProfile();
  const credentials = Object.values(CREDENTIALS);

  return (
    <div className="game-modal-backdrop" data-ocid="passport.dialog">
      <section
        className="game-modal passport-panel"
        aria-label="Career Passport"
      >
        <button className="modal-close" type="button" onClick={onClose}>
          [ESC]
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

          <PassportSection title="People Met">
            <p>
              {progress.discoveredNpcs.length
                ? progress.discoveredNpcs
                    .map((id) => NPC_NAMES[id] ?? id)
                    .join(", ")
                : "No introductions yet."}
            </p>
          </PassportSection>

          <PassportSection title="Places Visited">
            <p>
              {progress.visitedLocations
                .map((id) => LOCATION_NAMES[id] ?? id)
                .join(", ")}
            </p>
          </PassportSection>

          <PassportSection title="Inventory">
            <p>
              {profile?.inventory.length
                ? profile.inventory
                    .map((item) => item.replaceAll("_", " "))
                    .join(", ")
                : "No power-ups acquired."}
            </p>
          </PassportSection>

          <PassportSection title="Chapter Status">
            <p className={progress.chapterComplete ? "success-text" : ""}>
              {progress.chapterComplete
                ? "Career Compass restored. District Two awaits."
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
