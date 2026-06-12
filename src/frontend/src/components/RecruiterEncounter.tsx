import { GameBridge } from "@/game/GameBridge";
import { CREDENTIALS, useCareerProgress } from "@/game/careerProgress";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useState } from "react";
import { useRef } from "react";

const QUESTIONS = [
  {
    prompt: "Ed asks: What makes your application memorable?",
    choices: [
      ["A specific result that proves my impact.", true],
      ["I am passionate, hardworking, and detail-oriented.", false],
      ["My resume uses a very exciting font.", false],
    ] as const,
  },
  {
    prompt: "Ed follows up: How will you answer a behavioral question?",
    choices: [
      ["Tell a focused STAR story with a measurable result.", true],
      ["Speak until everyone forgets the original question.", false],
      ["Say my greatest weakness is perfectionism.", false],
    ] as const,
  },
  {
    prompt: "Final question: What do you do after a setback?",
    choices: [
      ["Use the feedback, practice, and try again.", true],
      ["Assume the market has a personal vendetta.", false],
      ["Delete LinkedIn and move into the fountain.", false],
    ] as const,
  },
];

export default function RecruiterEncounter({
  onClose,
}: { onClose: () => void }) {
  const progress = useCareerProgress();
  const modalRef = useRef<HTMLElement>(null);
  useModalFocus(modalRef, onClose);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [finished, setFinished] = useState(false);
  const ready =
    progress.credentials.includes(CREDENTIALS.resume) &&
    progress.credentials.includes(CREDENTIALS.interview);

  const choose = (correct: boolean) => {
    const nextScore = score + (correct ? 1 : 0);
    setScore(nextScore);
    setFeedback(
      correct
        ? "Strong choice. Specific, useful, and easy to remember."
        : "That answer needs another pass. Ed gives you a coaching note, not a penalty.",
    );
    if (round === QUESTIONS.length - 1) {
      setFinished(true);
      if (nextScore >= 2 && !progress.chapterComplete) {
        GameBridge.emit("missionCompleted", {
          missionId: "chapter_one_complete",
        });
      }
    } else {
      setTimeout(() => {
        setRound((value) => value + 1);
        setFeedback("");
      }, 650);
    }
  };

  const reset = () => {
    setRound(0);
    setScore(0);
    setFeedback("");
    setFinished(false);
  };

  return (
    <div className="game-modal-backdrop" data-ocid="recruiter_encounter.dialog">
      <section
        ref={modalRef}
        className="game-modal encounter-panel"
        aria-label="Recruiter encounter"
      >
        <button className="modal-close" type="button" onClick={onClose}>
          Close
        </button>
        <p className="eyebrow">CHAPTER 1 FINALE</p>
        <h1>THE RECRUITER ENCOUNTER</h1>

        {!ready ? (
          <>
            <p className="modal-lede">
              Ed checks your passport. You need both the Tailored Resume and
              Interview Badge before the recruiter challenge unlocks.
            </p>
            <button
              className="encounter-choice"
              type="button"
              onClick={onClose}
            >
              RETURN TO TRAINING
            </button>
          </>
        ) : finished ? (
          <>
            <p className="encounter-result">
              {score >= 2
                ? `PASS: ${score}/3. You restored the Career Compass and completed Chapter 1.`
                : `COACHING RETRY: ${score}/3. Ed marks the weak spots and invites you to try again.`}
            </p>
            <button
              className="encounter-choice"
              type="button"
              onClick={score >= 2 ? onClose : reset}
            >
              {score >= 2 ? "CONTINUE EXPLORING" : "TRY AGAIN"}
            </button>
          </>
        ) : (
          <>
            <div className="encounter-progress">
              ROUND {round + 1}/{QUESTIONS.length}
            </div>
            <p className="encounter-prompt">{QUESTIONS[round]!.prompt}</p>
            <div className="encounter-choices">
              {QUESTIONS[round]!.choices.map((choice) => (
                <button
                  className="encounter-choice"
                  type="button"
                  key={choice[0]}
                  onClick={() => choose(choice[1])}
                  disabled={Boolean(feedback)}
                >
                  {choice[0]}
                </button>
              ))}
            </div>
            {feedback && <p className="encounter-feedback">{feedback}</p>}
          </>
        )}
      </section>
    </div>
  );
}
