import { createActor } from "@/backend";
import type { CoverLetter } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Tone = "Formal" | "Casual" | "Confident";

interface CLForm {
  jobTitle: string;
  company: string;
  hiringManager: string;
  yourName: string;
  keyStrengths: string;
  tone: Tone;
  body: string;
}

const TONE_TEMPLATES: Record<Tone, (f: CLForm) => string> = {
  Formal: (f) =>
    `Dear ${f.hiringManager || "Hiring Manager"},\n\nI am writing to express my sincere interest in the ${f.jobTitle || "[Job Title]"} position at ${f.company || "[Company]"}. With a strong background in ${f.keyStrengths || "relevant fields"}, I am confident in my ability to contribute meaningfully to your team.\n\nThroughout my career, I have developed a proven track record of delivering results with precision and professionalism. I welcome the opportunity to bring this same dedication to ${f.company || "your organization"}.\n\nI would welcome the opportunity to further discuss how my qualifications align with your needs. Thank you for considering my application.\n\nSincerely,\n${f.yourName || "[Your Name]"}`,

  Casual: (f) =>
    `Hi ${f.hiringManager || "there"},\n\nI spotted the ${f.jobTitle || "[Job Title]"} opening at ${f.company || "[Company]"} and honestly — it jumped out at me. I've been doing ${f.keyStrengths || "this kind of work"} for a while now, and the role feels like a natural fit.\n\nI'm the kind of person who shows up, figures things out, and doesn't ghost Slack at 4:59. I work well with teams, take feedback well, and bring genuine enthusiasm to the projects I'm part of.\n\nWould love to chat more about it — feel free to reach out at your convenience!\n\nCheers,\n${f.yourName || "[Your Name]"}`,

  Confident: (f) =>
    `Dear ${f.hiringManager || "Hiring Team"},\n\nI am the ${f.jobTitle || "[Job Title]"} candidate you've been looking for.\n\nWith expertise in ${f.keyStrengths || "high-impact areas"} and a track record of results that speak louder than bullet points, I bring exactly what ${f.company || "[Company]"} needs to accelerate its next chapter.\n\nI don't just fill roles — I elevate teams. My approach combines strategic thinking with decisive action, and I've consistently delivered outcomes that exceed expectations.\n\nI would welcome a conversation to discuss how I can drive results at ${f.company || "your organization"}.\n\nBest,\n${f.yourName || "[Your Name]"}`,
};

const EMPTY_FORM: CLForm = {
  jobTitle: "",
  company: "",
  hiringManager: "",
  yourName: "",
  keyStrengths: "",
  tone: "Formal",
  body: TONE_TEMPLATES.Formal({
    jobTitle: "",
    company: "",
    hiringManager: "",
    yourName: "",
    keyStrengths: "",
    tone: "Formal",
    body: "",
  }),
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString();
}

const TONE_COLORS: Record<Tone, string> = {
  Formal: "border-[#00ffff] text-[#00ffff] shadow-[0_0_8px_#00ffff]",
  Casual: "border-[#39ff14] text-[#39ff14] shadow-[0_0_8px_#39ff14]",
  Confident: "border-[#ff00ff] text-[#ff00ff] shadow-[0_0_8px_#ff00ff]",
};
const TONE_INACTIVE =
  "border-border text-muted-foreground hover:border-[#00ffff] hover:text-[#00ffff]";

export default function CoverLetterPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CLForm>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [showList, setShowList] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<bigint | null>(null);

  // Emit location change on mount for music
  useEffect(() => {
    GameBridge.emit("locationChanged", { locationId: "cover_letter_corner" });
    return () => {
      // no cleanup needed — music manager handles transitions
    };
  }, []);

  // Auto-regenerate body when tone or key fields change (only if body matches a template)
  const regenerateBody = (updated: CLForm) => {
    const freshBody = TONE_TEMPLATES[updated.tone](updated);
    return { ...updated, body: freshBody };
  };

  const setField = <K extends keyof CLForm>(key: K, value: CLForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Regenerate template when structural fields change (not body itself)
      if (key !== "body") {
        return regenerateBody(next);
      }
      return next;
    });
  };

  const { data: letters = [], isLoading } = useQuery<CoverLetter[]>({
    queryKey: ["coverletters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCoverLetters();
    },
    enabled: !!actor && !isFetching,
  });

  const createMutation = useMutation({
    mutationFn: async (f: CLForm) => {
      if (!actor) throw new Error("No actor");
      return actor.createCoverLetter(f.jobTitle, f.company, f.body, f.tone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coverletters"] });
      GameBridge.emit("xpGained", { amount: 75 });
      toast("+75 XP! Cover letter saved.", { description: "Penny approves." });
      setShowList(true);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
    },
    onError: () => toast("Save failed. The quill is broken."),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: bigint; f: CLForm }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCoverLetter(id, f.jobTitle, f.company, f.body, f.tone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coverletters"] });
      GameBridge.emit("xpGained", { amount: 75 });
      toast("+75 XP! Cover letter updated.");
      setShowList(true);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
    },
    onError: () => toast("Update failed. Try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCoverLetter(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coverletters"] });
      toast("Letter deleted.");
      setDeleteConfirm(null);
    },
  });

  const handleExit = () => {
    navigate({ to: "/" });
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowList(false);
  };

  const handleEdit = (l: CoverLetter) => {
    setEditingId(l.id);
    const tone = (
      ["Formal", "Casual", "Confident"].includes(l.tone) ? l.tone : "Formal"
    ) as Tone;
    setForm({
      jobTitle: l.jobTitle,
      company: l.company,
      hiringManager: "",
      yourName: "",
      keyStrengths: "",
      tone,
      body: l.body,
    });
    setShowList(false);
  };

  const handleSave = () => {
    if (!form.jobTitle.trim() || !form.company.trim()) {
      toast("Job title and company are required.");
      return;
    }
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, f: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const words = wordCount(form.body);

  return (
    <div
      className="flex flex-col w-full h-full overflow-hidden"
      style={{ background: "#0a0d14" }}
      data-ocid="coverletter.page"
    >
      {/* ── HEADER ─────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b-4 sticky top-0 z-20 flex-shrink-0"
        style={{
          background: "#0d1220",
          borderColor: "#00ffff",
          boxShadow: "0 0 16px #00ffff44",
        }}
      >
        <button
          type="button"
          onClick={handleExit}
          className="font-display font-bold tracking-widest transition-smooth"
          style={{
            fontSize: "1.125rem",
            color: "#00ffff",
            textShadow: "0 0 8px #00ffff",
            border: "4px solid #00ffff",
            padding: "0.4rem 1rem",
            background: "transparent",
            cursor: "pointer",
          }}
          data-ocid="coverletter.back_button"
        >
          ← TOWN SQUARE
        </button>

        <div className="flex flex-col items-center">
          <h1
            className="font-display font-bold tracking-widest"
            style={{
              fontSize: "1.5rem",
              color: "#00ffff",
              textShadow: "0 0 12px #00ffff, 0 0 24px #00ffff88",
              letterSpacing: "0.15em",
            }}
          >
            ✉️ COVER LETTER CORNER
          </h1>
          <span
            className="font-display"
            style={{ fontSize: "1.125rem", color: "#00ffff88" }}
          >
            Where prose finds employment
          </span>
        </div>

        <div style={{ width: "160px" }}>{/* spacer */}</div>
      </header>

      {/* ── NPC PENNY ──────────────────────────────── */}
      <div
        className="flex items-start gap-4 px-6 py-3 border-b-2 flex-shrink-0"
        style={{ background: "#0d1a1f", borderColor: "#00ffff44" }}
        data-ocid="coverletter.npc_panel"
      >
        <div
          style={{
            fontSize: "2.5rem",
            filter: "drop-shadow(0 0 6px #00ffff88)",
            flexShrink: 0,
          }}
        >
          📜
        </div>
        <div className="flex flex-col gap-1">
          <span
            className="font-display font-bold tracking-widest"
            style={{
              fontSize: "1.125rem",
              color: "#00ffff",
              textShadow: "0 0 6px #00ffff",
            }}
          >
            PENNY THE SCRIBE:
          </span>
          <span
            className="font-display"
            style={{
              fontSize: "1.125rem",
              color: "#c0d8e0",
              lineHeight: 1.5,
            }}
          >
            {showList
              ? "A cover letter? Bold move in an era of ghosting. I respect it."
              : "Choose your tone. Make it memorable. They read hundreds of these, you know."}
          </span>
        </div>
      </div>

      {/* ── CONTENT AREA ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {showList ? (
          /* ── LETTERS LIST VIEW ─────────────────── */
          <div className="px-6 py-6 flex flex-col gap-4">
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <span
                className="font-display font-bold"
                style={{ fontSize: "1.125rem", color: "#00ffff" }}
              >
                SAVED LETTERS ({letters.length})
              </span>
              <button
                type="button"
                onClick={handleNew}
                className="font-display font-bold tracking-widest transition-smooth"
                style={{
                  fontSize: "1.125rem",
                  color: "#000",
                  background: "#00ffff",
                  border: "4px solid #00ffff",
                  padding: "0.4rem 1.25rem",
                  cursor: "pointer",
                  textShadow: "none",
                  boxShadow: "0 0 10px #00ffff88",
                }}
                data-ocid="coverletter.new_button"
              >
                [+ WRITE NEW LETTER]
              </button>
            </div>

            {/* Loading */}
            {isLoading && (
              <div
                className="text-center py-12 font-display"
                style={{ fontSize: "1.125rem", color: "#00ffff88" }}
                data-ocid="coverletter.loading_state"
              >
                LOADING LETTERS...
              </div>
            )}

            {/* Empty state */}
            {!isLoading && letters.length === 0 && (
              <div
                className="flex flex-col items-center justify-center gap-6 py-16 border-4"
                style={{ borderColor: "#00ffff44", background: "#0d1a1f" }}
                data-ocid="coverletter.empty_state"
              >
                <span style={{ fontSize: "3.5rem" }}>✉️</span>
                <div className="text-center">
                  <p
                    className="font-display font-bold"
                    style={{ fontSize: "1.5rem", color: "#00ffff" }}
                  >
                    NO LETTERS YET
                  </p>
                  <p
                    className="font-display mt-2"
                    style={{ fontSize: "1.125rem", color: "#7a9aaa" }}
                  >
                    Your eloquence is wasted if it stays in your head.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNew}
                  className="font-display font-bold tracking-widest transition-smooth"
                  style={{
                    fontSize: "1.125rem",
                    color: "#000",
                    background: "#00ffff",
                    border: "4px solid #00ffff",
                    padding: "0.5rem 1.5rem",
                    cursor: "pointer",
                    boxShadow: "0 0 12px #00ffff88",
                  }}
                  data-ocid="coverletter.empty_new_button"
                >
                  [WRITE FIRST LETTER]
                </button>
              </div>
            )}

            {/* Letters */}
            <div className="flex flex-col gap-3">
              {letters.map((l, i) => (
                <div
                  key={String(l.id)}
                  className="border-4 p-4"
                  style={{
                    borderColor: "#00ffff44",
                    background: "#0d1a1f",
                    boxShadow: "0 0 8px #00ffff22",
                  }}
                  data-ocid={`coverletter.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-display font-bold truncate"
                        style={{
                          fontSize: "1.25rem",
                          color: "#00ffff",
                          textShadow: "0 0 6px #00ffff88",
                        }}
                      >
                        {l.jobTitle}
                      </p>
                      <p
                        className="font-display mt-0.5"
                        style={{ fontSize: "1.125rem", color: "#7a9aaa" }}
                      >
                        {l.company}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className="font-display border-2 px-2 py-0.5"
                          style={{
                            fontSize: "1.125rem",
                            borderColor: "#00ffff",
                            color: "#00ffff",
                          }}
                        >
                          {l.tone}
                        </span>
                        <span
                          className="font-display"
                          style={{ fontSize: "1.125rem", color: "#556677" }}
                        >
                          {formatDate(l.updatedAt)}
                        </span>
                      </div>
                      <p
                        className="font-display mt-2 line-clamp-2"
                        style={{ fontSize: "1.125rem", color: "#8899aa" }}
                      >
                        {l.body.slice(0, 140)}…
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(l)}
                        className="font-display font-bold tracking-wide transition-smooth"
                        style={{
                          fontSize: "1.125rem",
                          color: "#00ffff",
                          border: "3px solid #00ffff44",
                          padding: "0.25rem 0.75rem",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                        data-ocid={`coverletter.edit_button.${i + 1}`}
                      >
                        [EDIT]
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard
                            .writeText(l.body)
                            .then(() => toast("Letter copied!"));
                        }}
                        className="font-display font-bold tracking-wide transition-smooth"
                        style={{
                          fontSize: "1.125rem",
                          color: "#7a9aaa",
                          border: "3px solid #334455",
                          padding: "0.25rem 0.75rem",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                        data-ocid={`coverletter.copy_button.${i + 1}`}
                      >
                        [COPY]
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(l.id)}
                        className="font-display font-bold tracking-wide transition-smooth"
                        style={{
                          fontSize: "1.125rem",
                          color: "#ff4444",
                          border: "3px solid #ff444444",
                          padding: "0.25rem 0.75rem",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                        data-ocid={`coverletter.delete_button.${i + 1}`}
                      >
                        [DEL]
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── EDITOR + PREVIEW PANELS ────────────── */
          <div className="flex gap-0 h-full" style={{ minHeight: "500px" }}>
            {/* LEFT: Editor */}
            <div
              className="flex flex-col gap-4 px-6 py-5 overflow-y-auto"
              style={{
                flex: "0 0 50%",
                borderRight: "4px solid #00ffff44",
                background: "#0a0f18",
              }}
              data-ocid="coverletter.editor_panel"
            >
              <div className="flex items-center justify-between">
                <h2
                  className="font-display font-bold tracking-widest"
                  style={{
                    fontSize: "1.25rem",
                    color: "#00ffff",
                    textShadow: "0 0 8px #00ffff",
                  }}
                >
                  {editingId !== null ? "✏️ EDIT LETTER" : "📝 NEW LETTER"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowList(true);
                    setEditingId(null);
                    setForm({ ...EMPTY_FORM });
                  }}
                  className="font-display transition-smooth"
                  style={{
                    fontSize: "1.125rem",
                    color: "#556677",
                    border: "3px solid #334455",
                    padding: "0.25rem 0.75rem",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  data-ocid="coverletter.back_to_list_button"
                >
                  ← BACK
                </button>
              </div>

              {/* ─ Job Title ─ */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cl-jobtitle"
                  className="font-display font-bold tracking-widest"
                  style={{ fontSize: "1.125rem", color: "#7a9aaa" }}
                >
                  JOB TITLE *
                </label>
                <input
                  id="cl-jobtitle"
                  type="text"
                  value={form.jobTitle}
                  onChange={(e) => setField("jobTitle", e.target.value)}
                  placeholder="Senior Pixel Architect"
                  className="font-display bg-background text-foreground focus:outline-none"
                  style={{
                    fontSize: "1.125rem",
                    border: "4px solid #334455",
                    padding: "0.5rem 0.75rem",
                    width: "100%",
                    caretColor: "#00ffff",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#00ffff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#334455";
                  }}
                  data-ocid="coverletter.jobtitle_input"
                />
              </div>

              {/* ─ Company ─ */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cl-company"
                  className="font-display font-bold tracking-widest"
                  style={{ fontSize: "1.125rem", color: "#7a9aaa" }}
                >
                  COMPANY NAME *
                </label>
                <input
                  id="cl-company"
                  type="text"
                  value={form.company}
                  onChange={(e) => setField("company", e.target.value)}
                  placeholder="Acme Innovations LLC"
                  className="font-display bg-background text-foreground focus:outline-none"
                  style={{
                    fontSize: "1.125rem",
                    border: "4px solid #334455",
                    padding: "0.5rem 0.75rem",
                    width: "100%",
                    caretColor: "#00ffff",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#00ffff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#334455";
                  }}
                  data-ocid="coverletter.company_input"
                />
              </div>

              {/* ─ Hiring Manager ─ */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cl-hiring"
                  className="font-display font-bold tracking-widest"
                  style={{ fontSize: "1.125rem", color: "#7a9aaa" }}
                >
                  HIRING MANAGER (optional)
                </label>
                <input
                  id="cl-hiring"
                  type="text"
                  value={form.hiringManager}
                  onChange={(e) => setField("hiringManager", e.target.value)}
                  placeholder="Alex Chen"
                  className="font-display bg-background text-foreground focus:outline-none"
                  style={{
                    fontSize: "1.125rem",
                    border: "4px solid #334455",
                    padding: "0.5rem 0.75rem",
                    width: "100%",
                    caretColor: "#00ffff",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#00ffff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#334455";
                  }}
                  data-ocid="coverletter.hiringmanager_input"
                />
              </div>

              {/* ─ Your Name ─ */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cl-yourname"
                  className="font-display font-bold tracking-widest"
                  style={{ fontSize: "1.125rem", color: "#7a9aaa" }}
                >
                  YOUR NAME
                </label>
                <input
                  id="cl-yourname"
                  type="text"
                  value={form.yourName}
                  onChange={(e) => setField("yourName", e.target.value)}
                  placeholder="Jordan Lee"
                  className="font-display bg-background text-foreground focus:outline-none"
                  style={{
                    fontSize: "1.125rem",
                    border: "4px solid #334455",
                    padding: "0.5rem 0.75rem",
                    width: "100%",
                    caretColor: "#00ffff",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#00ffff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#334455";
                  }}
                  data-ocid="coverletter.yourname_input"
                />
              </div>

              {/* ─ Key Strengths ─ */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cl-strengths"
                  className="font-display font-bold tracking-widest"
                  style={{ fontSize: "1.125rem", color: "#7a9aaa" }}
                >
                  KEY STRENGTHS
                </label>
                <input
                  id="cl-strengths"
                  type="text"
                  value={form.keyStrengths}
                  onChange={(e) => setField("keyStrengths", e.target.value)}
                  placeholder="React, leadership, making spreadsheets look intentional"
                  className="font-display bg-background text-foreground focus:outline-none"
                  style={{
                    fontSize: "1.125rem",
                    border: "4px solid #334455",
                    padding: "0.5rem 0.75rem",
                    width: "100%",
                    caretColor: "#00ffff",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#00ffff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#334455";
                  }}
                  data-ocid="coverletter.strengths_input"
                />
              </div>

              {/* ─ Tone Selector ─ */}
              <div className="flex flex-col gap-2">
                <span
                  className="font-display font-bold tracking-widest"
                  style={{ fontSize: "1.125rem", color: "#7a9aaa" }}
                >
                  TONE
                </span>
                <div className="flex gap-3">
                  {(["Formal", "Casual", "Confident"] as Tone[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setField("tone", t)}
                      className={`font-display font-bold tracking-wide border-4 px-3 py-2 cursor-pointer transition-smooth ${
                        form.tone === t ? TONE_COLORS[t] : TONE_INACTIVE
                      }`}
                      style={{
                        fontSize: "1.125rem",
                        background: "transparent",
                      }}
                      data-ocid={`coverletter.tone_${t.toLowerCase()}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─ Letter Body ─ */}
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="cl-body"
                    className="font-display font-bold tracking-widest"
                    style={{ fontSize: "1.125rem", color: "#7a9aaa" }}
                  >
                    LETTER BODY
                  </label>
                  <span
                    className="font-display"
                    style={{ fontSize: "1.125rem", color: "#556677" }}
                    data-ocid="coverletter.wordcount"
                  >
                    {words} words
                  </span>
                </div>
                <textarea
                  id="cl-body"
                  value={form.body}
                  onChange={(e) => setField("body", e.target.value)}
                  className="font-display bg-background text-foreground focus:outline-none resize-none"
                  style={{
                    fontSize: "1.125rem",
                    border: "4px solid #334455",
                    padding: "0.75rem",
                    minHeight: "160px",
                    flex: 1,
                    lineHeight: 1.6,
                    caretColor: "#00ffff",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#00ffff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#334455";
                  }}
                  data-ocid="coverletter.body_textarea"
                />
              </div>

              {/* ─ Save Button ─ */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="font-display font-bold tracking-widest transition-smooth"
                style={{
                  fontSize: "1.25rem",
                  color: isSaving ? "#005566" : "#000",
                  background: isSaving ? "#004455" : "#00ffff",
                  border: "4px solid #00ffff",
                  padding: "0.65rem 1.5rem",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  boxShadow: isSaving ? "none" : "0 0 14px #00ffff88",
                  letterSpacing: "0.1em",
                }}
                data-ocid="coverletter.submit_button"
              >
                {isSaving ? "[SAVING...]" : "[SAVE LETTER \u2192 +75 XP]"}
              </button>
            </div>

            {/* RIGHT: Live Preview */}
            <div
              className="flex flex-col overflow-y-auto"
              style={{
                flex: "0 0 50%",
                background: "#050810",
                padding: "1.5rem",
              }}
              data-ocid="coverletter.preview_panel"
            >
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h2
                  className="font-display font-bold tracking-widest"
                  style={{
                    fontSize: "1.125rem",
                    color: "#00ffff",
                    textShadow: "0 0 6px #00ffff",
                  }}
                >
                  📄 LIVE PREVIEW
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(form.body)
                      .then(() => toast("Letter copied!"));
                  }}
                  className="font-display transition-smooth"
                  style={{
                    fontSize: "1.125rem",
                    color: "#00ffff88",
                    border: "3px solid #00ffff44",
                    padding: "0.2rem 0.6rem",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  data-ocid="coverletter.preview_copy_button"
                >
                  [COPY]
                </button>
              </div>

              {/* Letter document */}
              <div
                className="flex-1 overflow-y-auto"
                style={{
                  background: "#ffffff",
                  border: "4px solid #00ffff44",
                  padding: "2.5rem",
                  boxShadow: "0 0 20px #00ffff22, 0 4px 24px rgba(0,0,0,0.6)",
                }}
                data-ocid="coverletter.preview_document"
              >
                {/* Letterhead */}
                <div
                  style={{
                    borderBottom: "2px solid #e0e0e0",
                    marginBottom: "1.5rem",
                    paddingBottom: "1rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "#111",
                      fontFamily: "Georgia, serif",
                      marginBottom: "0.15rem",
                    }}
                  >
                    {form.yourName || "Your Name"}
                  </p>
                  <p
                    style={{
                      fontSize: "1.125rem",
                      color: "#555",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {form.jobTitle
                      ? `Applying for: ${form.jobTitle}`
                      : "Application Letter"}
                  </p>
                  {form.company && (
                    <p
                      style={{
                        fontSize: "1.125rem",
                        color: "#777",
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      To: {form.company}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "1.125rem",
                      color: "#999",
                      fontFamily: "Georgia, serif",
                      marginTop: "0.25rem",
                    }}
                  >
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Body */}
                <div
                  style={{
                    fontSize: "1.125rem",
                    color: "#1a1a1a",
                    fontFamily: "Georgia, serif",
                    lineHeight: 1.75,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {form.body ||
                    "Start filling in the fields on the left to generate your letter."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── DELETE CONFIRM OVERLAY ──────────────────── */}
      {deleteConfirm !== null && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.85)" }}
          data-ocid="coverletter.delete_dialog"
        >
          <div
            className="flex flex-col gap-6 p-8"
            style={{
              background: "#0d1220",
              border: "4px solid #ff4444",
              boxShadow: "0 0 24px #ff444466",
              maxWidth: "420px",
              width: "90%",
            }}
          >
            <h3
              className="font-display font-bold tracking-widest"
              style={{
                fontSize: "1.5rem",
                color: "#ff4444",
                textShadow: "0 0 8px #ff4444",
              }}
            >
              DELETE LETTER?
            </h3>
            <p
              className="font-display"
              style={{ fontSize: "1.125rem", color: "#aabbcc" }}
            >
              This letter will vanish forever. No refunds on written words.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="font-display font-bold tracking-wide transition-smooth"
                style={{
                  fontSize: "1.125rem",
                  color: "#fff",
                  background: "#cc2222",
                  border: "4px solid #ff4444",
                  padding: "0.5rem 1.25rem",
                  cursor: deleteMutation.isPending ? "not-allowed" : "pointer",
                }}
                data-ocid="coverletter.confirm_button"
              >
                [CONFIRM DELETE]
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="font-display font-bold tracking-wide transition-smooth"
                style={{
                  fontSize: "1.125rem",
                  color: "#7a9aaa",
                  background: "transparent",
                  border: "4px solid #334455",
                  padding: "0.5rem 1.25rem",
                  cursor: "pointer",
                }}
                data-ocid="coverletter.cancel_button"
              >
                [CANCEL]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
