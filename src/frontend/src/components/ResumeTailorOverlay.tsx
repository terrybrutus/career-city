import { createActor } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import {
  clearDraft,
  loadDraft,
  useAutosaveDraft,
} from "@/hooks/useAutosaveDraft";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useProfile } from "@/hooks/useProfile";
import { useActor } from "@caffeineai/core-infrastructure";
import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

// ── Shared RPG overlay styles ─────────────────────────────────────────
const ACCENT = "#ff00ff";
const ACCENT_DIM = "rgba(255,0,255,0.18)";
const BG = "rgba(8,2,14,0.97)";
const BORDER = `3px solid ${ACCENT}`;
const TEXT = "#e8e0f4";
const DIM = "rgba(200,180,230,0.65)";
const FONT = '"Space Grotesk", monospace';

function rpgInput(extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(255,0,255,0.07)",
    border: "2px solid rgba(255,0,255,0.35)",
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: ACCENT,
        fontFamily: FONT,
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

export default function ResumeTailorOverlay({
  onClose,
}: { onClose: () => void }) {
  const { actor } = useActor(createActor);
  const { data: profile } = useProfile();
  const draft = useRef(
    loadDraft("career_city_resume_draft", {
      name: "",
      jobTitle: "",
      jobDesc: "",
      background: "",
    }),
  ).current;
  const modalRef = useRef<HTMLDivElement>(null);
  useModalFocus(modalRef, onClose);
  const hasResumeBoost = profile?.inventory.includes("resume_boost") ?? false;
  const [name, setName] = useState(draft.name);
  const [jobTitle, setJobTitle] = useState(draft.jobTitle);
  const [jobDesc, setJobDesc] = useState(draft.jobDesc);
  const [background, setBackground] = useState(draft.background);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  useAutosaveDraft(
    "career_city_resume_draft",
    { name, jobTitle, jobDesc, background },
    !result && Boolean(name || jobTitle || jobDesc || background),
  );

  const handleResumeUpload = useCallback(async (file: File | undefined) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "txt" && extension !== "md") {
      setError(
        "Upload a .txt or .md resume. PDF and DOC parsing are not supported yet.",
      );
      return;
    }
    setError("");
    setBackground(await file.text());
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!actor) {
      setError("Not connected. Please try again.");
      return;
    }
    if (!jobTitle.trim() || !jobDesc.trim() || !background.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const jobDescription = `Job Title: ${jobTitle}\n\n${jobDesc}`;
      const resumeData = `Name: ${name}\nBackground & Skills: ${background}${
        hasResumeBoost
          ? "\nResume Boost active: include an extra achievement-writing example."
          : ""
      }`;
      const res = await actor.tailorResume(jobDescription, resumeData);
      if (res.__kind__ === "ok") {
        setResult(res.ok);
        await actor.createResume(
          `${name || "Player"} - ${jobTitle}`,
          "",
          "",
          res.ok,
          [],
          [],
        );
        clearDraft("career_city_resume_draft");
        GameBridge.emit("missionCompleted", { missionId: "craft_resume" });
      } else {
        setError(res.err ?? "Something went wrong.");
      }
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [actor, name, jobTitle, jobDesc, background, hasResumeBoost]);

  const handleClose = useCallback(() => {
    GameBridge.emit("careerToolClose", undefined);
    onClose();
  }, [onClose]);

  return (
    // Backdrop
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      data-ocid="resume_tailor.dialog"
      ref={modalRef}
      aria-label="Resume Tailor"
    >
      {/* Modal */}
      <div
        style={{
          background: BG,
          border: BORDER,
          boxShadow:
            "0 0 40px rgba(255,0,255,0.25), 0 0 80px rgba(255,0,255,0.08)",
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px 28px",
          fontFamily: FONT,
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close resume tailor"
          data-ocid="resume_tailor.close_button"
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
            ◈ VERA'S WORKSHOP ◈
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
            RESUME TAILOR
          </div>
          <div style={{ color: DIM, fontSize: 13, marginTop: 6 }}>
            Paste your resume below and I'll tailor it to the job description.
          </div>
        </div>

        {/* Form */}
        {!result ? (
          <div>
            <Field label="Your Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Jane Smith"
                style={rpgInput()}
                data-ocid="resume_tailor.name_input"
              />
            </Field>
            <Field label="Job Title Targeting">
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Senior Frontend Engineer"
                style={rpgInput()}
                data-ocid="resume_tailor.job_title_input"
              />
            </Field>
            <Field label="Job Description">
              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Paste the job description here…"
                rows={5}
                style={rpgInput({ resize: "vertical" })}
                data-ocid="resume_tailor.job_desc_input"
              />
            </Field>
            <Field label="Your Background & Skills">
              <input
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={(event) =>
                  void handleResumeUpload(event.target.files?.[0])
                }
                data-ocid="resume_tailor.resume_upload"
                style={rpgInput({ marginBottom: 8 })}
              />
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="List your experience, skills, and key achievements…"
                rows={4}
                style={rpgInput({ resize: "vertical" })}
                data-ocid="resume_tailor.background_input"
              />
            </Field>

            {error && (
              <div
                style={{
                  color: "#ff4466",
                  fontSize: 13,
                  marginBottom: 12,
                  textAlign: "center",
                }}
                data-ocid="resume_tailor.error_state"
              >
                ⚠ {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading}
              data-ocid="resume_tailor.submit_button"
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
              {loading ? "TAILORING YOUR RESUME…" : "✂ TAILOR MY RESUME"}
            </button>

            {loading && (
              <div
                style={{
                  textAlign: "center",
                  color: DIM,
                  fontSize: 12,
                  marginTop: 10,
                }}
                data-ocid="resume_tailor.loading_state"
              >
                Vera is working her magic…
              </div>
            )}
          </div>
        ) : (
          /* Result panel */
          <div>
            <div
              style={{
                color: ACCENT,
                fontSize: 13,
                letterSpacing: "0.08em",
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              ✓ Tailored Resume Advice
            </div>
            <div
              style={{
                background: "rgba(255,0,255,0.06)",
                border: "1px solid rgba(255,0,255,0.25)",
                padding: "16px 18px",
                color: TEXT,
                fontSize: 14,
                lineHeight: 1.75,
                wordBreak: "break-word",
                maxHeight: 320,
                overflowY: "auto",
              }}
              data-ocid="resume_tailor.success_state"
            >
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1
                      style={{
                        color: ACCENT,
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 8,
                        marginTop: 12,
                      }}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2
                      style={{
                        color: ACCENT,
                        fontSize: 16,
                        fontWeight: 700,
                        marginBottom: 6,
                        marginTop: 10,
                      }}
                    >
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3
                      style={{
                        color: ACCENT,
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 4,
                        marginTop: 8,
                      }}
                    >
                      {children}
                    </h3>
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
                  ol: ({ children }) => (
                    <ol style={{ paddingLeft: 20, marginBottom: 8 }}>
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ marginBottom: 4, color: TEXT }}>{children}</li>
                  ),
                  p: ({ children }) => (
                    <p style={{ marginBottom: 8, color: TEXT }}>{children}</p>
                  ),
                  hr: () => (
                    <hr
                      style={{
                        borderColor: "rgba(255,0,255,0.25)",
                        marginTop: 8,
                        marginBottom: 8,
                      }}
                    />
                  ),
                }}
              >
                {result}
              </ReactMarkdown>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(result)
                    .then(() => {
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    })
                    .catch(() =>
                      setError(
                        "Copy failed. Select the advice and copy it manually.",
                      ),
                    );
                }}
                data-ocid="resume_tailor.copy_button"
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: isCopied ? ACCENT : ACCENT_DIM,
                  border: `2px solid ${ACCENT}`,
                  color: isCopied ? "#000" : ACCENT,
                  fontFamily: FONT,
                  fontSize: 13,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  transition: "all 0.2s",
                }}
              >
                {isCopied ? "✓ COPIED!" : "📋 COPY ADVICE"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult("");
                  setError("");
                }}
                data-ocid="resume_tailor.try_again_button"
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "transparent",
                  border: "2px solid rgba(255,0,255,0.3)",
                  color: DIM,
                  fontFamily: FONT,
                  fontSize: 13,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                ↺ TRY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
