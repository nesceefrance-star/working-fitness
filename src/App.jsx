import { useState, useEffect, useRef, useCallback } from "react";

// ─── PROGRAMME ────────────────────────────────────────────────────────────────
const PROGRAM = {
  lundi: {
    label: "LUNDI", focus: "PUSH", sub: "Pecs · Épaules · Triceps", color: "#FF6B35",
    warmup: ["5 min tapis / rameur", "Mobilité épaules"],
    exercises: [
      { id: "bench",    name: "Développé couché",          sets: 4, reps: "8-10",   rest: 90, type: "weight",     search: "bench press barbell" },
      { id: "incline",  name: "Développé incliné haltères",sets: 3, reps: "10",     rest: 75, type: "weight",     search: "incline dumbbell press" },
      { id: "pecdeck",  name: "Écartés poulie / pec deck", sets: 3, reps: "12-15",  rest: 60, type: "weight",     search: "cable fly chest" },
      { id: "ohpress",  name: "Développé militaire assis", sets: 4, reps: "8-10",   rest: 75, type: "weight",     search: "seated overhead press" },
      { id: "laterals", name: "Élévations latérales",      sets: 4, reps: "15",     rest: 45, type: "weight",     search: "lateral raise dumbbell" },
      { id: "tricord",  name: "Triceps corde poulie",      sets: 3, reps: "12-15",  rest: 45, type: "weight",     search: "tricep pushdown cable" },
      { id: "dips",     name: "Dips assistés / banc",      sets: 2, reps: "max",    rest: 60, type: "bodyweight", search: "dips tricep" },
    ],
    cardio: { desc: "Corde à sauter", duration: 12, detail: "45 sec actif / 15 sec pause" },
  },
  mardi: {
    label: "MARDI", focus: "JAMBES + ABDOS", sub: "Quadriceps · Ischio · Core", color: "#4ECDC4",
    warmup: ["8 min vélo"],
    exercises: [
      { id: "legpress", name: "Presse à cuisses",          sets: 4, reps: "12",      rest: 75, type: "weight",     search: "leg press machine" },
      { id: "rdl",      name: "Soulevé de terre roumain",  sets: 4, reps: "10",      rest: 90, type: "weight",     search: "romanian deadlift" },
      { id: "lunges",   name: "Fentes marchées",           sets: 3, reps: "12/jambe",rest: 60, type: "weight",     search: "walking lunges" },
      { id: "legcurl",  name: "Leg curl",                  sets: 3, reps: "12",      rest: 60, type: "weight",     search: "lying leg curl machine" },
      { id: "calves",   name: "Mollets debout",            sets: 4, reps: "20",      rest: 30, type: "weight",     search: "standing calf raise" },
      { id: "plank",    name: "Gainage planche",           sets: 3, reps: "45 sec",  rest: 45, type: "bodyweight", search: "plank core exercise" },
      { id: "legraise", name: "Relevés de jambes",         sets: 3, reps: "15",      rest: 45, type: "bodyweight", search: "hanging leg raise abs" },
      { id: "crunch",   name: "Crunch poulie",             sets: 3, reps: "20",      rest: 45, type: "weight",     search: "cable crunch abs" },
    ],
    cardio: { desc: "Tapis incliné", duration: 10, detail: "Marche rapide" },
  },
  mercredi: {
    label: "MERCREDI", focus: "PULL + BRAS", sub: "Dos · Biceps · Arrière épaules", color: "#A78BFA",
    warmup: ["10 min rameur"],
    exercises: [
      { id: "latpull",   name: "Tirage vertical large",     sets: 4, reps: "10", rest: 75, type: "weight", search: "lat pulldown wide grip" },
      { id: "rowing",    name: "Rowing barre / machine",    sets: 4, reps: "10", rest: 75, type: "weight", search: "barbell row bent over" },
      { id: "seatedrow", name: "Tirage horizontal serré",   sets: 3, reps: "12", rest: 60, type: "weight", search: "seated cable row" },
      { id: "facepull",  name: "Face pull poulie",          sets: 4, reps: "15", rest: 45, type: "weight", search: "face pull cable rear delt" },
      { id: "oiseau",    name: "Oiseau haltères / machine", sets: 3, reps: "15", rest: 45, type: "weight", search: "rear delt fly dumbbell" },
      { id: "curlbarre", name: "Curl barre EZ",             sets: 3, reps: "12", rest: 45, type: "weight", search: "EZ bar curl bicep" },
      { id: "curlinc",   name: "Curl incliné haltères",     sets: 3, reps: "12", rest: 45, type: "weight", search: "incline dumbbell curl" },
    ],
    cardio: { desc: "Elliptique", duration: 12, detail: "Allure soutenue" },
  },
  jeudi: {
    label: "JEUDI / VEN", focus: "FULL BODY", sub: "Circuit · Sèche", color: "#F59E0B",
    warmup: ["Mobilité générale 5 min"],
    isCircuit: true, rounds: 4,
    exercises: [
      { id: "goblet",    name: "Goblet squat",      sets: 4, reps: "15",       rest: 0, type: "weight",     search: "goblet squat dumbbell" },
      { id: "pushup",    name: "Pompes",             sets: 4, reps: "15",       rest: 0, type: "bodyweight", search: "push up chest" },
      { id: "rowdb",     name: "Rowing haltère",     sets: 4, reps: "12",       rest: 0, type: "weight",     search: "dumbbell row one arm" },
      { id: "fentesc",   name: "Fentes",             sets: 4, reps: "10/jambe", rest: 0, type: "weight",     search: "dumbbell lunge" },
      { id: "devep",     name: "Développé épaules",  sets: 4, reps: "12",       rest: 0, type: "weight",     search: "dumbbell shoulder press" },
      { id: "gainagefb", name: "Gainage",            sets: 4, reps: "40 sec",   rest: 0, type: "bodyweight", search: "plank core" },
    ],
    cardio: { desc: "Cardio au choix", duration: 12, detail: "Piscine 20 min OU Tapis 30s rapide / 1 min lent" },
  },
};

const DAYS = ["lundi", "mardi", "mercredi", "jeudi"];
const GK = "dc6zaTOxFJmzC";
const STORAGE_KEY = "wt_history_v2";

// ─── GIF ─────────────────────────────────────────────────────────────────────
function ExGif({ exercise }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const fetched = useRef(false);

  const doFetch = useCallback(async () => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GK}&q=${encodeURIComponent(exercise.search)}&limit=1&rating=g`);
      const d = await res.json();
      if (d.data?.[0]) setUrl(d.data[0].images.fixed_height.url);
    } catch {}
    setLoading(false);
  }, [exercise.search]);

  const toggle = () => { setOpen(v => !v); if (!fetched.current) doFetch(); };

  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={toggle} style={S.gifBtn}>{open ? "▲ Masquer" : "▶ Voir le mouvement"}</button>
      {open && (
        <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", background: "#111", minHeight: 50 }}>
          {loading && <p style={{ textAlign: "center", padding: 16, color: "#555", fontSize: 12 }}>Chargement…</p>}
          {url && !loading && <img src={url} alt={exercise.name} style={{ width: "100%", display: "block", maxHeight: 200, objectFit: "cover" }} />}
          {!url && !loading && <p style={{ textAlign: "center", padding: 12, color: "#444", fontSize: 11 }}>GIF non disponible</p>}
        </div>
      )}
    </div>
  );
}

// ─── TIMER ────────────────────────────────────────────────────────────────────
function RestTimer({ seconds: defaultSec }) {
  const [sec, setSec] = useState(defaultSec);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running && sec > 0) { ref.current = setInterval(() => setSec(s => s - 1), 1000); }
    else if (sec === 0 && running) { setRunning(false); setDone(true); }
    return () => clearInterval(ref.current);
  }, [running, sec]);

  const start = () => { clearInterval(ref.current); setSec(defaultSec); setDone(false); setRunning(true); };
  const stop  = () => { clearInterval(ref.current); setRunning(false); setSec(defaultSec); setDone(false); };

  const pct = (defaultSec - sec) / defaultSec;
  const r = 30, circ = 2 * Math.PI * r;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, paddingTop: 14, borderTop: "1px solid #1e1e1e" }}>
      <p style={{ fontSize: 12, color: "#555", flexShrink: 0 }}>⏸ Repos {defaultSec}s</p>
      <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
        <svg viewBox="0 0 64 64" width="64" height="64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#1e1e1e" strokeWidth="4" />
          <circle cx="32" cy="32" r={r} fill="none"
            stroke={done ? "#4ECDC4" : "#FF6B35"} strokeWidth="4"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fc)", fontSize: 14, fontWeight: 700, color: done ? "#4ECDC4" : "#fff" }}>
          {done ? "GO!" : `${sec}s`}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {!running && !done && <button onClick={start} style={S.timerBtn}>▶ Start</button>}
        {running  && <button onClick={stop}  style={{ ...S.timerBtn, background: "#1e1e1e", color: "#777" }}>✕ Stop</button>}
        {done     && <button onClick={start} style={S.timerBtn}>🔁 Relancer</button>}
      </div>
    </div>
  );
}

// ─── SET TRACKER ─────────────────────────────────────────────────────────────
function ExCard({ ex, idx, sets, open, onToggle, onSetChange }) {
  const done = sets.filter(s => s.done).length;
  const complete = done === ex.sets;

  const update = (i, patch) => onSetChange(sets.map((s, j) => j === i ? { ...s, ...patch } : s));

  return (
    <div style={{ background: "#111", border: `1px solid ${complete ? "#1e3d1e" : open ? "#2a2a2a" : "#181818"}`, borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
      {/* Header row */}
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          border: `1px solid ${complete ? "#3a7a3a" : "#252525"}`,
          background: complete ? "#0e2a0e" : "#151515",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--fc)", fontSize: 13, fontWeight: 700,
          color: complete ? "#5ab85a" : "#555"
        }}>{done}/{ex.sets}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{idx + 1}. {ex.name}</p>
          <p style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
            {ex.sets}×{ex.reps}{ex.rest > 0 ? ` · ${ex.rest}s repos` : ex.rest === 0 ? " · enchaîner" : ""}
          </p>
        </div>
        <span style={{ color: "#333", fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>▼</span>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #181818" }}>
          <ExGif exercise={ex} />

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr 48px", gap: 8, marginTop: 14, marginBottom: 6 }}>
            {["#", ex.type === "weight" ? "Charge" : "Type", "Reps", "✓"].map((h, i) => (
              <span key={i} style={{ fontSize: 10, color: "#333", fontWeight: 700, letterSpacing: 1, textAlign: "center" }}>{h}</span>
            ))}
          </div>

          {/* Set rows */}
          {sets.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr 48px", gap: 8, alignItems: "center", marginBottom: 8, opacity: s.done ? 0.4 : 1 }}>
              <span style={{ textAlign: "center", fontSize: 13, color: "#555", fontWeight: 600 }}>{i + 1}</span>
              {ex.type === "weight"
                ? <input inputMode="decimal" placeholder="kg" value={s.weight || ""} onChange={e => update(i, { weight: e.target.value })} style={S.inp} />
                : <span style={{ fontSize: 12, color: "#444", textAlign: "center" }}>Corps</span>}
              <input inputMode="decimal" placeholder={ex.reps} value={s.reps || ""} onChange={e => update(i, { reps: e.target.value })} style={S.inp} />
              <button onClick={() => update(i, { done: !s.done })}
                style={{ ...S.check, ...(s.done ? S.checkDone : {}) }}>
                {s.done ? "✓" : "○"}
              </button>
            </div>
          ))}

          {ex.rest > 0 && <RestTimer key={ex.id} seconds={ex.rest} />}
        </div>
      )}
    </div>
  );
}

// ─── HISTORY SHEET ────────────────────────────────────────────────────────────
function HistorySheet({ history, onClose, onDelete }) {
  const [confirmIdx, setConfirmIdx] = useState(null);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.sheet, maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p style={{ fontFamily: "var(--fc)", fontSize: 22, fontWeight: 700 }}>📊 Historique</p>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {history.length === 0 && (
          <p style={{ textAlign: "center", color: "#444", padding: "48px 0", fontSize: 14 }}>Aucune séance enregistrée.</p>
        )}

        {history.map((s, i) => (
          <div key={i} style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: 12, padding: "14px 16px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{s.dayLabel} — {s.focus}</p>
                <p style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{s.date}</p>
              </div>
              {/* Delete button */}
              {confirmIdx === i ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#888" }}>Supprimer ?</span>
                  <button onClick={() => { onDelete(i); setConfirmIdx(null); }}
                    style={{ background: "#3a0e0e", border: "1px solid #7a2a2a", borderRadius: 6, color: "#e05a5a", fontSize: 11, padding: "4px 9px", cursor: "pointer" }}>
                    Oui
                  </button>
                  <button onClick={() => setConfirmIdx(null)}
                    style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 6, color: "#666", fontSize: 11, padding: "4px 9px", cursor: "pointer" }}>
                    Non
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmIdx(i)}
                  style={{ background: "none", border: "none", color: "#444", fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>
                  🗑
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#777" }}>
              <span>⏱ {s.duration}</span>
              <span>🏋️ {s.totalWeight} kg</span>
              <span>✅ {s.setsCompleted} séries</span>
            </div>
            {s.notes && <p style={{ fontSize: 12, color: "#555", marginTop: 8, fontStyle: "italic" }}>📝 {s.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RECAP MODAL ─────────────────────────────────────────────────────────────
function Recap({ sessionData, dayKey, startTime, onSave, onClose }) {
  const [notes, setNotes] = useState("");
  const day = PROGRAM[dayKey];
  const dur = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  const mins = Math.floor(dur / 60), secs = dur % 60;

  let totalWeight = 0, setsCompleted = 0;
  day.exercises.forEach(ex => {
    (sessionData[ex.id] || []).forEach(s => {
      if (s.done) { setsCompleted++; if (s.weight) totalWeight += parseFloat(s.weight) * (parseInt(s.reps) || 1); }
    });
  });

  return (
    <div style={{ ...S.overlay, alignItems: "center" }}>
      <div style={{ background: "#101010", border: "1px solid #1e1e1e", borderRadius: 20, padding: "26px 20px", width: "100%", maxWidth: 400 }}>
        <p style={{ fontFamily: "var(--fc)", fontSize: 30, fontWeight: 900, marginBottom: 4 }}>🏁 Séance terminée !</p>
        <p style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>{day.label} — {day.focus} · {new Date().toLocaleDateString("fr-FR")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[{ v: `${mins}:${String(secs).padStart(2, "0")}`, l: "Durée" }, { v: Math.round(totalWeight), l: "kg soulevés" }, { v: setsCompleted, l: "Séries ✓" }].map((s, i) => (
            <div key={i} style={{ background: "#181818", borderRadius: 10, padding: "13px 6px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--fc)", fontSize: 26, fontWeight: 900, color: "#FF6B35" }}>{s.v}</p>
              <p style={{ fontSize: 10, color: "#444", marginTop: 3 }}>{s.l}</p>
            </div>
          ))}
        </div>
        <div style={{ background: "#081515", border: "1px solid #143030", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: "#4ECDC4" }}>
          🫀 {day.cardio.desc} · {day.cardio.duration} min · {day.cardio.detail}
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes, ressenti, charges max…"
          style={{ width: "100%", background: "#181818", border: "1px solid #252525", borderRadius: 10, color: "#f0f0f0", fontSize: 14, padding: 12, minHeight: 72, resize: "none", marginBottom: 14, fontFamily: "inherit", outline: "none", WebkitAppearance: "none" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onSave({ dayLabel: day.label, focus: day.focus, date: new Date().toLocaleDateString("fr-FR"), duration: `${mins}min ${secs}s`, totalWeight: Math.round(totalWeight), setsCompleted, notes })}
            style={{ flex: 1, padding: 15, background: "#FF6B35", border: "none", borderRadius: 10, color: "#fff", fontFamily: "var(--fc)", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
            💾 Enregistrer
          </button>
          <button onClick={onClose} style={{ padding: "15px 18px", background: "#181818", border: "1px solid #252525", borderRadius: 10, color: "#555", fontSize: 14, cursor: "pointer" }}>
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [currentDay, setCurrentDay] = useState(null);
  const [sessionData, setSessionData] = useState({});
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [activeEx, setActiveEx] = useState(null);
  const [showRecap, setShowRecap] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const timerRef = useRef(null);

  const saveHistory = (h) => {
    setHistory(h);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); } catch {}
  };

  useEffect(() => {
    if (started) { timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000); }
    return () => clearInterval(timerRef.current);
  }, [started, startTime]);

  const openDay = d => { setCurrentDay(d); setSessionData({}); setStarted(false); setStartTime(null); setElapsed(0); setActiveEx(null); setScreen("session"); };
  const getSets = ex => sessionData[ex.id] || Array.from({ length: ex.sets }, () => ({ done: false, weight: "", reps: "" }));
  const updateSets = (id, sets) => setSessionData(p => ({ ...p, [id]: sets }));
  const handleSaveSession = recap => { saveHistory([recap, ...history]); setShowRecap(false); setScreen("home"); setCurrentDay(null); };
  const handleDelete = idx => { const updated = history.filter((_, i) => i !== idx); saveHistory(updated); };

  const elStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  const day = currentDay ? PROGRAM[currentDay] : null;

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") return (
    <div style={S.app}>
      <GlobalStyles />
      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: "env(safe-area-inset-top, 44px) 20px 28px", textAlign: "center", background: "linear-gradient(180deg,#141414 0%,#080808 100%)", borderBottom: "1px solid #161616" }}>
          <div style={{ fontSize: 46, marginBottom: 10 }}>💪</div>
          <h1 style={{ fontFamily: "var(--fc)", fontSize: 30, fontWeight: 900, letterSpacing: 4, color: "#fff", lineHeight: 1.1 }}>
            PROGRAMME<br /><span style={{ color: "#FF6B35" }}>12 SEMAINES</span>
          </h1>
          <p style={{ color: "#555", fontSize: 12, marginTop: 8 }}>Objectif &lt;20% MG · 92 kg · 1m87</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "20px 14px 0" }}>
          {DAYS.map(d => {
            const info = PROGRAM[d];
            const last = history.find(h => h.dayLabel === info.label);
            return (
              <button key={d} onClick={() => openDay(d)}
                style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 14, padding: "18px 14px 14px", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3, position: "relative", overflow: "hidden", WebkitAppearance: "none" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: info.color }} />
                <span style={{ fontFamily: "var(--fc)", fontSize: 10, fontWeight: 700, letterSpacing: 2, color: info.color, marginTop: 4 }}>{info.label}</span>
                <span style={{ fontFamily: "var(--fc)", fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{info.focus}</span>
                <span style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{info.sub}</span>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid #1a1a1a", fontSize: 10, color: "#3a3a3a" }}>
                  <span>{info.exercises.length} exos</span>
                  {last && <span style={{ color: "#444", fontStyle: "italic" }}>{last.date}</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: "16px 14px 0" }}>
          <button onClick={() => setShowHistory(true)}
            style={{ width: "100%", padding: 14, background: "#111", border: "1px solid #1a1a1a", borderRadius: 10, color: "#666", fontSize: 13, cursor: "pointer", WebkitAppearance: "none" }}>
            📊 Historique ({history.length} séance{history.length !== 1 ? "s" : ""})
          </button>
          <div style={{ marginTop: 12, background: "#0c150e", border: "1px solid #1a3020", borderRadius: 10, padding: "12px 14px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#4a8", letterSpacing: 1, marginBottom: 4 }}>🎯 RAPPELS SÈCHE</p>
            <p style={{ fontSize: 11, color: "#3a6045", lineHeight: 1.6 }}>180g protéines · 3L eau · déficit modéré · limiter alcool</p>
          </div>
        </div>
      </div>

      {showHistory && <HistorySheet history={history} onClose={() => setShowHistory(false)} onDelete={handleDelete} />}
    </div>
  );

  // ── SESSION ───────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      <GlobalStyles />
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#0a0a0a", borderBottom: `2px solid ${day.color}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#666", fontSize: 13, cursor: "pointer", padding: "6px 0", WebkitAppearance: "none" }}>← Retour</button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "var(--fc)", fontSize: 9, fontWeight: 700, letterSpacing: 2.5, color: day.color }}>{day.label}</p>
          <p style={{ fontFamily: "var(--fc)", fontSize: 20, fontWeight: 900, lineHeight: 1.1 }}>{day.focus}</p>
        </div>
        {started && <p style={{ fontFamily: "var(--fc)", fontSize: 22, fontWeight: 700, color: day.color }}>{elStr}</p>}
      </div>

      <div style={{ paddingBottom: 80 }}>
        {!started && (
          <div style={{ padding: "20px 14px" }}>
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 16, marginBottom: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 8 }}>🔥 Échauffement</p>
              {day.warmup.map((w, i) => <p key={i} style={{ fontSize: 13, color: "#555", marginBottom: 3 }}>· {w}</p>)}
            </div>
            <button onClick={() => { setStarted(true); setStartTime(Date.now()); }}
              style={{ width: "100%", padding: 18, background: day.color, border: "none", borderRadius: 12, color: "#fff", fontFamily: "var(--fc)", fontSize: 24, fontWeight: 900, letterSpacing: 4, cursor: "pointer", WebkitAppearance: "none" }}>
              ▶ LANCER LA SÉANCE
            </button>
          </div>
        )}

        {started && (
          <div style={{ padding: "10px 10px 16px" }}>
            {day.isCircuit && (
              <div style={{ background: "#1a1500", border: "1px solid #3a3000", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#F59E0B", marginBottom: 10, textAlign: "center" }}>
                🔄 Circuit {day.rounds} tours · 90 sec repos entre chaque tour
              </div>
            )}

            {day.exercises.map((ex, idx) => (
              <ExCard key={ex.id} ex={ex} idx={idx} sets={getSets(ex)} open={activeEx === ex.id}
                onToggle={() => setActiveEx(activeEx === ex.id ? null : ex.id)}
                onSetChange={sets => updateSets(ex.id, sets)} />
            ))}

            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#0a1515", border: "1px solid #143030", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>🫀</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{day.cardio.desc}</p>
                <p style={{ fontSize: 11, color: "#4ECDC4", marginTop: 2 }}>{day.cardio.duration} min · {day.cardio.detail}</p>
              </div>
            </div>

            <button onClick={() => setShowRecap(true)}
              style={{ width: "100%", padding: 16, background: "#141414", border: "1px solid #2a2a2a", borderRadius: 12, color: "#aaa", fontFamily: "var(--fc)", fontSize: 17, fontWeight: 700, letterSpacing: 2, cursor: "pointer", WebkitAppearance: "none" }}>
              🏁 Terminer la séance
            </button>
          </div>
        )}
      </div>

      {showRecap && <Recap sessionData={sessionData} dayKey={currentDay} startTime={startTime} onSave={handleSaveSession} onClose={() => setShowRecap(false)} />}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app:      { fontFamily: "'Barlow', sans-serif", background: "#080808", color: "#f0f0f0", minHeight: "100vh", WebkitTextSizeAdjust: "100%", overscrollBehavior: "none" },
  inp:      { background: "#181818", border: "1px solid #252525", borderRadius: 8, color: "#f0f0f0", fontSize: 16, padding: "9px 6px", width: "100%", textAlign: "center", outline: "none", WebkitAppearance: "none" },
  check:    { width: 44, height: 44, borderRadius: "50%", border: "1px solid #252525", background: "#181818", color: "#444", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", WebkitAppearance: "none" },
  checkDone:{ background: "#0e2a0e", borderColor: "#3a7a3a", color: "#5ab85a" },
  timerBtn: { background: "#FF6B35", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "9px 14px", cursor: "pointer", whiteSpace: "nowrap", WebkitAppearance: "none" },
  gifBtn:   { background: "#181818", border: "1px solid #252525", color: "#666", fontSize: 12, padding: "7px 13px", borderRadius: 8, cursor: "pointer", WebkitAppearance: "none" },
  overlay:  { position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 100, display: "flex", alignItems: "flex-end", padding: 0 },
  sheet:    { background: "#101010", borderRadius: "20px 20px 0 0", padding: "24px 18px 48px", width: "100%" },
  closeBtn: { background: "#1e1e1e", border: "none", color: "#888", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", WebkitAppearance: "none" },
};

function GlobalStyles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
    :root { --fc: 'Barlow Condensed', sans-serif; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html { height: 100%; background: #080808; }
    body { height: 100%; background: #080808; -webkit-overflow-scrolling: touch; overscroll-behavior: none; }
    input, button, textarea, select { font-family: 'Barlow', sans-serif; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
  `}</style>;
}
