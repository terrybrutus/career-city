import { createActor } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useProfile } from "@/hooks/useProfile";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type WorkbenchTool =
  | "resume-tailor"
  | "cover-letter"
  | "interview-coach"
  | "item-shop";

const toolCopy: Record<
  WorkbenchTool,
  { title: string; mentor: string; accent: string; lede: string }
> = {
  "resume-tailor": {
    title: "Resume Drafting Table",
    mentor: "Vera",
    accent: "#ff00ff",
    lede: "Turn your target role and evidence into a realistic resume draft.",
  },
  "cover-letter": {
    title: "Writing Desk",
    mentor: "Penny",
    accent: "#00ffff",
    lede: "Use the resume in your Backpack to create a focused cover letter.",
  },
  "interview-coach": {
    title: "Mock Interview Seat",
    mentor: "Chad",
    accent: "#ffaa00",
    lede: "Practice a STAR answer based on the role you have been preparing for.",
  },
  "item-shop": {
    title: "Preparation Shelf",
    mentor: "Felix",
    accent: "#8844ff",
    lede: "Choose one useful preparation tool for the rest of the journey.",
  },
};

const categories = [
  "Behavioral",
  "Technical",
  "Culture Fit",
  "Leadership",
  "Problem Solving",
];

function scoreAnswer(answer: string): bigint {
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

function latestRoleFromTitle(title?: string): string {
  if (!title) return "";
  return title.split(" - ").at(-1)?.trim() ?? title;
}

export default function CareerWorkbench({
  tool,
  onClose,
}: {
  tool: WorkbenchTool;
  onClose: () => void;
}) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const modalRef = useRef<HTMLDivElement>(null);
  useModalFocus(modalRef, onClose);
  const copy = toolCopy[tool];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [resumeState, setResumeState] = useState({
    name: "",
    role: "",
    jobDescription: "",
    evidence: "",
  });
  const [letterState, setLetterState] = useState({
    name: "",
    role: "",
    company: "",
    jobDescription: "",
    background: "",
  });
  const [interviewState, setInterviewState] = useState({
    role: "",
    category: categories[0]!,
    question: "",
    answer: "",
    feedback: "",
  });
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const { data: resumes } = useQuery({
    queryKey: ["resumes"],
    enabled: Boolean(actor),
    queryFn: () => actor?.listResumes(),
  });
  const latestResume = resumes?.at(-1);
  const carriedRole = latestRoleFromTitle(latestResume?.name);
  const carriedSummary = latestResume?.summary ?? "";

  const { data: backendItems } = useQuery({
    queryKey: ["shop-items"],
    enabled: Boolean(actor) && tool === "item-shop",
    queryFn: () => actor?.listShopItems(),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const shopItems = useMemo(
    () =>
      backendItems ?? [
        {
          id: "resume_boost",
          name: "Resume Boost",
          description: "Adds an extra achievement-writing prompt.",
          xpCost: 50n,
          effect: "resume_boost",
        },
        {
          id: "confidence_elixir",
          name: "Confidence Elixir",
          description: "Unlocks an interview hint.",
          xpCost: 75n,
          effect: "confidence_elixir",
        },
        {
          id: "cover_letter_scroll",
          name: "Cover Letter Scroll",
          description: "Adds a cover-letter structure hint.",
          xpCost: 40n,
          effect: "cover_letter_scroll",
        },
      ],
    [backendItems],
  );

  const close = useCallback(() => {
    GameBridge.emit("careerToolClose", undefined);
    onClose();
  }, [onClose]);

  const tailorResume = useCallback(async () => {
    if (!actor) {
      setError("Connect first so Vera can save the resume to your Backpack.");
      return;
    }
    if (!resumeState.role.trim() || !resumeState.evidence.trim()) {
      setError("Add a target role and at least one real achievement.");
      return;
    }
    setBusy(true);
    setError("");
    setResult("");
    try {
      const jobDescription = `Target role: ${resumeState.role}\n\n${resumeState.jobDescription || "No formal job description yet."}`;
      const resumeData = `Name: ${resumeState.name || "Player"}\nEvidence and background:\n${resumeState.evidence}`;
      const res = await actor.tailorResume(jobDescription, resumeData);
      if (res.__kind__ === "err") {
        setError(res.err);
        return;
      }
      setResult(res.ok);
      await actor.createResume(
        `${resumeState.name || "Player"} - ${resumeState.role}`,
        "",
        "",
        res.ok,
        [],
        [],
      );
      GameBridge.emit("missionCompleted", { missionId: "craft_resume" });
      void qc.invalidateQueries({ queryKey: ["resumes"] });
    } catch {
      setError("Vera hit a snag while saving the resume.");
    } finally {
      setBusy(false);
    }
  }, [actor, qc, resumeState]);

  const createLetter = useCallback(async () => {
    if (!actor) {
      setError("Connect first so Penny can save the cover letter.");
      return;
    }
    const role = letterState.role || carriedRole;
    const background = letterState.background || carriedSummary;
    if (!role.trim() || !letterState.company.trim() || !background.trim()) {
      setError("Add a company and make sure your Backpack has resume context.");
      return;
    }
    setBusy(true);
    setError("");
    setResult("");
    try {
      const res = await actor.generateCoverLetter(
        role,
        letterState.company,
        `${background}\n\nJob description:\n${letterState.jobDescription || "Not provided."}`,
      );
      if (res.__kind__ === "err") {
        setError(res.err);
        return;
      }
      setResult(res.ok);
      await actor.createCoverLetter(
        role,
        letterState.company,
        res.ok,
        "Focused",
      );
      GameBridge.emit("missionCompleted", { missionId: "craft_cover_letter" });
      void qc.invalidateQueries({ queryKey: ["career-journal"] });
    } catch {
      setError("Penny could not save the cover letter yet.");
    } finally {
      setBusy(false);
    }
  }, [actor, carriedRole, carriedSummary, letterState, qc]);

  const startInterview = useCallback(async () => {
    if (!actor) {
      setError("Connect first so Chad can save the interview note.");
      return;
    }
    const role = interviewState.role || carriedRole;
    if (!role.trim()) {
      setError(
        "Pick a role first. A saved resume will fill this automatically.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await actor.interviewQuestion(
        role,
        interviewState.category,
        null,
        null,
      );
      if (res.__kind__ === "err") {
        setError(res.err);
        return;
      }
      setInterviewState((current) => ({
        ...current,
        role,
        question: res.ok,
        answer: "",
        feedback: "",
      }));
    } catch {
      setError("Chad could not prepare a question yet.");
    } finally {
      setBusy(false);
    }
  }, [actor, carriedRole, interviewState.category, interviewState.role]);

  const submitInterview = useCallback(async () => {
    if (!actor || !interviewState.question || !interviewState.answer.trim()) {
      setError("Answer the current question first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await actor.interviewQuestion(
        interviewState.role,
        interviewState.category,
        interviewState.question,
        interviewState.answer,
      );
      if (res.__kind__ === "err") {
        setError(res.err);
        return;
      }
      setInterviewState((current) => ({ ...current, feedback: res.ok }));
      await actor.createInterviewNote(
        BigInt(Date.now()) * 1_000_000n,
        interviewState.role,
        interviewState.question,
        interviewState.answer,
        scoreAnswer(interviewState.answer),
      );
      GameBridge.emit("missionCompleted", { missionId: "practice_interview" });
    } catch {
      setError("Chad could not save the feedback yet.");
    } finally {
      setBusy(false);
    }
  }, [actor, interviewState]);

  const buyItem = useCallback(
    async (id: string) => {
      if (!actor) {
        setError("Connect first so Felix can put the tool in your Backpack.");
        return;
      }
      setPurchasing(id);
      setError("");
      try {
        const res = await actor.purchaseItem(id);
        if (res.__kind__ === "err") {
          setError(res.err);
          return;
        }
        GameBridge.emit("missionCompleted", { missionId: "choose_power_up" });
        void qc.invalidateQueries({ queryKey: ["profile"] });
      } catch {
        setError("Felix could not complete the purchase yet.");
      } finally {
        setPurchasing(null);
      }
    },
    [actor, qc],
  );

  return (
    <div className="workbench-shell" data-ocid={`workbench.${tool}`}>
      <div
        className="workbench-panel"
        style={{ ["--accent" as string]: copy.accent }}
        ref={modalRef}
      >
        <button className="workbench-close" type="button" onClick={close}>
          Close
        </button>
        <p className="eyebrow">{copy.mentor.toUpperCase()}</p>
        <h1>{copy.title}</h1>
        <p className="modal-lede">{copy.lede}</p>
        {latestResume && tool !== "resume-tailor" && (
          <div className="backpack-context">
            Backpack context: latest resume for{" "}
            <strong>{carriedRole || latestResume.name}</strong> is ready.
          </div>
        )}
        {tool === "resume-tailor" && (
          <div className="workbench-grid">
            <Field label="Player name">
              <input
                value={resumeState.name}
                placeholder="Jane Smith"
                onChange={(e) =>
                  setResumeState((s) => ({ ...s, name: e.target.value }))
                }
              />
            </Field>
            <Field label="Target role">
              <input
                value={resumeState.role}
                placeholder="Senior Frontend Engineer"
                onChange={(e) =>
                  setResumeState((s) => ({ ...s, role: e.target.value }))
                }
              />
            </Field>
            <Field label="Job description or role notes">
              <textarea
                value={resumeState.jobDescription}
                placeholder="Paste a job description or describe the role."
                onChange={(e) =>
                  setResumeState((s) => ({
                    ...s,
                    jobDescription: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Evidence">
              <textarea
                value={resumeState.evidence}
                placeholder="List achievements, projects, numbers, tools, and outcomes."
                onChange={(e) =>
                  setResumeState((s) => ({ ...s, evidence: e.target.value }))
                }
              />
            </Field>
            <button type="button" onClick={tailorResume} disabled={busy}>
              {busy ? "Vera is drafting..." : "Save resume to Backpack"}
            </button>
          </div>
        )}
        {tool === "cover-letter" && (
          <div className="workbench-grid">
            <Field label="Player name">
              <input
                value={letterState.name}
                placeholder="Jane Smith"
                onChange={(e) =>
                  setLetterState((s) => ({ ...s, name: e.target.value }))
                }
              />
            </Field>
            <Field label="Role">
              <input
                value={letterState.role || carriedRole}
                placeholder="Filled from Backpack when available"
                onChange={(e) =>
                  setLetterState((s) => ({ ...s, role: e.target.value }))
                }
              />
            </Field>
            <Field label="Company">
              <input
                value={letterState.company}
                placeholder="Company name"
                onChange={(e) =>
                  setLetterState((s) => ({ ...s, company: e.target.value }))
                }
              />
            </Field>
            <Field label="Job description">
              <textarea
                value={letterState.jobDescription}
                placeholder="Paste a job post for now. API search can plug in here later."
                onChange={(e) =>
                  setLetterState((s) => ({
                    ...s,
                    jobDescription: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Resume evidence">
              <textarea
                value={letterState.background || carriedSummary}
                placeholder="Filled from Backpack when available"
                onChange={(e) =>
                  setLetterState((s) => ({ ...s, background: e.target.value }))
                }
              />
            </Field>
            <button type="button" onClick={createLetter} disabled={busy}>
              {busy ? "Penny is writing..." : "Save cover letter"}
            </button>
          </div>
        )}
        {tool === "interview-coach" && (
          <div className="workbench-grid">
            <Field label="Role">
              <input
                value={interviewState.role || carriedRole}
                placeholder="Filled from Backpack when available"
                onChange={(e) =>
                  setInterviewState((s) => ({ ...s, role: e.target.value }))
                }
              />
            </Field>
            <Field label="Focus">
              <select
                value={interviewState.category}
                onChange={(e) =>
                  setInterviewState((s) => ({ ...s, category: e.target.value }))
                }
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>
            {!interviewState.question ? (
              <button type="button" onClick={startInterview} disabled={busy}>
                {busy ? "Chad is preparing..." : "Start practice"}
              </button>
            ) : (
              <>
                <div className="workbench-card">
                  <strong>Chad asks:</strong>
                  <p>{interviewState.question}</p>
                </div>
                <Field label="Your answer">
                  <textarea
                    value={interviewState.answer}
                    placeholder="Answer with a specific STAR story."
                    onChange={(e) =>
                      setInterviewState((s) => ({
                        ...s,
                        answer: e.target.value,
                      }))
                    }
                  />
                </Field>
                <button type="button" onClick={submitInterview} disabled={busy}>
                  {busy ? "Chad is reviewing..." : "Save feedback"}
                </button>
              </>
            )}
          </div>
        )}
        {tool === "item-shop" && (
          <div className="shop-grid">
            {shopItems.map((item) => {
              const owned = profile?.inventory.includes(item.id) ?? false;
              return (
                <button
                  type="button"
                  className="shop-card"
                  key={item.id}
                  disabled={owned || purchasing === item.id}
                  onClick={() => buyItem(item.id)}
                >
                  <strong>
                    {owned ? "Packed: " : ""}
                    {item.name}
                  </strong>
                  <span>{item.description}</span>
                  <em>{Number(item.xpCost)} XP</em>
                </button>
              );
            })}
          </div>
        )}
        {error && <p className="workbench-error">{error}</p>}
        {result && (
          <div className="workbench-result">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
      </div>
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
    <div className="workbench-field">
      <span>{label}</span>
      {children}
    </div>
  );
}
