import CoverLetterOverlay from "@/components/CoverLetterOverlay";
import InterviewCoachOverlay from "@/components/InterviewCoachOverlay";
import ItemShopOverlay from "@/components/ItemShopOverlay";
import JourneyGuide from "@/components/JourneyGuide";
import ResumeTailorOverlay from "@/components/ResumeTailorOverlay";
import { GameBridge } from "@/game/GameBridge";
import { musicManager } from "@/game/MusicManager";
import { CoverLetterScene } from "@/game/scenes/CoverLetterScene";
import { InterviewCoachScene } from "@/game/scenes/InterviewCoachScene";
import { ItemShopScene } from "@/game/scenes/ItemShopScene";
import { PreloadScene } from "@/game/scenes/PreloadScene";
import { ResumeTailorScene } from "@/game/scenes/ResumeTailorScene";
import { TownScene } from "@/game/scenes/TownScene";
import { useQuests } from "@/hooks/useQuests";
import type { NPC } from "@/types/game";
import { useNavigate } from "@tanstack/react-router";
import Phaser from "phaser";
import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────
// Unified HUD Panel — top-right, all controls grouped
// ─────────────────────────────────────────────────────
type HUDTab = "quests" | "music" | "howto" | null;

function UnifiedHUDPanel() {
  const [activeTab, setActiveTab] = useState<HUDTab>(null);
  const [trackName, setTrackName] = useState("—");
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(() => musicManager.getVolume());
  const [started, setStarted] = useState(() => musicManager.isStarted());

  useEffect(() => {
    const poll = () => {
      setTrackName(musicManager.getCurrentTrackName());
      setStarted(musicManager.isStarted());
      setPaused(musicManager.isPaused());
    };
    poll();
    const id = setInterval(poll, 500);
    return () => clearInterval(id);
  }, []);

  const toggleTab = (tab: HUDTab) =>
    setActiveTab((cur) => (cur === tab ? null : tab));

  const panelBg = "rgba(4,4,20,0.95)";
  const borderGreen = "rgba(57,255,20,0.5)";
  const green = "#39ff14";
  const dim = "rgba(160,160,200,0.7)";

  const iconBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "rgba(57,255,20,0.15)" : "transparent",
    border: `2px solid ${active ? green : borderGreen}`,
    color: active ? green : dim,
    fontSize: 18,
    width: 36,
    height: 36,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    transition: "all 150ms",
    flexShrink: 0,
  });

  return (
    <div
      data-ocid="hud.unified_panel"
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 0,
        fontFamily: '"Space Grotesk", monospace',
        pointerEvents: "auto",
      }}
    >
      {/* Icon button row */}
      <div
        style={{
          background: panelBg,
          border: `2px solid ${borderGreen}`,
          borderRadius: "4px 4px 0 0",
          display: "flex",
          gap: 4,
          padding: "4px 6px",
          boxShadow: "0 0 12px rgba(57,255,20,0.15)",
        }}
      >
        <button
          type="button"
          title="Quests (Q)"
          aria-label="Toggle quests"
          data-ocid="hud.quests_tab"
          style={iconBtnStyle(activeTab === "quests")}
          onClick={() => toggleTab("quests")}
        >
          📋
        </button>
        <button
          type="button"
          title="Music"
          aria-label="Toggle music player"
          data-ocid="hud.music_tab"
          style={iconBtnStyle(activeTab === "music")}
          onClick={() => toggleTab("music")}
        >
          🎵
        </button>
        <button
          type="button"
          title="Controls"
          aria-label="Toggle controls help"
          data-ocid="hud.howto_tab"
          style={iconBtnStyle(activeTab === "howto")}
          onClick={() => toggleTab("howto")}
        >
          ❓
        </button>
      </div>

      {/* Expandable content panel */}
      {activeTab !== null && (
        <div
          style={{
            background: panelBg,
            border: `2px solid ${borderGreen}`,
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            padding: "10px 12px",
            minWidth: 220,
            maxWidth: 280,
            boxShadow: "0 4px 16px rgba(57,255,20,0.12)",
          }}
        >
          {activeTab === "quests" && (
            <div style={{ color: dim, fontSize: 13 }}>
              <div
                style={{
                  color: green,
                  fontSize: 14,
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                QUEST LOG
              </div>
              <div>Talk to NPCs around town to unlock quests and earn XP.</div>
              <div style={{ marginTop: 8, color: dim, fontSize: 12 }}>
                Press <span style={{ color: green }}>Q</span> to toggle the full
                quest log.
              </div>
            </div>
          )}
          {activeTab === "music" && (
            <div>
              <div
                style={{
                  color: green,
                  fontSize: 14,
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                MUSIC PLAYER
              </div>
              <div
                style={{
                  color: dim,
                  fontSize: 11,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                ♫ Now Playing
              </div>
              <div
                data-ocid="music_player.track_name"
                style={{
                  color: green,
                  fontSize: 13,
                  marginBottom: 10,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textShadow: "0 0 6px rgba(57,255,20,0.5)",
                }}
              >
                {started ? trackName : "Interact to start"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!started) return;
                    if (paused) {
                      musicManager.resume();
                      setPaused(false);
                    } else {
                      musicManager.pause();
                      setPaused(true);
                    }
                  }}
                  aria-label={paused ? "Resume music" : "Pause music"}
                  data-ocid="music_player.play_pause_button"
                  style={{
                    background: "transparent",
                    border: "2px solid rgba(57,255,20,0.5)",
                    color: green,
                    fontSize: 16,
                    width: 30,
                    height: 30,
                    cursor: started ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: started ? 1 : 0.4,
                    flexShrink: 0,
                    borderRadius: 1,
                  }}
                >
                  {paused ? "▶" : "⏸"}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => {
                    const v = Number.parseFloat(e.target.value);
                    setVolume(v);
                    musicManager.setVolume(v);
                    if (paused && v > 0) {
                      musicManager.resume();
                      setPaused(false);
                    }
                  }}
                  aria-label="Volume"
                  data-ocid="music_player.volume_slider"
                  style={{
                    flex: 1,
                    accentColor: green,
                    cursor: "pointer",
                    height: 4,
                    minWidth: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: dim, flexShrink: 0 }}>
                  {volume === 0 ? "🔇" : volume < 0.4 ? "🔉" : "🔊"}
                </span>
              </div>
            </div>
          )}
          {activeTab === "howto" && (
            <div style={{ color: dim, fontSize: 13 }}>
              <div
                style={{
                  color: green,
                  fontSize: 14,
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                CONTROLS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div>
                  <span style={{ color: green }}>WASD / Arrows</span> — Move
                </div>
                <div>
                  <span style={{ color: "#ff00ff" }}>ESC</span> — Close dialogue
                </div>
                <div>
                  <span style={{ color: green }}>Q</span> — Toggle quest log
                </div>
                <div
                  style={{
                    marginTop: 4,
                    color: "rgba(160,160,200,0.5)",
                    fontSize: 11,
                  }}
                >
                  Use joystick on mobile to move
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Dialogue Overlay (React, rendered on top of canvas)
// ─────────────────────────────────────────────────────
function DialogueOverlay({
  npc,
  dialogueIndex,
  onAdvance,
  onOption,
  onClose,
}: {
  npc: NPC;
  dialogueIndex: number;
  onAdvance: () => void;
  onOption: (action: string, payload?: string) => void;
  onClose: () => void;
}) {
  // Defensive guard: npc.dialogue must be a non-empty array before reading index
  if (!npc || !Array.isArray(npc.dialogue) || npc.dialogue.length === 0)
    return null;
  // Clamp dialogueIndex to valid range — protects against stale state after
  // switching from a multi-line NPC to a single-line one without resetting index
  const safeIndex = Math.min(dialogueIndex, npc.dialogue.length - 1);
  const entry = npc.dialogue[safeIndex];
  if (!entry) return null;

  return (
    <div
      className="absolute bottom-20 left-1/2 z-40"
      style={{
        transform: "translateX(-50%)",
        width: "min(560px, calc(100vw - 32px))",
        maxWidth: "calc(100vw - 32px)",
        boxSizing: "border-box",
      }}
      data-ocid="dialogue.panel"
    >
      {/* Pixel-border box */}
      <div
        style={{
          background: "rgba(4,4,20,0.97)",
          border: `4px solid ${npc.color}`,
          boxShadow: `0 0 16px ${npc.color}66, inset 0 0 12px rgba(0,0,0,0.8)`,
          padding: "clamp(0.6rem, 2.5vw, 1rem) clamp(0.75rem, 3vw, 1.25rem)",
          overflow: "hidden",
        }}
      >
        {/* Triangle indicator top-left */}
        <div
          style={{
            position: "absolute",
            top: -1,
            left: 12,
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: `8px solid ${npc.color}`,
          }}
        />
        {/* Speaker */}
        <div
          className="font-display mb-1.5"
          style={{
            fontSize: "clamp(13px, 3vw, 18px)",
            color: npc.color,
            textShadow: `0 0 8px ${npc.color}`,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          ◈ {entry.speaker}:
        </div>
        {/* Dialogue text */}
        <div
          className="font-display mb-4"
          style={{
            fontSize: "clamp(14px, 2.8vw, 20px)",
            color: "#e8e8f0",
            lineHeight: 1.7,
            letterSpacing: "0.04em",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            whiteSpace: "pre-wrap",
          }}
        >
          {entry.text}
        </div>
        {/* Options or continue */}
        {entry.options ? (
          <div className="flex gap-3 flex-wrap">
            {entry.options.map((opt, i) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => onOption(opt.action, opt.payload)}
                style={{
                  fontFamily: "var(--font-display), monospace",
                  fontSize: "clamp(13px, 3vw, 18px)",
                  color: i === 0 ? npc.color : "#aaaacc",
                  border: `3px solid ${i === 0 ? npc.color : "#555566"}`,
                  background: "transparent",
                  padding: "clamp(4px, 1.2vw, 6px) clamp(8px, 2vw, 12px)",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  transition: "all 0.1s",
                }}
                data-ocid={`dialogue.option.${i + 1}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdvance}
            style={{
              fontFamily: "var(--font-display), monospace",
              fontSize: "clamp(13px, 3vw, 18px)",
              color: npc.color,
              border: `3px solid ${npc.color}`,
              background: "transparent",
              padding: "clamp(4px, 1.2vw, 6px) clamp(8px, 2.5vw, 14px)",
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}
            data-ocid="dialogue.next_button"
          >
            [CONTINUE ▶]
          </button>
        )}
        {/* Close hint */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 6,
            right: 10,
            background: "transparent",
            border: "none",
            color: "#aaa",
            fontSize: "clamp(13px, 3vw, 18px)",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
          aria-label="Close dialogue"
          data-ocid="dialogue.close_button"
        >
          [ESC]
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Location Banner (brief flash when entering building)
// ─────────────────────────────────────────────────────
function LocationBanner({ text, color }: { text: string; color: string }) {
  return (
    <div
      className="absolute top-1/3 left-1/2 z-50 pointer-events-none"
      style={{ transform: "translate(-50%, -50%)" }}
      data-ocid="location.banner"
    >
      <div
        style={{
          fontFamily: "var(--font-display), monospace",
          fontSize: "20px",
          color,
          textShadow: `0 0 20px ${color}, 0 0 40px ${color}80`,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          background: "rgba(0,0,0,0.85)",
          border: `3px solid ${color}`,
          padding: "12px 28px",
          animation: "pulse-glow 1.5s ease-in-out",
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// GamePage
// ─────────────────────────────────────────────────────
export default function GamePage() {
  const navigate = useNavigate();
  const { acceptQuest } = useQuests();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Dialogue state
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showBanner, setShowBanner] = useState<{
    text: string;
    color: string;
  } | null>(null);

  // Career tool overlay state
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // ── Phaser game lifecycle ──────────────────────────
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: "#0a0a0f",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        width: 800,
        height: 600,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: true,
        antialias: false,
        antialiasGL: false,
      },
      scene: [
        PreloadScene,
        TownScene,
        ResumeTailorScene,
        CoverLetterScene,
        InterviewCoachScene,
        ItemShopScene,
      ],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      musicManager.stopAll();
    };
  }, []);

  // ── GameBridge event listeners ─────────────────────
  useEffect(() => {
    const unsubDialogue = GameBridge.on("dialogueOpened", (data) => {
      const npcData = data as NPC;
      // For Ed/Sam, TownScene emits a copy with a single dialogue line already set.
      // Use it directly so the rotated line is shown instead of index 0.
      if (
        npcData &&
        Array.isArray(npcData.dialogue) &&
        npcData.dialogue.length > 0
      ) {
        // Always reset dialogueIndex to 0 when a new NPC opens dialogue.
        // This prevents stale index from a previous NPC causing an undefined read.
        setDialogueIndex(0);
        setActiveNPC(npcData);
      }
    });

    const unsubLocation = GameBridge.on("locationChanged", () => {
      // Future: update minimap/HUD current location
    });

    const unsubToolOpen = GameBridge.on("careerToolOpen", (data) => {
      const d = data as { tool: string; npcId: string };
      if (d?.tool) {
        setActiveNPC(null);
        setDialogueIndex(0);
        setActiveTool(d.tool);
      }
    });

    const unsubToolClose = GameBridge.on("careerToolClose", () => {
      setActiveTool(null);
    });

    return () => {
      unsubDialogue();
      unsubLocation();
      unsubToolOpen();
      unsubToolClose();
    };
  }, []);

  // ── Keyboard: ESC closes dialogue or career tool ─────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeTool) {
          setActiveTool(null);
          GameBridge.emit("careerToolClose", undefined);
        } else {
          setActiveNPC(null);
          setDialogueIndex(0);
          GameBridge.emit("dialogueClosed");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTool]);

  // ── Dialogue handlers ──────────────────────────────
  const handleAdvance = useCallback(() => {
    if (!activeNPC) return;
    // Defensive: ensure dialogue array is valid before reading length
    if (!Array.isArray(activeNPC.dialogue) || activeNPC.dialogue.length === 0) {
      setActiveNPC(null);
      setDialogueIndex(0);
      GameBridge.emit("dialogueClosed");
      return;
    }
    const next = dialogueIndex + 1;
    if (next >= activeNPC.dialogue.length) {
      setActiveNPC(null);
      setDialogueIndex(0);
      GameBridge.emit("dialogueClosed");
    } else {
      setDialogueIndex(next);
    }
  }, [activeNPC, dialogueIndex]);

  const handleOption = useCallback(
    (action: string, payload?: string) => {
      if (action === "navigate" && payload) {
        setActiveNPC(null);
        setDialogueIndex(0);
        GameBridge.emit("dialogueClosed");
        void navigate({
          to: payload as "/" | "/resume" | "/coverletter" | "/interview",
        });
      } else if (action === "close" || action === "decline") {
        setActiveNPC(null);
        setDialogueIndex(0);
        GameBridge.emit("dialogueClosed");
      } else if (action === "accept_quest" && payload) {
        acceptQuest(payload);
        handleAdvance();
      } else {
        handleAdvance();
      }
    },
    [acceptQuest, navigate, handleAdvance],
  );

  const handleClose = useCallback(() => {
    setActiveNPC(null);
    setDialogueIndex(0);
    GameBridge.emit("dialogueClosed");
  }, []);

  // Reset dialogueIndex whenever a new NPC opens (belt-and-suspenders guard
  // against stale index surviving from a previous multi-line dialogue)
  useEffect(() => {
    if (activeNPC !== null) {
      setDialogueIndex(0);
    }
  }, [activeNPC]);

  // Dismiss banner after 2.5s
  useEffect(() => {
    if (!showBanner) return;
    const t = setTimeout(() => setShowBanner(null), 2500);
    return () => clearTimeout(t);
  }, [showBanner]);

  return (
    <div
      data-ocid="game.canvas_target"
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Phaser canvas mount point — centered, FIT scaled */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />

      {/* Unified HUD Panel — top-right, all controls in one place */}
      <UnifiedHUDPanel />
      <JourneyGuide />

      {/* CRT scanline overlay (CSS) */}
      <div
        className="absolute inset-0 pointer-events-none scanline"
        style={{ zIndex: 200 }}
      />

      {/* NPC Dialogue */}
      {activeNPC && (
        <DialogueOverlay
          npc={activeNPC}
          dialogueIndex={dialogueIndex}
          onAdvance={handleAdvance}
          onOption={handleOption}
          onClose={handleClose}
        />
      )}

      {/* Location banner */}
      {showBanner && (
        <LocationBanner text={showBanner.text} color={showBanner.color} />
      )}

      {/* Career tool overlays */}
      {activeTool === "resume-tailor" && (
        <ResumeTailorOverlay onClose={() => setActiveTool(null)} />
      )}
      {activeTool === "cover-letter" && (
        <CoverLetterOverlay onClose={() => setActiveTool(null)} />
      )}
      {activeTool === "interview-coach" && (
        <InterviewCoachOverlay onClose={() => setActiveTool(null)} />
      )}
      {activeTool === "item-shop" && (
        <ItemShopOverlay onClose={() => setActiveTool(null)} />
      )}
    </div>
  );
}
