import { QUEST_DEFINITIONS } from "@/data/quests";
import type { QuestProgress } from "@/types/game";

interface QuestLogProps {
  quests: QuestProgress[];
  onQuestClick?: (questId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  available: "#00ffff",
  active: "#ffaa00",
  completed: "#00ff00",
  locked: "#444",
};

const STATUS_ICONS: Record<string, string> = {
  available: "◇",
  active: "►",
  completed: "✓",
  locked: "✗",
};

const NEON_PURPLE = "#8844ff";
const BG_DARK = "#0d0d1a";

interface MergedQuest {
  questId: string;
  title: string;
  description: string;
  xpReward: number;
  status: QuestProgress["status"];
}

function mergeQuests(quests: QuestProgress[]): MergedQuest[] {
  return QUEST_DEFINITIONS.map((def) => {
    const found = quests.find((q) => q.questId === def.id);
    return {
      questId: def.id,
      title: def.title,
      description: def.description,
      xpReward: found?.xpReward ?? def.xpReward,
      status: found?.status ?? "available",
    };
  });
}

export default function QuestLog({
  quests,
  onQuestClick,
  isOpen,
  onToggle,
}: QuestLogProps) {
  const merged = mergeQuests(quests);
  const active = merged.filter((q) => q.status !== "completed");
  const completed = merged.filter((q) => q.status === "completed");

  if (!isOpen) {
    return (
      <button
        data-ocid="questlog.toggle_button"
        type="button"
        onClick={onToggle}
        aria-label="Expand quest log (Q)"
        title="Open quest log (Q)"
        style={{
          position: "fixed",
          top: 68,
          right: 12,
          width: 44,
          height: 44,
          background: BG_DARK,
          border: `3px solid ${NEON_PURPLE}`,
          color: NEON_PURPLE,
          fontSize: 22,
          cursor: "pointer",
          zIndex: 890,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 14px ${NEON_PURPLE}55`,
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        📜
      </button>
    );
  }

  return (
    <div
      data-ocid="questlog.panel"
      style={{
        position: "fixed",
        top: 68,
        right: 12,
        width: 280,
        maxHeight: "calc(100vh - 160px)",
        background: BG_DARK,
        border: `4px solid ${NEON_PURPLE}`,
        zIndex: 960,
        fontFamily: '"Press Start 2P", monospace',
        boxShadow: `0 0 24px ${NEON_PURPLE}55`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `2px solid ${NEON_PURPLE}66`,
          padding: "8px 10px",
          background: "rgba(0,0,0,0.7)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: NEON_PURPLE,
            fontSize: 18,
            fontWeight: 700,
            textShadow: `0 0 8px ${NEON_PURPLE}`,
            letterSpacing: "0.08em",
          }}
        >
          📜 QUEST LOG
        </span>
        <button
          data-ocid="questlog.close_button"
          type="button"
          onClick={onToggle}
          aria-label="Minimize quest log"
          style={{
            background: "transparent",
            border: `2px solid ${NEON_PURPLE}`,
            color: NEON_PURPLE,
            fontSize: "18px",
            width: 28,
            height: 28,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Scroll area */}
      <div
        style={{
          overflowY: "auto",
          flex: 1,
          padding: "6px 0",
        }}
      >
        {active.length > 0 && (
          <>
            <div style={sectionHeaderStyle("#00ffff")}>ACTIVE QUESTS</div>
            {active.map((quest, i) => (
              <QuestItem
                key={quest.questId}
                quest={quest}
                index={i + 1}
                prefix="quest"
                onClick={onQuestClick}
              />
            ))}
          </>
        )}

        {completed.length > 0 && (
          <>
            <div style={{ ...sectionHeaderStyle("#00ff0066"), marginTop: 8 }}>
              COMPLETED
            </div>
            {completed.map((quest, i) => (
              <QuestItem
                key={quest.questId}
                quest={quest}
                index={i + 1}
                prefix="completed"
                onClick={onQuestClick}
                dimmed
              />
            ))}
          </>
        )}

        {active.length === 0 && completed.length === 0 && (
          <div
            data-ocid="questlog.empty_state"
            style={{
              color: "#e0e0ff",
              fontSize: 18,
              padding: "20px 14px",
              textAlign: "center",
              lineHeight: 2,
            }}
          >
            NO QUESTS YET.
            <br />
            <span style={{ color: "#8844ff", fontSize: "18px" }}>
              TALK TO NPCs!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function sectionHeaderStyle(color: string): React.CSSProperties {
  return {
    color: color,
    fontSize: "18px",
    fontWeight: 600,
    padding: "4px 10px 6px",
    letterSpacing: "0.08em",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    marginBottom: 2,
  };
}

interface QuestItemProps {
  quest: {
    questId: string;
    title: string;
    description: string;
    xpReward: number;
    status: QuestProgress["status"];
  };
  index: number;
  prefix: string;
  onClick?: (id: string) => void;
  dimmed?: boolean;
}

function QuestItem({ quest, index, prefix, onClick, dimmed }: QuestItemProps) {
  const color = STATUS_COLORS[quest.status] ?? "#555";
  const icon = STATUS_ICONS[quest.status] ?? "?";

  return (
    <button
      data-ocid={`questlog.${prefix}.${index}`}
      type="button"
      onClick={() => onClick?.(quest.questId)}
      style={{
        display: "block",
        width: "100%",
        background: "transparent",
        border: "none",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 10px",
        textAlign: "left",
        cursor: "pointer",
        opacity: dimmed ? 0.45 : 1,
        fontFamily: '"Press Start 2P", monospace',
        transition: "background 120ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = `${color}11`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span
          style={{
            color: color,
            fontSize: 18,
            flexShrink: 0,
            lineHeight: 1.4,
            textShadow: `0 0 6px ${color}`,
          }}
        >
          {icon}
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: color,
              fontSize: "18px",
              fontWeight: 700,
              textShadow: `0 0 4px ${color}88`,
              marginBottom: 4,
              lineHeight: 1.4,
              textDecoration: dimmed ? "line-through" : "none",
            }}
          >
            {quest.title}
          </div>
          {!dimmed && (
            <div
              style={{
                color: "#e0e0ff",
                fontSize: "18px",
                lineHeight: 1.7,
                wordBreak: "break-word",
                marginBottom: 4,
              }}
            >
              {quest.description}
            </div>
          )}
          <div
            style={{
              color: "#ffaa00",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            +{quest.xpReward} XP
          </div>
        </div>
      </div>
    </button>
  );
}
