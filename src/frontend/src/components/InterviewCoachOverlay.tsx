import { createActor } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useProfile } from "@/hooks/useProfile";
import { useActor } from "@caffeineai/core-infrastructure";
import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

const ACCENT = "#ffaa00";
const ACCENT_DIM = "rgba(255,170,0,0.15)";
const BG = "rgba(10,8,2,0.97)";
const BORDER = `3px solid ${ACCENT}`;
const TEXT = "#f4ead0";
const DIM = "rgba(230,210,160,0.65)";
const FONT = '"Space Grotesk", monospace';

const CATEGORIES = [
  "Behavioral",
  "Technical",
  "Culture Fit",
  "Leadership",
  "Problem Solving",
];

function evidenceScore(answer: string): bigint {
  const lower = answer.toLowerCase();
  const checks = [
    answer.trim().split(/\s+/).length >= 45,
    /\d/.test(answer),
    ["i ", "my ", "me "].some((term) => lower.includes(term)),
    ["result", "outcome", "impact", "improved", "reduced", "increased"].some(
      (term) => lower.includes(term),
    ),
  ];
  return BigInt(checks.filter(Boolean).length * 25);
}

function rpgInput(extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(255,170,0,0.06)",
    border: "2px solid rgba(255,170,0,0.3)",
    color: TEXT,
    fontFamily: FONT,
    fontSize: 14,
    padding: "8px 12px",
    outline: "none",
    borderRadius: 1,
    boxSizing: "border-box",
    ...extra,
  };
}

type Phase = "setup" | "question" | "feedback";

interface InterviewState {
  jobTitle: string;
  category: string;
  question: string;
  answer: string;
  feedback: string;
  questionCount: number;
}

export default function InterviewCoachOverlay({
  onClose,
}: { onClose: () => void }) {
  const { actor } = useActor(createActor);
  const { data: profile } = useProfile();
  const modalRef = useRef<HTMLDivElement>(null);
  useModalFocus(modalRef, onClose);
  const hasConfidence =
    profile?.inventory.includes("confidence_elixir") ?? false;
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<InterviewState>({
    jobTitle: "",
    category: CATEGORIES[0]!,
    question: "",
    answer: "",
    feedback: "",
    questionCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const startInterview = useCallback(async () => {
    if (!actor) {
      setError("Not connected. Please try again.");
      return;
    }
    if (!state.jobTitle.trim()) {
      setError("Please enter the job title.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await actor.interviewQuestion(
        state.jobTitle,
        state.category,
        null,
        null,
      );
      if (res.__kind__ === "ok") {
        setState((s) => ({ ...s, question: res.ok, answer: "", feedback: "" }));
        setPhase("question");
      } else {
        setError(res.err ?? "Failed to get question.");
      }
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [actor, state.jobTitle, state.category]);

  const submitAnswer = useCallback(async () => {
    if (!actor) {
      setError("Not connected. Please try again.");
      return;
    }
    if (!state.answer.trim()) {
      setError("Please enter your answer.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await actor.interviewQuestion(
        state.jobTitle,
        state.category,
        state.question,
        state.answer,
      );
      if (res.__kind__ === "ok") {
        setState((s) => ({
          ...s,
          feedback: res.ok,
          questionCount: s.questionCount + 1,
        }));
        setPhase("feedback");
        await actor.createInterviewNote(
          BigInt(Date.now()) * 1_000_000n,
          state.jobTitle,
          state.question,
          state.answer,
          evidenceScore(state.answer),
        );
        GameBridge.emit("missionCompleted", {
          missionId: "practice_interview",
        });
      } else {
        setError(res.err ?? "Evaluation failed.");
      }
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [actor, state.jobTitle, state.category, state.question, state.answer]);

  const nextQuestion = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      const res = await actor.interviewQuestion(
        state.jobTitle,
        state.category,
        null,
        null,
      );
      if (res.__kind__ === "ok") {
        setState((s) => ({ ...s, question: res.ok, answer: "", feedback: "" }));
        setPhase("question");
      } else {
        setError(res.err ?? "Failed to get question.");
      }
    } catch {
      setError("Request failed.");
    } finally {
      setLoading(false);
    }
  }, [actor, state.jobTitle, state.category]);

  const handleClose = useCallback(() => {
    GameBridge.emit("careerToolClose", undefined);
    onClose();
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.84)",
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      data-ocid="interview_coach.dialog"
      ref={modalRef}
      aria-label="Interview Coach"
    >
      <div
        style={{
          background: BG,
          border: BORDER,
          boxShadow:
            "0 0 40px rgba(255,170,0,0.22), 0 0 80px rgba(255,170,0,0.07)",
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px 28px",
          fontFamily: FONT,
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close interview coach"
          data-ocid="interview_coach.close_button"
          style={{
            position: "absolute",
            top: 10,
            right: 14,
            background: "transparent",
            border: "none",
            color: DIM,
            fontSize: 18,
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          Close
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              color: ACCENT,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            ◈ CHAD'S HOT SEAT ◈
          </div>
          <div
            style={{
              fontSize: 22,
              color: ACCENT,
              textShadow: `0 0 12px ${ACCENT}`,
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            INTERVIEW COACH
          </div>
          {state.questionCount > 0 && (
            <div style={{ color: DIM, fontSize: 12, marginTop: 4 }}>
              Questions answered: {state.questionCount}
            </div>
          )}
        </div>

        {/* Setup phase */}
        {phase === "setup" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  color: ACCENT,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                What job are you interviewing for?
              </div>
              <input
                type="text"
                value={state.jobTitle}
                onChange={(e) =>
                  setState((s) => ({ ...s, jobTitle: e.target.value }))
                }
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Software Engineer"
                style={rpgInput()}
                data-ocid="interview_coach.job_title_input"
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  color: ACCENT,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                What's your interview focus?
              </div>
              <select
                value={state.category}
                onChange={(e) =>
                  setState((s) => ({ ...s, category: e.target.value }))
                }
                onKeyDown={(e) => e.stopPropagation()}
                style={rpgInput()}
                data-ocid="interview_coach.category_select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div
                style={{
                  color: "#ff4466",
                  fontSize: 13,
                  marginBottom: 12,
                  textAlign: "center",
                }}
                data-ocid="interview_coach.error_state"
              >
                ⚠ {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => void startInterview()}
              disabled={loading}
              data-ocid="interview_coach.start_button"
              style={{
                width: "100%",
                padding: "12px 0",
                background: loading ? ACCENT_DIM : ACCENT,
                border: "none",
                color: loading ? DIM : "#000",
                fontFamily: FONT,
                fontSize: 15,
                letterSpacing: "0.1em",
                cursor: loading ? "wait" : "pointer",
                fontWeight: 700,
              }}
            >
              {loading ? "LOADING QUESTION…" : "🎤 START INTERVIEW"}
            </button>

            {loading && (
              <div
                style={{
                  textAlign: "center",
                  color: DIM,
                  fontSize: 12,
                  marginTop: 10,
                }}
                data-ocid="interview_coach.loading_state"
              >
                Chad is preparing the hot seat…
              </div>
            )}
          </div>
        )}

        {/* Question phase */}
        {phase === "question" && (
          <div>
            <div
              style={{
                background: "rgba(255,170,0,0.08)",
                border: "1px solid rgba(255,170,0,0.3)",
                padding: "16px 18px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  color: ACCENT,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {state.category} Question
              </div>
              <div
                style={{
                  color: TEXT,
                  fontSize: 15,
                  lineHeight: 1.65,
                  wordBreak: "break-word",
                }}
                data-ocid="interview_coach.question_text"
              >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p style={{ margin: 0, color: TEXT }}>{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ color: ACCENT, fontWeight: 700 }}>
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {state.question}
                </ReactMarkdown>
              </div>
            </div>

            {hasConfidence && (
              <div style={{ marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowHint((value) => !value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    background: ACCENT_DIM,
                    border: `2px solid ${ACCENT}`,
                    color: ACCENT,
                    fontFamily: FONT,
                    cursor: "pointer",
                  }}
                  data-ocid="interview_coach.hint_button"
                >
                  CONFIDENCE ELIXIR: {showHint ? "HIDE HINT" : "REVEAL HINT"}
                </button>
                {showHint && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 10,
                      border: "1px solid rgba(255,170,0,0.35)",
                      color: TEXT,
                      fontSize: 13,
                      lineHeight: 1.55,
                    }}
                  >
                    Build a quick STAR answer: name the situation, your task,
                    the action you personally took, and a measurable result.
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  color: ACCENT,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Your Answer
              </div>
              <textarea
                value={state.answer}
                onChange={(e) =>
                  setState((s) => ({ ...s, answer: e.target.value }))
                }
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Use the STAR method: Situation, Task, Action, Result…"
                rows={5}
                style={rpgInput({ resize: "vertical" })}
                data-ocid="interview_coach.answer_input"
              />
            </div>

            {error && (
              <div
                style={{
                  color: "#ff4466",
                  fontSize: 13,
                  marginBottom: 12,
                  textAlign: "center",
                }}
                data-ocid="interview_coach.error_state"
              >
                ⚠ {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => void submitAnswer()}
              disabled={loading}
              data-ocid="interview_coach.submit_button"
              style={{
                width: "100%",
                padding: "12px 0",
                background: loading ? ACCENT_DIM : ACCENT,
                border: "none",
                color: loading ? DIM : "#000",
                fontFamily: FONT,
                fontSize: 15,
                letterSpacing: "0.1em",
                cursor: loading ? "wait" : "pointer",
                fontWeight: 700,
              }}
            >
              {loading ? "EVALUATING…" : "📝 SUBMIT ANSWER"}
            </button>

            {loading && (
              <div
                style={{
                  textAlign: "center",
                  color: DIM,
                  fontSize: 12,
                  marginTop: 10,
                }}
                data-ocid="interview_coach.loading_state"
              >
                Chad is reviewing your answer…
              </div>
            )}
          </div>
        )}

        {/* Feedback phase */}
        {phase === "feedback" && (
          <div>
            <div
              style={{
                color: ACCENT,
                fontSize: 13,
                letterSpacing: "0.08em",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              ✓ Chad's Feedback
            </div>
            <div
              style={{
                background: "rgba(255,170,0,0.06)",
                border: "1px solid rgba(255,170,0,0.22)",
                padding: "16px 18px",
                color: TEXT,
                fontSize: 14,
                lineHeight: 1.75,
                wordBreak: "break-word",
                maxHeight: 280,
                overflowY: "auto",
                marginBottom: 16,
              }}
              data-ocid="interview_coach.success_state"
            >
              <p>
                Evidence self-check: {evidenceScore(state.answer).toString()}
                /100. This checks specificity, ownership, measurable evidence,
                and outcomes; it is not a hiring prediction.
              </p>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1
                      style={{
                        color: ACCENT,
                        fontSize: 16,
                        fontWeight: 700,
                        marginBottom: 6,
                        marginTop: 8,
                      }}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2
                      style={{
                        color: ACCENT,
                        fontSize: 15,
                        fontWeight: 700,
                        marginBottom: 4,
                        marginTop: 6,
                      }}
                    >
                      {children}
                    </h2>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: TEXT, fontWeight: 700 }}>
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li style={{ marginBottom: 4, color: TEXT }}>{children}</li>
                  ),
                  p: ({ children }) => (
                    <p style={{ marginBottom: 8, color: TEXT }}>{children}</p>
                  ),
                }}
              >
                {state.feedback}
              </ReactMarkdown>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(state.feedback)
                    .then(() => {
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    })
                    .catch(() =>
                      setError(
                        "Copy failed. Select the feedback and copy it manually.",
                      ),
                    );
                }}
                data-ocid="interview_coach.copy_button"
                style={{
                  flex: 1,
                  padding: "8px 0",
                  background: isCopied ? ACCENT : ACCENT_DIM,
                  border: `2px solid ${ACCENT}`,
                  color: isCopied ? "#000" : ACCENT,
                  fontFamily: FONT,
                  fontSize: 12,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  transition: "all 0.2s",
                }}
              >
                {isCopied ? "✓ COPIED!" : "📋 COPY FEEDBACK"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => void nextQuestion()}
                disabled={loading}
                data-ocid="interview_coach.next_question_button"
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: loading ? ACCENT_DIM : ACCENT,
                  border: "none",
                  color: loading ? DIM : "#000",
                  fontFamily: FONT,
                  fontSize: 13,
                  cursor: loading ? "wait" : "pointer",
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                }}
              >
                {loading ? "LOADING…" : "⟶ NEXT QUESTION"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase("setup");
                  setState((s) => ({
                    ...s,
                    answer: "",
                    feedback: "",
                    question: "",
                  }));
                  setError("");
                }}
                data-ocid="interview_coach.restart_button"
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "transparent",
                  border: "2px solid rgba(255,170,0,0.3)",
                  color: DIM,
                  fontFamily: FONT,
                  fontSize: 13,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                ↺ CHANGE TOPIC
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
