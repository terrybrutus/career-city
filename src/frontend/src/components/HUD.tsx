import { useAuth } from "@/hooks/useAuth";
import { useMusicVolume } from "@/hooks/useMusicVolume";
import type { QuestProgress, UserProfile } from "@/types/game";
import { useEffect, useRef, useState } from "react";

const CAREER_TITLES: Record<number, string> = {
  1: "INTERN",
  2: "JR.DEV",
  3: "DEV",
  4: "SR.DEV",
  5: "LEAD",
  6: "STAFF",
  7: "PRINC",
  8: "ARCH",
  9: "DIR",
  10: "VP",
  11: "CTO",
  12: "LEGEND",
};

function getTitle(level: number): string {
  return CAREER_TITLES[level] ?? `LV.${level}`;
}

export type TextSize = "normal" | "large" | "xlarge";

const TEXT_SIZES: Record<TextSize, number> = {
  normal: 18,
  large: 22,
  xlarge: 26,
};

interface HUDProps {
  profile: UserProfile;
  xpToNextLevel: number;
  onToggleMinimap?: () => void;
  activeQuest?: QuestProgress | null;
  crtEnabled?: boolean;
  onCrtToggle?: (v: boolean) => void;
  textSize?: TextSize;
  onTextSize?: (v: TextSize) => void;
}

const NEON_GREEN = "#00ff00";
const BG_DARK = "#0a0a0f";

export default function HUD({
  profile,
  xpToNextLevel,
  onToggleMinimap,
  activeQuest,
  crtEnabled = true,
  onCrtToggle,
  textSize = "normal",
  onTextSize,
}: HUDProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(60);
  const { volume, setVolume, isMuted, toggleMute } = useMusicVolume();
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const settingsRef = useRef<HTMLDivElement>(null);

  const xpPercent = Math.min(
    100,
    xpToNextLevel > 0 ? Math.round((profile.xp / xpToNextLevel) * 100) : 0,
  );

  const px = TEXT_SIZES[textSize];
  const labelSm = Math.max(18, px - 4);

  // Close settings on outside click
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSettings]);

  return (
    <>
      {/* HUD Bar */}
      <div
        data-ocid="hud.panel"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 72,
          background: BG_DARK,
          borderTop: `2px solid ${NEON_GREEN}`,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 2px)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0 1rem",
          zIndex: 1000,
          fontFamily: '"Press Start 2P", monospace',
          boxShadow: `0 -4px 32px ${NEON_GREEN}33`,
        }}
      >
        {/* LEFT — map toggle + login */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          <button
            data-ocid="hud.minimap_toggle"
            type="button"
            onClick={onToggleMinimap}
            aria-label="Toggle minimap"
            title="Toggle minimap (M)"
            style={btnStyle(NEON_GREEN, 38)}
          >
            🗺️
          </button>
          {!isAuthenticated && (
            <button
              data-ocid="hud.login_button"
              type="button"
              onClick={() => void login()}
              disabled={authLoading}
              aria-label="Login with Internet Identity"
              style={{
                ...btnStyle("#00ffff", 0),
                padding: "0 8px",
                height: 34,
                fontSize: labelSm,
                whiteSpace: "nowrap",
                opacity: authLoading ? 0.5 : 1,
              }}
            >
              LOGIN
            </button>
          )}
        </div>

        {/* CENTER — level + XP bar */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            minWidth: 0,
          }}
        >
          {/* Level badge */}
          <div
            data-ocid="hud.level_badge"
            style={{
              background: "#000",
              border: `4px solid ${NEON_GREEN}`,
              padding: "3px 10px",
              flexShrink: 0,
              whiteSpace: "nowrap",
              boxShadow: `0 0 12px ${NEON_GREEN}66`,
            }}
          >
            <span
              style={{
                color: NEON_GREEN,
                fontSize: px,
                textShadow: `0 0 8px ${NEON_GREEN}, 0 0 18px ${NEON_GREEN}`,
                letterSpacing: "0.08em",
              }}
            >
              LV.{profile.careerLevel} {getTitle(profile.careerLevel)}
            </span>
          </div>

          {/* XP bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "100%",
              maxWidth: 320,
            }}
          >
            <div
              data-ocid="hud.xp_bar"
              role="progressbar"
              tabIndex={0}
              aria-valuenow={profile.xp}
              aria-valuemin={0}
              aria-valuemax={xpToNextLevel}
              aria-label={`XP: ${profile.xp} of ${xpToNextLevel}`}
              style={{
                position: "relative",
                height: 16,
                background: "#111",
                border: `2px solid ${NEON_GREEN}`,
                width: "100%",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${xpPercent}%`,
                  background: `linear-gradient(90deg, ${NEON_GREEN}, #00ffff)`,
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: `0 0 10px ${NEON_GREEN}`,
                }}
              />
              {[25, 50, 75].map((pct) => (
                <div
                  key={pct}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${pct}%`,
                    width: 2,
                    background: "rgba(0,0,0,0.6)",
                    zIndex: 2,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                color: NEON_GREEN,
                fontSize: labelSm,
                textShadow: `0 0 6px ${NEON_GREEN}`,
                textAlign: "center",
                letterSpacing: "0.05em",
              }}
            >
              {profile.xp} / {xpToNextLevel} XP
            </span>
          </div>
        </div>

        {/* RIGHT — active quest + settings */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          {activeQuest && (
            <div
              data-ocid="hud.active_quest"
              style={{
                color: "#ffaa00",
                fontSize: labelSm,
                textShadow: "0 0 6px #ffaa00",
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                border: "1px solid #ffaa0055",
                padding: "2px 6px",
              }}
            >
              ► {activeQuest.title}
            </div>
          )}
          <button
            data-ocid="hud.settings_button"
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            aria-label="Open settings"
            title="Settings"
            style={btnStyle(NEON_GREEN, 38)}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div
          ref={settingsRef}
          data-ocid="hud.settings_panel"
          style={{
            position: "fixed",
            bottom: 76,
            right: 8,
            background: BG_DARK,
            border: `4px solid ${NEON_GREEN}`,
            padding: "1.25rem",
            zIndex: 1100,
            fontFamily: '"Press Start 2P", monospace',
            minWidth: 280,
            boxShadow: `0 0 32px ${NEON_GREEN}55`,
            animation: "slideUpIn 0.25s ease",
          }}
        >
          <div
            style={{
              color: NEON_GREEN,
              fontSize: 18,
              textShadow: `0 0 8px ${NEON_GREEN}`,
              marginBottom: "1rem",
              borderBottom: `2px solid ${NEON_GREEN}44`,
              paddingBottom: "0.5rem",
              letterSpacing: "0.1em",
            }}
          >
            ⚙ SETTINGS
          </div>

          {/* Music volume */}
          <label style={settingLabelStyle}>
            <span style={{ color: NEON_GREEN, fontSize: 18, minWidth: 120 }}>
              MUSIC {isMuted ? "(MUTED)" : `${Math.round(volume * 100)}%`}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                data-ocid="hud.settings.music_slider"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
                style={sliderStyle}
                aria-label="Music volume"
              />
              <button
                data-ocid="hud.settings.mute_toggle"
                type="button"
                onClick={() => toggleMute()}
                style={{
                  ...btnStyle("#00ffff", 0),
                  padding: "2px 8px",
                  height: 28,
                  fontSize: 14,
                }}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
            </div>
          </label>

          {/* SFX volume */}
          <label style={settingLabelStyle}>
            <span style={{ color: NEON_GREEN, fontSize: 18, minWidth: 120 }}>
              SFX {sfxVolume}%
            </span>
            <input
              data-ocid="hud.settings.sfx_slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={sfxVolume}
              onChange={(e) =>
                setSfxVolume(Number.parseInt(e.target.value, 10))
              }
              style={sliderStyle}
              aria-label="SFX volume"
            />
          </label>

          {/* CRT toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <span style={{ color: NEON_GREEN, fontSize: 18 }}>CRT EFFECT</span>
            <button
              data-ocid="hud.settings.crt_toggle"
              type="button"
              onClick={() => onCrtToggle?.(!crtEnabled)}
              aria-label={`CRT effect ${crtEnabled ? "on" : "off"}`}
              style={{
                background: crtEnabled ? NEON_GREEN : "#333",
                border: `3px solid ${NEON_GREEN}`,
                color: crtEnabled ? "#000" : NEON_GREEN,
                fontSize: 14,
                padding: "3px 12px",
                cursor: "pointer",
                fontFamily: '"Press Start 2P", monospace',
              }}
            >
              {crtEnabled ? "ON" : "OFF"}
            </button>
          </div>

          {/* Text size */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ color: NEON_GREEN, fontSize: 18, marginBottom: 8 }}>
              TEXT SIZE
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["normal", "large", "xlarge"] as TextSize[]).map((sz) => (
                <button
                  key={sz}
                  data-ocid={`hud.settings.textsize_${sz}`}
                  type="button"
                  onClick={() => onTextSize?.(sz)}
                  style={{
                    background: textSize === sz ? NEON_GREEN : "#111",
                    border: `3px solid ${NEON_GREEN}`,
                    color: textSize === sz ? "#000" : NEON_GREEN,
                    fontSize: 14,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontFamily: '"Press Start 2P", monospace',
                    textTransform: "uppercase",
                  }}
                >
                  {sz === "normal" ? "A" : sz === "large" ? "A+" : "A++"}
                </button>
              ))}
            </div>
          </div>

          <button
            data-ocid="hud.settings_close_button"
            type="button"
            onClick={() => setShowSettings(false)}
            style={{
              marginTop: "0.5rem",
              background: "transparent",
              border: `2px solid ${NEON_GREEN}`,
              color: NEON_GREEN,
              fontSize: 18,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: '"Press Start 2P", monospace',
              width: "100%",
            }}
          >
            CLOSE
          </button>
        </div>
      )}
    </>
  );
}

function btnStyle(color: string, size: number): React.CSSProperties {
  return {
    background: "transparent",
    border: `2px solid ${color}`,
    color: color,
    width: size || undefined,
    height: size || undefined,
    fontSize: 20,
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textShadow: `0 0 8px ${color}`,
    transition: "box-shadow 150ms",
  };
}

const settingLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: "0.75rem",
};

const sliderStyle: React.CSSProperties = {
  width: 120,
  accentColor: "#00ff00",
  cursor: "pointer",
};
