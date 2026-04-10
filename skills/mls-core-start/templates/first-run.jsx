import { useState, useEffect, useRef } from "react";

// ── JS animation loop ──
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

// ── Background components ──
function Stars() {
  const t = useAnimationLoop();
  const starsRef = useRef(Array.from({ length: 35 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100, size: 1 + Math.random() * 2,
    speed: 0.3 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2, isGreen: Math.random() > 0.5,
  })));
  return <>{starsRef.current.map((s, i) => {
    const op = 0.1 + 0.35 * (Math.sin(t * s.speed + s.offset) * 0.5 + 0.5);
    return <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}px`, height: `${s.size}px`, borderRadius: "50%", opacity: op, background: s.isGreen ? "#34d399" : "#c8d2ff", boxShadow: s.isGreen ? `0 0 4px rgba(52,211,153,0.4)` : `0 0 3px rgba(200,210,255,0.3)` }} />;
  })}</>;
}

function Orbits({ t }) {
  const orbs = [
    { r: 220, spd: 0.015, sz: 5, c: "rgba(52,211,153,0.3)" },
    { r: 180, spd: -0.01, sz: 3, c: "rgba(129,140,248,0.25)" },
    { r: 260, spd: 0.008, sz: 4, c: "rgba(52,211,153,0.2)" },
  ];
  return <>{orbs.map((o, i) => {
    const a = t * o.spd * Math.PI * 2 + i * 2.1;
    return <div key={i} style={{ position: "absolute", left: `calc(50% + ${Math.cos(a) * o.r}px)`, top: `calc(47% + ${Math.sin(a) * o.r}px)`, width: `${o.sz}px`, height: `${o.sz}px`, borderRadius: "50%", background: o.c, boxShadow: `0 0 8px ${o.c}` }} />;
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

// ── Shared UI ──
function GlowText({ children, t, style = {} }) {
  const glow = 10 + 10 * (Math.sin(t * 0.7) * 0.5 + 0.5);
  return <span style={{ ...style, textShadow: `0 0 ${glow}px rgba(52,211,153,0.5)` }}>{children}</span>;
}

function PulsingDot({ t }) {
  const s = 1 + 0.2 * (Math.sin(t * 1.2) * 0.5 + 0.5);
  return <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", transform: `scale(${s})`, boxShadow: `0 0 ${8 + 8 * (Math.sin(t * 1.2) * 0.5 + 0.5)}px rgba(52,211,153,0.6)` }} />;
}

function FloatingNode({ children, index, visible, highlight, t }) {
  const floatY = visible ? Math.sin(t * (0.6 + index * 0.1) + index * 1.5) * 6 : 0;
  const glowI = highlight ? (0.05 + 0.06 * (Math.sin(t * 0.8) * 0.5 + 0.5)) : 0.01;
  const borderOp = highlight ? (0.25 + 0.15 * (Math.sin(t * 0.8) * 0.5 + 0.5)) : 0.06;
  return (
    <div style={{ width: "100%", opacity: visible ? 1 : 0, transform: visible ? `scale(1) translateY(${floatY}px)` : "scale(0.8) translateY(12px)", transition: visible ? "opacity 0.7s ease, transform 0.05s linear" : "opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
      <div style={{ border: `1px solid rgba(${highlight ? "52,211,153" : "255,255,255"},${borderOp})`, borderRadius: "18px", padding: "24px 36px", background: highlight ? `rgba(52,211,153,${glowI * 0.8})` : "rgba(255,255,255,0.012)", textAlign: "center", width: "100%", boxShadow: highlight ? `0 0 ${30 + 15 * Math.sin(t * 0.8)}px rgba(52,211,153,${glowI})` : "none", backdropFilter: "blur(16px)" }}>
        {children}
      </div>
    </div>
  );
}

function ConnectorLine({ visible, t, index }) {
  const op = visible ? 0.4 + 0.35 * (Math.sin(t * 0.7 + index) * 0.5 + 0.5) : 0;
  return <div style={{ height: "44px", display: "flex", alignItems: "center" }}><div style={{ width: "2px", height: "44px", background: visible ? "linear-gradient(to bottom, rgba(52,211,153,0.5), rgba(52,211,153,0.1))" : "transparent", opacity: op }} /></div>;
}

// ── DATA (Claude fills these) ──
const DATA = {
  folderName: "__FOLDER_NAME__",
  folderPath: "__FOLDER_PATH__",
  isEmptyFolder: false,
};

// ── Boot + Folder confirm (auto-transitions after 3s) ──
function BootAndFolderConfirm({ t }) {
  const [phase, setPhase] = useState(0);
  const [stage, setStage] = useState("boot");
  const [folderShow, setFolderShow] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1100),
      setTimeout(() => setPhase(4), 1600),
      setTimeout(() => setPhase(5), 2100),
      setTimeout(() => setStage("folder"), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (stage === "folder") setTimeout(() => setFolderShow(true), 100);
  }, [stage]);

  const nodes = [
    { label: "You", icon: "\u{1F464}", highlight: false },
    { label: "MLS Core", icon: "\u{1F9E0}", highlight: true },
    { label: "Cloud Sync", icon: "\u2601\uFE0F", highlight: false },
    { label: "Project Memory", icon: "\u{1F4C1}", highlight: false },
    { label: "Agent Network", icon: "\u{1F916}", highlight: false },
  ];

  const ctaGlow = 0.05 + 0.06 * (Math.sin(t * 0.8) * 0.5 + 0.5);
  const ctaBorder = 0.25 + 0.15 * (Math.sin(t * 0.8) * 0.5 + 0.5);

  return (
    <>
      {/* BOOT STAGE */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px", opacity: stage === "boot" ? 1 : 0, transform: stage === "boot" ? "scale(1)" : "scale(0.95)", transition: "opacity 0.8s ease, transform 0.8s ease", pointerEvents: stage === "boot" ? "auto" : "none" }}>
        <div style={{ marginBottom: "48px", opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.7s ease" }}>
          <GlowText t={t} style={{ fontSize: "14px", letterSpacing: "0.3em", fontFamily: "monospace", color: "#34d399", fontWeight: 500 }}>INITIALIZING</GlowText>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "420px" }}>
          {nodes.map((node, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <FloatingNode index={i} visible={phase >= i + 1} highlight={node.highlight} t={t}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
                  <span style={{ fontSize: "32px" }}>{node.icon}</span>
                  <span style={{ fontSize: "22px", fontWeight: 600, color: node.highlight ? "#34d399" : "rgba(255,255,255,0.85)" }}>{node.label}</span>
                </div>
              </FloatingNode>
              {i < nodes.length - 1 && <ConnectorLine visible={phase > i + 1} t={t} index={i} />}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "48px", opacity: phase >= 5 ? 1 : 0, transition: "opacity 0.7s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {phase >= 5 && <PulsingDot t={t} />}
            <GlowText t={t} style={{ fontSize: "14px", letterSpacing: "0.15em", fontFamily: "monospace", color: "#34d399" }}>Connection established</GlowText>
          </div>
        </div>
      </div>

      {/* FOLDER CONFIRM STAGE */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px", opacity: stage === "folder" ? 1 : 0, transform: stage === "folder" ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s", pointerEvents: stage === "folder" ? "auto" : "none" }}>
        <div style={{ width: "100%", maxWidth: "440px", opacity: folderShow ? 1 : 0, transform: folderShow ? "translateY(0)" : "translateY(16px)", transition: "all 0.7s ease" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>{"\u{1F4C1}"}</div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white", margin: "0 0 8px 0" }}>This Folder is Your Brain</h1>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>MLS Core lives inside your project folder</p>
          </div>

          <div style={{ border: "1px solid rgba(52,211,153,0.15)", borderRadius: "16px", padding: "20px", background: "rgba(52,211,153,0.03)", backdropFilter: "blur(16px)", marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#34d399", marginBottom: "12px" }}>YOUR WORKSPACE</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px" }}>{"\u{1F4C2}"}</span>
              <div>
                <div style={{ fontSize: "16px", fontFamily: "monospace", color: "white", fontWeight: 600 }}>{DATA.folderName}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginTop: "4px", wordBreak: "break-all" }}>{DATA.folderPath}</div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                This folder will represent <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>one project</span> in MLS Core. Everything you work on here builds shared memory that carries forward between sessions.
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid rgba(52,211,153,0.15)", borderRadius: "16px", padding: "16px", background: "rgba(52,211,153,0.03)", backdropFilter: "blur(16px)", marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#34d399", marginBottom: "10px" }}>WHAT GETS CREATED</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>
              A hidden <span style={{ color: "#34d399", fontFamily: "monospace" }}>.mls/</span> directory with:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px" }}>
              {["CONTEXT.md", "TASKS.md", "CHANGELOG.md", "GOALS.md", "PREFERENCES.md", "FEEDBACK.md", "CORRECTIONS.md"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0" }}>
                  <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(52,211,153,0.6)", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: `2px solid rgba(52,211,153,${ctaBorder})`, borderRadius: "20px", padding: "24px 24px 20px", textAlign: "center", background: `rgba(52,211,153,${ctaGlow * 0.6})`, boxShadow: `0 0 ${30 + 15 * Math.sin(t * 0.8)}px rgba(52,211,153,${ctaGlow})` }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#34d399", marginBottom: "8px" }}>Is this the right folder?</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>This will become your project's persistent memory</div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "20px" }}>
              <div style={{ border: "1px solid rgba(52,211,153,0.3)", borderRadius: "12px", padding: "10px 28px", background: "rgba(52,211,153,0.08)" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#34d399" }}>Yes</span>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "10px 28px", background: "rgba(255,255,255,0.02)" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>No</span>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(52,211,153,0.2)", paddingTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid rgba(52,211,153,${0.4 + 0.3 * (Math.sin(t * 1.5) * 0.5 + 0.5)})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "10px", color: "#34d399", fontWeight: 700 }}>{"\u2191"}</span>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "0.05em", color: `rgba(52,211,153,${0.6 + 0.4 * (Math.sin(t * 1.5) * 0.5 + 0.5)})` }}>Reply in chat</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Setup Options ──
function SetupOptions({ t, isEmptyFolder }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 300); }, []);
  const recommended = isEmptyFolder ? 1 : 0;
  const options = [
    { icon: "\u{1F50D}", name: "Seed from files", desc: "Scan this folder and auto-build context from existing files", tag: !isEmptyFolder ? "Recommended" : null },
    { icon: "\u{1F4AC}", name: "Guided setup", desc: "Answer 5-6 questions to populate your project context", tag: isEmptyFolder ? "Recommended" : null },
    { icon: "\u26A1", name: "Skip \u2014 build organically", desc: "Set up the structure now, build context as you work", tag: null },
  ];

  const pulseScale = 0.05 + 0.06 * (Math.sin(t * 0.8) * 0.5 + 0.5);
  const borderGlowOpacity = 0.25 + 0.15 * (Math.sin(t * 0.8) * 0.5 + 0.5);

  return (
    <div style={{ position: "relative", zIndex: 10, padding: "48px 20px", opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(16px)", transition: "all 0.7s ease" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>{"\u{1F6E0}\uFE0F"}</div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white", margin: "0 0 8px 0" }}>How Should We Start?</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>Choose how to build your initial project context</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {options.map((opt, i) => (
          <div key={i} style={{ border: i === recommended ? "1px solid rgba(52,211,153,0.35)" : "1px solid rgba(52,211,153,0.12)", borderRadius: "16px", padding: "16px", background: "rgba(52,211,153,0.03)", backdropFilter: "blur(16px)", opacity: show ? 1 : 0, transform: show ? "translateX(0)" : "translateX(-8px)", transition: "all 0.5s ease", transitionDelay: `${i * 150}ms` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>{opt.name}</span>
                  {opt.tag && <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "4px", padding: "2px 6px" }}>{opt.tag}</span>}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{opt.desc}</div>
              </div>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "14px", fontFamily: "monospace" }}>{i + 1}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "20px", border: `2px solid rgba(52,211,153,${borderGlowOpacity})`, borderRadius: "16px", padding: "16px 20px", background: "rgba(52,211,153,0.03)", textAlign: "center", boxShadow: `0 0 ${20 + 20 * pulseScale}px rgba(52,211,153,${0.08 * pulseScale})` }}>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "#34d399", marginBottom: "4px" }}>Reply with 1, 2, or 3</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{"\u2191"} Type your choice in the chat</div>
      </div>
    </div>
  );
}

// ── Capabilities ── (V3: added web dashboard + updated count)
function Capabilities({ t }) {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => { const interval = setInterval(() => setRevealed(p => p < 7 ? p + 1 : p), 250); return () => clearInterval(interval); }, []);
  const commands = [
    { cmd: "/mls-core-start", desc: "Begin a session", icon: "\u{1F680}" },
    { cmd: "/mls-core-stop", desc: "End & save", icon: "\u{1F4DD}" },
    { cmd: "/mls-push", desc: "Sync to cloud", icon: "\u2601\uFE0F" },
    { cmd: "/mls-pull", desc: "Pull from cloud", icon: "\u{1F4E5}" },
    { cmd: "/mls-test", desc: "Health check", icon: "\u{1FA7A}" },
    { cmd: "/mls-agents", desc: "Agent marketplace", icon: "\u{1F916}" },
    { cmd: "memorylayer.com", desc: "Web dashboard", icon: "\u{1F310}" },
  ];
  return (
    <div style={{ position: "relative", zIndex: 10, padding: "48px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>{"\u26A1"}</div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white", margin: "0 0 8px 0" }}>Your Toolkit</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>6 commands + web dashboard</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {commands.map((cmd, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", border: "1px solid rgba(52,211,153,0.12)", borderRadius: "14px", padding: "12px 16px", background: "rgba(52,211,153,0.03)", backdropFilter: "blur(16px)", opacity: i < revealed ? 1 : 0, transform: i < revealed ? "translateX(0)" : "translateX(-12px)", transition: "all 0.5s ease" }}>
            <span style={{ fontSize: "16px" }}>{cmd.icon}</span>
            <code style={{ fontSize: "12px", fontWeight: 700, color: "#34d399", flexShrink: 0 }}>{cmd.cmd}</code>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>{cmd.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Animated checkmark ──
function AnimCheck({ visible, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (visible) { const timeout = setTimeout(() => setShow(true), delay); return () => clearTimeout(timeout); }
  }, [visible, delay]);
  return (
    <span style={{ display: "inline-flex", opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(0.5)", transition: "all 0.5s ease" }}>
      <span style={{ color: "#34d399", fontWeight: 700 }}>{"\u2713"}</span>
    </span>
  );
}

// ── Setup Complete ── (V3: added cloud sync + Supabase check)
function SetupComplete({ t, projectName, notionConnected, communityBrainConnected, supabaseConnected }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1400),
      setTimeout(() => setStep(4), 1900),
      setTimeout(() => setStep(5), 2400),
      setTimeout(() => setStep(6), 3100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const checks = [
    { label: "Project memory initialized", always: true },
    { label: "7 context files created", always: true },
    { label: "Cloud sync activated", always: supabaseConnected },
    { label: "Notion dashboard created", always: notionConnected },
    { label: "Community Brain connected", always: communityBrainConnected },
    { label: "Session 1 is live", always: true },
  ].filter(c => c.always);

  const pulseScale = 0.05 + 0.06 * (Math.sin(t * 0.8) * 0.5 + 0.5);
  const borderGlowOpacity = 0.25 + 0.15 * (Math.sin(t * 0.8) * 0.5 + 0.5);

  return (
    <div style={{ position: "relative", zIndex: 10, padding: "48px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>{"\u{1F407}"}</div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "white", margin: "0 0 8px 0" }}>{projectName || "Your Project"}</h1>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>Setup complete</p>
      </div>
      <div style={{ border: "1px solid rgba(52,211,153,0.2)", borderRadius: "16px", padding: "20px", background: "rgba(52,211,153,0.03)", backdropFilter: "blur(16px)", marginBottom: "20px" }}>
        {checks.map((check, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", opacity: step > i ? 1 : 0, transition: "all 0.5s ease" }}>
            <AnimCheck visible={step > i} delay={200} />
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>{check.label}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", opacity: step >= checks.length ? 1 : 0, transform: step >= checks.length ? "translateY(0)" : "translateY(16px)", transition: "all 0.7s ease" }}>
        <div style={{ display: "inline-block", border: `2px solid rgba(52,211,153,${borderGlowOpacity})`, borderRadius: "18px", padding: "12px 32px", background: "rgba(52,211,153,0.05)", boxShadow: `0 0 ${20 + 20 * pulseScale}px rgba(52,211,153,${0.08 * pulseScale})` }}>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#34d399" }}>Start working {"\u203A"}</span>
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)", marginTop: "12px", margin: "12px 0 0 0" }}>Say "end session" when you're done</p>
      </div>
    </div>
  );
}

// ── Connect Options ── (shown first, replaces boot_folder confirm)
function ConnectOptions({ t }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 200); }, []);

  const pulseGlow = 0.05 + 0.06 * (Math.sin(t * 0.8) * 0.5 + 0.5);
  const borderGlowOpacity = 0.25 + 0.15 * (Math.sin(t * 0.8) * 0.5 + 0.5);

  const options = [
    {
      num: "1", icon: "\u{1F310}", name: "memorylayer.pro", tag: "Cloud",
      tagColor: "#34d399", highlight: true,
      url: "https://memorylayer.pro",
      signupUrl: "https://memorylayer.pro/signup",
      desc: "Cloud sync, team sharing, session analytics. Get your API key at memorylayer.pro \u2192 Settings \u2192 API Key.",
      noAccountHint: "No account? Create one free at memorylayer.pro/signup",
    },
    {
      num: "2", icon: "\u{1F4D3}", name: "Notion", tag: "Sync",
      tagColor: "#818cf8", highlight: false,
      desc: "Syncs to your Notion workspace. Context lives as a structured, searchable page.",
    },
    {
      num: "3", icon: "\u{1F4BE}", name: "Local only", tag: "Private",
      tagColor: "rgba(255,255,255,0.35)", highlight: false,
      desc: "Memory stays on this machine. Fast, private, no account needed. Connect later with /mls-connect.",
    },
  ];

  return (
    <div style={{ position: "relative", zIndex: 10, padding: "36px 20px", opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(16px)", transition: "all 0.6s ease" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "36px", marginBottom: "10px" }}>{"\u{1F517}"}</div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "white", margin: "0 0 6px 0" }}>Where Should Your Memory Live?</h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: "0 0 4px 0" }}>First-time setup for <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{DATA.folderName}</span></p>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: 0 }}>Other open folders are available as context</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
        {options.map((opt, i) => (
          <div key={i} style={{
            border: opt.highlight ? "1px solid rgba(52,211,153,0.35)" : "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px", padding: "14px 18px",
            background: opt.highlight ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.02)",
            backdropFilter: "blur(16px)",
            opacity: show ? 1 : 0, transform: show ? "translateX(0)" : "translateX(-8px)",
            transition: "all 0.5s ease", transitionDelay: `${i * 100}ms`,
            boxShadow: opt.highlight ? "0 0 20px rgba(52,211,153,0.06)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0, border: `1px solid ${opt.highlight ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.08)"}`, background: opt.highlight ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px" }}>{opt.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: opt.highlight ? "#34d399" : "rgba(255,255,255,0.85)" }}>{opt.name}</span>
                  <span style={{ fontSize: "10px", fontFamily: "monospace", color: opt.tagColor, border: `1px solid ${opt.tagColor}`, borderRadius: "4px", padding: "1px 5px", opacity: 0.8 }}>{opt.tag}</span>
                  {opt.url && <span style={{ fontSize: "11px", color: "rgba(52,211,153,0.6)", fontFamily: "monospace" }}>{opt.url}</span>}
                </div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.38)", margin: "0 0 4px 0", lineHeight: 1.5 }}>{opt.desc}</p>
                {opt.noAccountHint && <p style={{ fontSize: "11px", color: "rgba(52,211,153,0.5)", margin: 0, fontStyle: "italic" }}>{opt.noAccountHint}</p>}
              </div>
              <span style={{ fontSize: "15px", fontFamily: "monospace", color: "rgba(255,255,255,0.18)", flexShrink: 0, paddingTop: "4px" }}>{opt.num}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ border: `2px solid rgba(52,211,153,${borderGlowOpacity})`, borderRadius: "14px", padding: "14px 18px", background: `rgba(52,211,153,${pulseGlow * 0.6})`, textAlign: "center", boxShadow: `0 0 ${18 + 14 * Math.sin(t * 0.8)}px rgba(52,211,153,${pulseGlow})` }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#34d399", marginBottom: "3px" }}>Reply with 1, 2, or 3</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)", fontFamily: "monospace" }}>{"\u2191"} Type your choice in the chat</div>
      </div>
    </div>
  );
}

const PHASE = "__PHASE__"; // "connect" | "setup" | "capabilities" | "complete"
const SETUP_DATA = {
  projectName: "__PROJECT_NAME__",
  notionConnected: false,
  communityBrainConnected: false,
  supabaseConnected: false,
};

export default function MLSBootFirstRun() {
  const t = useAnimationLoop();
  return (
    <div style={{ background: "#040810", minHeight: "100vh", width: "100%", position: "relative", overflow: "hidden" }}>
      <LivingBackground />
      {PHASE === "connect" && <ConnectOptions t={t} />}
      {PHASE === "setup" && <SetupOptions t={t} isEmptyFolder={DATA.isEmptyFolder} />}
      {PHASE === "capabilities" && <Capabilities t={t} />}
      {PHASE === "complete" && <SetupComplete t={t} projectName={SETUP_DATA.projectName} notionConnected={SETUP_DATA.notionConnected} communityBrainConnected={SETUP_DATA.communityBrainConnected} supabaseConnected={SETUP_DATA.supabaseConnected} />}
    </div>
  );
}
