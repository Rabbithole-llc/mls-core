import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────
// ACHIEVEMENTS_DATA — filled by mls-core-start at render time.
// Shape: { unlocked: Achievement[], in_progress: Achievement[], locked: Achievement[] }
// Each Achievement: { slug, name, description, icon, unlocked_at?, progress? }
// ─────────────────────────────────────────────────────────
const ACHIEVEMENTS_DATA = {
  unlocked: [],
  in_progress: [],
  locked: [],
};

// ── Icon mapping: Lucide name → emoji ──
const ICON_MAP = {
  zap:      "⚡",
  calendar: "📅",
  clock:    "⏱",
  brain:    "🧠",
  target:   "🎯",
  refresh:  "🔄",
  cpu:      "💻",
  layers:   "📊",
  folder:   "📁",
  users:    "👥",
};

// ── Category definitions (slug → category) ──
const CATEGORIES = [
  {
    name: "Sessions",
    slugs: ["first-contact", "streak-3", "streak-7", "streak-30", "warm-starter"],
  },
  {
    name: "Memory",
    slugs: ["memory-keeper", "goal-crusher", "correction-loop", "time-saver", "century-club"],
  },
  {
    name: "Agents",
    slugs: ["agent-activated", "agent-loop", "multi-agent", "agent-veteran"],
  },
  {
    name: "Projects & Hubs",
    slugs: ["founder", "multi-project", "team-player"],
  },
  {
    name: "Community",
    slugs: ["brain-sharer"],
  },
];

// ── Animation hook ──
function useAnimationLoop() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let frame;
    const start = Date.now();
    const loop = () => { setTick((Date.now() - start) / 1000); frame = requestAnimationFrame(loop); };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  return tick;
}

// ── Background ──
function Stars() {
  const t = useAnimationLoop();
  const starsRef = useRef(
    Array.from({ length: 28 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: 1 + Math.random() * 1.5, speed: 0.3 + Math.random() * 0.4,
      offset: Math.random() * Math.PI * 2, isAmber: Math.random() > 0.7,
    }))
  );
  return (
    <>
      {starsRef.current.map((s, i) => {
        const op = 0.08 + 0.2 * (Math.sin(t * s.speed + s.offset) * 0.5 + 0.5);
        return (
          <div key={i} style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.size}px`, height: `${s.size}px`, borderRadius: "50%", opacity: op,
            background: s.isAmber ? "#fbbf24" : "#c8d2ff",
            boxShadow: s.isAmber ? `0 0 4px rgba(251,191,36,0.3)` : `0 0 3px rgba(200,210,255,0.2)`,
          }} />
        );
      })}
    </>
  );
}

function LivingBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 30%, #1a1000 0%, #070d18 45%, #040810 100%)" }} />
      <Stars />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 0%, rgba(4,8,16,0.6) 100%)" }} />
    </div>
  );
}

// ── Helpers ──
function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
}

function getIcon(iconName) {
  return ICON_MAP[iconName] || "🏅";
}

// ── Build a lookup of every known achievement by slug from all three arrays ──
function buildLookup() {
  const map = {};
  for (const a of ACHIEVEMENTS_DATA.unlocked)    map[a.slug] = { ...a, state: "unlocked" };
  for (const a of ACHIEVEMENTS_DATA.in_progress) map[a.slug] = { ...a, state: "in_progress" };
  for (const a of ACHIEVEMENTS_DATA.locked)      map[a.slug] = { ...a, state: "locked" };
  return map;
}

// ── Progress bar ──
function ProgressBar({ value }) {
  return (
    <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.08)", overflow: "hidden", marginTop: "8px" }}>
      <div style={{
        height: "100%", borderRadius: "2px",
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: "linear-gradient(90deg, rgba(251,191,36,0.5) 0%, rgba(251,191,36,0.85) 100%)",
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

// ── Single achievement card ──
function AchievementCard({ ach, state, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const isUnlocked    = state === "unlocked";
  const isInProgress  = state === "in_progress";
  const isLocked      = state === "locked";

  const borderColor = isUnlocked   ? "rgba(251,191,36,0.35)"
                    : isInProgress ? "rgba(251,191,36,0.18)"
                    : "rgba(255,255,255,0.06)";
  const bgColor     = isUnlocked   ? "rgba(251,191,36,0.07)"
                    : isInProgress ? "rgba(251,191,36,0.03)"
                    : "rgba(255,255,255,0.02)";
  const nameColor   = isUnlocked   ? "#fbbf24"
                    : isInProgress ? "rgba(251,191,36,0.6)"
                    : "rgba(255,255,255,0.2)";
  const descColor   = isUnlocked   ? "rgba(255,255,255,0.45)"
                    : isInProgress ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.12)";
  const iconOp      = isUnlocked ? 1 : isInProgress ? 0.5 : 0.2;

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      borderRadius: "12px",
      padding: "14px",
      background: bgColor,
      backdropFilter: "blur(12px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      position: "relative",
    }}>
      {/* Unlocked glow accent */}
      {isUnlocked && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          borderRadius: "12px 12px 0 0",
          background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)",
        }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        {/* Icon */}
        <div style={{ fontSize: "20px", opacity: iconOp, flexShrink: 0, lineHeight: 1.2, marginTop: "1px" }}>
          {getIcon(ach?.icon)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "3px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: nameColor, fontFamily: "monospace" }}>
              {ach?.name || ach?.slug || "—"}
            </span>
            {isUnlocked && (
              <span style={{ fontSize: "10px", color: "rgba(251,191,36,0.4)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                ✓ unlocked
              </span>
            )}
            {isInProgress && ach?.progress != null && (
              <span style={{ fontSize: "10px", color: "rgba(251,191,36,0.35)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                {ach.progress}%
              </span>
            )}
          </div>

          <p style={{ fontSize: "11px", color: descColor, margin: 0, lineHeight: 1.5 }}>
            {ach?.description || ""}
          </p>

          {/* Unlock date */}
          {isUnlocked && ach?.unlocked_at && (
            <p style={{ fontSize: "10px", color: "rgba(251,191,36,0.3)", fontFamily: "monospace", margin: "5px 0 0 0" }}>
              {formatDate(ach.unlocked_at)}
            </p>
          )}

          {/* Progress bar */}
          {isInProgress && ach?.progress != null && (
            <ProgressBar value={ach.progress} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Category section ──
function CategorySection({ category, lookup, baseDelay }) {
  const achievements = category.slugs.map(slug => {
    const found = lookup[slug];
    if (found) return found;
    // Slug not in any list — treat as unknown/locked placeholder
    return { slug, name: slug, description: "", icon: "target", state: "locked" };
  });

  const unlocked   = achievements.filter(a => a.state === "unlocked");
  const inProgress = achievements.filter(a => a.state === "in_progress");
  const locked     = achievements.filter(a => a.state === "locked");

  const ordered = [...unlocked, ...inProgress, ...locked];

  return (
    <div style={{ marginBottom: "28px" }}>
      {/* Category header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(251,191,36,0.12)" }} />
        <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(251,191,36,0.45)", letterSpacing: "0.15em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {category.name}
          {unlocked.length > 0 && (
            <span style={{ marginLeft: "6px", color: "rgba(251,191,36,0.25)" }}>
              {unlocked.length}/{category.slugs.length}
            </span>
          )}
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(251,191,36,0.12)" }} />
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {ordered.map((ach, i) => (
          <AchievementCard
            key={ach.slug}
            ach={ach}
            state={ach.state}
            delay={baseDelay + i * 60}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ──
export default function MLSAchievements() {
  const t = useAnimationLoop();
  const lookup = buildLookup();

  const totalUnlocked  = ACHIEVEMENTS_DATA.unlocked.length;
  const totalInProgress = ACHIEVEMENTS_DATA.in_progress.length;
  const totalAll = CATEGORIES.reduce((n, c) => n + c.slugs.length, 0);

  // Glow on header trophy
  const trophyGlow = 12 + 8 * (Math.sin(t * 0.6) * 0.5 + 0.5);

  return (
    <div style={{ background: "#040810", minHeight: "100vh", width: "100%", position: "relative", overflow: "hidden" }}>
      <LivingBackground />

      <div style={{ position: "relative", zIndex: 10, padding: "36px 20px 60px", maxWidth: "520px", margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", fontFamily: "monospace", letterSpacing: "0.2em", color: "rgba(251,191,36,0.5)", textTransform: "uppercase" }}>
              memorylayer.pro
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <span style={{ fontSize: "28px", filter: `drop-shadow(0 0 ${trophyGlow}px rgba(251,191,36,0.4))` }}>🏆</span>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", margin: 0, lineHeight: 1.2 }}>
              Achievements
            </h1>
          </div>

          {/* Summary pill row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            <span style={{
              padding: "4px 10px", borderRadius: "20px",
              background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)",
              fontSize: "11px", color: "#fbbf24", fontFamily: "monospace",
            }}>
              {totalUnlocked} unlocked
            </span>
            {totalInProgress > 0 && (
              <span style={{
                padding: "4px 10px", borderRadius: "20px",
                background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)",
                fontSize: "11px", color: "rgba(251,191,36,0.5)", fontFamily: "monospace",
              }}>
                {totalInProgress} in progress
              </span>
            )}
            <span style={{
              fontSize: "11px", color: "rgba(255,255,255,0.2)", fontFamily: "monospace",
            }}>
              of {totalAll} total
            </span>
          </div>
        </div>

        {/* ── Recent unlocked strip (top 3) ── */}
        {totalUnlocked > 0 && (
          <div style={{
            border: "1px solid rgba(251,191,36,0.18)",
            borderRadius: "14px",
            padding: "14px 16px",
            background: "rgba(251,191,36,0.04)",
            marginBottom: "24px",
          }}>
            <div style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(251,191,36,0.4)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
              Most Recent
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {[...ACHIEVEMENTS_DATA.unlocked]
                .sort((a, b) => (b.unlocked_at || "").localeCompare(a.unlocked_at || ""))
                .slice(0, 3)
                .map((ach, i) => (
                  <span key={i} style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    padding: "5px 12px", borderRadius: "20px",
                    background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
                    fontSize: "12px", color: "#fbbf24", fontFamily: "monospace",
                  }}>
                    <span style={{ opacity: 0.8 }}>{getIcon(ach.icon)}</span>
                    {ach.name}
                  </span>
                ))
              }
            </div>
          </div>
        )}

        {/* ── Category sections ── */}
        {CATEGORIES.map((cat, ci) => (
          <CategorySection
            key={cat.name}
            category={cat}
            lookup={lookup}
            baseDelay={ci * 80}
          />
        ))}

        {/* ── Footer ── */}
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <p style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.12)" }}>
            memorylayer.pro/dashboard/achievements
          </p>
        </div>

      </div>
    </div>
  );
}
