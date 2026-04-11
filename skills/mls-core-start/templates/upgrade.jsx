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
    speed: 0.3 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2, isGreen: Math.random() > 0.5,
  })));
  return <>{starsRef.current.map((s, i) => {
    const opacity = 0.1 + 0.35 * (Math.sin(t * s.speed + s.offset) * 0.5 + 0.5);
    const scale = 0.8 + 0.4 * (Math.sin(t * s.speed + s.offset) * 0.5 + 0.5);
    return <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: `${s.size * scale}px`, height: `${s.size * scale}px`, borderRadius: "50%", opacity, background: s.isGreen ? "#06b6d4" : "#c8d2ff", boxShadow: s.isGreen ? `0 0 ${4 * scale}px rgba(6,182,212,0.4)` : `0 0 3px rgba(200,210,255,0.3)`, transition: "none" }} />;
  })}</>;
}

function Orbits({ t }) {
  const angle = t * 0.015 * Math.PI * 2;
  return <div style={{ position: "absolute", left: `calc(50% + ${Math.cos(angle) * 220}px)`, top: `calc(45% + ${Math.sin(angle) * 220}px)`, width: "4px", height: "4px", borderRadius: "50%", background: "rgba(6,182,212,0.3)", boxShadow: "0 0 8px rgba(6,182,212,0.3)" }} />;
}

function CenterGlow({ t }) {
  const s = 1 + 0.12 * Math.sin(t * 0.5);
  return <div style={{ position: "absolute", top: "45%", left: "50%", width: `${400 * s}px`, height: `${400 * s}px`, marginLeft: `${-200 * s}px`, marginTop: `${-200 * s}px`, borderRadius: "50%", opacity: (0.6 + 0.4 * Math.sin(t * 0.5)) * 0.12, background: "radial-gradient(circle, rgba(6,182,212,0.6) 0%, rgba(6,182,212,0.2) 40%, transparent 70%)" }} />;
}

function Grid({ t }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.03 + 0.03 * Math.sin(t * 0.4) }}>
      <defs><pattern id="ug" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
      <rect width="100%" height="100%" fill="url(#ug)" />
    </svg>
  );
}

function UpgradeLivingBackground() {
  const t = useAnimationLoop();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 45%, #0d1f3c 0%, #070d18 50%, #040810 100%)" }} />
      <CenterGlow t={t} /><Grid t={t} /><Stars /><Orbits t={t} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 0%, rgba(4,8,16,0.7) 100%)" }} />
    </div>
  );
}

const accentColors = {
  cyan: { dot: "bg-cyan-400", text: "text-cyan-400", border: "border-cyan-400/30", bg: "bg-cyan-400/10", glow: "shadow-cyan-500/20" },
  teal: { dot: "bg-teal-400", text: "text-teal-400", border: "border-teal-400/30", bg: "bg-teal-400/10", glow: "shadow-teal-500/20" },
  emerald: { dot: "bg-emerald-400", text: "text-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-400/10", glow: "shadow-emerald-500/20" },
  indigo: { dot: "bg-indigo-400", text: "text-indigo-400", border: "border-indigo-400/30", bg: "bg-indigo-400/10", glow: "shadow-indigo-500/20" },
};

function AnimCheck({ visible, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => { if (visible) { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); } }, [visible, delay]);
  return <span className={`transition-all duration-500 ${show ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}><span className="text-emerald-400 font-bold">{"\u2713"}</span></span>;
}

function VersionBadge({ from, to, colors }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => { const t = [setTimeout(() => setPhase(1), 500), setTimeout(() => setPhase(2), 1200), setTimeout(() => setPhase(3), 1800)]; return () => t.forEach(clearTimeout); }, []);
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      <div className={`transition-all duration-500 ${phase >= 1 ? "opacity-100" : "opacity-0"}`}>
        <div className="border border-white/10 rounded-xl px-5 py-3 bg-white/5 text-center"><div className="text-xs text-white/30 mb-1">FROM</div><code className="text-lg text-white/40">v{from}</code></div>
      </div>
      <div className={`transition-all duration-500 ${phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}><span className={`text-2xl ${colors.text}`}>{"\u2192"}</span></div>
      <div className={`transition-all duration-500 ${phase >= 3 ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
        <div className={`border-2 ${colors.border} rounded-xl px-5 py-3 ${colors.bg} text-center shadow-lg ${colors.glow}`}><div className={`text-xs ${colors.text} mb-1`}>TO</div><code className={`text-lg font-bold ${colors.text}`}>v{to}</code></div>
      </div>
    </div>
  );
}

function MigrationChecklist({ items, colors }) {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => { const i = setInterval(() => setRevealed(p => p < items.length ? p + 1 : p), 300); return () => clearInterval(i); }, [items.length]);
  return (
    <div className={`border ${colors.border} rounded-xl p-4 ${colors.bg} my-4`}>
      {items.map((item, i) => (
        <div key={i} className={`flex items-center gap-3 py-1.5 transition-all duration-400 ${i < revealed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}`}>
          <AnimCheck visible={i < revealed} delay={150} />
          <span className="text-xs text-white/60">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

const upgradeSlides = [
  { id: "welcome", badge: "Upgrade", accent: "cyan", number: "01", icon: "\u{1F680}", title: "Welcome to v3.0.0", subtitle: "Upgraded from v2.0.0", body: "Your project has been automatically migrated. All your context, goals, feedback, and preferences are preserved — plus Supabase cloud sync is now built in.", versionBadge: true },
  { id: "features", badge: "What's New", accent: "teal", number: "02", icon: "\u2728", title: "Supabase Cloud Sync", subtitle: "Your memory now lives in the cloud",
    newFeatures: [
      { name: "Supabase Backend", desc: "Real-time cloud sync via Edge Functions.", icon: "\u2601\uFE0F" },
      { name: "Session API", desc: "Start/end sessions with server-side tracking.", icon: "\u{1F504}" },
      { name: "Memory API", desc: "Push context snapshots mid-session.", icon: "\u{1F9E0}" },
      { name: "API Key Auth", desc: "Secure project-scoped authentication.", icon: "\u{1F511}" },
      { name: "Local-First", desc: "Works offline. Syncs when connected.", icon: "\u{1F4BE}" },
      { name: "Agent Hooks", desc: "Agents decoupled from Core via .agents/", icon: "\u{1F�}" },
      { name: "Auto-Migration", desc: "V2 configs upgraded automatically.", icon: "\u{1F4E6}" },
    ] },
  { id: "community", badge: "Community Brain", accent: "emerald", number: "03", icon: "\u{1F30D}", title: "Join the Network", subtitle: "Your project now connects to Memory Layer community powered by Supabase",
    communityFeatures: [
      { name: "Project Leaderboard", desc: "See the most active projects. Stats update every session close.", icon: "\u{1F3C6}" },
      { name: "Agent Marketplace", desc: "Browse and install specialized agents from the marketplace.", icon: "\u{1F6D2}" },
      { name: "Network Insights", desc: "Collective patterns, popular tags, and ROI across all projects.", icon: "\u{1F4CA}" },
    ], footer: "Your data is anonymized by default." },
  { id: "commands", badge: "Architecture Changes", accent: "cyan", number: "04", icon: "\u{1F6E0}\uFE0F", title: "Architecture Changes", subtitle: "What moved in V3",
    commandChanges: [
      { old: "Agents in config.json", new: ".agents/ directory", desc: "Hook-based agent system" },
    ] },
  { id: "migrated", badge: "Auto-Migrated", accent: "indigo", number: "05", icon: "\u{1F4E6}", title: "Your Project, Upgraded", subtitle: "Zero data loss", migrationChecklist: true },
  { id: "ready", badge: "Ready", accent: "indigo", number: "06", icon: "\u{1F407}", title: "You're All Set", readySlide: true, footer: "Built by Rabbithole LLC" },
];

function UpgradeReadyAnimation() {
  const [step, setStep] = useState(0);
  useEffect(() => { const t = [setTimeout(() => setStep(1), 400), setTimeout(() => setStep(2), 1000), setTimeout(() => setStep(3), 1600)]; return () => t.forEach(clearTimeout); }, []);
  const colors = accentColors.indigo;
  return (
    <div className="my-4 text-center">
      <div className={`transition-all duration-700 ${step >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
        <div className={`border ${colors.border} rounded-xl p-5 ${colors.bg} mb-5`}>
          <div className="flex items-center justify-center gap-3 mb-3"><AnimCheck visible={step >= 1} delay={200} /><span className="text-sm text-white/70">All data preserved</span></div>
          <div className="flex items-center justify-center gap-3 mb-3"><AnimCheck visible={step >= 2} delay={0} /><span className={`text-sm text-white/70 transition-opacity duration-500 ${step >= 2 ? "opacity-100" : "opacity-0"}`}>Supabase sync ready</span></div>
          <div className="flex items-center justify-center gap-3"><AnimCheck visible={step >= 3} delay={0} /><span className={`text-sm text-white/70 transition-opacity duration-500 ${step >= 3 ? "opacity-100" : "opacity-0"}`}>Community Brain connected</span></div>
        </div>
      </div>
      <div className={`transition-all duration-700 ${step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className={`inline-block border-2 ${colors.border} rounded-2xl px-8 py-3 ${colors.bg} shadow-lg ${colors.glow}`}>
          <span className={`text-lg font-bold ${colors.text}`}>Start working {"\u203A"}</span>
        </div>
        <p className="text-xs text-white/30 mt-3">Everything works exactly the same {"\u2014"} just better.</p>
      </div>
    </div>
  );
}

function SlideContent({ slide }) {
  const colors = accentColors[slide.accent];
  const total = upgradeSlides.length;
  return (
    <div className="flex flex-col h-full p-8 justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <span className={`text-xs font-mono uppercase tracking-widest ${colors.text}`}>{slide.badge}</span>
          <span className="text-xs font-mono text-white/20">{slide.number} / {String(total).padStart(2, "0")}</span>
        </div>
        {slide.icon && <div className="text-4xl mb-3">{slide.icon}</div>}
        <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{slide.title}</h1>
        {slide.subtitle && <p className="text-sm text-white/50 mb-3">{slide.subtitle}</p>}
        {slide.body && <p className="text-sm text-white/40 leading-relaxed whitespace-pre-line">{slide.body}</p>}
      </div>
      {slide.versionBadge && <VersionBadge from="2.0.0" to="3.0.0" colors={colors} />}
      {slide.newFeatures && (
        <div className="grid grid-cols-2 gap-2 my-4">
          {slide.newFeatures.map((f, i) => (
            <div key={i} className={`border ${colors.border} rounded-lg p-2.5 ${colors.bg}`}>
              <div className="flex items-center gap-1.5 mb-1"><span className="text-sm">{f.icon}</span><span className="text-xs font-semibold text-white">{f.name}</span></div>
              <div className="text-xs text-white/35 leading-snug">{f.desc}</div>
            </div>
          ))}
        </div>
      )}
      {slide.communityFeatures && (
        <div className="flex flex-col gap-3 my-4">
          {slide.communityFeatures.map((f, i) => (
            <div key={i} className={`border ${colors.border} rounded-xl p-4 ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-1.5"><span className="text-lg">{f.icon}</span><span className="text-sm font-semibold text-white">{f.name}</span></div>
              <div className="text-xs text-white/40 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      )}
      {slide.commandChanges && (
        <div className="my-4">
          <div className={`text-xs font-mono ${colors.text} mb-2`}>CHANGED</div>
          <div className="flex flex-col gap-2 mb-4">
            {slide.commandChanges.map((c, i) => (
              <div key={i} className={`border ${colors.border} rounded-xl p-3 ${colors.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs text-white/30 line-through">{c.old}</code>
                  <span className="text-xs text-white/20">{"\u2192"}</span>
                  <code className={`text-xs font-bold ${colors.text}`}>{c.new}</code>
                </div>
                <div className="text-xs text-white/40">{c.desc}</div>
              </div>
            ))}
          </div>
          <div className="text-xs font-mono text-white/20 mb-2">UNCHANGED</div>
          <div className="grid grid-cols-2 gap-1.5">
            {["/mls-core-start", "/mls-core-stop", "/mls-push", "/mls-pull"].map((cmd, i) => (
              <div key={i} className="flex items-center gap-2 py-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400/60" /><code className="text-xs text-white/40">{cmd}</code></div>
            ))}
          </div>
        </div>
      )}
      {slide.migrationChecklist && (
        <MigrationChecklist items={[
          { label: "All existing context preserved" }, { label: "Supabase config block added" },
          { label: "Sync config block added (primary: supabase)" }, { label: "Agent config moved to .agents/" },
          { label: ".agents/ directory created" }, { label: "Community Brain still connected" },
          { label: "Version bumped to 3.0.0" },
        ]} colors={colors} />
      )}
      {slide.readySlide && <UpgradeReadyAnimation />}
      {slide.footer && <div className="mt-auto pt-3"><p className="text-xs text-white/20 text-center">{slide.footer}</p></div>}
    </div>
  );
}

export default function UpgradePreview() {
  const [current, setCurrent] = useState(0);
  const slide = upgradeSlides[current];
  const total = upgradeSlides.length;
  return (
    <div style={{ background: "#040810", minHeight: "100vh", width: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <UpgradeLivingBackground />
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", padding: "32px 24px", maxWidth: "480px", margin: "0 auto", width: "100%" }}>
        <div className="flex-1 flex flex-col">
          <div style={{ flex: 1, borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)", backdropFilter: "blur(16px)", position: "relative" }}>
            <div className="absolute inset-0 overflow-y-auto"><SlideContent slide={slide} /></div>
          </div>
          <div className="flex items-center justify-between mt-5 px-2">
            <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="text-sm text-white/30 hover:text-white/70 disabled:opacity-10 disabled:cursor-not-allowed transition-colors px-3 py-1">{"\u2190"} Prev</button>
            <div className="flex gap-1.5">
              {upgradeSlides.map((s, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? `${accentColors[s.accent].dot} w-5` : "bg-white/15 hover:bg-white/30 w-1.5"}`} />
              ))}
            </div>
            <button onClick={() => setCurrent(Math.min(total - 1, current + 1))} disabled={current === total - 1} className="text-sm text-white/30 hover:text-white/70 disabled:opacity-10 disabled:cursor-not-allowed transition-colors px-3 py-1">Next {"\u2192"}</button>
          </div>
          <div className="text-center mt-3"><button className="text-xs text-white/20 hover:text-white/50 transition-colors">I know what's new {"\u2192"} skip</button></div>
        </div>
      </div>
    </div>
  );
}
