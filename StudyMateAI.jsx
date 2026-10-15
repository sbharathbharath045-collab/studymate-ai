import { useState, useEffect, useRef, useCallback } from "react";

const PALETTE = {
  bg: "#050816", surface: "rgba(255,255,255,0.04)", surfaceHover: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.08)", accent: "#7C3AED", accentSoft: "#A78BFA",
  accentGlow: "rgba(124,58,237,0.25)", teal: "#0EA5E9", tealGlow: "rgba(14,165,233,0.2)",
  text: "#F8FAFC", muted: "#94A3B8", success: "#10B981",
};

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "History", "English"];
const LANGS = ["English", "Tamil", "Hindi", "Telugu", "Kannada", "Malayalam", "French", "Spanish"];

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "⊹", section: null },
  { id: "notes", label: "Smart Notes", icon: "◈", section: "Learn" },
  { id: "voice", label: "Voice Notes", icon: "◉", section: "Learn", badge: "NEW" },
  { id: "tutor", label: "AI Tutor", icon: "◎", section: "Learn" },
  { id: "quiz", label: "Quiz Generator", icon: "◇", section: "Practice" },
  { id: "adaptive", label: "Adaptive Quiz", icon: "◆", section: "Practice", badge: "NEW" },
  { id: "flashcards", label: "Flashcards", icon: "▣", section: "Practice" },
  { id: "pdf", label: "PDF Notes", icon: "⬡", section: "Tools", badge: "NEW" },
  { id: "exam", label: "Exam Predictor", icon: "◍", section: "Tools", badge: "NEW" },
  { id: "translate", label: "Multi-Language", icon: "◌", section: "Tools", badge: "NEW" },
  { id: "planner", label: "Study Planner", icon: "◑", section: "Plan" },
  { id: "progress", label: "Progress", icon: "◐", section: "Plan" },
];

// ── API helper ───────────────────────────────────────────────────
async function claudeAPI(system, userMsg, maxTokens = 1000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

async function claudeChat(system, messages, maxTokens = 1000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

// ── Particle Canvas ──────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
    const pts = Array.from({ length: 120 }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.6 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.alpha})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ── Sidebar ──────────────────────────────────────────────────────
function Sidebar({ active, setActive }) {
  const sections = ["Learn", "Practice", "Tools", "Plan"];
  return (
    <div style={{
      width: 220, minHeight: "100vh", background: "rgba(5,8,22,0.9)",
      backdropFilter: "blur(20px)", borderRight: `1px solid ${PALETTE.border}`,
      display: "flex", flexDirection: "column", padding: "24px 0", zIndex: 10,
      position: "fixed", left: 0, top: 0, overflowY: "auto",
    }}>
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.teal})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: `0 0 20px ${PALETTE.accentGlow}`,
          }}>◈</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: PALETTE.text }}>StudyMate</div>
            <div style={{ fontSize: 11, color: PALETTE.muted }}>AI Learning</div>
          </div>
        </div>
      </div>

      <NavBtn item={NAV_ITEMS[0]} active={active} setActive={setActive} />

      {sections.map(sec => (
        <div key={sec} style={{ padding: "4px 12px 4px" }}>
          <div style={{ fontSize: 10, color: PALETTE.muted, letterSpacing: 2, padding: "8px 8px 4px", textTransform: "uppercase" }}>{sec}</div>
          {NAV_ITEMS.filter(i => i.section === sec).map(item => (
            <NavBtn key={item.id} item={item} active={active} setActive={setActive} />
          ))}
        </div>
      ))}

      <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${PALETTE.border}` }}>
        <div style={{ fontSize: 11, color: PALETTE.success, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: PALETTE.success, display: "inline-block" }} />
          Claude AI connected
        </div>
      </div>
    </div>
  );
}

function NavBtn({ item, active, setActive }) {
  const isActive = active === item.id;
  return (
    <button onClick={() => setActive(item.id)} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
      background: isActive ? `linear-gradient(90deg, ${PALETTE.accentGlow}, transparent)` : "transparent",
      color: isActive ? PALETTE.accentSoft : PALETTE.muted,
      fontSize: 13, fontWeight: isActive ? 600 : 400,
      borderLeft: isActive ? `2px solid ${PALETTE.accent}` : "2px solid transparent",
      transition: "all 0.2s", textAlign: "left",
    }}>
      <span style={{ fontSize: 13 }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span style={{
          fontSize: 9, padding: "2px 5px", borderRadius: 4,
          background: `${PALETTE.accent}44`, color: PALETTE.accentSoft,
          fontWeight: 700, letterSpacing: 0.5,
        }}>{item.badge}</span>
      )}
    </button>
  );
}

function Card({ children, style = {}, glow }) {
  return (
    <div style={{
      background: PALETTE.surface, border: `1px solid ${PALETTE.border}`,
      borderRadius: 16, backdropFilter: "blur(12px)",
      boxShadow: glow ? `0 0 40px ${PALETTE.accentGlow}` : "none", ...style,
    }}>{children}</div>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%", margin: "0 auto 12px",
        border: `3px solid rgba(124,58,237,0.2)`, borderTop: `3px solid ${PALETTE.accent}`,
        animation: "spin 1s linear infinite",
      }} />
      <div style={{ color: PALETTE.muted, fontSize: 13 }}>AI is thinking...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function renderMd(text) {
  return text
    .replace(/^### (.+)/gm, `<h3 style="color:#A78BFA;font-size:14px;margin:14px 0 6px">$1</h3>`)
    .replace(/^## (.+)/gm, `<h2 style="color:#F8FAFC;font-size:16px;margin:18px 0 8px">$1</h2>`)
    .replace(/^# (.+)/gm, `<h1 style="color:#F8FAFC;font-size:18px;margin:20px 0 10px">$1</h1>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:#F8FAFC">$1</strong>`)
    .replace(/^[-*] (.+)/gm, `<li style="color:#94A3B8;margin:3px 0;line-height:1.6">$1</li>`)
    .replace(/^(\d+)\. (.+)/gm, `<li style="color:#94A3B8;margin:3px 0">$2</li>`)
    .replace(/→/g, `<span style="color:#7C3AED">→</span>`)
    .replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>");
}

// ══════════════════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════════════════
function HomePage({ setActive }) {
  const features = [
    { id: "notes", icon: "◈", title: "Smart Notes", desc: "Paste content → AI summaries, bullets, concept maps", color: PALETTE.accent },
    { id: "voice", icon: "◉", title: "Voice Notes", desc: "Speak your lecture → AI transcribes & structures", color: PALETTE.teal, badge: "NEW" },
    { id: "tutor", icon: "◎", title: "AI Tutor", desc: "Chat with Claude AI for personalized explanations", color: "#F59E0B" },
    { id: "adaptive", icon: "◆", title: "Adaptive Quiz", desc: "Quiz difficulty adjusts based on your performance", color: "#EC4899", badge: "NEW" },
    { id: "pdf", icon: "⬡", title: "PDF Notes", desc: "Upload any PDF → AI extracts key notes instantly", color: PALETTE.success, badge: "NEW" },
    { id: "exam", icon: "◍", title: "Exam Predictor", desc: "AI predicts likely exam questions from your topics", color: "#F97316", badge: "NEW" },
    { id: "translate", icon: "◌", title: "Multi-Language", desc: "Study content in Tamil, Hindi, Telugu & 5 more langs", color: "#8B5CF6", badge: "NEW" },
    { id: "flashcards", icon: "▣", title: "Flashcards", desc: "AI spaced-repetition cards for long-term retention", color: PALETTE.teal },
  ];
  return (
    <div>
      <div style={{ textAlign: "center", padding: "48px 0 40px" }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20,
          background: PALETTE.accentGlow, border: `1px solid ${PALETTE.accent}`,
          color: PALETTE.accentSoft, fontSize: 12, marginBottom: 20, letterSpacing: 1,
        }}>Powered by Claude AI · 5 New Vision Features Added</div>
        <h1 style={{
          fontSize: 50, fontWeight: 800, lineHeight: 1.1, margin: "0 0 16px",
          background: `linear-gradient(135deg, ${PALETTE.text} 0%, ${PALETTE.accentSoft} 60%, ${PALETTE.teal} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Study Smarter,<br />Not Harder</h1>
        <p style={{ color: PALETTE.muted, fontSize: 16, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>
          Voice-to-notes, PDF upload, adaptive quizzes, exam prediction, and multi-language support — all AI-powered.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => setActive("voice")} style={{
            padding: "12px 24px", borderRadius: 10, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.teal})`,
            color: "#fff", fontWeight: 600, fontSize: 14, boxShadow: `0 0 24px ${PALETTE.accentGlow}`,
          }}>◉ Try Voice Notes →</button>
          <button onClick={() => setActive("exam")} style={{
            padding: "12px 24px", borderRadius: 10, cursor: "pointer",
            background: "transparent", border: `1px solid ${PALETTE.border}`,
            color: PALETTE.text, fontWeight: 500, fontSize: 14,
          }}>◍ Exam Predictor</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {features.map(f => (
          <Card key={f.id} style={{ padding: 20, cursor: "pointer", transition: "all 0.2s", position: "relative" }}
            onClick={() => setActive(f.id)}>
            {f.badge && (
              <span style={{
                position: "absolute", top: 12, right: 12, fontSize: 9,
                padding: "2px 6px", borderRadius: 4,
                background: `${PALETTE.accent}44`, color: PALETTE.accentSoft, fontWeight: 700,
              }}>{f.badge}</span>
            )}
            <div style={{
              width: 38, height: 38, borderRadius: 10, marginBottom: 12,
              background: `${f.color}22`, border: `1px solid ${f.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: f.color,
            }}>{f.icon}</div>
            <div style={{ color: PALETTE.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{f.title}</div>
            <div style={{ color: PALETTE.muted, fontSize: 12, lineHeight: 1.5 }}>{f.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SMART NOTES
// ══════════════════════════════════════════════════════════
function SmartNotesPage() {
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [mode, setMode] = useState("summary");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modeMap = {
    summary: "Generate a structured summary with key concepts, main ideas, and important points.",
    bullets: "Convert the content into clear, concise bullet points organized by topic.",
    concept: "Create a concept map outline showing how key ideas connect. Use → arrows to show relationships.",
  };
  const generate = async () => {
    if (!content.trim()) { setError("Paste some content first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const text = await claudeAPI(
        `You are StudyMate AI. Subject: ${subject}. ${modeMap[mode]} Be clear, structured, student-friendly. Use markdown.`,
        `Process this study material:\n\n${content}`
      );
      setResult(text);
    } catch { setError("AI generation failed."); }
    setLoading(false);
  };
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: PALETTE.text, fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>Smart Notes</h1>
        <p style={{ color: PALETTE.muted, fontSize: 14 }}>Paste any content — textbook, lecture, article — get AI-structured notes.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${PALETTE.border}`, color: PALETTE.text, borderRadius: 8, padding: "8px 10px", fontSize: 13 }}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[["summary","◈ Summary"],["bullets","≡ Bullets"],["concept","⌖ Concept Map"]].map(([id,label]) => (
              <button key={id} onClick={() => setMode(id)} style={{
                padding: "7px 12px", borderRadius: 8, border: `1px solid ${mode===id?PALETTE.accent:PALETTE.border}`,
                background: mode===id?PALETTE.accentGlow:"transparent",
                color: mode===id?PALETTE.accentSoft:PALETTE.muted, fontSize: 12, cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Paste textbook chapter, lecture notes, or any content here..."
            style={{ width:"100%", minHeight:260, background:"rgba(255,255,255,0.02)", border:`1px solid ${PALETTE.border}`, borderRadius:10, color:PALETTE.text, fontSize:13, padding:14, resize:"vertical", outline:"none", lineHeight:1.6, boxSizing:"border-box", fontFamily:"system-ui" }} />
          {error && <div style={{ color:"#F87171", fontSize:13, marginTop:8 }}>{error}</div>}
          <button onClick={generate} disabled={loading} style={{
            width:"100%", marginTop:14, padding:"12px", border:"none", borderRadius:10, color:"#fff", fontWeight:600, fontSize:14, cursor:loading?"not-allowed":"pointer",
            background: loading?"rgba(124,58,237,0.3)":`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`,
          }}>{loading?"◌ Generating...":"◈ Generate Notes"}</button>
        </Card>
        <Card style={{ padding:24, minHeight:380 }} glow={!!result}>
          {!result && !loading && <div style={{ textAlign:"center", paddingTop:80, color:PALETTE.muted }}><div style={{ fontSize:48, opacity:0.2, marginBottom:12 }}>◈</div>Your notes appear here</div>}
          {loading && <Spinner />}
          {result && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <span style={{ color:PALETTE.accentSoft, fontSize:12, fontWeight:600 }}>✦ {subject}</span>
                <button onClick={() => navigator.clipboard.writeText(result)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${PALETTE.border}`, background:"transparent", color:PALETTE.muted, fontSize:11, cursor:"pointer" }}>Copy</button>
              </div>
              <div style={{ color:PALETTE.muted, fontSize:13, lineHeight:1.7 }} dangerouslySetInnerHTML={{ __html: renderMd(result) }} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// VOICE NOTES (NEW)
// ══════════════════════════════════════════════════════════
function VoiceNotesPage() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("Mathematics");
  const [mode, setMode] = useState("summary");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setSupported(false);
    }
  }, []);

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    let finalText = transcript;
    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setTranscript(finalText + interim);
    };
    recognition.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const generateNotes = async () => {
    if (!transcript.trim()) return;
    setLoading(true); setNotes(null);
    try {
      const modeMap = {
        summary: "Create a structured summary with headings and key points.",
        bullets: "Convert into organized bullet points by topic.",
        concept: "Create a concept map showing how ideas connect using → arrows.",
      };
      const text = await claudeAPI(
        `You are StudyMate AI. The user has spoken a lecture or study session aloud. Subject: ${subject}. ${modeMap[mode]} Clean up filler words, organize clearly, use markdown formatting.`,
        `Spoken lecture transcript:\n\n${transcript}`
      );
      setNotes(text);
    } catch { setNotes("Failed to process. Try again."); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: PALETTE.text, fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>Voice Notes</h1>
        <p style={{ color: PALETTE.muted, fontSize: 14 }}>Speak your lecture aloud — AI transcribes and structures your notes automatically.</p>
      </div>
      {!supported ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◉</div>
          <div style={{ color: PALETTE.text, fontWeight: 600, marginBottom: 8 }}>Browser Not Supported</div>
          <div style={{ color: PALETTE.muted, fontSize: 13 }}>Voice recognition requires Chrome or Edge. Please open this in Chrome.</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <Card style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <select value={subject} onChange={e => setSubject(e.target.value)} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, color:PALETTE.text, borderRadius:8, padding:"8px 10px", fontSize:13 }}>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                {[["summary","Summary"],["bullets","Bullets"],["concept","Concept Map"]].map(([id,label]) => (
                  <button key={id} onClick={() => setMode(id)} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${mode===id?PALETTE.accent:PALETTE.border}`, background:mode===id?PALETTE.accentGlow:"transparent", color:mode===id?PALETTE.accentSoft:PALETTE.muted, fontSize:12, cursor:"pointer" }}>{label}</button>
                ))}
              </div>

              {/* Record button */}
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <button onClick={recording ? stopRecording : startRecording} style={{
                  width: 90, height: 90, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: recording ? "#EF4444" : `linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`,
                  color: "#fff", fontSize: 28, transition: "all 0.2s",
                  boxShadow: recording ? "0 0 30px rgba(239,68,68,0.5)" : `0 0 30px ${PALETTE.accentGlow}`,
                  animation: recording ? "pulse 1.5s ease-in-out infinite" : "none",
                }}>{recording ? "◼" : "◉"}</button>
                <div style={{ color: recording ? "#EF4444" : PALETTE.muted, fontSize: 13, marginTop: 12 }}>
                  {recording ? "● Recording... click to stop" : "Click to start recording"}
                </div>
                <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}`}</style>
              </div>

              <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
                placeholder="Transcript appears here as you speak... or type/paste spoken notes manually."
                style={{ width:"100%", minHeight:160, background:"rgba(255,255,255,0.02)", border:`1px solid ${PALETTE.border}`, borderRadius:10, color:PALETTE.text, fontSize:13, padding:14, resize:"vertical", outline:"none", lineHeight:1.6, boxSizing:"border-box", fontFamily:"system-ui" }} />

              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <button onClick={generateNotes} disabled={loading || !transcript.trim()} style={{
                  flex:1, padding:"11px", border:"none", borderRadius:10, color:"#fff", fontWeight:600, fontSize:14, cursor:"pointer",
                  background:loading?"rgba(124,58,237,0.3)":`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`,
                }}>{loading?"◌ Processing...":"◈ Generate Notes"}</button>
                <button onClick={() => { setTranscript(""); setNotes(null); }} style={{ padding:"11px 16px", borderRadius:10, border:`1px solid ${PALETTE.border}`, background:"transparent", color:PALETTE.muted, cursor:"pointer", fontSize:13 }}>Clear</button>
              </div>
            </Card>
          </div>

          <Card style={{ padding:24, minHeight:360 }} glow={!!notes}>
            {!notes && !loading && <div style={{ textAlign:"center", paddingTop:80, color:PALETTE.muted }}><div style={{ fontSize:48, opacity:0.2, marginBottom:12 }}>◉</div>Structured notes appear here after processing</div>}
            {loading && <Spinner />}
            {notes && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                  <span style={{ color:PALETTE.accentSoft, fontSize:12, fontWeight:600 }}>✦ Voice Notes · {subject}</span>
                  <button onClick={() => navigator.clipboard.writeText(notes)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${PALETTE.border}`, background:"transparent", color:PALETTE.muted, fontSize:11, cursor:"pointer" }}>Copy</button>
                </div>
                <div style={{ color:PALETTE.muted, fontSize:13, lineHeight:1.7 }} dangerouslySetInnerHTML={{ __html: renderMd(notes) }} />
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PDF NOTES (NEW)
// ══════════════════════════════════════════════════════════
function PDFNotesPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [subject, setSubject] = useState("Mathematics");
  const [mode, setMode] = useState("summary");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const extractText = async (f) => {
    setExtracting(true); setError("");
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(f);
      });
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
              { type: "text", text: "Extract all the main text content from this PDF. Return the raw text content clearly." }
            ]
          }]
        }),
      });
      const data = await res.json();
      const extracted = data.content?.map(b => b.text || "").join("") || "";
      setText(extracted);
    } catch { setError("Failed to extract PDF text. Make sure it's a text-based PDF."); }
    setExtracting(false);
  };

  const handleFile = async (f) => {
    if (!f || f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    setFile(f); setNotes(null); setText("");
    await extractText(f);
  };

  const generateNotes = async () => {
    if (!text.trim()) return;
    setLoading(true); setNotes(null);
    const modeMap = {
      summary: "Generate a comprehensive structured summary with headings and key concepts.",
      bullets: "Convert all key points into organized bullet points by section.",
      concept: "Create a concept map outline with → arrows showing relationships between ideas.",
    };
    try {
      const result = await claudeAPI(
        `You are StudyMate AI. Subject: ${subject}. ${modeMap[mode]} Be thorough and student-friendly. Use markdown.`,
        `PDF content to process:\n\n${text.slice(0, 3000)}`
      );
      setNotes(result);
    } catch { setNotes("Generation failed. Try again."); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: PALETTE.text, fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>PDF Notes</h1>
        <p style={{ color: PALETTE.muted, fontSize: 14 }}>Upload any PDF — textbook, research paper, slides — get AI-generated notes instantly.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          {/* Drop zone */}
          <Card style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              style={{
                padding: 32, textAlign: "center", cursor: "pointer",
                border: `2px dashed ${file ? PALETTE.accent : PALETTE.border}`,
                borderRadius: 16, transition: "all 0.2s",
                background: file ? PALETTE.accentGlow : "transparent",
              }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{extracting ? "◌" : "⬡"}</div>
              <div style={{ color: PALETTE.text, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                {extracting ? "Extracting text..." : file ? file.name : "Drop PDF here or click to upload"}
              </div>
              <div style={{ color: PALETTE.muted, fontSize: 12 }}>Supports text-based PDFs · Max ~10MB</div>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>
          </Card>

          {text && (
            <Card style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ color: PALETTE.accentSoft, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                ✦ Extracted {text.length} characters
              </div>
              <div style={{ color: PALETTE.muted, fontSize: 12, lineHeight: 1.5, maxHeight: 100, overflow: "hidden" }}>
                {text.slice(0, 200)}...
              </div>
            </Card>
          )}

          {error && <div style={{ color: "#F87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <Card style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, color:PALETTE.text, borderRadius:8, padding:"8px 10px", fontSize:13 }}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              {[["summary","Summary"],["bullets","Bullets"],["concept","Concept Map"]].map(([id,label]) => (
                <button key={id} onClick={() => setMode(id)} style={{ padding:"7px 12px", borderRadius:8, border:`1px solid ${mode===id?PALETTE.accent:PALETTE.border}`, background:mode===id?PALETTE.accentGlow:"transparent", color:mode===id?PALETTE.accentSoft:PALETTE.muted, fontSize:12, cursor:"pointer" }}>{label}</button>
              ))}
            </div>
            <button onClick={generateNotes} disabled={!text || loading} style={{
              width:"100%", padding:"12px", border:"none", borderRadius:10, color:"#fff", fontWeight:600, fontSize:14, cursor:(!text||loading)?"not-allowed":"pointer",
              background:(!text||loading)?"rgba(124,58,237,0.3)":`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`,
            }}>{loading?"◌ Generating...":"⬡ Generate PDF Notes"}</button>
          </Card>
        </div>

        <Card style={{ padding:24, minHeight:380 }} glow={!!notes}>
          {!notes && !loading && <div style={{ textAlign:"center", paddingTop:80, color:PALETTE.muted }}><div style={{ fontSize:48, opacity:0.2, marginBottom:12 }}>⬡</div>Upload a PDF to get started</div>}
          {loading && <Spinner />}
          {notes && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <span style={{ color:PALETTE.accentSoft, fontSize:12, fontWeight:600 }}>✦ PDF Notes · {subject}</span>
                <button onClick={() => navigator.clipboard.writeText(notes)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${PALETTE.border}`, background:"transparent", color:PALETTE.muted, fontSize:11, cursor:"pointer" }}>Copy</button>
              </div>
              <div style={{ color:PALETTE.muted, fontSize:13, lineHeight:1.7, maxHeight:500, overflowY:"auto" }} dangerouslySetInnerHTML={{ __html: renderMd(notes) }} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// AI TUTOR
// ══════════════════════════════════════════════════════════
function TutorPage() {
  const [messages, setMessages] = useState([
    { role:"assistant", content:"Hi! I'm your AI Tutor. Ask me anything — I'll explain clearly step by step. What are we studying today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("Mathematics");
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role:"user", content:input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(""); setLoading(true);
    try {
      const reply = await claudeChat(
        `You are StudyMate AI Tutor, friendly and patient, specializing in ${subject}. Explain clearly with examples. Break down complex topics step by step.`,
        newMsgs.map(m => ({ role:m.role, content:m.content }))
      );
      setMessages(prev => [...prev, { role:"assistant", content:reply }]);
    } catch { setMessages(prev => [...prev, { role:"assistant", content:"Connection error. Try again." }]); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h1 style={{ color:PALETTE.text, fontSize:28, fontWeight:700, margin:"0 0 4px" }}>AI Tutor</h1>
          <p style={{ color:PALETTE.muted, fontSize:14, margin:0 }}>Ask anything — personalized explanations in real time</p>
        </div>
        <select value={subject} onChange={e => setSubject(e.target.value)} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${PALETTE.border}`, color:PALETTE.text, borderRadius:8, padding:"8px 12px", fontSize:13 }}>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <Card style={{ height:440, display:"flex", flexDirection:"column" }}>
        <div style={{ flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:14 }}>
          {messages.map((m,i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
              <div style={{
                maxWidth:"75%", padding:"11px 15px", borderRadius:14, fontSize:14, lineHeight:1.6,
                background: m.role==="user"?`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`:"rgba(255,255,255,0.06)",
                color:PALETTE.text,
                borderBottomRightRadius: m.role==="user"?4:14, borderBottomLeftRadius: m.role==="assistant"?4:14,
              }}>{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ display:"flex" }}><div style={{ padding:"11px 15px", borderRadius:14, background:"rgba(255,255,255,0.06)", color:PALETTE.muted, fontSize:14 }}>◌ Thinking...</div></div>}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding:"14px 18px", borderTop:`1px solid ${PALETTE.border}`, display:"flex", gap:10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}
            placeholder="Ask a question..." style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, borderRadius:10, padding:"10px 14px", color:PALETTE.text, fontSize:14, outline:"none" }} />
          <button onClick={send} disabled={loading} style={{ padding:"10px 20px", background:`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`, border:"none", borderRadius:10, color:"#fff", fontWeight:600, cursor:"pointer" }}>Send</button>
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// QUIZ GENERATOR
// ══════════════════════════════════════════════════════════
function QuizPage() {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setQuestions(null); setAnswers({}); setSubmitted(false);
    try {
      const text = await claudeAPI(
        `You are StudyMate AI. Generate exactly 5 MCQs about the topic in ${subject}. Return ONLY a JSON array, no other text:\n[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A"}]`,
        `Generate 5 MCQs about: ${topic}`
      );
      setQuestions(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch { setQuestions([]); }
    setLoading(false);
  };

  const score = questions ? questions.filter((q,i) => answers[i]===q.answer).length : 0;

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:PALETTE.text, fontSize:28, fontWeight:700, margin:"0 0 4px" }}>Quiz Generator</h1>
        <p style={{ color:PALETTE.muted, fontSize:14 }}>Enter a topic → get 5 AI-generated MCQs instantly</p>
      </div>
      <Card style={{ padding:20, marginBottom:18 }}>
        <div style={{ display:"flex", gap:10 }}>
          <select value={subject} onChange={e => setSubject(e.target.value)} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, color:PALETTE.text, borderRadius:8, padding:"10px 10px", fontSize:13 }}>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key==="Enter" && generate()}
            placeholder="Topic (e.g. Quadratic Equations, Photosynthesis...)"
            style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, borderRadius:8, padding:"10px 14px", color:PALETTE.text, fontSize:14, outline:"none" }} />
          <button onClick={generate} disabled={loading} style={{ padding:"10px 22px", background:`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`, border:"none", borderRadius:8, color:"#fff", fontWeight:600, cursor:"pointer" }}>{loading?"◌":"Generate"}</button>
        </div>
      </Card>
      {questions && questions.length > 0 && (
        <div>
          {questions.map((q,i) => (
            <Card key={i} style={{ padding:20, marginBottom:14 }}>
              <div style={{ color:PALETTE.text, fontWeight:600, marginBottom:12, fontSize:14 }}><span style={{ color:PALETTE.accentSoft }}>Q{i+1}. </span>{q.question}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {q.options.map((opt,j) => {
                  const letter = ["A","B","C","D"][j];
                  const selected = answers[i]===letter;
                  const correct = submitted && letter===q.answer;
                  const wrong = submitted && selected && letter!==q.answer;
                  return (
                    <button key={j} onClick={() => !submitted && setAnswers(p => ({...p,[i]:letter}))} style={{
                      padding:"10px 14px", borderRadius:8, textAlign:"left", fontSize:13, cursor:submitted?"default":"pointer",
                      border:`1px solid ${correct?PALETTE.success:wrong?"#F87171":selected?PALETTE.accent:PALETTE.border}`,
                      background: correct?`${PALETTE.success}22`:wrong?"rgba(248,113,113,0.15)":selected?PALETTE.accentGlow:"transparent",
                      color:PALETTE.text,
                    }}>{opt}</button>
                  );
                })}
              </div>
            </Card>
          ))}
          {!submitted ? (
            <button onClick={() => setSubmitted(true)} style={{ padding:"12px 32px", background:`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`, border:"none", borderRadius:10, color:"#fff", fontWeight:600, cursor:"pointer" }}>Submit Quiz</button>
          ) : (
            <Card style={{ padding:24, textAlign:"center" }} glow>
              <div style={{ fontSize:36, fontWeight:800, color:score>=4?PALETTE.success:score>=2?"#F59E0B":"#F87171" }}>{score}/5</div>
              <div style={{ color:PALETTE.text, marginTop:8, fontWeight:600 }}>{score===5?"Perfect! 🎉":score>=4?"Great job!":score>=2?"Keep practicing!":"Review this topic"}</div>
              <button onClick={() => { setQuestions(null); setTopic(""); }} style={{ marginTop:14, padding:"10px 24px", borderRadius:8, border:`1px solid ${PALETTE.border}`, background:"transparent", color:PALETTE.muted, cursor:"pointer" }}>Try Another Topic</button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ADAPTIVE QUIZ (NEW)
// ══════════════════════════════════════════════════════════
function AdaptiveQuizPage() {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [difficulty, setDifficulty] = useState("Medium");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [history, setHistory] = useState([]);
  const [done, setDone] = useState(false);

  const fetchQuestion = async (diff, hist) => {
    setLoading(true); setQuestion(null); setSelected(null); setFeedback(null);
    const histStr = hist.length ? `\nPrevious: ${hist.map(h => `${h.q} [${h.correct?"✓":"✗"}]`).join(", ")}` : "";
    try {
      const text = await claudeAPI(
        `You are StudyMate Adaptive Quiz AI. Generate ONE ${diff} difficulty MCQ on ${subject} - topic: ${topic}. Avoid repeating previous questions. Return ONLY JSON:\n{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A","explanation":"..."}`,
        `Generate a ${diff} difficulty question.${histStr}`
      );
      setQuestion(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch { setQuestion(null); }
    setLoading(false);
  };

  const start = async () => {
    if (!topic.trim()) return;
    setStarted(true); setDifficulty("Medium"); setScore({ correct:0, total:0 }); setHistory([]); setDone(false);
    await fetchQuestion("Medium", []);
  };

  const answer = (letter) => {
    if (selected || !question) return;
    setSelected(letter);
    const correct = letter === question.answer;
    setFeedback({ correct, explanation: question.explanation });
    setScore(s => ({ correct: s.correct + (correct?1:0), total: s.total+1 }));
    const newHist = [...history, { q: question.question.slice(0,40), correct }];
    setHistory(newHist);
    // Adaptive difficulty
    const recent = newHist.slice(-3);
    const recentCorrect = recent.filter(h => h.correct).length;
    if (recentCorrect === 3) setDifficulty("Hard");
    else if (recentCorrect === 0) setDifficulty("Easy");
    else setDifficulty("Medium");
  };

  const next = async () => {
    if (score.total >= 9) { setDone(true); return; }
    await fetchQuestion(difficulty, history);
  };

  const diffColors = { Easy: PALETTE.success, Medium: "#F59E0B", Hard: "#EF4444" };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:PALETTE.text, fontSize:28, fontWeight:700, margin:"0 0 4px" }}>Adaptive Quiz</h1>
        <p style={{ color:PALETTE.muted, fontSize:14 }}>Difficulty adjusts automatically based on your performance — Easy → Medium → Hard.</p>
      </div>

      {!started ? (
        <Card style={{ padding:32, maxWidth:500 }}>
          <div style={{ color:PALETTE.text, fontWeight:600, marginBottom:20, fontSize:16 }}>Start your adaptive session</div>
          <select value={subject} onChange={e => setSubject(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, color:PALETTE.text, borderRadius:8, padding:"10px", fontSize:14, marginBottom:12 }}>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <input value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="Enter topic (e.g. Derivatives, Cell Division...)"
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, borderRadius:8, padding:"10px 14px", color:PALETTE.text, fontSize:14, outline:"none", marginBottom:20, boxSizing:"border-box" }} />
          <div style={{ background:"rgba(124,58,237,0.1)", border:`1px solid ${PALETTE.accent}44`, borderRadius:10, padding:14, marginBottom:20, fontSize:13, color:PALETTE.muted, lineHeight:1.6 }}>
            ◆ Starts at Medium difficulty<br/>
            ◆ Gets Harder when you score 3 in a row<br/>
            ◆ Gets Easier when you miss 3 in a row<br/>
            ◆ 10 questions with explanations
          </div>
          <button onClick={start} style={{ width:"100%", padding:"13px", background:`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`, border:"none", borderRadius:10, color:"#fff", fontWeight:600, fontSize:15, cursor:"pointer" }}>Start Adaptive Quiz</button>
        </Card>
      ) : done ? (
        <Card style={{ padding:40, textAlign:"center", maxWidth:500 }} glow>
          <div style={{ fontSize:48, fontWeight:800, color:score.correct>=8?PALETTE.success:score.correct>=5?"#F59E0B":"#EF4444", marginBottom:8 }}>{score.correct}/{score.total}</div>
          <div style={{ color:PALETTE.text, fontSize:18, fontWeight:600, marginBottom:16 }}>
            {score.correct>=8?"Outstanding! 🎉":score.correct>=6?"Well done!":score.correct>=4?"Good effort!":"Keep practicing!"}
          </div>
          <div style={{ color:PALETTE.muted, fontSize:13, marginBottom:24 }}>Final difficulty reached: <span style={{ color:diffColors[difficulty], fontWeight:600 }}>{difficulty}</span></div>
          <button onClick={() => { setStarted(false); setTopic(""); }} style={{ padding:"11px 28px", background:`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`, border:"none", borderRadius:10, color:"#fff", fontWeight:600, cursor:"pointer" }}>Try Another Topic</button>
        </Card>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20 }}>
          <div>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ color:PALETTE.muted, fontSize:13 }}>Q {score.total+1}/10</span>
                <span style={{ padding:"4px 10px", borderRadius:6, fontSize:12, fontWeight:700, background:`${diffColors[difficulty]}22`, color:diffColors[difficulty] }}>{difficulty}</span>
              </div>
              <span style={{ color:PALETTE.accentSoft, fontSize:13, fontWeight:600 }}>Score: {score.correct}/{score.total}</span>
            </div>

            <Card style={{ padding:24 }}>
              {loading ? <Spinner /> : question ? (
                <>
                  <div style={{ color:PALETTE.text, fontWeight:600, fontSize:15, marginBottom:20, lineHeight:1.5 }}>{question.question}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                    {question.options.map((opt,j) => {
                      const letter = ["A","B","C","D"][j];
                      const isSelected = selected===letter;
                      const isCorrect = selected && letter===question.answer;
                      const isWrong = selected && isSelected && !isCorrect;
                      return (
                        <button key={j} onClick={() => answer(letter)} style={{
                          padding:"12px 16px", borderRadius:10, textAlign:"left", fontSize:13, cursor:selected?"default":"pointer",
                          border:`1px solid ${isCorrect?PALETTE.success:isWrong?"#EF4444":isSelected?PALETTE.accent:PALETTE.border}`,
                          background: isCorrect?`${PALETTE.success}22`:isWrong?"rgba(239,68,68,0.15)":isSelected?PALETTE.accentGlow:"rgba(255,255,255,0.02)",
                          color:PALETTE.text, transition:"all 0.2s",
                        }}>{opt}</button>
                      );
                    })}
                  </div>
                  {feedback && (
                    <div style={{ padding:16, borderRadius:10, background:feedback.correct?`${PALETTE.success}15`:"rgba(239,68,68,0.1)", border:`1px solid ${feedback.correct?PALETTE.success+"44":"rgba(239,68,68,0.3)"}`, marginBottom:16 }}>
                      <div style={{ color:feedback.correct?PALETTE.success:"#EF4444", fontWeight:600, marginBottom:6, fontSize:14 }}>
                        {feedback.correct?"✓ Correct!":"✗ Incorrect"}
                      </div>
                      <div style={{ color:PALETTE.muted, fontSize:13, lineHeight:1.5 }}>{feedback.explanation}</div>
                    </div>
                  )}
                  {selected && (
                    <button onClick={next} style={{ padding:"11px 28px", background:`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`, border:"none", borderRadius:10, color:"#fff", fontWeight:600, cursor:"pointer", fontSize:14 }}>
                      {score.total >= 9 ? "See Results" : `Next Question (${difficulty})`} →
                    </button>
                  )}
                </>
              ) : <div style={{ color:PALETTE.muted, textAlign:"center", padding:"40px 0" }}>Failed to load question. <button onClick={() => fetchQuestion(difficulty,history)} style={{ color:PALETTE.accentSoft, background:"none", border:"none", cursor:"pointer" }}>Retry</button></div>}
            </Card>
          </div>

          {/* Progress sidebar */}
          <div>
            <Card style={{ padding:20 }}>
              <div style={{ color:PALETTE.text, fontWeight:600, marginBottom:16, fontSize:14 }}>Session Progress</div>
              {["Easy","Medium","Hard"].map(d => (
                <div key={d} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ color:diffColors[d], fontSize:12, fontWeight:600 }}>{d}</span>
                    <span style={{ color:PALETTE.muted, fontSize:12 }}>{history.filter((_,i) => {
                      const h = history.slice(0,i+1);
                      const r = h.slice(-3);
                      const rc = r.filter(x=>x.correct).length;
                      const eff = rc===3?"Hard":rc===0?"Easy":"Medium";
                      return eff===d;
                    }).length}</span>
                  </div>
                  <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.06)" }}>
                    <div style={{ height:"100%", borderRadius:2, background:diffColors[d], width:`${(history.filter(h=>h.correct).length/Math.max(score.total,1))*100}%`, transition:"width 0.5s" }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${PALETTE.border}` }}>
                {history.slice(-5).reverse().map((h,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ color:h.correct?PALETTE.success:"#EF4444", fontSize:12 }}>{h.correct?"✓":"✗"}</span>
                    <span style={{ color:PALETTE.muted, fontSize:11 }}>{h.q}...</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// FLASHCARDS
// ══════════════════════════════════════════════════════════
function FlashcardsPage() {
  const [topic, setTopic] = useState(""); const [cards, setCards] = useState(null);
  const [index, setIndex] = useState(0); const [flipped, setFlipped] = useState(false); const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setCards(null); setIndex(0); setFlipped(false);
    try {
      const text = await claudeAPI(
        `Generate exactly 6 flashcards. Return ONLY JSON array:\n[{"front":"Question or term","back":"Answer or definition"}]`,
        `Create 6 flashcards about: ${topic}`
      );
      setCards(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch { setCards([]); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}><h1 style={{ color:PALETTE.text, fontSize:28, fontWeight:700, margin:"0 0 4px" }}>Flashcards</h1><p style={{ color:PALETTE.muted, fontSize:14 }}>AI spaced-repetition cards for fast revision</p></div>
      <Card style={{ padding:20, marginBottom:24 }}>
        <div style={{ display:"flex", gap:12 }}>
          <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key==="Enter" && generate()} placeholder="Enter any topic..." style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, borderRadius:8, padding:"10px 14px", color:PALETTE.text, fontSize:14, outline:"none" }} />
          <button onClick={generate} disabled={loading} style={{ padding:"10px 24px", background:`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`, border:"none", borderRadius:8, color:"#fff", fontWeight:600, cursor:"pointer" }}>{loading?"◌":"Generate"}</button>
        </div>
      </Card>
      {cards && cards.length > 0 && (
        <div>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
            <div onClick={() => setFlipped(!flipped)} style={{
              width:460, height:240, borderRadius:20, cursor:"pointer",
              background:flipped?`linear-gradient(135deg,${PALETTE.accent}33,${PALETTE.teal}22)`:"rgba(255,255,255,0.06)",
              border:`1px solid ${flipped?PALETTE.accent:PALETTE.border}`,
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              padding:28, textAlign:"center", transition:"all 0.3s",
              boxShadow:flipped?`0 0 40px ${PALETTE.accentGlow}`:"none",
            }}>
              <div style={{ fontSize:11, color:flipped?PALETTE.accentSoft:PALETTE.muted, marginBottom:14, letterSpacing:2, textTransform:"uppercase" }}>{flipped?"Answer":"Question"} · {index+1}/{cards.length}</div>
              <div style={{ color:PALETTE.text, fontSize:17, fontWeight:600, lineHeight:1.5 }}>{flipped?cards[index].back:cards[index].front}</div>
              <div style={{ color:PALETTE.muted, fontSize:12, marginTop:18 }}>{flipped?"Click to see question":"Click to reveal answer"}</div>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:20 }}>
            <button onClick={() => { setIndex(Math.max(0,index-1)); setFlipped(false); }} style={{ padding:"10px 22px", borderRadius:8, border:`1px solid ${PALETTE.border}`, background:"transparent", color:PALETTE.muted, cursor:"pointer" }}>← Prev</button>
            <button onClick={() => { setIndex(Math.min(cards.length-1,index+1)); setFlipped(false); }} style={{ padding:"10px 22px", borderRadius:8, background:`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`, border:"none", color:"#fff", fontWeight:600, cursor:"pointer" }}>Next →</button>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
            {cards.map((_,i) => <button key={i} onClick={() => { setIndex(i); setFlipped(false); }} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${i===index?PALETTE.accent:PALETTE.border}`, background:i===index?PALETTE.accentGlow:"transparent", color:i===index?PALETTE.accentSoft:PALETTE.muted, fontSize:12, cursor:"pointer" }}>{i+1}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// EXAM PREDICTOR (NEW)
// ══════════════════════════════════════════════════════════
function ExamPredictorPage() {
  const [subject, setSubject] = useState("Mathematics");
  const [topics, setTopics] = useState("");
  const [examType, setExamType] = useState("University Final Exam");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const examTypes = ["University Final Exam", "Semester Mid-Term", "Board Exam", "Competitive Exam (JEE/NEET)", "Unit Test"];

  const predict = async () => {
    if (!topics.trim()) return;
    setLoading(true); setResult(null);
    try {
      const text = await claudeAPI(
        `You are StudyMate AI Exam Predictor. Based on the subject, topics covered, and exam type, predict the most likely exam questions. Format your response as:\n## High Probability Questions (must prepare)\n## Medium Probability Questions\n## Important Formulas/Concepts to Remember\n## Exam Tips\nBe specific and actionable. Use markdown.`,
        `Subject: ${subject}\nExam Type: ${examType}\nTopics Covered:\n${topics}\n\nPredict likely exam questions and preparation strategy.`
      );
      setResult(text);
    } catch { setResult("Prediction failed. Try again."); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:PALETTE.text, fontSize:28, fontWeight:700, margin:"0 0 4px" }}>Exam Predictor</h1>
        <p style={{ color:PALETTE.muted, fontSize:14 }}>Tell AI your topics and exam type — get predicted questions and prep strategy.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card style={{ padding:24 }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ color:PALETTE.muted, fontSize:12, display:"block", marginBottom:6 }}>Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, color:PALETTE.text, borderRadius:8, padding:"10px", fontSize:14 }}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ color:PALETTE.muted, fontSize:12, display:"block", marginBottom:6 }}>Exam Type</label>
            <select value={examType} onChange={e => setExamType(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, color:PALETTE.text, borderRadius:8, padding:"10px", fontSize:14 }}>
              {examTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ color:PALETTE.muted, fontSize:12, display:"block", marginBottom:6 }}>Topics You've Covered</label>
            <textarea value={topics} onChange={e => setTopics(e.target.value)}
              placeholder={`List the topics/chapters you've studied, e.g.:\n- Limits and Continuity\n- Derivatives and Applications\n- Integration Techniques\n- Differential Equations`}
              style={{ width:"100%", minHeight:200, background:"rgba(255,255,255,0.02)", border:`1px solid ${PALETTE.border}`, borderRadius:10, color:PALETTE.text, fontSize:13, padding:14, resize:"vertical", outline:"none", lineHeight:1.6, boxSizing:"border-box", fontFamily:"system-ui" }} />
          </div>
          <button onClick={predict} disabled={loading || !topics.trim()} style={{
            width:"100%", padding:"12px", border:"none", borderRadius:10, color:"#fff", fontWeight:600, fontSize:14, cursor:"pointer",
            background:loading?"rgba(124,58,237,0.3)":`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`,
          }}>{loading?"◌ Predicting...":"◍ Predict Exam Questions"}</button>
          <div style={{ marginTop:14, padding:12, borderRadius:10, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", color:"#F59E0B", fontSize:12, lineHeight:1.6 }}>
            ⚠ Predictions are AI estimates based on common exam patterns. Use alongside official syllabus.
          </div>
        </Card>
        <Card style={{ padding:24, minHeight:400 }} glow={!!result}>
          {!result && !loading && <div style={{ textAlign:"center", paddingTop:80, color:PALETTE.muted }}><div style={{ fontSize:48, opacity:0.2, marginBottom:12 }}>◍</div>Predicted questions and strategy appear here</div>}
          {loading && <Spinner />}
          {result && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <span style={{ color:"#F97316", fontSize:12, fontWeight:600 }}>✦ {examType} · {subject}</span>
                <button onClick={() => navigator.clipboard.writeText(result)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${PALETTE.border}`, background:"transparent", color:PALETTE.muted, fontSize:11, cursor:"pointer" }}>Copy</button>
              </div>
              <div style={{ color:PALETTE.muted, fontSize:13, lineHeight:1.7, maxHeight:520, overflowY:"auto" }} dangerouslySetInnerHTML={{ __html: renderMd(result) }} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MULTI-LANGUAGE (NEW)
// ══════════════════════════════════════════════════════════
function MultiLanguagePage() {
  const [content, setContent] = useState("");
  const [targetLang, setTargetLang] = useState("Tamil");
  const [subject, setSubject] = useState("Mathematics");
  const [mode, setMode] = useState("translate");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const modes = [
    ["translate", "Translate Notes"],
    ["explain", "Explain in Language"],
    ["bilingual", "Bilingual Summary"],
  ];

  const process = async () => {
    if (!content.trim()) return;
    setLoading(true); setResult(null);
    const systemMap = {
      translate: `You are StudyMate AI. Translate the given study content from English to ${targetLang}. Keep technical terms accurate. Maintain the structure and formatting. The subject is ${subject}.`,
      explain: `You are StudyMate AI. Explain the given study content in ${targetLang} language. Make it easy to understand for a student. The subject is ${subject}. Use simple language in ${targetLang}.`,
      bilingual: `You are StudyMate AI. Create a bilingual summary of the content. For each key point, show: English version, then ${targetLang} version below it. Subject: ${subject}. Format clearly with markdown.`,
    };
    try {
      const text = await claudeAPI(systemMap[mode], `Content:\n\n${content}`);
      setResult(text);
    } catch { setResult("Translation failed. Try again."); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:PALETTE.text, fontSize:28, fontWeight:700, margin:"0 0 4px" }}>Multi-Language Support</h1>
        <p style={{ color:PALETTE.muted, fontSize:14 }}>Study in your native language — translate, explain, or get bilingual summaries.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card style={{ padding:24 }}>
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, color:PALETTE.text, borderRadius:8, padding:"8px 10px", fontSize:13 }}>
              {LANGS.filter(l => l !== "English").map(l => <option key={l}>{l}</option>)}
            </select>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${PALETTE.border}`, color:PALETTE.text, borderRadius:8, padding:"8px 10px", fontSize:13 }}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {modes.map(([id,label]) => (
              <button key={id} onClick={() => setMode(id)} style={{ padding:"7px 10px", borderRadius:8, border:`1px solid ${mode===id?PALETTE.accent:PALETTE.border}`, background:mode===id?PALETTE.accentGlow:"transparent", color:mode===id?PALETTE.accentSoft:PALETTE.muted, fontSize:11, cursor:"pointer" }}>{label}</button>
            ))}
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Paste English study content here — notes, textbook paragraph, explanation..."
            style={{ width:"100%", minHeight:260, background:"rgba(255,255,255,0.02)", border:`1px solid ${PALETTE.border}`, borderRadius:10, color:PALETTE.text, fontSize:13, padding:14, resize:"vertical", outline:"none", lineHeight:1.6, boxSizing:"border-box", fontFamily:"system-ui" }} />
          <button onClick={process} disabled={loading||!content.trim()} style={{
            width:"100%", marginTop:14, padding:"12px", border:"none", borderRadius:10, color:"#fff", fontWeight:600, fontSize:14, cursor:"pointer",
            background:loading?"rgba(124,58,237,0.3)":`linear-gradient(135deg,${PALETTE.accent},${PALETTE.teal})`,
          }}>{loading?`◌ Processing in ${targetLang}...`:`◌ ${modes.find(m=>m[0]===mode)[1]} → ${targetLang}`}</button>
        </Card>
        <Card style={{ padding:24, minHeight:380 }} glow={!!result}>
          {!result && !loading && (
            <div style={{ textAlign:"center", paddingTop:60, color:PALETTE.muted }}>
              <div style={{ fontSize:48, opacity:0.2, marginBottom:12 }}>◌</div>
              <div style={{ marginBottom:8 }}>Output in {targetLang} appears here</div>
              <div style={{ display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap", marginTop:20 }}>
                {LANGS.filter(l => l!=="English").map(l => (
                  <span key={l} onClick={() => setTargetLang(l)} style={{ padding:"4px 10px", borderRadius:6, background:targetLang===l?PALETTE.accentGlow:"rgba(255,255,255,0.04)", border:`1px solid ${targetLang===l?PALETTE.accent:PALETTE.border}`, color:targetLang===l?PALETTE.accentSoft:PALETTE.muted, fontSize:12, cursor:"pointer" }}>{l}</span>
                ))}
              </div>
            </div>
          )}
          {loading && <Spinner />}
          {result && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <span style={{ color:"#8B5CF6", fontSize:12, fontWeight:600 }}>✦ {modes.find(m=>m[0]===mode)[1]} → {targetLang}</span>
                <button onClick={() => navigator.clipboard.writeText(result)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${PALETTE.border}`, background:"transparent", color:PALETTE.muted, fontSize:11, cursor:"pointer" }}>Copy</button>
              </div>
              <div style={{ color:PALETTE.muted, fontSize:13, lineHeight:1.8, maxHeight:520, overflowY:"auto" }} dangerouslySetInnerHTML={{ __html: renderMd(result) }} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STUDY PLANNER
// ══════════════════════════════════════════════════════════
function PlannerPage() {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const slots = ["8AM","10AM","12PM","2PM","4PM","6PM","8PM"];
  const [plan, setPlan] = useState({});
  const colors = [PALETTE.accent, PALETTE.teal, "#F59E0B", "#EC4899", PALETTE.success];
  const subs = ["Math","Physics","Chemistry","CS","English"];
  const [selected, setSelected] = useState("Math");

  const toggle = (d,s) => {
    const key = `${d}-${s}`;
    setPlan(prev => {
      if (prev[key]===selected) { const n={...prev}; delete n[key]; return n; }
      return {...prev,[key]:selected};
    });
  };

  return (
    <div>
      <div style={{ marginBottom:20 }}><h1 style={{ color:PALETTE.text, fontSize:28, fontWeight:700, margin:"0 0 4px" }}>Study Planner</h1><p style={{ color:PALETTE.muted, fontSize:14 }}>Select a subject then click cells to build your weekly schedule</p></div>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {subs.map((s,i) => (
          <button key={s} onClick={() => setSelected(s)} style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${selected===s?colors[i]:PALETTE.border}`, background:selected===s?`${colors[i]}22`:"transparent", color:selected===s?colors[i]:PALETTE.muted, fontSize:13, cursor:"pointer", fontWeight:selected===s?600:400 }}>{s}</button>
        ))}
      </div>
      <Card style={{ padding:20, overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr><th style={{ color:PALETTE.muted, fontSize:12, padding:"8px 10px", width:55 }}></th>{days.map(d => <th key={d} style={{ color:PALETTE.text, fontSize:13, fontWeight:600, padding:"8px 10px", textAlign:"center" }}>{d}</th>)}</tr></thead>
          <tbody>{slots.map(slot => (
            <tr key={slot}><td style={{ color:PALETTE.muted, fontSize:12, padding:"5px 10px" }}>{slot}</td>
              {days.map(d => {
                const key = `${d}-${slot}`;
                const subj = plan[key];
                const ci = subs.indexOf(subj);
                return (
                  <td key={d} onClick={() => toggle(d,slot)} style={{ padding:3 }}>
                    <div style={{ height:38, borderRadius:7, cursor:"pointer", background:subj?`${colors[ci%colors.length]}33`:"rgba(255,255,255,0.02)", border:`1px solid ${subj?colors[ci%colors.length]:PALETTE.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:subj?colors[ci%colors.length]:PALETTE.border, fontWeight:600, transition:"all 0.2s" }}>{subj||"+"}</div>
                  </td>
                );
              })}
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PROGRESS
// ══════════════════════════════════════════════════════════
function ProgressPage() {
  const weeks = ["W1","W2","W3","W4","W5","W6","W7","W8"];
  const scores = [62,70,65,78,80,76,88,92];
  const topics = [
    { name:"Algebra", progress:85, color:PALETTE.accent },
    { name:"Calculus", progress:60, color:PALETTE.teal },
    { name:"Statistics", progress:72, color:"#F59E0B" },
    { name:"Geometry", progress:45, color:"#EC4899" },
    { name:"Trigonometry", progress:90, color:PALETTE.success },
  ];
  return (
    <div>
      <div style={{ marginBottom:24 }}><h1 style={{ color:PALETTE.text, fontSize:28, fontWeight:700, margin:"0 0 4px" }}>Progress</h1><p style={{ color:PALETTE.muted, fontSize:14 }}>Track your learning journey and topic mastery</p></div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <Card style={{ padding:24 }}>
          <div style={{ color:PALETTE.text, fontWeight:600, marginBottom:18 }}>Quiz Score Trend</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:110 }}>
            {scores.map((s,i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:"100%", borderRadius:"4px 4px 0 0", height:`${(s/100)*100}px`, background:`linear-gradient(to top,${PALETTE.accent},${PALETTE.teal})`, opacity:i===scores.length-1?1:0.6 }} />
                <div style={{ fontSize:10, color:PALETTE.muted }}>{weeks[i]}</div>
              </div>
            ))}
          </div>
          <div style={{ color:PALETTE.accentSoft, fontSize:13, marginTop:12, fontWeight:600 }}>Latest: 92% ↑ +4 from last week</div>
        </Card>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[{ label:"Study Streak",value:"14 days",icon:"◑",color:PALETTE.accent },{ label:"Notes Created",value:"47",icon:"◈",color:PALETTE.teal },{ label:"Quizzes Done",value:"23",icon:"◇",color:"#F59E0B" },{ label:"Hours Studied",value:"38h",icon:"◎",color:PALETTE.success }].map(s => (
            <Card key={s.label} style={{ padding:18 }}><div style={{ fontSize:18, color:s.color, marginBottom:6 }}>{s.icon}</div><div style={{ fontSize:22, fontWeight:800, color:PALETTE.text }}>{s.value}</div><div style={{ fontSize:11, color:PALETTE.muted }}>{s.label}</div></Card>
          ))}
        </div>
      </div>
      <Card style={{ padding:24 }}>
        <div style={{ color:PALETTE.text, fontWeight:600, marginBottom:18 }}>Topic Mastery</div>
        {topics.map(t => (
          <div key={t.name} style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}><span style={{ color:PALETTE.text, fontSize:13 }}>{t.name}</span><span style={{ color:t.color, fontSize:13, fontWeight:600 }}>{t.progress}%</span></div>
            <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.06)" }}><div style={{ height:"100%", borderRadius:3, width:`${t.progress}%`, background:`linear-gradient(90deg,${t.color},${t.color}88)`, transition:"width 1s ease" }} /></div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [active, setActive] = useState("home");
  const pages = {
    home: <HomePage setActive={setActive} />,
    notes: <SmartNotesPage />,
    voice: <VoiceNotesPage />,
    tutor: <TutorPage />,
    quiz: <QuizPage />,
    adaptive: <AdaptiveQuizPage />,
    flashcards: <FlashcardsPage />,
    pdf: <PDFNotesPage />,
    exam: <ExamPredictorPage />,
    translate: <MultiLanguagePage />,
    planner: <PlannerPage />,
    progress: <ProgressPage />,
  };
  return (
    <div style={{ minHeight:"100vh", background:PALETTE.bg, fontFamily:"system-ui,sans-serif", color:PALETTE.text }}>
      <ParticleCanvas />
      <Sidebar active={active} setActive={setActive} />
      <main style={{ marginLeft:220, minHeight:"100vh", padding:"28px 36px", position:"relative", zIndex:1 }}>
        <div style={{ maxWidth:1100 }}>
          {pages[active] || pages.home}
        </div>
      </main>
    </div>
  );
}
