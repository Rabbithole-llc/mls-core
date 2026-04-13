import { useState, useEffect, useRef } from "react";

const DATA = {
  projectName: "__PROJECT_NAME__",
  sessionNumber: 0,
  lastHandoff: [],
  activeGoals: [],
  activeTasks: 0,
  lastSessionTag: "build",
  timeSaved: "0 hrs",
  communityBrainConnected: false,
  supabaseConnected: false,
  isWarmStart: false,
  lastSessionMinutesAgo: null,
  // Up to 3 most-recently unlocked Achievement objects (sorted by unlocked_at desc).
  // Each has: slug, name, description, icon, unlocked_at.
  recentAchievements: [],
};

// ── JS-driven animation hook ──
function useAnimationLoop() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let frame;
    let start = Date.now();
    const loop = () => {
      setTick((Date.now() - start) / 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  return tick;
}

// ── Twinkling stars (JS driven) ──
function Stars() {
  const t = useAnimationLoop();
  const starsRef = useRef(
    Array.from({ length: 35 }, (_, i) => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: 1 + Math.random() * 2, speed: 0.3 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
      isGreen: Math.random() > 0.5,
    }))
  );
  return (
    <>
      {starsRef.current.map((s, i) => {
        const opacity = 0.1 + 0.35 * (Math.sin(t * s.speed + s.offset) * 0.5 + 0.5);
        const scale = 0.8 + 0.4 * (Math.sin(t * s.speed + s.offset) * 0.5 + 0.5);
        return (
          <div key={i} style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.size * scale}px`, height: `${s.size * scale}px`,
            borderRadius: "50%", opacity,
            background: s.isGreen ? "#34d399" : "#c8d2ff",
            boxShadow: s.isGreen ? `0 0 ${4 * scale}px rgba(52,211,153,0.4)` : `0 0 ${3 * scale}px rgba(200,210,255,0.3)`,
            transition: "none",
          }} />
        );
      })}
    </>
  );
}

function Orbits({ t }) {
  const orbs = [
    { radius: 220, speed: 0.015, size: 5, color: "rgba(52,211,153,0.3)", glow: "rgba(52,211,153,0.3)" },
    { radius: 180, speed: -0.01, size: 3, color: "rgba(129,140,248,0.25)", glow: "rgba(129,140,248,0.2)" },
  ];
  return (
    <>
      {orbs.map((o, i) => {
        const angle = t * o.speed * Math.PI * 2 + i * 2.1;
        const x = Math.cos(angle) * o.radius;
        const y = Math.sin(angle) * o.radius;
        return (
          <div key={i} style={{
            position: "absolute", left: `calc(50% + ${x}px)`, top: `calc(40% + ${y}px)`,
            width: `${o.size}px`, height: `${o.size}px`, borderRadius: "50%",
            background: o.color, boxShadow: `0 0 8px ${o.glow}`,
          }} />
        );
      })}
    </>
  );
}

function CenterGlow({ t }) {
  const scale = 1 + 0.12 * Math.sin(t * 0.5);
  const opacity = 0.6 + 0.4 * Math.sin(t * 0.5);
  return (
    <div style={{
      position: "absolute", top: "40%", left: "50%",
      width: `${420 * scale}px`, height: `${420 * scale}px`,
      marginLeft: `${-210 * scale}px`, marginTop: `${-210 * scale}px`,
      borderRadius: "50%", opacity: opacity * 0.15,
      background: "radial-gradient(circle, rgba(16,185,129,0.7) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)",
    }} />
  );
}

function Grid({ t }) {
  const opacity = 0.03 + 0.03 * Math.sin(t * 0.4);
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity }}>
      <defs>
        <pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
    </svg>
  );
}

function LivingBackground() {
  const t = useAnimationLoop();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 45%, #0d1f3c 0%, #070d18 50%, #040810 100%)" }} />
      <CenterGlow t={t} />
      <Grid t={t} />
      <Stars />
      <Orbits t={t} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 0%, rgba(4,8,16,0.7) 100%)" }} />
    </div>
  );
}

function PulsingDot({ t }) {
  const scale = 1 + 0.2 * (Math.sin(t * 1.2) * 0.5 + 0.5);
  const glow = 8 + 8 * (Math.sin(t * 1.2) * 0.5 + 0.5);
  return (
    <div style={{
      width: "6px", height: "6px", borderRadius: "50%",
      background: "#34d399",
      transform: `scale(${scale})`,
      boxShadow: `0 0 ${glow}px rgba(52,211,153,0.6)`,
    }} />
  );
}

function GlowText({ children, t, style = {} }) {
  const glow = 10 + 10 * (Math.sin(t * 0.7) * 0.5 + 0.5);
  return (
    <span style={{ ...style, textShadow: `0 0 ${glow}px rgba(52,211,153,0.5)` }}>
      {children}
    </span>
  );
}

function AnimCheck({ visible, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (visible) { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }
  }, [visible, delay]);
  return (
    <span className={`inline-flex transition-all duration-500 ${show ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
      <span className="text-emerald-400 font-bold">{"\u2713"}</span>
    </span>
  );
}

export default function MLSBootReconnect() {
  const t = useAnimationLoop();
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    // V3: faster boot — 3s total for warm, 4s for cold (was 5s)
    const speed = DATA.isWarmStart ? 0.5 : 0.8;
    const timers = [
      setTimeout(() => setPhase(1), 200 * speed), setTimeout(() => setPhase(2), 600 * speed),
      setTimeout(() => setPhase(3), 1200 * speed), setTimeout(() => setPhase(4), 1900 * speed),
      setTimeout(() => setPhase(5), 2600 * speed), setTimeout(() => setPhase(6), 3300 * speed),
      setTimeout(() => setPhase(7), 3800 * speed),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const contextFiles = ["CONTEXT.md", "TASKS.md", "GOALS.md", "PREFERENCES.md", "CORRECTIONS.md", "CHANGELOG.md", "FEEDBACK.md"];
  const warmLabel = DATA.isWarmStart ? `Warm resume \u2014 last session ${DATA.lastSessionMinutesAgo} min ago` : null;
  const card = { border: "1px solid rgba(52,211,153,0.15)", borderRadius: "16px", padding: "16px", background: "rgba(52,211,153,0.03)", backdropFilter: "blur(16px)" };

  return (
    <div style={{ background: "#040810", minHeight: "100vh", width: "100%", position: "relative", overflow: "hidden" }}>
      <LivingBackground />
      <div style={{ position: "relative", zIndex: 10, padding: "40px 24px", maxWidth: "480px", margin: "0 auto" }}>
        <div className="flex flex-col">

          {/* Phase 1: Project Identity */}
          <div className={`transition-all duration-700 ${phase >= 1 ? "opacity-100" : "opacity-0"}`}>
            <div className="flex items-center justify-between mb-2">
              <GlowText t={t} style={{ fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.2em", color: "#34d399", textTransform: "uppercase" }}>
                {DATA.isWarmStart ? "Warm Resume" : "Reconnecting"}
              </GlowText>
              <span className="text-xs font-mono text-white/20">Session {DATA.sessionNumber}</span>
            </div>
            <div className="text-4xl mb-2">{"\u{1F9E0}"}</div>
            <h1 className={`text-2xl font-bold text-white mb-1 leading-tight transition-all duration-700 ${phase >= 1 ? "translate-y-0" : "translate-y-4"}`}>{DATA.projectName}</h1>
            {warmLabel && <p className={`text-xs text-emerald-400/60 font-mono mt-1 transition-all duration-500 ${phase >= 1 ? "opacity-100" : "opacity-0"}`}>{warmLabel}</p>}
            <p className={`text-xs text-white/30 font-mono mt-1 transition-all duration-500 ${phase >= 2 ? "opacity-100" : "opacity-0"}`}>Loading memory...</p>
          </div>

          {/* Phase 3: Context Files */}
          <div className={`mt-5 transition-all duration-500 ${phase >= 3 ? "opacity-100" : "opacity-0"}`}>
            <div style={card}>
              <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#34d399", marginBottom: "12px" }}>MEMORY FILES</div>
              <div className="grid grid-cols-2 gap-1.5">
                {contextFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 transition-all duration-300"
                    style={{ transitionDelay: `${i * 80}ms`, opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? "translateX(0)" : "translateX(-8px)" }}>
                    <AnimCheck visible={phase >= 3} delay={i * 80 + 200} />
                    <span className="text-xs text-white/50 font-mono">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phase 4: Last Handoff */}
          <div className={`mt-4 transition-all duration-600 ${phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div style={card}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{"\u{1F91D}"}</span>
                <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#34d399" }}>LAST HANDOFF</span>
                {DATA.lastSessionTag && <span className="text-xs text-white/20 font-mono ml-auto">{DATA.lastSessionTag}</span>}
              </div>
              {DATA.lastHandoff.length > 0 ? (
                DATA.lastHandoff.slice(0, 3).map((line, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <span style={{ color: "#34d399", fontSize: "12px", marginTop: "2px", flexShrink: 0 }}>{"\u2192"}</span>
                    <span className="text-xs text-white/40 leading-relaxed">{line}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-white/30 italic">No handoff from previous session</span>
              )}
            </div>
          </div>

          {/* Phase 5: Status Dashboard */}
          <div className={`mt-4 transition-all duration-600 ${phase >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: DATA.activeGoals.length || "\u2014", label: "Goals" },
                { value: DATA.activeTasks || "\u2014", label: "Tasks" },
                { value: DATA.timeSaved, label: "Saved" },
              ].map((s, i) => (
                <div key={i} style={{ ...card, textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#34d399" }}>{s.value}</div>
                  <div className="text-xs text-white/30">{s.label}</div>
                </div>
              ))}
            </div>
            {DATA.activeGoals.length > 0 && (
              <div style={{ ...card, marginTop: "8px" }}>
                <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#34d399", marginBottom: "8px" }}>ACTIVE GOALS</div>
                {DATA.activeGoals.slice(0, 3).map((goal, i) => (
                  <div key={i} className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/50">{goal.name}</span>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#34d399" }}>{goal.progress}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phase 6: Connections (V3: replaced agentCount with Supabase) */}
          <div className={`mt-4 transition-all duration-600 ${phase >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-4 justify-center">
              {[
                { connected: DATA.supabaseConnected, label: "Cloud Sync" },
                { connected: DATA.communityBrainConnected, label: "Community Brain" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {c.connected ? <PulsingDot t={t} /> : <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />}
                  <span className="text-xs text-white/30">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 6.5: Recent Achievements Strip (amber pills) */}
          {phase >= 6 && DATA.recentAchievements && DATA.recentAchievements.length > 0 && (
            <div className={`mt-3 transition-all duration-500 ${phase >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                {DATA.recentAchievements.slice(0, 3).map((ach, i) => (
                  <span key={i} style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    padding: "4px 10px", borderRadius: "20px",
                    background: "rgba(251,191,36,0.10)",
                    border: "1px solid rgba(251,191,36,0.22)",
                    fontSize: "11px", color: "#fbbf24", fontFamily: "monospace",
                    whiteSpace: "nowrap",
                  }}>
                    <span style={{ fontSize: "12px" }}>🏆</span>
                    {ach.name}
                  </span>
                ))}
                <span style={{
                  fontSize: "11px", color: "rgba(251,191,36,0.4)", fontFamily: "monospace",
                  marginLeft: "2px", cursor: "default",
                }}>
                  View all →
                </span>
              </div>
            </div>
          )}

          {/* Phase 7: Ready */}
          <div className={`mt-8 text-center transition-all duration-700 ${phase >= 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {phase >= 7 && (
              <div style={{ display: "inline-block", border: `2px solid rgba(52,211,153,${0.25 + 0.15 * (Math.sin(t * 0.8) * 0.5 + 0.5)})`, borderRadius: "18px", padding: "12px 32px", background: "rgba(52,211,153,0.05)", boxShadow: `0 0 ${20 + 20 * (0.05 + 0.06 * (Math.sin(t * 0.8) * 0.5 + 0.5))}px rgba(52,211,153,${0.08 * (0.05 + 0.06 * (Math.sin(t * 0.8) * 0.5 + 0.5))})` }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#34d399" }}>
                  {DATA.isWarmStart ? "Pick up where you left off \u203A" : "Ready to work \u203A"}
                </span>
              </div>
            )}
            <p className="text-xs text-white/20 mt-2">Session {DATA.sessionNumber} starting</p>
          </div>

        </div>
      </div>
    </div>
  );
}
