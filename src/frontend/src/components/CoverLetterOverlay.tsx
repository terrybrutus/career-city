import { createActor } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { useActor } from "@caffeineai/core-infrastructure";
import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";

const ACCENT = "#00ffff";
const ACCENT_DIM = "rgba(0,255,255,0.15)";
const BG = "rgba(2,10,18,0.97)";
const BORDER = `3px solid ${ACCENT}`;
const TEXT = "#d8f4f8";
const DIM = "rgba(160,220,240,0.65)";
const FONT = '"Space Grotesk", monospace';

function rpgInput(extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(0,255,255,0.06)",
    border: "2px solid rgba(0,255,255,0.3)",
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
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
        {label}
      </div>
      {children}
    </div>
  );
}

export default function CoverLetterOverlay({
  onClose,
}: { onClose: () => void }) {
  const { actor } = useActor(createActor);
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [background, setBackground] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!actor) {
      setError("Not connected. Please try again.");
      return;
    }
    if (
      !jobTitle.trim() ||
      !company.trim() ||
      !jobDesc.trim() ||
      !background.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const candidateName = name || "the applicant";
      const candidateBg = `You are Penny, an expert cover letter writer. Write a professional, engaging cover letter for ${candidateName} applying for ${jobTitle} at ${company}. Their experience: ${background}\n\nJob Description: ${jobDesc}\n\nWrite the full cover letter in first person as if you ARE the user. Make it specific, warm, and compelling. No placeholder text.`;
      const res = await actor.generateCoverLetter(
        jobTitle,
        company,
        candidateBg,
      );
      if (res.__kind__ === "ok") {
        setResult(res.ok);
        GameBridge.emit("xpGained", {
          amount: 75,
          reason: "cover_letter_generated",
        });
      } else {
        setError(res.err ?? "Something went wrong.");
      }
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [actor, name, jobTitle, company, jobDesc, background]);

  const handleClose = useCallback(() => {
    GameBridge.emit("careerToolClose", undefined);
    onClose();
  }, [onClose]);

  return (
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
      data-ocid="cover_letter.dialog"
    >
      <div
        style={{
          background: BG,
          border: BORDER,
          boxShadow:
            "0 0 40px rgba(0,255,255,0.22), 0 0 80px rgba(0,255,255,0.07)",
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
          aria-label="Close cover letter generator"
          data-ocid="cover_letter.close_button"
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
          [ESC]
        </button>

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
            ◈ PENNY'S WRITING PARLOR ◈
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
            COVER LETTER GENERATOR
          </div>
          <div style={{ color: DIM, fontSize: 13, marginTop: 6 }}>
            Three paragraphs. One job. Let's make them want you.
          </div>
        </div>

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
                data-ocid="cover_letter.name_input"
              />
            </Field>
            <Field label="Job Title">
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Product Designer"
                style={rpgInput()}
                data-ocid="cover_letter.job_title_input"
              />
            </Field>
            <Field label="Company Name">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Acme Corp"
                style={rpgInput()}
                data-ocid="cover_letter.company_input"
              />
            </Field>
            <Field label="Job Description">
              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Paste the job description…"
                rows={4}
                style={rpgInput({ resize: "vertical" })}
                data-ocid="cover_letter.job_desc_input"
              />
            </Field>
            <Field label="Your Background">
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Summarize your relevant experience and skills…"
                rows={4}
                style={rpgInput({ resize: "vertical" })}
                data-ocid="cover_letter.background_input"
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
                data-ocid="cover_letter.error_state"
              >
                ⚠ {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading}
              data-ocid="cover_letter.submit_button"
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
              {loading ? "WRITING YOUR LETTER…" : "✍ GENERATE COVER LETTER"}
            </button>

            {loading && (
              <div
                style={{
                  textAlign: "center",
                  color: DIM,
                  fontSize: 12,
                  marginTop: 10,
                }}
                data-ocid="cover_letter.loading_state"
              >
                Penny is at the typewriter…
              </div>
            )}
          </div>
        ) : (
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
              ✓ Your Cover Letter
            </div>
            <div
              style={{
                background: "rgba(0,255,255,0.05)",
                border: "1px solid rgba(0,255,255,0.22)",
                padding: "16px 18px",
                color: TEXT,
                fontSize: 14,
                lineHeight: 1.75,
                wordBreak: "break-word",
                maxHeight: 320,
                overflowY: "auto",
              }}
              data-ocid="cover_letter.success_state"
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
                    <p style={{ marginBottom: 10, color: TEXT }}>{children}</p>
                  ),
                  hr: () => (
                    <hr
                      style={{
                        borderColor: "rgba(0,255,255,0.22)",
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
                  void navigator.clipboard.writeText(result).then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  });
                }}
                data-ocid="cover_letter.copy_button"
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
                {isCopied ? "✓ COPIED!" : "📋 COPY LETTER"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult("");
                  setError("");
                }}
                data-ocid="cover_letter.try_again_button"
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "transparent",
                  border: "2px solid rgba(0,255,255,0.25)",
                  color: DIM,
                  fontFamily: FONT,
                  fontSize: 13,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                ↺ WRITE ANOTHER
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
