import { createActor } from "@/backend";
import type { Experience, Resume } from "@/backend";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelModal } from "@/components/ui/PixelModal";
import { toast } from "@/components/ui/Toast";
import { GameBridge } from "@/game/GameBridge";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type ExperienceForm = Experience & { _key: string };

const EMPTY_EXP: ExperienceForm = {
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  description: "",
  _key: "exp-0",
};

let _keyCount = 0;
const nextKey = () => `exp-${++_keyCount}`;

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  summary: "",
  skills: "",
  experiences: [{ ...EMPTY_EXP }] as ExperienceForm[],
};
type ResumeForm = typeof EMPTY_FORM;

function resumeToForm(r: Resume): ResumeForm {
  return {
    name: r.name,
    email: r.email,
    phone: r.phone,
    summary: r.summary,
    skills: r.skills.join(", "),
    experiences:
      r.experiences.length > 0
        ? r.experiences.map((e, i) => ({ ...e, _key: `exp-edit-${i}` }))
        : [{ ...EMPTY_EXP }],
  };
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString();
}

// ── ATS Score ──────────────────────────────────────────────────────────────

const ATS_KEYWORDS = [
  "managed",
  "led",
  "developed",
  "built",
  "designed",
  "achieved",
  "increased",
  "reduced",
  "collaborated",
  "delivered",
  "optimized",
  "implemented",
  "improved",
  "launched",
  "created",
];

function calcAtsScore(form: ResumeForm): number {
  const allText = [
    form.name,
    form.summary,
    form.skills,
    ...form.experiences.map((e) => `${e.description} ${e.title}`),
  ]
    .join(" ")
    .toLowerCase();
  const totalChars = allText.length;
  const keywordHits = ATS_KEYWORDS.filter((kw) => allText.includes(kw)).length;
  const charScore = Math.min(totalChars / 800, 1) * 40;
  const kwScore = (keywordHits / ATS_KEYWORDS.length) * 40;
  const hasAllFields =
    form.name && form.email && form.summary && form.skills ? 20 : 0;
  return Math.round(charScore + kwScore + hasAllFields);
}

// ── ATS Score Bar ──────────────────────────────────────────────────────────

function AtsScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "#39ff14" : score >= 40 ? "#ffbf00" : "#ff00ff";
  const label = score >= 70 ? "STRONG" : score >= 40 ? "DECENT" : "NEEDS WORK";
  return (
    <div className="flex flex-col gap-1">
      <div
        className="font-display flex items-center justify-between"
        style={{ fontSize: "1.125rem" }}
      >
        <span style={{ color: "#ff00ff", textShadow: "0 0 8px #ff00ff" }}>
          ATS COMPATIBILITY
        </span>
        <span style={{ color, textShadow: `0 0 8px ${color}` }}>
          {score}% — {label}
        </span>
      </div>
      <div
        style={{
          height: "1rem",
          background: "#0d0d1a",
          border: "4px solid #ff00ff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            transition: "width 0.4s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)",
          }}
        />
      </div>
    </div>
  );
}

// ── ATS Tips ───────────────────────────────────────────────────────────────

const ATS_TIPS = [
  "Use action verbs — led, built, achieved",
  "Include keywords from the job posting",
  "Quantify results with numbers where possible",
  "Keep summary under 3 sentences",
  "List skills matching the job description",
  "Use consistent date formats (YYYY-MM)",
];

function AtsSidebar() {
  return (
    <div
      style={{
        background: "#0d0d1a",
        border: "4px solid #ff00ff",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        minWidth: "220px",
        flexShrink: 0,
      }}
    >
      <div
        className="font-display neon-text-magenta"
        style={{ fontSize: "1.125rem", marginBottom: "0.25rem" }}
      >
        ATS TIPS
      </div>
      {ATS_TIPS.map((tip) => (
        <div
          key={tip}
          className="font-display"
          style={{
            fontSize: "1.125rem",
            color: "#ccc",
            lineHeight: 1.5,
            paddingLeft: "0.75rem",
            borderLeft: "3px solid #ff00ff44",
          }}
        >
          ▸ {tip}
        </div>
      ))}
    </div>
  );
}

// ── Collapsible Section ────────────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        border: "4px solid #ff00ff44",
        marginBottom: "0.5rem",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "#ff00ff18",
          border: "none",
          borderBottom: open ? "4px solid #ff00ff44" : "none",
          padding: "0.5rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <span
          className="font-display neon-text-magenta"
          style={{ fontSize: "1.125rem", letterSpacing: "0.08em" }}
        >
          {title}
        </span>
        <span
          className="font-display"
          style={{ color: "#ff00ff", fontSize: "1.125rem" }}
        >
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div style={{ padding: "1rem" }}>{children}</div>}
    </div>
  );
}

// ── XP Toast ───────────────────────────────────────────────────────────────

function XpPopup({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: "6rem",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#0d0d1a",
        border: "4px solid #ff00ff",
        padding: "0.75rem 2rem",
        zIndex: 9999,
        animation: "fadeUpOut 3s forwards",
        boxShadow: "0 0 24px #ff00ff, 0 0 48px #ff00ff44",
        pointerEvents: "none",
      }}
    >
      <span
        className="font-display neon-text-magenta"
        style={{ fontSize: "1.25rem" }}
      >
        +100 XP GAINED!
      </span>
    </div>
  );
}

// ── Interior Scene Decoration ──────────────────────────────────────────────

function InteriorBg() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Dark wood floor tiles */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 31px, #ff00ff0a 31px, #ff00ff0a 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, #ff00ff0a 31px, #ff00ff0a 32px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Brick wall at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          backgroundImage:
            "repeating-linear-gradient(0deg, #1a0a1a, #1a0a1a 18px, #ff00ff22 18px, #ff00ff22 20px), repeating-linear-gradient(90deg, #1a0a1a, #1a0a1a 38px, #ff00ff22 38px, #ff00ff22 40px)",
          backgroundSize: "40px 20px",
          opacity: 0.7,
        }}
      />
      {/* Bookshelves left */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "60px",
          width: "32px",
          bottom: 0,
          background:
            "repeating-linear-gradient(180deg, #3a1a3a 0px, #3a1a3a 20px, #1a0a1a 20px, #1a0a1a 24px)",
          borderRight: "4px solid #ff00ff33",
        }}
      />
      {/* Bookshelves right */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "60px",
          width: "32px",
          bottom: 0,
          background:
            "repeating-linear-gradient(180deg, #3a1a3a 0px, #3a1a3a 20px, #1a0a1a 20px, #1a0a1a 24px)",
          borderLeft: "4px solid #ff00ff33",
        }}
      />
      {/* Scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.12), rgba(0,0,0,0.12) 1px, transparent 1px, transparent 2px)",
        }}
      />
    </div>
  );
}

// ── Resume Card ────────────────────────────────────────────────────────────

function ResumeCard({
  resume,
  index,
  onEdit,
  onDelete,
}: {
  resume: Resume;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <PixelCard
      variant="secondary"
      glowing
      data-ocid={`resume.item.${index}`}
      className="flex items-start justify-between gap-4"
    >
      <div className="flex-1 min-w-0">
        <div
          className="font-display neon-text-magenta truncate"
          style={{ fontSize: "1.125rem", marginBottom: "0.25rem" }}
        >
          {resume.name}
        </div>
        <div
          className="font-display"
          style={{
            fontSize: "1.125rem",
            color: "#aaa",
            marginBottom: "0.25rem",
          }}
        >
          {resume.email}
          {resume.phone ? ` • ${resume.phone}` : ""}
        </div>
        {resume.summary && (
          <div
            className="font-display line-clamp-2"
            style={{
              fontSize: "1.125rem",
              color: "#ddd",
              lineHeight: 1.5,
              marginBottom: "0.5rem",
            }}
          >
            {resume.summary}
          </div>
        )}
        {resume.skills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {resume.skills.slice(0, 5).map((s) => (
              <span
                key={s}
                className="font-display"
                style={{
                  fontSize: "1.125rem",
                  border: "2px solid #ff00ff",
                  color: "#ff00ff",
                  padding: "1px 6px",
                }}
              >
                {s}
              </span>
            ))}
            {resume.skills.length > 5 && (
              <span
                className="font-display"
                style={{ fontSize: "1.125rem", color: "#888" }}
              >
                +{resume.skills.length - 5} more
              </span>
            )}
          </div>
        )}
        <div
          className="font-display"
          style={{ fontSize: "1.125rem", color: "#666", marginTop: "0.5rem" }}
        >
          SAVED: {formatDate(resume.updatedAt)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <PixelButton
          variant="ghost"
          size="sm"
          onClick={onEdit}
          data-ocid={`resume.edit_button.${index}`}
        >
          [EDIT]
        </PixelButton>
        <PixelButton
          variant="danger"
          size="sm"
          onClick={onDelete}
          data-ocid={`resume.delete_button.${index}`}
        >
          [DEL]
        </PixelButton>
      </div>
    </PixelCard>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ResumePage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Resume | null>(null);
  const [form, setForm] = useState<ResumeForm>({
    ...EMPTY_FORM,
    experiences: [{ ...EMPTY_EXP }],
  });
  const [deleteConfirm, setDeleteConfirm] = useState<bigint | null>(null);
  const [xpPopup, setXpPopup] = useState(false);

  // Emit locationChanged on mount for music
  useEffect(() => {
    GameBridge.emit("locationChanged", { locationId: "resume_tailor" });
  }, []);

  const { data: resumes = [], isLoading } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listResumes();
    },
    enabled: !!actor && !isFetching,
  });

  const createMutation = useMutation({
    mutationFn: async (f: ResumeForm) => {
      if (!actor) throw new Error("No actor");
      const exps: Experience[] = f.experiences.filter(
        (e) => e.company || e.title,
      );
      return actor.createResume(
        f.name,
        f.email,
        f.phone,
        f.summary,
        exps,
        f.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      GameBridge.emit("xpGained", { amount: 100, source: "resume_saved" });
      setXpPopup(true);
      setTimeout(() => setXpPopup(false), 3200);
      toast("+100 XP! Resume saved.", "success");
      setModalOpen(false);
      setForm({ ...EMPTY_FORM, experiences: [{ ...EMPTY_EXP }] });
    },
    onError: () => toast("SAVE FAILED. The gods are displeased.", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: bigint; f: ResumeForm }) => {
      if (!actor) throw new Error("No actor");
      const exps: Experience[] = f.experiences.filter(
        (e) => e.company || e.title,
      );
      return actor.updateResume(
        id,
        f.name,
        f.email,
        f.phone,
        f.summary,
        exps,
        f.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      GameBridge.emit("xpGained", { amount: 100, source: "resume_saved" });
      setXpPopup(true);
      setTimeout(() => setXpPopup(false), 3200);
      toast("+100 XP! Resume updated.", "success");
      setModalOpen(false);
      setEditTarget(null);
      setForm({ ...EMPTY_FORM, experiences: [{ ...EMPTY_EXP }] });
    },
    onError: () => toast("UPDATE FAILED. Resume resists change.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteResume(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast("RESUME DELETED. Godspeed.", "warning");
      setDeleteConfirm(null);
    },
    onError: () => toast("DELETE FAILED. Resume clings to life.", "error"),
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, experiences: [{ ...EMPTY_EXP }] });
    setModalOpen(true);
  };

  const openEdit = (r: Resume) => {
    setEditTarget(r);
    setForm(resumeToForm(r));
    setModalOpen(true);
  };

  const handleExit = () => {
    navigate({ to: "/" });
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) {
      toast("Name and email are required. Shocking, I know.", "error");
      return;
    }
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, f: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateExp = (i: number, field: keyof ExperienceForm, val: string) => {
    setForm((prev) => {
      const exps = [...prev.experiences];
      exps[i] = { ...exps[i], [field]: val };
      return { ...prev, experiences: exps };
    });
  };

  const addExp = () =>
    setForm((prev) => ({
      ...prev,
      experiences: [...prev.experiences, { ...EMPTY_EXP, _key: nextKey() }],
    }));

  const removeExp = (i: number) =>
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, idx) => idx !== i),
    }));

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const atsScore = calcAtsScore(form);

  return (
    <div
      data-ocid="resume.page"
      className="relative w-full"
      style={{
        height: "100vh",
        overflowY: "auto",
        background: "#0d0d1a",
        fontFamily: "var(--font-display), monospace",
      }}
    >
      <InteriorBg />
      <XpPopup visible={xpPopup} />

      {/* ── Header ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#1a0a1a",
          borderBottom: "4px solid #ff00ff",
          boxShadow: "0 0 20px #ff00ff44",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Back button */}
        <PixelButton
          variant="ghost"
          size="sm"
          onClick={handleExit}
          data-ocid="resume.back_button"
          style={{
            borderColor: "#ff00ff",
            color: "#ff00ff",
            minWidth: "140px",
          }}
        >
          ← TOWN SQUARE
        </PixelButton>

        {/* Building title */}
        <div style={{ textAlign: "center", flex: 1 }}>
          <div
            className="font-display neon-text-magenta"
            style={{ fontSize: "1.25rem", letterSpacing: "0.1em" }}
          >
            📋 RESUME TAILOR
          </div>
          <div
            className="font-display"
            style={{
              fontSize: "1.125rem",
              color: "#ff00ff88",
              marginTop: "2px",
            }}
          >
            Polishing bullet points since forever
          </div>
        </div>

        {/* Spacer */}
        <div style={{ minWidth: "140px" }} />
      </div>

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* ── NPC VERA ── */}
        <div
          style={{
            background: "#1a0a1a",
            border: "4px solid #ff00ff",
            boxShadow: "0 0 16px #ff00ff44",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
          }}
          data-ocid="resume.npc_dialogue"
        >
          <div style={{ fontSize: "2.5rem", lineHeight: 1, flexShrink: 0 }}>
            🧙‍♀️
          </div>
          <div>
            <div
              className="font-display neon-text-magenta"
              style={{ fontSize: "1.125rem", marginBottom: "0.4rem" }}
            >
              VERA — CAREER COUNSELOR
            </div>
            <div
              className="font-display"
              style={{ fontSize: "1.125rem", color: "#eee", lineHeight: 1.6 }}
            >
              Welcome, job seeker. Let me help you craft the perfect resume. Or
              at least a passable one. Even heroes need a good CV before the
              adventure begins.
            </div>
          </div>
        </div>

        {/* ── Action bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            className="font-display neon-text-magenta"
            style={{ fontSize: "1.125rem" }}
          >
            RESUMES ({resumes.length})
          </div>
          <PixelButton
            variant="secondary"
            size="md"
            onClick={openCreate}
            data-ocid="resume.new_button"
          >
            [+ NEW RESUME]
          </PixelButton>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div
            className="font-display"
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "#ff00ff88",
              fontSize: "1.125rem",
            }}
            data-ocid="resume.loading_state"
          >
            LOADING RESUMES...
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && resumes.length === 0 && (
          <PixelCard
            variant="secondary"
            className="text-center py-10"
            data-ocid="resume.empty_state"
          >
            <div
              className="font-display"
              style={{
                fontSize: "1.125rem",
                color: "#ff00ff",
                marginBottom: "0.5rem",
              }}
            >
              NO RESUMES YET
            </div>
            <div
              className="font-display"
              style={{
                fontSize: "1.125rem",
                color: "#888",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              Your career story is unwritten.
              <br />
              That&apos;s either inspiring or terrifying.
            </div>
            <PixelButton
              variant="secondary"
              size="lg"
              onClick={openCreate}
              data-ocid="resume.empty_new_button"
            >
              [CREATE FIRST RESUME]
            </PixelButton>
          </PixelCard>
        )}

        {/* ── Resume list ── */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {resumes.map((r, i) => (
            <ResumeCard
              key={String(r.id)}
              resume={r}
              index={i + 1}
              onEdit={() => openEdit(r)}
              onDelete={() => setDeleteConfirm(r.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Delete confirm modal ── */}
      <PixelModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="DELETE RESUME?"
        variant="default"
        data-ocid="resume.delete_dialog"
      >
        <div
          className="font-display"
          style={{
            fontSize: "1.125rem",
            color: "#aaa",
            lineHeight: 1.6,
            marginBottom: "1.5rem",
          }}
        >
          Are you sure? This resume will be gone forever.
          <br />
          Forever is a long time.
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <PixelButton
            variant="danger"
            onClick={() =>
              deleteConfirm !== null && deleteMutation.mutate(deleteConfirm)
            }
            disabled={deleteMutation.isPending}
            data-ocid="resume.confirm_button"
          >
            [CONFIRM DELETE]
          </PixelButton>
          <PixelButton
            variant="ghost"
            onClick={() => setDeleteConfirm(null)}
            data-ocid="resume.cancel_button"
          >
            [CANCEL]
          </PixelButton>
        </div>
      </PixelModal>

      {/* ── Create / Edit modal ── */}
      <PixelModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
        title={editTarget ? "EDIT RESUME" : "NEW RESUME"}
        variant="secondary"
        className="max-h-[92vh] overflow-y-auto w-full max-w-3xl"
        data-ocid="resume.form_dialog"
      >
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            alignItems: "flex-start",
          }}
        >
          {/* Form */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {/* ATS score at top */}
            <AtsScoreBar score={atsScore} />

            {/* Contact Info */}
            <Section title="CONTACT INFO">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <PixelInput
                  label="FULL NAME"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ada Lovelace"
                  data-ocid="resume.name_input"
                />
                <PixelInput
                  label="EMAIL"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="ada@computing.io"
                  data-ocid="resume.email_input"
                />
              </div>
              <PixelInput
                label="PHONE"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="555-HIRE-ME"
                data-ocid="resume.phone_input"
              />
            </Section>

            {/* Summary */}
            <Section title="SUMMARY">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <label
                  htmlFor="resume-summary"
                  className="font-display"
                  style={{
                    fontSize: "1.125rem",
                    color: "#aaa",
                    letterSpacing: "0.06em",
                  }}
                >
                  PROFESSIONAL SUMMARY
                </label>
                <textarea
                  id="resume-summary"
                  value={form.summary}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, summary: e.target.value }))
                  }
                  className="font-display"
                  style={{
                    fontSize: "1.125rem",
                    background: "#0d0d1a",
                    color: "#eee",
                    border: "4px solid #ff00ff44",
                    padding: "0.5rem 0.75rem",
                    resize: "vertical",
                    minHeight: "80px",
                    outline: "none",
                    lineHeight: 1.6,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#ff00ff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#ff00ff44";
                  }}
                  placeholder="A brief origin story. Keep it under 3 sentences."
                  data-ocid="resume.summary_textarea"
                />
                <div
                  className="font-display"
                  style={{
                    fontSize: "1.125rem",
                    color: "#666",
                    textAlign: "right",
                  }}
                >
                  {form.summary.length} chars
                </div>
              </div>
            </Section>

            {/* Work Experience */}
            <Section title="WORK EXPERIENCE">
              {form.experiences.map((exp, i) => (
                <div
                  key={exp._key}
                  style={{
                    border: "4px solid #ff00ff22",
                    padding: "0.75rem",
                    marginBottom: "0.75rem",
                    position: "relative",
                  }}
                >
                  <div
                    className="font-display"
                    style={{
                      fontSize: "1.125rem",
                      color: "#ff00ff88",
                      marginBottom: "0.5rem",
                    }}
                  >
                    ENTRY #{i + 1}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <PixelInput
                      label="COMPANY"
                      value={exp.company}
                      onChange={(e) => updateExp(i, "company", e.target.value)}
                      placeholder="Acme Corp"
                    />
                    <PixelInput
                      label="JOB TITLE"
                      value={exp.title}
                      onChange={(e) => updateExp(i, "title", e.target.value)}
                      placeholder="Senior Pixel Pusher"
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <PixelInput
                      label="START DATE"
                      value={exp.startDate}
                      onChange={(e) =>
                        updateExp(i, "startDate", e.target.value)
                      }
                      placeholder="2020-01"
                    />
                    <PixelInput
                      label="END DATE"
                      value={exp.endDate}
                      onChange={(e) => updateExp(i, "endDate", e.target.value)}
                      placeholder="Present"
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <label
                      htmlFor={`exp-desc-${exp._key}`}
                      className="font-display"
                      style={{
                        fontSize: "1.125rem",
                        color: "#aaa",
                        letterSpacing: "0.06em",
                      }}
                    >
                      DESCRIPTION
                    </label>
                    <textarea
                      id={`exp-desc-${exp._key}`}
                      value={exp.description}
                      onChange={(e) =>
                        updateExp(i, "description", e.target.value)
                      }
                      className="font-display"
                      style={{
                        fontSize: "1.125rem",
                        background: "#0d0d1a",
                        color: "#eee",
                        border: "4px solid #ff00ff22",
                        padding: "0.5rem 0.75rem",
                        resize: "vertical",
                        minHeight: "60px",
                        outline: "none",
                        lineHeight: 1.5,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#ff00ff";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#ff00ff22";
                      }}
                      placeholder="Achieved synergy. Disrupted paradigms. Had meetings."
                    />
                    <div
                      className="font-display"
                      style={{
                        fontSize: "1.125rem",
                        color: "#666",
                        textAlign: "right",
                      }}
                    >
                      {exp.description.length} chars
                    </div>
                  </div>
                  {form.experiences.length > 1 && (
                    <button
                      type="button"
                      className="font-display"
                      style={{
                        position: "absolute",
                        top: "0.5rem",
                        right: "0.5rem",
                        fontSize: "1.125rem",
                        color: "#ff4444",
                        border: "2px solid #ff4444",
                        background: "transparent",
                        padding: "2px 6px",
                        cursor: "pointer",
                      }}
                      onClick={() => removeExp(i)}
                    >
                      [REMOVE]
                    </button>
                  )}
                </div>
              ))}
              <PixelButton
                variant="ghost"
                size="sm"
                onClick={addExp}
                data-ocid="resume.add_experience_button"
              >
                [+ ADD EXPERIENCE]
              </PixelButton>
            </Section>

            {/* Education */}
            <Section title="EDUCATION" defaultOpen={false}>
              <div
                className="font-display"
                style={{ fontSize: "1.125rem", color: "#888", lineHeight: 1.6 }}
              >
                Include your degrees and certifications in the skills section
                below, or add experience entries for educational milestones.
              </div>
            </Section>

            {/* Skills */}
            <Section title="SKILLS">
              <PixelInput
                label="SKILLS (comma-separated)"
                value={form.skills}
                onChange={(e) =>
                  setForm((p) => ({ ...p, skills: e.target.value }))
                }
                placeholder="React, TypeScript, Leadership, Coffee Mastery"
                data-ocid="resume.skills_input"
              />
              <div
                className="font-display"
                style={{
                  fontSize: "1.125rem",
                  color: "#666",
                  marginTop: "0.25rem",
                  textAlign: "right",
                }}
              >
                {form.skills.split(",").filter((s) => s.trim()).length} skills
              </div>
            </Section>

            {/* Save button */}
            <div
              style={{
                borderTop: "4px solid #ff00ff44",
                paddingTop: "1rem",
                display: "flex",
                gap: "0.75rem",
              }}
            >
              <PixelButton
                variant="secondary"
                size="lg"
                onClick={handleSubmit}
                disabled={isSaving}
                data-ocid="resume.submit_button"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  fontSize: "1.125rem",
                }}
              >
                {isSaving
                  ? "[SAVING...]"
                  : editTarget
                    ? "[SAVE CHANGES → +100 XP]"
                    : "[SAVE RESUME → +100 XP]"}
              </PixelButton>
              <PixelButton
                variant="ghost"
                onClick={() => {
                  setModalOpen(false);
                  setEditTarget(null);
                }}
                data-ocid="resume.form_cancel_button"
              >
                [CANCEL]
              </PixelButton>
            </div>
          </div>

          {/* Sidebar */}
          <AtsSidebar />
        </div>
      </PixelModal>

      {/* Keyframe for XP popup */}
      <style>{`
        @keyframes fadeUpOut {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
          70%  { opacity: 1; transform: translateX(-50%) translateY(-16px); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-32px); }
        }
      `}</style>
    </div>
  );
}
