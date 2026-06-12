import { createActor } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useProfile } from "@/hooks/useProfile";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";

const ACCENT = "#8844ff";
const ACCENT_DIM = "rgba(136,68,255,0.15)";
const BG = "rgba(6,2,16,0.97)";
const BORDER = `3px solid ${ACCENT}`;
const _TEXT = "#e0d4f8";
const DIM = "rgba(180,160,240,0.65)";
const FONT = '"Space Grotesk", monospace';

interface ShopItem {
  id: string;
  emoji: string;
  name: string;
  description: string;
  price: number;
  color: string;
}

const FALLBACK_ITEMS: ShopItem[] = [
  {
    id: "resume_boost",
    emoji: "📄",
    name: "Resume Boost",
    description: "Polish your resume and stand out from the pile.",
    price: 50,
    color: "#ff00ff",
  },
  {
    id: "confidence_elixir",
    emoji: "✨",
    name: "Confidence Elixir",
    description: "Walk into any interview like you own the room.",
    price: 75,
    color: "#ffaa00",
  },
  {
    id: "interview_armor",
    emoji: "🛡",
    name: "Interview Armor",
    description: "Deflect trick questions like a seasoned pro.",
    price: 100,
    color: "#4488ff",
  },
  {
    id: "cover_letter_scroll",
    emoji: "📜",
    name: "Cover Letter Scroll",
    description: "Ancient wisdom encoded in compelling prose.",
    price: 40,
    color: "#00ffff",
  },
  {
    id: "networking_potion",
    emoji: "🧪",
    name: "Networking Potion",
    description: "Suddenly everyone wants to connect with you.",
    price: 150,
    color: "#44ff88",
  },
];

export default function ItemShopOverlay({ onClose }: { onClose: () => void }) {
  const { actor } = useActor(createActor);
  const { data: profile } = useProfile();
  const modalRef = useRef<HTMLDivElement>(null);
  useModalFocus(modalRef, onClose);
  const qc = useQueryClient();
  const { data: backendItems } = useQuery({
    queryKey: ["shop-items"],
    enabled: Boolean(actor),
    queryFn: () => actor?.listShopItems(),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const items = useMemo(
    () =>
      backendItems?.map((item, index) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.xpCost),
        emoji:
          FALLBACK_ITEMS.find((fallback) => fallback.id === item.id)?.emoji ??
          "ITEM",
        color:
          FALLBACK_ITEMS.find((fallback) => fallback.id === item.id)?.color ??
          ["#ff00ff", "#ffaa00", "#4488ff", "#00ffff", "#44ff88"][index % 5]!,
      })) ?? FALLBACK_ITEMS,
    [backendItems],
  );
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<Set<string>>(
    () => new Set(profile?.inventory ?? []),
  );
  const [error, setError] = useState("");

  const handlePurchase = useCallback(
    async (item: ShopItem) => {
      if (!actor) {
        setError("Not connected.");
        return;
      }
      if (purchased.has(item.id)) return;
      setPurchasing(item.id);
      setError("");
      try {
        const result = await actor.purchaseItem(item.id);
        if (result.__kind__ === "err") {
          setError(result.err);
          return;
        }
        setPurchased((prev) => new Set([...prev, item.id]));
        GameBridge.emit("shopItemPurchased", {
          itemId: item.id,
          xpCost: item.price,
        });
        GameBridge.emit("missionCompleted", { missionId: "choose_power_up" });
        void qc.invalidateQueries({ queryKey: ["profile"] });
      } catch {
        setError(`Failed to purchase ${item.name}.`);
      } finally {
        setPurchasing(null);
      }
    },
    [actor, purchased, qc],
  );

  const handleClose = useCallback(() => {
    GameBridge.emit("careerToolClose", undefined);
    onClose();
  }, [onClose]);

  const xp = profile?.xp ?? 0;
  const levelTitle = profile?.levelTitle ?? "Intern";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      data-ocid="item_shop.dialog"
      ref={modalRef}
      aria-label="Preparation Shop"
    >
      <div
        style={{
          background: BG,
          border: BORDER,
          boxShadow:
            "0 0 40px rgba(136,68,255,0.25), 0 0 80px rgba(136,68,255,0.08)",
          width: "100%",
          maxWidth: 600,
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
          aria-label="Close item shop"
          data-ocid="item_shop.close_button"
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
            ◈ FELIX'S CAREER EMPORIUM ◈
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
            ITEM SHOP
          </div>
          <div style={{ color: DIM, fontSize: 13, marginTop: 6 }}>
            Welcome, <span style={{ color: ACCENT }}>{levelTitle}</span>{" "}
            &nbsp;·&nbsp; XP:{" "}
            <span style={{ color: ACCENT }}>{xp.toLocaleString()}</span>
          </div>
          <div
            style={{
              color: "rgba(180,160,240,0.4)",
              fontSize: 11,
              marginTop: 4,
            }}
          >
            Preparation tools use Career Tokens. Lifetime XP and level never
            decrease.
          </div>
        </div>

        {error && (
          <div
            style={{
              color: "#ff4466",
              fontSize: 13,
              marginBottom: 14,
              textAlign: "center",
            }}
            data-ocid="item_shop.error_state"
          >
            ⚠ {error}
          </div>
        )}

        {/* Item grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
          data-ocid="item_shop.list"
        >
          {items.map((item, i) => {
            const isBought = purchased.has(item.id);
            const isBuying = purchasing === item.id;
            return (
              <div
                key={item.id}
                data-ocid={`item_shop.item.${i + 1}`}
                style={{
                  background: isBought
                    ? "rgba(136,68,255,0.08)"
                    : "rgba(136,68,255,0.04)",
                  border: `2px solid ${isBought ? "rgba(136,68,255,0.5)" : "rgba(136,68,255,0.2)"}`,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  opacity: isBought ? 0.65 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>
                    {item.emoji}
                  </span>
                  <div>
                    <div
                      style={{
                        color: item.color,
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ color: ACCENT, fontSize: 11 }}>
                      {item.price} TOKENS
                    </div>
                  </div>
                </div>
                <div style={{ color: DIM, fontSize: 12, lineHeight: 1.55 }}>
                  {item.description}
                </div>
                <button
                  type="button"
                  onClick={() => void handlePurchase(item)}
                  disabled={isBought || isBuying || purchasing !== null}
                  data-ocid={
                    isBought
                      ? `item_shop.purchased_button.${i + 1}`
                      : `item_shop.buy_button.${i + 1}`
                  }
                  style={{
                    padding: "8px 0",
                    background: isBought
                      ? "transparent"
                      : isBuying
                        ? ACCENT_DIM
                        : ACCENT_DIM,
                    border: `2px solid ${isBought ? "rgba(136,68,255,0.2)" : ACCENT}`,
                    color: isBought ? "rgba(136,68,255,0.4)" : ACCENT,
                    fontFamily: FONT,
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    cursor: isBought
                      ? "default"
                      : purchasing !== null
                        ? "wait"
                        : "pointer",
                    fontWeight: 700,
                    marginTop: "auto",
                  }}
                >
                  {isBought
                    ? "✓ ACQUIRED"
                    : isBuying
                      ? "ACQUIRING…"
                      : "⬡ ACQUIRE"}
                </button>
              </div>
            );
          })}
        </div>

        <div
          style={{
            textAlign: "center",
            color: "rgba(180,160,240,0.3)",
            fontSize: 11,
            marginTop: 16,
          }}
        >
          Items acquired: {purchased.size} / {items.length}
        </div>
      </div>
    </div>
  );
}
