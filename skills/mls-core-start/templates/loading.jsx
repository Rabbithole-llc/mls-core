import { useState, useEffect, useRef } from "react";

// ── JS-driven animation hook ──
function useAnimationLoop() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let frame;
    let start = Date.now();
    const loop = () => { setTick((Date.now() - start) / 1000); frame = requestAnimationFrame(loop); };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  return tick;
}

function Stars() {
  const t = useAnimationLoop();
  const starsRef = useRef(Array.from({ length: 30 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100, size: 1 + Math.random() * 2,
    speed: 0.3 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2, isGreen: Math.random() > 0.6,
  })));
  return <>{starsRef.current.map((s, i) => {
    const opacity = 0.1 + 0.35 * (Math.sin(t * s.speed + s.offset) * 0.5 + 0.5);
    const scale = 0.8 + 0.4 * (Math.sin(t * s.speed + s.offset) * 0.5 + 0.5);
    return <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: `${s.size * scale}px`, height: `${s.size * scale}px`, borderRadius: "50%", opacity, background: s.isGreen ? "#34d399" : "#c8d2ff", boxShadow: s.isGreen ? `0 0 ${4 * scale}px rgba(52,211,153,0.4)` : `0 0 3px rgba(200,210,255,0.3)`, transition: "none" }} />;
  })}</>;
}

function Orbits({ t }) {
  const orbs = [
    { radius: 220, speed: 0.015, size: 5, color: "rgba(52,211,153,0.3)" },
    { radius: 180, speed: -0.01, size: 3, color: "rgba(129,140,248,0.25)" },
  ];
  return <>{orbs.map((o, i) => {
    const angle = t * o.speed * Math.PI * 2 + i * 2.1;
    return <div key={i} style={{ position: "absolute", left: `calc(50% + ${Math.cos(angle) * o.radius}px)`, top: `calc(47% + ${Math.sin(angle) * o.radius}px)`, width: `${o.size}px`, height: `${o.size}px`, borderRadius: "50%", background: o.color, boxShadow: `0 0 8px ${o.color}` }} />;
  })}</>;
}

function CenterGlow({ t }) {
  const s = 1 + 0.12 * Math.sin(t * 0.5);
  return <div style={{ position: "absolute", top: "47%", left: "50%", width: `${420 * s}px`, height: `${420 * s}px`, marginLeft: `${-210 * s}px`, marginTop: `${-210 * s}px`, borderRadius: "50%", opacity: 0.15 * (0.6 + 0.4 * Math.sin(t * 0.5)), background: "radial-gradient(circle, rgba(16,185,129,0.7) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)" }} />;
}

function Grid({ t }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.03 + 0.03 * Math.sin(t * 0.4) }}>
      <defs><pattern id="g" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
      <rect width="100%" height="100%" fill="url(#g)" />
    </svg>
  );
}

function LivingBackground() {
  const t = useAnimationLoop();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 45%, #0d1f3c 0%, #070d18 50%, #040810 100%)" }} />
      <CenterGlow t={t} /><Grid t={t} /><Stars /><Orbits t={t} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 0%, rgba(4,8,16,0.7) 100%)" }} />
    </div>
  );
}

function GlowText({ children, t, style = {} }) {
  const glow = 10 + 10 * (Math.sin(t * 0.7) * 0.5 + 0.5);
  return <span style={{ ...style, textShadow: `0 0 ${glow}px rgba(52,211,153,0.5)` }}>{children}</span>;
}

const LOADING_MESSAGE = "__LOADING_MESSAGE__";
const LOADING_STEPS = ["__STEP_1__", "__STEP_2__", "__STEP_3__"];

export default function MLSBootLoading() {
  const t = useAnimationLoop();
  const [progress, setProgress] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setProgress(p => Math.min(p + 0.5, 95)), 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    LOADING_STEPS.forEach((_, i) => { setTimeout(() => setVisibleSteps(i + 1), 800 + i * 1200); });
  }, []);

  const spinnerRotation = (t * 360) % 360;
  const pulseScale = 1 + 0.2 * (Math.sin(t * 1.2) * 0.5 + 0.5);
  const pulseGlow = 8 + 8 * (Math.sin(t * 1.2) * 0.5 + 0.5);

  return (
    <div style={{ background: "#040810", minHeight: "100vh", width: "100%", position: "relative", overflow: "hidden" }}>
      <LivingBackground />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "48px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid rgba(52,211,153,0.15)", borderTop: "2px solid #34d399", borderRadius: "50%", transform: `rotate(${spinnerRotation}deg)`, marginBottom: "32px" }} />
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{LOADING_MESSAGE}</span>
          <span style={{ opacity: 0.4 + 0.6 * (Math.sin(t * 3) * 0.5 + 0.5), color: "rgba(255,255,255,0.85)", transition: "none" }}>...</span>
        </div>
        <div style={{ width: "100%", maxWidth: "320px", marginBottom: "40px" }}>
          <div style={{ height: "3px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: "4px", background: "linear-gradient(90deg, rgba(52,211,153,0.6), #34d399)", width: `${progress}%`, transition: "width 0.3s ease", boxShadow: "0 0 12px rgba(52,211,153,0.3)" }} />
          </div>
        </div>
        <div style={{ width: "100%", maxWidth: "320px" }}>
          {LOADING_STEPS.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", opacity: i < visibleSteps ? 1 : 0, transform: i < visibleSteps ? "translateX(0)" : "translateX(-8px)", transition: "all 0.5s ease" }}>
              {i < visibleSteps - 1 ? (
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: "#34d399", boxShadow: `0 0 ${pulseGlow}px rgba(52,211,153,0.5)`, transform: `scale(${pulseScale})` }} />
              ) : (
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: "rgba(52,211,153,0.4)" }} />
              )}
              <span style={{ fontSize: "13px", fontFamily: "monospace", color: i < visibleSteps - 1 ? "rgba(52,211,153,0.7)" : "rgba(255,255,255,0.35)", transition: "color 0.5s ease" }}>{step}</span>
              {i < visibleSteps - 1 && <GlowText t={t} style={{ fontSize: "12px", marginLeft: "auto" }}>{"\u2713"}</GlowText>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
