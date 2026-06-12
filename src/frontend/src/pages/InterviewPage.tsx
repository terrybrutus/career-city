import { createActor } from "@/backend";
import type { InterviewNote } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = "Entry Level" | "Mid Level" | "Senior Level";
type Phase = "INTRO" | "QUESTION" | "FEEDBACK" | "COMPLETE";

interface Question {
  id: string;
  text: string;
}

const QUESTIONS: Record<Difficulty, Question[]> = {
  "Entry Level": [
    { id: "el1", text: "Tell me about yourself." },
    { id: "el2", text: "What are your greatest strengths?" },
    { id: "el3", text: "Why do you want this job?" },
    { id: "el4", text: "Where do you see yourself in 5 years?" },
    { id: "el5", text: "What's your biggest weakness?" },
    {
      id: "el6",
      text: "Describe a challenge you overcame in school or a previous role.",
    },
    { id: "el7", text: "How do you handle feedback from a manager?" },
    { id: "el8", text: "Why are you interested in this industry?" },
  ],
  "Mid Level": [
    {
      id: "ml1",
      text: "Describe a challenging project you led or contributed to significantly.",
    },
    { id: "ml2", text: "How do you handle conflict at work?" },
    {
      id: "ml3",
      text: "Tell me about a time you led a team, formally or informally.",
    },
    {
      id: "ml4",
      text: "What's your approach to problem-solving under pressure?",
    },
    { id: "ml5", text: "Describe your workflow when tackling a complex task." },
    { id: "ml6", text: "How do you prioritize when everything feels urgent?" },
    {
      id: "ml7",
      text: "Tell me about a time you disagreed with a decision. What happened?",
    },
    {
      id: "ml8",
      text: "How do you keep your skills sharp in a fast-moving field?",
    },
  ],
  "Senior Level": [
    {
      id: "sl1",
      text: "How do you build consensus among stakeholders with conflicting priorities?",
    },
    {
      id: "sl2",
      text: "Tell me about a significant failure and what you learned from it.",
    },
    {
      id: "sl3",
      text: "How do you mentor junior team members without micromanaging?",
    },
    { id: "sl4", text: "Describe your leadership philosophy." },
    {
      id: "sl5",
      text: "How do you handle competing priorities at a strategic level?",
    },
    {
      id: "sl6",
      text: "Describe a time you had to change direction mid-project. How did you manage it?",
    },
    {
      id: "sl7",
      text: "How do you make decisions with incomplete information?",
    },
    {
      id: "sl8",
      text: "Tell me about a time you influenced organizational change.",
    },
  ],
};

const TIMER_SECONDS = 60;
const SESSION_QUESTIONS = 5;

function getSessionQuestions(difficulty: Difficulty): Question[] {
  const pool = [...QUESTIONS[difficulty]];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, SESSION_QUESTIONS);
}

function getChadFeedback(answer: string): string {
  const len = answer.trim().length;
  if (len === 0)
    return "...You submitted nothing. That's a bold strategy. It won't work.";
  if (len < 30) return "That's... sparse. Try expanding on that. WAY more.";
  if (len < 100) return "Decent. Could be punchier. But you've done worse.";
  if (len < 250)
    return "Not bad. You actually said something. I'm moderately impressed.";
  return "Thorough. Maybe too thorough — interviewers have other meetings. But I respect the effort.";
}

function getQuestionScore(answer: string): number {
  const len = answer.trim().length;
  if (len === 0) return 1;
  if (len < 30) return 2;
  if (len < 100) return 3;
  if (len < 200) return 4;
  return 5;
}

function getGrade(total: number): {
  grade: string;
  label: string;
  color: string;
} {
  const pct = total / (SESSION_QUESTIONS * 5);
  if (pct >= 0.9) return { grade: "S", label: "OUTSTANDING", color: "#ffaa00" };
  if (pct >= 0.75) return { grade: "A", label: "EXCELLENT", color: "#39ff14" };
  if (pct >= 0.55)
    return { grade: "B", label: "SOLID EFFORT", color: "#00ffff" };
  return { grade: "C", label: "NEEDS WORK", color: "#ff00ff" };
}

// Stable star keys — never changes, never reorders, safe to use static keys
const STAR_SLOT_IDS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
];

function StarRow({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <span className="inline-flex gap-1">
      {STAR_SLOT_IDS.slice(0, max).map((slotId, pos) => (
        <span
          key={slotId}
          style={{
            color: pos < score ? "#ffaa00" : "#333",
            textShadow: pos < score ? "0 0 6px #ffaa00" : "none",
            fontSize: "1.25rem",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const pct = seconds / total;
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const dash = pct * circ;
  const color =
    seconds <= 10 ? "#ff2244" : seconds <= 30 ? "#ffaa00" : "#39ff14";
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 96, height: 96 }}
    >
      <svg
        width="96"
        height="96"
        style={{ transform: "rotate(-90deg)" }}
        role="img"
        aria-label={`Timer: ${seconds} seconds remaining`}
      >
        <title>Countdown timer</title>
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#222"
          strokeWidth="8"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="butt"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: "stroke-dasharray 1s linear, stroke 0.5s",
          }}
        />
      </svg>
      <span
        className="absolute font-display"
        aria-hidden="true"
        style={{
          color,
          fontSize: "1.5rem",
          fontWeight: 700,
          textShadow: `0 0 8px ${color}`,
        }}
      >
        {seconds}
      </span>
    </div>
  );
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  // Session state machine
  const [phase, setPhase] = useState<Phase>("INTRO");
  const [difficulty, setDifficulty] = useState<Difficulty>("Entry Level");
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mount: emit locationChanged for music
  useEffect(() => {
    GameBridge.emit("locationChanged", { locationId: "interview_coach" });
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerActive(false);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive]);

  function handleAutoSubmit() {
    toast("⏰ TIME'S UP! Auto-submitted.", {
      style: {
        background: "#1a0000",
        color: "#ff2244",
        border: "2px solid #ff2244",
      },
    });
    submitAnswer(currentAnswer);
  }

  function startSession() {
    const qs = getSessionQuestions(difficulty);
    setSessionQuestions(qs);
    setQuestionIndex(0);
    setCurrentAnswer("");
    setAnswers([]);
    setScores([]);
    setTimer(TIMER_SECONDS);
    setTimerActive(true);
    setPhase("QUESTION");
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  function submitAnswer(ans: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    const score = getQuestionScore(ans);
    const newAnswers = [...answers, ans];
    const newScores = [...scores, score];
    setAnswers(newAnswers);
    setScores(newScores);
    setCurrentAnswer("");
    setPhase("FEEDBACK");
  }

  function handleSubmitClick() {
    submitAnswer(currentAnswer);
  }

  function goNextQuestion() {
    const nextIdx = questionIndex + 1;
    if (nextIdx >= SESSION_QUESTIONS) {
      setPhase("COMPLETE");
    } else {
      setQuestionIndex(nextIdx);
      setTimer(TIMER_SECONDS);
      setTimerActive(true);
      setPhase("QUESTION");
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }

  const totalScore = scores.reduce((s, x) => s + x, 0);

  // ─── Save mutation ────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const now = BigInt(Date.now()) * 1_000_000n;
      const grade = getGrade(totalScore);
      const notesText = sessionQuestions
        .map(
          (q, i) =>
            `Q: ${q.text}\nA: ${answers[i] ?? ""}\nScore: ${scores[i] ?? 0}/5`,
        )
        .join("\n\n");
      return actor.createInterviewNote(
        now,
        difficulty,
        `Session: ${difficulty} — Grade ${grade.grade} (${totalScore}/${SESSION_QUESTIONS * 5})`,
        notesText,
        BigInt(totalScore),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-notes"] });
      GameBridge.emit("xpGained", { amount: 150 });
      toast("🌟 +150 XP! Practice session complete.", {
        style: {
          background: "#0d0a00",
          color: "#ffaa00",
          border: "2px solid #ffaa00",
        },
      });
    },
    onError: () => toast("Failed to save session. Try again."),
  });

  // History
  const { data: history = [], isLoading: historyLoading } = useQuery<
    InterviewNote[]
  >({
    queryKey: ["interview-notes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listInterviewNotes();
    },
    enabled: !!actor && !isFetching,
  });

  function goToTown() {
    navigate({ to: "/" });
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      data-ocid="interview.page"
      className="scanline"
      style={{
        minHeight: "100dvh",
        background: "#050505",
        color: "#f0f0f0",
        fontFamily: "var(--font-display), monospace",
        overflowY: "auto",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: "#0d0900",
          borderBottom: "4px solid #ffaa00",
          boxShadow: "0 0 20px #ffaa0055",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#ffaa00",
              textShadow: "0 0 12px #ffaa00, 0 0 24px #ffaa0088",
            }}
          >
            🎤 INTERVIEW COACH
          </div>
          <div style={{ fontSize: "1.125rem", color: "#aaa", marginTop: 2 }}>
            CHAD'S PRACTICE ARENA
          </div>
        </div>
        <button
          type="button"
          data-ocid="interview.back_button"
          onClick={goToTown}
          style={{
            background: "transparent",
            border: "3px solid #ffaa00",
            color: "#ffaa00",
            fontSize: "1.125rem",
            padding: "0.5rem 1.25rem",
            cursor: "pointer",
            fontFamily: "var(--font-display), monospace",
            letterSpacing: "0.05em",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 12px #ffaa00";
            e.currentTarget.style.background = "#1a0d0055";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.background = "transparent";
          }}
        >
          ← TOWN SQUARE
        </button>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.5rem" }}>
        {/* ── NPC CHAD ── */}
        <div
          style={{
            background: "#100a00",
            border: "3px solid #ffaa00",
            boxShadow: "0 0 16px #ffaa0044",
            borderRadius: 0,
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            gap: "1rem",
            alignItems: "flex-start",
          }}
        >
          <div style={{ fontSize: "2.5rem", flexShrink: 0, lineHeight: 1 }}>
            🧑‍💼
          </div>
          <div>
            <div
              style={{
                fontSize: "1.125rem",
                color: "#ffaa00",
                fontWeight: 700,
                marginBottom: 4,
                textShadow: "0 0 8px #ffaa00",
              }}
            >
              CHAD THE INTERVIEWER:
            </div>
            <div
              style={{ fontSize: "1.125rem", color: "#ccc", lineHeight: 1.6 }}
            >
              I used to interview for Google. Then I became an NPC. Let&apos;s
              get you ready.
            </div>
          </div>
        </div>

        {/* ── INTRO PHASE ── */}
        {phase === "INTRO" && (
          <IntroPhase
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            onStart={startSession}
            history={history}
            historyLoading={historyLoading}
          />
        )}

        {/* ── QUESTION PHASE ── */}
        {phase === "QUESTION" && sessionQuestions[questionIndex] && (
          <QuestionPhase
            question={sessionQuestions[questionIndex]}
            questionIndex={questionIndex}
            total={SESSION_QUESTIONS}
            timer={timer}
            currentAnswer={currentAnswer}
            setCurrentAnswer={setCurrentAnswer}
            onSubmit={handleSubmitClick}
            textareaRef={textareaRef}
          />
        )}

        {/* ── FEEDBACK PHASE ── */}
        {phase === "FEEDBACK" && sessionQuestions[questionIndex] && (
          <FeedbackPhase
            question={sessionQuestions[questionIndex]}
            answer={answers[questionIndex] ?? ""}
            score={scores[questionIndex] ?? 1}
            questionIndex={questionIndex}
            total={SESSION_QUESTIONS}
            onNext={goNextQuestion}
          />
        )}

        {/* ── COMPLETE PHASE ── */}
        {phase === "COMPLETE" && (
          <CompletePhase
            sessionQuestions={sessionQuestions}
            answers={answers}
            scores={scores}
            totalScore={totalScore}
            isSaving={saveMutation.isPending}
            isSaved={saveMutation.isSuccess}
            onSave={() => saveMutation.mutate()}
            onRetry={startSession}
            onGoToTown={goToTown}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntroPhase({
  difficulty,
  setDifficulty,
  onStart,
  history,
  historyLoading,
}: {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  history: InterviewNote[];
  historyLoading: boolean;
}) {
  const DIFFICULTIES: Difficulty[] = [
    "Entry Level",
    "Mid Level",
    "Senior Level",
  ];
  return (
    <div data-ocid="interview.intro_section">
      {/* Welcome card */}
      <div
        style={{
          background: "#0a0800",
          border: "3px solid #443300",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            fontSize: "1.5rem",
            color: "#ffaa00",
            fontWeight: 700,
            marginBottom: "0.75rem",
            textShadow: "0 0 10px #ffaa00",
          }}
        >
          PRACTICE SESSION
        </div>
        <ul
          style={{
            fontSize: "1.125rem",
            color: "#ccc",
            lineHeight: 2,
            paddingLeft: "1.25rem",
          }}
        >
          <li>5 questions selected from the {difficulty} bank</li>
          <li>60 seconds per question — use the time wisely</li>
          <li>CHAD grades each answer (brutally honestly)</li>
          <li>
            Complete all 5 to earn{" "}
            <span style={{ color: "#ffaa00" }}>+150 XP</span>
          </li>
        </ul>
      </div>

      {/* Difficulty selector */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            fontSize: "1.125rem",
            color: "#ffaa00",
            fontWeight: 700,
            marginBottom: "0.75rem",
            letterSpacing: "0.08em",
          }}
        >
          SELECT DIFFICULTY:
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              data-ocid={`interview.difficulty.${d.toLowerCase().replace(/\s+/g, "_")}`}
              onClick={() => setDifficulty(d)}
              style={{
                background: difficulty === d ? "#1a0d00" : "transparent",
                border: `3px solid ${difficulty === d ? "#ffaa00" : "#443300"}`,
                color: difficulty === d ? "#ffaa00" : "#888",
                fontSize: "1.125rem",
                padding: "0.6rem 1.25rem",
                cursor: "pointer",
                fontFamily: "var(--font-display), monospace",
                letterSpacing: "0.05em",
                boxShadow: difficulty === d ? "0 0 10px #ffaa0055" : "none",
                transition: "all 0.15s",
              }}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        type="button"
        data-ocid="interview.start_button"
        onClick={onStart}
        style={{
          background: "#ffaa00",
          border: "3px solid #ffaa00",
          color: "#000",
          fontSize: "1.25rem",
          fontWeight: 700,
          padding: "0.875rem 2.5rem",
          cursor: "pointer",
          fontFamily: "var(--font-display), monospace",
          letterSpacing: "0.1em",
          boxShadow: "0 0 20px #ffaa0088",
          transition: "all 0.15s",
          marginBottom: "2rem",
          display: "block",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 32px #ffaa00";
          e.currentTarget.style.transform = "scale(1.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px #ffaa0088";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        ▶ START PRACTICE SESSION
      </button>

      {/* History section */}
      <div>
        <div
          style={{
            fontSize: "1.25rem",
            color: "#ffaa00",
            fontWeight: 700,
            marginBottom: "0.75rem",
            letterSpacing: "0.08em",
            textShadow: "0 0 8px #ffaa00",
          }}
        >
          PAST SESSIONS
        </div>
        {historyLoading && (
          <div
            data-ocid="interview.loading_state"
            style={{ fontSize: "1.125rem", color: "#666" }}
          >
            LOADING HISTORY...
          </div>
        )}
        {!historyLoading && history.length === 0 && (
          <div
            data-ocid="interview.history_empty_state"
            style={{
              background: "#0a0800",
              border: "3px solid #443300",
              padding: "1.5rem",
              textAlign: "center",
              fontSize: "1.125rem",
              color: "#666",
            }}
          >
            No sessions yet. Complete a session above to start building your
            history.
          </div>
        )}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {history.slice(0, 5).map((note, i) => (
            <div
              key={String(note.id)}
              data-ocid={`interview.history.${i + 1}`}
              style={{
                background: "#0a0800",
                border: "2px solid #332200",
                padding: "1rem 1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "1.125rem",
                    color: "#ffaa00",
                    marginBottom: 4,
                    fontWeight: 700,
                  }}
                >
                  {note.role}
                </div>
                <div
                  style={{
                    fontSize: "1.125rem",
                    color: "#ccc",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {note.question}
                </div>
              </div>
              <div
                style={{ fontSize: "1.125rem", color: "#666", flexShrink: 0 }}
              >
                {formatDate(note.sessionDate)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionPhase({
  question,
  questionIndex,
  total,
  timer,
  currentAnswer,
  setCurrentAnswer,
  onSubmit,
  textareaRef,
}: {
  question: Question;
  questionIndex: number;
  total: number;
  timer: number;
  currentAnswer: string;
  setCurrentAnswer: (v: string) => void;
  onSubmit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const isRed = timer <= 10;
  return (
    <div data-ocid="interview.question_section">
      {/* Progress */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ fontSize: "1.125rem", color: "#888" }}>
          QUESTION {questionIndex + 1} OF {total}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {STAR_SLOT_IDS.slice(0, total).map((slotId, i) => (
            <div
              key={slotId}
              style={{
                width: 16,
                height: 16,
                background:
                  i < questionIndex
                    ? "#39ff14"
                    : i === questionIndex
                      ? "#ffaa00"
                      : "#222",
                boxShadow:
                  i === questionIndex
                    ? "0 0 8px #ffaa00"
                    : i < questionIndex
                      ? "0 0 6px #39ff14"
                      : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Question card + timer */}
      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          alignItems: "flex-start",
          marginBottom: "1.25rem",
        }}
      >
        <TimerRing seconds={timer} total={TIMER_SECONDS} />
        <div
          style={{
            flex: 1,
            background: "#100a00",
            border: `3px solid ${isRed ? "#ff2244" : "#ffaa00"}`,
            boxShadow: `0 0 16px ${isRed ? "#ff224455" : "#ffaa0044"}`,
            padding: "1.25rem 1.5rem",
          }}
        >
          <div
            style={{
              fontSize: "1.125rem",
              color: "#ffaa00",
              fontWeight: 700,
              marginBottom: 8,
              letterSpacing: "0.06em",
            }}
          >
            CHAD ASKS:
          </div>
          <div
            style={{
              fontSize: "1.375rem",
              color: isRed ? "#ff8888" : "#ffe",
              lineHeight: 1.55,
              fontWeight: 500,
            }}
          >
            {question.text}
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div
        style={{
          height: 10,
          background: "#111",
          border: "2px solid #222",
          marginBottom: "1.25rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(timer / TIMER_SECONDS) * 100}%`,
            background: isRed ? "#ff2244" : timer <= 30 ? "#ffaa00" : "#39ff14",
            boxShadow: `0 0 8px ${isRed ? "#ff2244" : "#ffaa00"}`,
            transition: "width 1s linear, background 0.5s",
          }}
        />
      </div>

      {/* Answer textarea */}
      <div
        style={{
          background: "#0a0800",
          border: "3px solid #443300",
          padding: "1.25rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            fontSize: "1.125rem",
            color: "#ffaa00",
            fontWeight: 700,
            marginBottom: "0.75rem",
          }}
        >
          YOUR ANSWER:
        </div>
        <textarea
          ref={textareaRef}
          data-ocid="interview.answer_textarea"
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          rows={6}
          style={{
            width: "100%",
            background: "#050400",
            border: `3px solid ${isRed ? "#ff2244" : "#ffaa00"}`,
            color: "#f0f0f0",
            fontSize: "1.125rem",
            padding: "0.875rem",
            fontFamily: "var(--font-mono), monospace",
            resize: "vertical",
            outline: "none",
            lineHeight: 1.6,
            caretColor: "#ffaa00",
            boxShadow: `inset 0 0 8px ${isRed ? "#ff224422" : "#ffaa0022"}`,
          }}
          placeholder="Type your answer here... voice input unavailable in this dimension."
        />
        <div style={{ fontSize: "1.125rem", color: "#666", marginTop: 6 }}>
          {currentAnswer.length} characters
        </div>
      </div>

      <button
        type="button"
        data-ocid="interview.submit_answer_button"
        onClick={onSubmit}
        style={{
          background: "#ffaa00",
          border: "3px solid #ffaa00",
          color: "#000",
          fontSize: "1.25rem",
          fontWeight: 700,
          padding: "0.75rem 2rem",
          cursor: "pointer",
          fontFamily: "var(--font-display), monospace",
          letterSpacing: "0.08em",
          boxShadow: "0 0 16px #ffaa0088",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 28px #ffaa00";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 16px #ffaa0088";
        }}
      >
        SUBMIT ANSWER ▶
      </button>
    </div>
  );
}

function FeedbackPhase({
  question,
  answer,
  score,
  questionIndex,
  total,
  onNext,
}: {
  question: Question;
  answer: string;
  score: number;
  questionIndex: number;
  total: number;
  onNext: () => void;
}) {
  const feedback = getChadFeedback(answer);
  const isLast = questionIndex + 1 >= total;
  return (
    <div data-ocid="interview.feedback_section">
      {/* Faded question */}
      <div
        style={{
          background: "#080600",
          border: "2px solid #332200",
          padding: "1rem 1.25rem",
          marginBottom: "1rem",
          opacity: 0.7,
        }}
      >
        <div
          style={{
            fontSize: "1.125rem",
            color: "#664400",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          QUESTION ASKED:
        </div>
        <div style={{ fontSize: "1.125rem", color: "#aaa", lineHeight: 1.5 }}>
          {question.text}
        </div>
      </div>

      {/* Your answer */}
      <div
        style={{
          background: "#0a0900",
          border: "2px solid #443300",
          padding: "1rem 1.25rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            fontSize: "1.125rem",
            color: "#ffaa00",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          YOUR ANSWER:
        </div>
        <div
          style={{
            fontSize: "1.125rem",
            color: "#ccc",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {answer.trim().length === 0 ? (
            <em style={{ color: "#555" }}>No answer submitted.</em>
          ) : (
            answer
          )}
        </div>
      </div>

      {/* Chad feedback */}
      <div
        style={{
          background: "#100a00",
          border: "3px solid #ffaa00",
          boxShadow: "0 0 20px #ffaa0055",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.25rem",
          display: "flex",
          gap: "1rem",
          alignItems: "flex-start",
        }}
      >
        <div style={{ fontSize: "2rem", flexShrink: 0 }}>🧑‍💼</div>
        <div>
          <div
            style={{
              fontSize: "1.125rem",
              color: "#ffaa00",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            CHAD SAYS:
          </div>
          <div style={{ fontSize: "1.25rem", color: "#ffe", lineHeight: 1.6 }}>
            {feedback}
          </div>
          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: "1.125rem", color: "#888" }}>SCORE:</span>
            <StarRow score={score} />
            <span
              style={{
                fontSize: "1.125rem",
                color: "#ffaa00",
                fontWeight: 700,
              }}
            >
              {score}/5
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        data-ocid="interview.next_question_button"
        onClick={onNext}
        style={{
          background: isLast ? "#ffaa00" : "transparent",
          border: "3px solid #ffaa00",
          color: isLast ? "#000" : "#ffaa00",
          fontSize: "1.25rem",
          fontWeight: 700,
          padding: "0.75rem 2rem",
          cursor: "pointer",
          fontFamily: "var(--font-display), monospace",
          letterSpacing: "0.08em",
          boxShadow: "0 0 14px #ffaa0066",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 28px #ffaa00";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 14px #ffaa0066";
        }}
      >
        {isLast
          ? "VIEW RESULTS ▶"
          : `NEXT QUESTION (${questionIndex + 1}/${total}) ▶`}
      </button>
    </div>
  );
}

function CompletePhase({
  sessionQuestions,
  answers: _answers,
  scores,
  totalScore,
  isSaving,
  isSaved,
  onSave,
  onRetry,
  onGoToTown,
}: {
  sessionQuestions: Question[];
  answers: string[];
  scores: number[];
  totalScore: number;
  isSaving: boolean;
  isSaved: boolean;
  onSave: () => void;
  onRetry: () => void;
  onGoToTown: () => void;
}) {
  const maxScore = SESSION_QUESTIONS * 5;
  const { grade, label, color } = getGrade(totalScore);

  return (
    <div data-ocid="interview.complete_section">
      {/* Grade card */}
      <div
        style={{
          background: "#100a00",
          border: `4px solid ${color}`,
          boxShadow: `0 0 32px ${color}66`,
          padding: "2rem",
          textAlign: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            fontSize: "4rem",
            fontWeight: 900,
            color,
            textShadow: `0 0 24px ${color}`,
            lineHeight: 1.1,
          }}
        >
          {grade}
        </div>
        <div
          style={{
            fontSize: "1.5rem",
            color,
            fontWeight: 700,
            marginTop: 6,
            marginBottom: 16,
            letterSpacing: "0.12em",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: "1.5rem", color: "#fff", marginBottom: 8 }}>
          TOTAL SCORE:{" "}
          <span style={{ color: "#ffaa00", fontWeight: 700 }}>
            {totalScore}
          </span>{" "}
          / {maxScore}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
          {STAR_SLOT_IDS.slice(0, maxScore).map((slotId, i) => (
            <span
              key={slotId}
              style={{
                color: i < totalScore ? "#ffaa00" : "#333",
                fontSize: "1.125rem",
                textShadow: i < totalScore ? "0 0 5px #ffaa00" : "none",
              }}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Per-question breakdown */}
      <div
        style={{
          background: "#0a0800",
          border: "2px solid #443300",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            fontSize: "1.25rem",
            color: "#ffaa00",
            fontWeight: 700,
            marginBottom: "1rem",
            letterSpacing: "0.06em",
          }}
        >
          SESSION BREAKDOWN
        </div>
        {sessionQuestions.map((q, i) => (
          <div
            key={q.id}
            data-ocid={`interview.breakdown.${i + 1}`}
            style={{
              borderBottom:
                i < sessionQuestions.length - 1 ? "1px solid #221800" : "none",
              padding: "0.75rem 0",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{ fontSize: "1.125rem", color: "#ccc", fontWeight: 500 }}
            >
              Q{i + 1}: {q.text}
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <StarRow score={scores[i] ?? 0} />
              <span style={{ fontSize: "1.125rem", color: "#888" }}>
                {scores[i] ?? 0}/5
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* XP Banner */}
      {isSaved && (
        <div
          data-ocid="interview.success_state"
          style={{
            background: "#0d0a00",
            border: "3px solid #ffaa00",
            boxShadow: "0 0 20px #ffaa00",
            padding: "1rem 1.5rem",
            fontSize: "1.25rem",
            color: "#ffaa00",
            fontWeight: 700,
            marginBottom: "1.25rem",
            textAlign: "center",
            letterSpacing: "0.06em",
          }}
        >
          🌟 +150 XP! Practice session complete.
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {!isSaved && (
          <button
            type="button"
            data-ocid="interview.save_session_button"
            onClick={onSave}
            disabled={isSaving}
            style={{
              background: "#ffaa00",
              border: "3px solid #ffaa00",
              color: "#000",
              fontSize: "1.125rem",
              fontWeight: 700,
              padding: "0.75rem 1.75rem",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontFamily: "var(--font-display), monospace",
              letterSpacing: "0.06em",
              opacity: isSaving ? 0.7 : 1,
              boxShadow: "0 0 16px #ffaa0088",
              transition: "all 0.15s",
            }}
          >
            {isSaving ? "SAVING..." : "💾 SAVE SESSION (+150 XP)"}
          </button>
        )}
        <button
          type="button"
          data-ocid="interview.practice_again_button"
          onClick={onRetry}
          style={{
            background: "transparent",
            border: "3px solid #ffaa00",
            color: "#ffaa00",
            fontSize: "1.125rem",
            fontWeight: 700,
            padding: "0.75rem 1.75rem",
            cursor: "pointer",
            fontFamily: "var(--font-display), monospace",
            letterSpacing: "0.06em",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1a0d00";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          ↺ PRACTICE AGAIN
        </button>
        <button
          type="button"
          data-ocid="interview.town_square_button"
          onClick={onGoToTown}
          style={{
            background: "transparent",
            border: "3px solid #443300",
            color: "#888",
            fontSize: "1.125rem",
            padding: "0.75rem 1.75rem",
            cursor: "pointer",
            fontFamily: "var(--font-display), monospace",
            letterSpacing: "0.06em",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#ffaa00";
            e.currentTarget.style.color = "#ffaa00";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#443300";
            e.currentTarget.style.color = "#888";
          }}
        >
          ← TOWN SQUARE
        </button>
      </div>
    </div>
  );
}
