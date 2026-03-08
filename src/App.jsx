import { useState, useEffect } from "react";
import { load, save } from "./storage.js";

const PHASES = { IDLE: "idle", TOEPING: "toeping", PICK_WINNER: "pick_winner" };
const BB_PHASES = { BIDDING: "bidding", PLAYING: "playing" };
const uid = () => Math.random().toString(36).slice(2, 9);

const C = {
  bg: "#0f1117", surface: "#1a1d27", card: "#242836",
  accent: "#e8aa3a", accentDim: "#b8872e",
  red: "#e05252", green: "#4ecb71", blue: "#5b8def",
  purple: "#a87bef", orange: "#e88a3a",
  text: "#eaedf3", textDim: "#7a7f91", border: "#2e3244", eliminated: "#3a2020",
};

const pill = {
  padding: "6px 14px", borderRadius: 20, border: "none",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
  transition: "all .15s", fontFamily: "inherit",
};

const RECENT_NAMES_DEFAULT = ["Max", "Tim", "Sanne", "Luuk", "Emma", "Daan"];

// Yahtzee categories
const YZ_UPPER = [
  { key: "ones", label: "Ones", desc: "Total of ones" },
  { key: "twos", label: "Twos", desc: "Total of twos" },
  { key: "threes", label: "Threes", desc: "Total of threes" },
  { key: "fours", label: "Fours", desc: "Total of fours" },
  { key: "fives", label: "Fives", desc: "Total of fives" },
  { key: "sixes", label: "Sixes", desc: "Total of sixes" },
];
const YZ_LOWER = [
  { key: "threeOfKind", label: "3 of a Kind", desc: "Sum all dice" },
  { key: "fourOfKind", label: "4 of a Kind", desc: "Sum all dice" },
  { key: "fullHouse", label: "Full House", desc: "25 pts" },
  { key: "smStraight", label: "Sm. Straight", desc: "30 pts" },
  { key: "lgStraight", label: "Lg. Straight", desc: "40 pts" },
  { key: "yahtzee", label: "Yahtzee", desc: "50 pts" },
  { key: "chance", label: "Chance", desc: "Sum all dice" },
];
const YZ_ALL = [...YZ_UPPER, ...YZ_LOWER];

function NumStepper({ value, onChange, min, max, color = C.accent, label, suffix }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, padding: "10px 16px", borderRadius: 12 }}>
      <span style={{ fontSize: 13, color: C.textDim, flex: 1 }}>{label}</span>
      <button onClick={() => onChange(Math.max(min ?? -999, value - 1))} style={{ ...pill, background: C.card, color: C.text, width: 32, padding: "4px 0", textAlign: "center" }}>−</button>
      <span style={{ fontSize: 18, fontWeight: 800, minWidth: 28, textAlign: "center", color }}>{value}</span>
      <button onClick={() => onChange(Math.min(max ?? 999, value + 1))} style={{ ...pill, background: C.card, color: C.text, width: 32, padding: "4px 0", textAlign: "center" }}>+</button>
      {suffix && <span style={{ fontSize: 13, color: C.textDim }}>{suffix}</span>}
    </div>
  );
}

// ─── MAIN APP ───
export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedGame, setSelectedGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [recentNames, setRecentNames] = useState(load("recentNames", RECENT_NAMES_DEFAULT));
  const [gameSettings, setGameSettings] = useState(load("gameSettings", {
    eliminationLimit: 15,
    bbMaxCards: 8, bbBaseBonus: 10, bbUnderPenalty: -3, bbOverPenalty: -2, bbBonusPerTrick: 3, bbNoTrumpRound: true,
    yzMultiple: false,
  }));

  useEffect(() => { save("gameSettings", gameSettings); }, [gameSettings]);
  useEffect(() => { save("recentNames", recentNames); }, [recentNames]);

  const updateSetting = (key, val) => setGameSettings({ ...gameSettings, [key]: val });
  const addToRecent = (name) => {
    const t = name.trim(); if (!t) return;
    setRecentNames((prev) => [t, ...prev.filter((n) => n.toLowerCase() !== t.toLowerCase())].slice(0, 20));
  };
  const startGame = (game) => { setSelectedGame(game); setScreen("setup"); };
  const beginGame = () => { players.forEach((p) => addToRecent(p.name)); setScreen("game"); };
  const backToHome = () => { setScreen("home"); setPlayers([]); };

  return (
    <div style={{ fontFamily: "'DM Sans','Avenir Next',system-ui,sans-serif", background: C.bg, color: C.text, minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      {screen === "home" && <HomeScreen onSelect={startGame} />}
      {screen === "setup" && <SetupScreen game={selectedGame} players={players} setPlayers={setPlayers} settings={gameSettings} updateSetting={updateSetting} recentNames={recentNames} addToRecent={addToRecent} onStart={beginGame} onBack={backToHome} />}
      {screen === "game" && selectedGame.id === "toepen" && <ToepGameScreen game={selectedGame} initialPlayers={players} eliminationLimit={gameSettings.eliminationLimit} recentNames={recentNames} addToRecent={addToRecent} onExit={backToHome} />}
      {screen === "game" && selectedGame.id === "counter" && <CounterGameScreen game={selectedGame} initialPlayers={players} recentNames={recentNames} addToRecent={addToRecent} onExit={backToHome} />}
      {screen === "game" && selectedGame.id === "boerenbridge" && <BBGameScreen game={selectedGame} initialPlayers={players} settings={gameSettings} recentNames={recentNames} addToRecent={addToRecent} onExit={backToHome} />}
      {screen === "game" && selectedGame.id === "yahtzee" && <YahtzeeGameScreen game={selectedGame} initialPlayers={players} settings={gameSettings} recentNames={recentNames} addToRecent={addToRecent} onExit={backToHome} />}
    </div>
  );
}

// ═══════════════════════════════════════════
// HOME SCREEN — VERTICAL LAYOUT
// ═══════════════════════════════════════════
function HomeScreen({ onSelect }) {
  const games = [
    { id: "toepen", name: "Toepen", emoji: "🃏", color: C.accent },
    { id: "boerenbridge", name: "Boerenbridge", emoji: "🂡", color: C.purple },
    { id: "yahtzee", name: "Yahtzee", emoji: "🎲", color: C.orange },
    { id: "counter", name: "Counter", emoji: "🔢", color: C.blue },
  ];

  return (
    <div style={{ padding: "60px 20px 40px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: -0.5 }}>Score Keeper</h1>
      <p style={{ color: C.textDim, fontSize: 14, marginBottom: 32 }}>Pick a game to get started</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {games.map((g) => (
          <div key={g.id} onClick={() => onSelect(g)}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: C.card, borderRadius: 14, padding: "18px 20px",
              cursor: "pointer", border: `1px solid ${g.color}33`,
              transition: "transform .12s, box-shadow .12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = `0 4px 16px ${g.color}18`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <span style={{ fontSize: 36, width: 44, textAlign: "center", flexShrink: 0 }}>{g.emoji}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: g.color }}>{g.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SETUP SCREEN
// ═══════════════════════════════════════════
function SetupScreen({ game, players, setPlayers, settings, updateSetting, recentNames, addToRecent, onStart, onBack }) {
  const [nameInput, setNameInput] = useState("");
  const addPlayer = (name) => { const t = name.trim(); if (!t || players.find((p) => p.name === t)) return; setPlayers([...players, { id: uid(), name: t, score: 0 }]); addToRecent(t); setNameInput(""); };
  const removePlayer = (id) => setPlayers(players.filter((p) => p.id !== id));
  const movePlayer = (i, d) => { const n = [...players]; const s = i + d; if (s < 0 || s >= n.length) return; [n[i], n[s]] = [n[s], n[i]]; setPlayers(n); };
  const suggestions = recentNames.filter((n) => !players.find((p) => p.name === n) && (nameInput === "" || n.toLowerCase().includes(nameInput.toLowerCase())));
  const minPlayers = game.id === "counter" ? 1 : 2;

  return (
    <div style={{ padding: "40px 20px" }}>
      <button onClick={onBack} style={{ ...pill, background: "transparent", color: C.textDim, padding: "4px 0", marginBottom: 16 }}>← Back</button>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{game.emoji} {game.name}</h2>
      <p style={{ color: C.textDim, fontSize: 13, marginBottom: 24 }}>Add players and set the rules</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {game.id === "toepen" && <NumStepper label="Elimination at" value={settings.eliminationLimit} onChange={(v) => updateSetting("eliminationLimit", v)} min={5} max={30} color={C.accent} suffix="lives" />}
        {game.id === "boerenbridge" && (<>
          <NumStepper label="Max cards per round" value={settings.bbMaxCards} onChange={(v) => updateSetting("bbMaxCards", v)} min={3} max={13} color={C.purple} />
          <NumStepper label="Base bonus (correct)" value={settings.bbBaseBonus} onChange={(v) => updateSetting("bbBaseBonus", v)} min={0} max={20} color={C.green} />
          <NumStepper label="Bonus per trick" value={settings.bbBonusPerTrick} onChange={(v) => updateSetting("bbBonusPerTrick", v)} min={0} max={10} color={C.green} />
          <NumStepper label="Penalty under (per diff)" value={settings.bbUnderPenalty} onChange={(v) => updateSetting("bbUnderPenalty", v)} min={-10} max={0} color={C.red} />
          <NumStepper label="Penalty over (per diff)" value={settings.bbOverPenalty} onChange={(v) => updateSetting("bbOverPenalty", v)} min={-10} max={0} color={C.red} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, padding: "10px 16px", borderRadius: 12 }}>
            <span style={{ fontSize: 13, color: C.textDim, flex: 1 }}>No-trump round at max cards</span>
            <button onClick={() => updateSetting("bbNoTrumpRound", !settings.bbNoTrumpRound)} style={{ ...pill, padding: "6px 16px", background: settings.bbNoTrumpRound ? C.purple + "33" : C.card, color: settings.bbNoTrumpRound ? C.purple : C.textDim, border: `1px solid ${settings.bbNoTrumpRound ? C.purple + "66" : C.border}` }}>{settings.bbNoTrumpRound ? "ON" : "OFF"}</button>
          </div>
        </>)}
        {game.id === "yahtzee" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, padding: "10px 16px", borderRadius: 12 }}>
            <span style={{ fontSize: 13, color: C.textDim, flex: 1 }}>Allow multiple Yahtzees (+100 bonus)</span>
            <button onClick={() => updateSetting("yzMultiple", !settings.yzMultiple)} style={{ ...pill, padding: "6px 16px", background: settings.yzMultiple ? C.orange + "33" : C.card, color: settings.yzMultiple ? C.orange : C.textDim, border: `1px solid ${settings.yzMultiple ? C.orange + "66" : C.border}` }}>{settings.yzMultiple ? "ON" : "OFF"}</button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPlayer(nameInput)} placeholder="Player name..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
        <button onClick={() => addPlayer(nameInput)} style={{ ...pill, background: C.accent, color: C.bg, fontSize: 14 }}>Add</button>
      </div>
      {suggestions.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>{suggestions.slice(0, 10).map((n) => <button key={n} onClick={() => addPlayer(n)} style={{ ...pill, background: C.surface, color: C.textDim, border: `1px solid ${C.border}`, fontSize: 12 }}>+ {n}</button>)}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 32 }}>
        {players.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, padding: "10px 14px", borderRadius: 10 }}>
            <span style={{ fontSize: 12, color: C.textDim, width: 18 }}>{i + 1}.</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{p.name}</span>
            <button onClick={() => movePlayer(i, -1)} style={{ ...pill, background: "transparent", color: C.textDim, padding: "2px 6px", fontSize: 16, opacity: i === 0 ? 0.2 : 1 }}>↑</button>
            <button onClick={() => movePlayer(i, 1)} style={{ ...pill, background: "transparent", color: C.textDim, padding: "2px 6px", fontSize: 16, opacity: i === players.length - 1 ? 0.2 : 1 }}>↓</button>
            <button onClick={() => removePlayer(p.id)} style={{ ...pill, background: "transparent", color: C.red, padding: "2px 8px", fontSize: 14 }}>✕</button>
          </div>
        ))}
      </div>

      {players.length >= minPlayers ? (
        <button onClick={onStart} style={{ ...pill, width: "100%", padding: "14px 0", fontSize: 16, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, borderRadius: 12, fontWeight: 800 }}>Start Game →</button>
      ) : <p style={{ color: C.textDim, fontSize: 13, textAlign: "center" }}>Add at least {minPlayers} player{minPlayers > 1 ? "s" : ""} to start</p>}
    </div>
  );
}

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════
function AddPlayerPopup({ players, recentNames, onAdd, onClose }) {
  const [name, setName] = useState("");
  const suggestions = recentNames.filter((n) => !players.find((p) => p.name === n) && (name === "" || n.toLowerCase().includes(name.toLowerCase())));
  const doAdd = (n) => { onAdd(n); setName(""); };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doAdd(name)} placeholder="Name..." autoFocus
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
        <button onClick={() => doAdd(name)} style={{ ...pill, background: C.accent, color: C.bg }}>Add</button>
        <button onClick={onClose} style={{ ...pill, background: C.surface, color: C.textDim }}>✕</button>
      </div>
      {suggestions.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{suggestions.slice(0, 10).map((n) => <button key={n} onClick={() => doAdd(n)} style={{ ...pill, background: C.surface, color: C.textDim, border: `1px solid ${C.border}`, fontSize: 12 }}>+ {n}</button>)}</div>}
    </div>
  );
}

function GameMenu({ onAddPlayer, onExit }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <button onClick={onAddPlayer} style={{ ...pill, background: C.surface, color: C.text, textAlign: "left" }}>+ Add Player</button>
      <button onClick={onExit} style={{ ...pill, background: C.red + "22", color: C.red, textAlign: "left" }}>End Game</button>
    </div>
  );
}

// ═══════════════════════════════════════════
// TOEPEN — quit gives PREVIOUS stake (stake before the toep)
// ═══════════════════════════════════════════
function ToepGameScreen({ game, initialPlayers, eliminationLimit, recentNames, addToRecent, onExit }) {
  const [players, setPlayers] = useState(initialPlayers.map((p) => ({ ...p, score: 0, inRound: true, quitThisRound: false })));
  const [stake, setStake] = useState(1);
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [history, setHistory] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const inRoundPlayers = players.filter((p) => p.inRound && !p.quitThisRound && p.score < eliminationLimit);
  const snapshot = () => JSON.parse(JSON.stringify({ players, stake, phase }));
  const pushHistory = (label) => setHistory((h) => [...h, { label, state: snapshot() }]);

  const handleToep = (pid) => { pushHistory(`Toep by ${players.find((p) => p.id === pid)?.name}`); setStake((s) => s + 1); setPhase(PHASES.TOEPING); };
  // FIX: quitting costs the PREVIOUS stake (stake - 1), not the current stake
  const handleQuit = (pid) => {
    const p = players.find((pl) => pl.id === pid);
    const quitStake = stake - 1; // previous stake before the toep
    pushHistory(`${p.name} quits (+${quitStake})`);
    setPlayers(players.map((pl) => pl.id === pid ? { ...pl, quitThisRound: true, score: pl.score + quitStake } : pl));
  };
  const handleContinue = () => { pushHistory("Continue → pick winner"); setPhase(PHASES.PICK_WINNER); };
  const handlePickWinner = (wid) => {
    pushHistory(`${players.find((p) => p.id === wid).name} wins round`);
    setPlayers(players.map((p) => {
      if (p.id === wid || p.quitThisRound || p.score >= eliminationLimit || !p.inRound) return { ...p, inRound: true, quitThisRound: false };
      return { ...p, score: p.score + stake, inRound: true, quitThisRound: false };
    }));
    setStake(1); setPhase(PHASES.IDLE);
  };
  const handleUndo = () => { if (!history.length) return; const prev = history[history.length - 1].state; setPlayers(prev.players); setStake(prev.stake); setPhase(prev.phase); setHistory((h) => h.slice(0, -1)); };
  const adjustScore = (pid, d) => { pushHistory("Manual adjust"); setPlayers(players.map((p) => p.id === pid ? { ...p, score: Math.max(0, p.score + d) } : p)); };
  const addMid = (name) => { const t = name.trim(); if (!t || players.find((p) => p.name === t)) return; addToRecent(t); setPlayers([...players, { id: uid(), name: t, score: 0, inRound: true, quitThisRound: false }]); };
  const removeMid = (id) => setPlayers(players.filter((p) => p.id !== id));
  const moveMid = (i, d) => { const n = [...players]; const s = i + d; if (s < 0 || s >= n.length) return; [n[i], n[s]] = [n[s], n[i]]; setPlayers(n); };
  const canContinue = phase === PHASES.TOEPING && inRoundPlayers.length >= 1;

  return (
    <div style={{ padding: "20px 12px", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Current Stake</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: C.accent, textShadow: `0 0 20px ${C.accent}44` }}>{stake}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleUndo} disabled={!history.length} style={{ ...pill, background: C.surface, color: history.length ? C.text : C.textDim, border: `1px solid ${C.border}`, opacity: history.length ? 1 : 0.4, fontSize: 12 }}>↩ Undo</button>
          <button onClick={() => setShowMenu(!showMenu)} style={{ ...pill, background: C.surface, color: C.text, border: `1px solid ${C.border}`, fontSize: 16, padding: "4px 10px" }}>⋮</button>
        </div>
      </div>
      <div style={{ padding: "8px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, background: phase === PHASES.IDLE ? C.surface : phase === PHASES.TOEPING ? C.accent + "22" : C.green + "22", color: phase === PHASES.IDLE ? C.textDim : phase === PHASES.TOEPING ? C.accent : C.green, border: `1px solid ${phase === PHASES.IDLE ? C.border : phase === PHASES.TOEPING ? C.accent + "44" : C.green + "44"}` }}>
        {phase === PHASES.IDLE && "Ready — tap Toep to raise the stakes"}
        {phase === PHASES.TOEPING && `Toep! Stake is ${stake}. Quitting costs ${stake - 1}.`}
        {phase === PHASES.PICK_WINNER && "Pick the round winner"}
      </div>
      {showMenu && <GameMenu onAddPlayer={() => { setShowAddPlayer(true); setShowMenu(false); }} onExit={() => { setShowMenu(false); onExit(); }} />}
      {showAddPlayer && <AddPlayerPopup players={players} recentNames={recentNames} onAdd={addMid} onClose={() => setShowAddPlayer(false)} />}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12 }}>
        {players.map((p, idx) => {
          const elim = p.score >= eliminationLimit; const quit = p.quitThisRound; const active = !elim && !quit && p.inRound;
          return (
            <div key={p.id} style={{ minWidth: 100, flex: 1, background: elim ? C.eliminated : quit ? C.surface : C.card, borderRadius: 14, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, border: `1px solid ${elim ? C.red + "33" : C.border}`, opacity: elim ? 0.5 : quit ? 0.65 : 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, textAlign: "center", lineHeight: 1.2, minHeight: 28, display: "flex", alignItems: "center" }}>{p.name}</div>
              <div><div style={{ fontSize: 34, fontWeight: 900, color: elim ? C.red : p.score >= eliminationLimit - 3 ? C.red : C.text }}>{p.score}</div>
                {elim && <div style={{ fontSize: 9, color: C.red, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>OUT</div>}</div>
              {!elim && <div style={{ display: "flex", gap: 6, width: "100%" }}>
                <button onClick={() => adjustScore(p.id, -1)} style={{ ...pill, flex: 1, padding: "10px 0", fontSize: 22, fontWeight: 800, background: C.surface, color: C.textDim, textAlign: "center", borderRadius: 10, lineHeight: 1 }}>−</button>
                <button onClick={() => adjustScore(p.id, 1)} style={{ ...pill, flex: 1, padding: "10px 0", fontSize: 22, fontWeight: 800, background: C.surface, color: C.textDim, textAlign: "center", borderRadius: 10, lineHeight: 1 }}>+</button>
              </div>}
              {!elim && <div style={{ marginTop: 2, width: "100%" }}>
                {phase === PHASES.IDLE && <button onClick={() => handleToep(p.id)} style={{ ...pill, width: "100%", padding: "10px 0", background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, color: C.bg, fontSize: 13, fontWeight: 700, borderRadius: 10 }}>Toep</button>}
                {phase === PHASES.TOEPING && active && <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <button onClick={() => handleToep(p.id)} style={{ ...pill, width: "100%", padding: "9px 0", background: C.accent + "22", color: C.accent, fontSize: 12, fontWeight: 700, border: `1px solid ${C.accent}44`, borderRadius: 10 }}>Toep</button>
                  <button onClick={() => handleQuit(p.id)} style={{ ...pill, width: "100%", padding: "9px 0", background: C.red + "22", color: C.red, fontSize: 12, fontWeight: 700, border: `1px solid ${C.red}44`, borderRadius: 10 }}>Quit</button>
                </div>}
                {phase === PHASES.TOEPING && quit && <div style={{ fontSize: 12, color: C.red, fontWeight: 700, textAlign: "center", padding: "8px 0" }}>Quit (+{stake - 1})</div>}
                {phase === PHASES.PICK_WINNER && active && <button onClick={() => handlePickWinner(p.id)} style={{ ...pill, width: "100%", padding: "10px 0", background: C.green + "22", color: C.green, fontSize: 13, fontWeight: 700, border: `1px solid ${C.green}44`, borderRadius: 10 }}>Winner</button>}
              </div>}
              <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                <button onClick={() => moveMid(idx, -1)} style={{ ...pill, background: "transparent", color: C.textDim, padding: "2px 6px", fontSize: 14, opacity: idx === 0 ? 0.2 : 0.6 }}>◀</button>
                <button onClick={() => removeMid(p.id)} style={{ ...pill, background: "transparent", color: C.red, padding: "2px 6px", fontSize: 11, opacity: 0.5 }}>✕</button>
                <button onClick={() => moveMid(idx, 1)} style={{ ...pill, background: "transparent", color: C.textDim, padding: "2px 6px", fontSize: 14, opacity: idx === players.length - 1 ? 0.2 : 0.6 }}>▶</button>
              </div>
            </div>
          );
        })}
      </div>
      {canContinue && <button onClick={handleContinue} style={{ ...pill, width: "100%", padding: "14px 0", marginTop: 12, background: `linear-gradient(135deg, ${C.green}, #38a85c)`, color: C.bg, fontSize: 15, fontWeight: 800, borderRadius: 12 }}>Continue → Pick Winner</button>}
      {history.length > 0 && <div style={{ marginTop: 24, padding: "12px 14px", background: C.surface, borderRadius: 12 }}>
        <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Round Log</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 120, overflowY: "auto" }}>{[...history].reverse().slice(0, 10).map((h, i) => <div key={i} style={{ fontSize: 12, color: C.textDim }}>{h.label}</div>)}</div>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════
// COUNTER
// ═══════════════════════════════════════════
function CounterGameScreen({ game, initialPlayers, recentNames, addToRecent, onExit }) {
  const [players, setPlayers] = useState(initialPlayers.map((p) => ({ ...p, score: 0 })));
  const [addInputs, setAddInputs] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [history, setHistory] = useState([]);
  const pushHistory = () => setHistory((h) => [...h, JSON.parse(JSON.stringify(players))]);
  const handleUndo = () => { if (!history.length) return; setPlayers(history[history.length - 1]); setHistory((h) => h.slice(0, -1)); };
  const addMid = (name) => { const t = name.trim(); if (!t || players.find((p) => p.name === t)) return; addToRecent(t); pushHistory(); setPlayers([...players, { id: uid(), name: t, score: 0 }]); };
  const removeMid = (id) => { pushHistory(); setPlayers(players.filter((p) => p.id !== id)); };
  const moveMid = (i, d) => { const n = [...players]; const s = i + d; if (s < 0 || s >= n.length) return; pushHistory(); [n[i], n[s]] = [n[s], n[i]]; setPlayers(n); };
  const getV = (id) => addInputs[id] || "";
  const setV = (id, v) => setAddInputs({ ...addInputs, [id]: v });
  const applyAdd = (id) => { const v = parseInt(getV(id)); if (isNaN(v)) return; pushHistory(); setPlayers(players.map((p) => p.id === id ? { ...p, score: p.score + v } : p)); setAddInputs({ ...addInputs, [id]: "" }); };

  return (
    <div style={{ padding: "20px 12px", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{game.emoji} {game.name}</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleUndo} disabled={!history.length} style={{ ...pill, background: C.surface, color: history.length ? C.text : C.textDim, border: `1px solid ${C.border}`, opacity: history.length ? 1 : 0.4, fontSize: 12 }}>↩ Undo</button>
          <button onClick={() => setShowMenu(!showMenu)} style={{ ...pill, background: C.surface, color: C.text, border: `1px solid ${C.border}`, fontSize: 16, padding: "4px 10px" }}>⋮</button>
        </div>
      </div>
      {showMenu && <GameMenu onAddPlayer={() => { setShowAddPlayer(true); setShowMenu(false); }} onExit={() => { setShowMenu(false); onExit(); }} />}
      {showAddPlayer && <AddPlayerPopup players={players} recentNames={recentNames} onAdd={addMid} onClose={() => setShowAddPlayer(false)} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {players.map((p, idx) => (
          <div key={p.id} style={{ background: C.card, borderRadius: 14, padding: "16px 18px", border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => moveMid(idx, -1)} style={{ ...pill, background: "transparent", color: C.textDim, padding: "0 4px", fontSize: 12, opacity: idx === 0 ? 0.2 : 0.6 }}>▲</button>
                  <button onClick={() => moveMid(idx, 1)} style={{ ...pill, background: "transparent", color: C.textDim, padding: "0 4px", fontSize: 12, opacity: idx === players.length - 1 ? 0.2 : 0.6 }}>▼</button>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: C.blue }}>{p.score}</span>
                <button onClick={() => removeMid(p.id)} style={{ ...pill, background: "transparent", color: C.red, padding: "2px 6px", fontSize: 12, opacity: 0.5 }}>✕</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={getV(p.id)} onChange={(e) => { const v = e.target.value; if (v === "" || v === "-" || /^-?\d*$/.test(v)) setV(p.id, v); }} onKeyDown={(e) => e.key === "Enter" && applyAdd(p.id)} placeholder="± points"
                style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 18, fontFamily: "inherit", outline: "none", textAlign: "center", fontWeight: 700 }} />
              <button onClick={() => applyAdd(p.id)} style={{ ...pill, padding: "12px 22px", fontSize: 16, fontWeight: 800, background: `linear-gradient(135deg, ${C.blue}, #4a7ad8)`, color: "#fff", borderRadius: 10 }}>Add</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {[1, 5, 10, -1, -5, -10].map((val) => (
                <button key={val} onClick={() => { pushHistory(); setPlayers(players.map((pl) => pl.id === p.id ? { ...pl, score: pl.score + val } : pl)); }}
                  style={{ ...pill, padding: "10px 0", fontSize: 14, fontWeight: 700, background: val > 0 ? C.green + "18" : C.red + "18", color: val > 0 ? C.green : C.red, border: `1px solid ${val > 0 ? C.green + "33" : C.red + "33"}`, borderRadius: 8, flex: 1, minWidth: 44, textAlign: "center" }}>{val > 0 ? "+" : ""}{val}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// BOERENBRIDGE — with bid total warning
// ═══════════════════════════════════════════
function BBGameScreen({ game, initialPlayers, settings, recentNames, addToRecent, onExit }) {
  const maxC = settings.bbMaxCards;
  const buildRounds = () => {
    const f = [];
    for (let i = 1; i <= maxC; i++) f.push({ cards: i, noTrump: false });
    if (settings.bbNoTrumpRound) f.push({ cards: maxC, noTrump: true });
    for (let i = maxC - 1; i >= 1; i--) f.push({ cards: i, noTrump: false });
    return f;
  };
  const [rounds] = useState(buildRounds);
  const [currentRound, setCurrentRound] = useState(0);
  const [phase, setPhase] = useState(BB_PHASES.BIDDING);
  const [players, setPlayers] = useState(initialPlayers.map((p) => ({ ...p, totalScore: 0 })));
  const [bids, setBids] = useState({});
  const [tricks, setTricks] = useState({});
  const [roundHistory, setRoundHistory] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const round = rounds[currentRound];
  const isLastRound = currentRound >= rounds.length - 1;
  const isGameOver = currentRound >= rounds.length;
  const getBid = (id) => bids[id] ?? "";
  const getTricks = (id) => tricks[id] ?? "";
  const setBid = (id, v) => setBids({ ...bids, [id]: v });
  const setTrick = (id, v) => setTricks({ ...tricks, [id]: v });
  const allBidsIn = players.every((p) => bids[p.id] !== undefined && bids[p.id] !== "");
  const allTricksIn = players.every((p) => tricks[p.id] !== undefined && tricks[p.id] !== "");

  // Bid warning: total bids == cards when cards >= 3
  const totalBids = players.reduce((sum, p) => sum + (typeof bids[p.id] === "number" ? bids[p.id] : 0), 0);
  const showBidWarning = round && round.cards >= 3 && allBidsIn && totalBids === round.cards;

  const confirmBids = () => { if (!allBidsIn) return; setPhase(BB_PHASES.PLAYING); };
  const calcScore = (bid, actual) => {
    const b = parseInt(bid); const a = parseInt(actual);
    if (isNaN(b) || isNaN(a)) return 0;
    if (a === b) return settings.bbBaseBonus + (settings.bbBonusPerTrick * a);
    const diff = Math.abs(a - b);
    return a < b ? settings.bbUnderPenalty * diff : settings.bbOverPenalty * diff;
  };
  const confirmRound = () => {
    if (!allTricksIn) return;
    const scores = {};
    const updated = players.map((p) => { const s = calcScore(bids[p.id], tricks[p.id]); scores[p.id] = s; return { ...p, totalScore: p.totalScore + s }; });
    setRoundHistory([...roundHistory, { roundIdx: currentRound, round, bids: { ...bids }, tricks: { ...tricks }, scores }]);
    setPlayers(updated); setBids({}); setTricks({}); setCurrentRound(currentRound + 1); setPhase(BB_PHASES.BIDDING);
  };
  const undoLastRound = () => {
    if (!roundHistory.length) return;
    const last = roundHistory[roundHistory.length - 1];
    setPlayers(players.map((p) => ({ ...p, totalScore: p.totalScore - (last.scores[p.id] || 0) })));
    setRoundHistory(roundHistory.slice(0, -1)); setCurrentRound(last.roundIdx); setBids(last.bids); setTricks(last.tricks); setPhase(BB_PHASES.PLAYING);
  };
  const addMid = (name) => { const t = name.trim(); if (!t || players.find((p) => p.name === t)) return; addToRecent(t); setPlayers([...players, { id: uid(), name: t, totalScore: 0 }]); };
  const removeMid = (id) => setPlayers(players.filter((p) => p.id !== id));
  const moveMid = (i, d) => { const n = [...players]; const s = i + d; if (s < 0 || s >= n.length) return; [n[i], n[s]] = [n[s], n[i]]; setPlayers(n); };
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);

  if (isGameOver) {
    return (
      <div style={{ padding: "40px 20px", minHeight: "100vh" }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4, color: C.purple }}>🏆 Game Over!</h2>
        <p style={{ color: C.textDim, fontSize: 13, marginBottom: 24 }}>{rounds.length} rounds completed</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
          {sorted.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, background: i === 0 ? C.purple + "22" : C.card, border: `1px solid ${i === 0 ? C.purple + "55" : C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: i === 0 ? C.purple : C.textDim, width: 30 }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>{p.name}</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: p.totalScore >= 0 ? C.green : C.red }}>{p.totalScore}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={undoLastRound} style={{ ...pill, flex: 1, padding: "12px 0", background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10 }}>↩ Undo last round</button>
          <button onClick={onExit} style={{ ...pill, flex: 1, padding: "12px 0", background: C.accent, color: C.bg, borderRadius: 10 }}>Home</button>
        </div>
        {roundHistory.length > 0 && <div style={{ marginTop: 24, overflowX: "auto" }}>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Score History</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr><th style={{ padding: "6px 8px", color: C.textDim, textAlign: "left", borderBottom: `1px solid ${C.border}` }}>Rnd</th>
              {players.map((p) => <th key={p.id} style={{ padding: "6px 8px", color: C.text, textAlign: "center", borderBottom: `1px solid ${C.border}` }}>{p.name}</th>)}</tr></thead>
            <tbody>{roundHistory.map((rh, ri) => <tr key={ri}><td style={{ padding: "4px 8px", color: C.textDim, borderBottom: `1px solid ${C.border}22` }}>{rh.round.cards}{rh.round.noTrump ? "★" : ""}</td>
              {players.map((p) => { const s = rh.scores[p.id] || 0; return <td key={p.id} style={{ padding: "4px 8px", textAlign: "center", color: s >= 0 ? C.green : C.red, borderBottom: `1px solid ${C.border}22` }}>{rh.bids[p.id]}→{rh.tricks[p.id]} ({s > 0 ? "+" : ""}{s})</td>; })}</tr>)}</tbody>
          </table>
        </div>}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 12px", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Round {currentRound + 1} / {rounds.length}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: C.purple }}>{round.cards} card{round.cards > 1 ? "s" : ""}</span>
            {round.noTrump && <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accent + "22", padding: "2px 8px", borderRadius: 6 }}>NO TRUMP</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={undoLastRound} disabled={!roundHistory.length} style={{ ...pill, background: C.surface, color: roundHistory.length ? C.text : C.textDim, border: `1px solid ${C.border}`, opacity: roundHistory.length ? 1 : 0.4, fontSize: 12 }}>↩ Undo</button>
          <button onClick={() => setShowMenu(!showMenu)} style={{ ...pill, background: C.surface, color: C.text, border: `1px solid ${C.border}`, fontSize: 16, padding: "4px 10px" }}>⋮</button>
        </div>
      </div>
      <div style={{ padding: "8px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, background: phase === BB_PHASES.BIDDING ? C.purple + "22" : C.green + "22", color: phase === BB_PHASES.BIDDING ? C.purple : C.green, border: `1px solid ${phase === BB_PHASES.BIDDING ? C.purple + "44" : C.green + "44"}` }}>
        {phase === BB_PHASES.BIDDING && "Enter each player's bid (predicted tricks)"}
        {phase === BB_PHASES.PLAYING && "Round over — enter actual tricks won"}
      </div>

      {/* BID WARNING */}
      {phase === BB_PHASES.BIDDING && showBidWarning && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 700, background: C.red + "22", color: C.red, border: `1px solid ${C.red}44` }}>
          ⚠ Total bids ({totalBids}) equals the number of cards ({round.cards}) — this is not allowed from 3 cards onwards!
        </div>
      )}

      {showMenu && <GameMenu onAddPlayer={() => { setShowAddPlayer(true); setShowMenu(false); }} onExit={() => { setShowMenu(false); onExit(); }} />}
      {showAddPlayer && <AddPlayerPopup players={players} recentNames={recentNames} onAdd={addMid} onClose={() => setShowAddPlayer(false)} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {players.map((p, idx) => {
          const bid = getBid(p.id); const trick = getTricks(p.id);
          const preview = phase === BB_PHASES.PLAYING && bid !== "" && trick !== "" ? calcScore(bid, trick) : null;
          return (
            <div key={p.id} style={{ background: C.card, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <button onClick={() => moveMid(idx, -1)} style={{ ...pill, background: "transparent", color: C.textDim, padding: "0 3px", fontSize: 10, opacity: idx === 0 ? 0.2 : 0.6 }}>▲</button>
                    <button onClick={() => moveMid(idx, 1)} style={{ ...pill, background: "transparent", color: C.textDim, padding: "0 3px", fontSize: 10, opacity: idx === players.length - 1 ? 0.2 : 0.6 }}>▼</button>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: p.totalScore >= 0 ? C.green : C.red }}>{p.totalScore}</span>
                  <button onClick={() => removeMid(p.id)} style={{ ...pill, background: "transparent", color: C.red, padding: "2px 5px", fontSize: 11, opacity: 0.4 }}>✕</button>
                </div>
              </div>
              <div><div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Bid</div>
                <div style={{ display: "flex", gap: 4 }}>{Array.from({ length: round.cards + 1 }, (_, i) => i).map((n) => (
                  <button key={n} onClick={() => setBid(p.id, n)} style={{ ...pill, flex: 1, padding: "8px 0", fontSize: 14, fontWeight: 700, background: bid === n ? C.purple : C.surface, color: bid === n ? "#fff" : C.textDim, border: `1px solid ${bid === n ? C.purple : C.border}`, borderRadius: 8, textAlign: "center", minWidth: 0 }}>{n}</button>
                ))}</div></div>
              {phase === BB_PHASES.PLAYING && <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Tricks won</div>
                <div style={{ display: "flex", gap: 4 }}>{Array.from({ length: round.cards + 1 }, (_, i) => i).map((n) => (
                  <button key={n} onClick={() => setTrick(p.id, n)} style={{ ...pill, flex: 1, padding: "8px 0", fontSize: 14, fontWeight: 700, background: trick === n ? C.green : C.surface, color: trick === n ? "#fff" : C.textDim, border: `1px solid ${trick === n ? C.green : C.border}`, borderRadius: 8, textAlign: "center", minWidth: 0 }}>{n}</button>
                ))}</div>
                {preview !== null && <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: preview >= 0 ? C.green : C.red, textAlign: "right" }}>{preview >= 0 ? "+" : ""}{preview} pts</div>}
              </div>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        {phase === BB_PHASES.BIDDING && <button onClick={confirmBids} disabled={!allBidsIn || showBidWarning} style={{ ...pill, width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 800, borderRadius: 12, background: allBidsIn && !showBidWarning ? `linear-gradient(135deg, ${C.purple}, #8a5fc7)` : C.surface, color: allBidsIn && !showBidWarning ? "#fff" : C.textDim, border: allBidsIn && !showBidWarning ? "none" : `1px solid ${C.border}` }}>Confirm Bids → Play Round</button>}
        {phase === BB_PHASES.PLAYING && <button onClick={confirmRound} disabled={!allTricksIn} style={{ ...pill, width: "100%", padding: "14px 0", fontSize: 15, fontWeight: 800, borderRadius: 12, background: allTricksIn ? `linear-gradient(135deg, ${C.green}, #38a85c)` : C.surface, color: allTricksIn ? "#fff" : C.textDim, border: allTricksIn ? "none" : `1px solid ${C.border}` }}>{isLastRound ? "Finish Game" : "Score Round → Next"}</button>}
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 2, flexWrap: "wrap" }}>{rounds.map((r, i) => <div key={i} style={{ flex: 1, minWidth: 8, height: 6, borderRadius: 3, background: i < currentRound ? C.purple : i === currentRound ? C.accent : C.surface, opacity: i < currentRound ? 0.5 : 1 }} />)}</div>
      {roundHistory.length > 0 && <div style={{ marginTop: 16, overflowX: "auto" }}>
        <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Previous rounds</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr><th style={{ padding: "4px 6px", color: C.textDim, textAlign: "left" }}>Rnd</th>{players.map((p) => <th key={p.id} style={{ padding: "4px 6px", color: C.text, textAlign: "center" }}>{p.name.slice(0, 6)}</th>)}</tr></thead>
          <tbody>{[...roundHistory].reverse().slice(0, 5).map((rh, ri) => <tr key={ri}><td style={{ padding: "3px 6px", color: C.textDim }}>{rh.round.cards}{rh.round.noTrump ? "★" : ""}</td>
            {players.map((p) => { const s = rh.scores[p.id] || 0; return <td key={p.id} style={{ padding: "3px 6px", textAlign: "center", color: s >= 0 ? C.green : C.red }}>{rh.bids[p.id]}→{rh.tricks[p.id]} ({s > 0 ? "+" : ""}{s})</td>; })}</tr>)}</tbody>
        </table>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════
// YAHTZEE GAME SCREEN
// ═══════════════════════════════════════════
function YahtzeeGameScreen({ game, initialPlayers, settings, recentNames, addToRecent, onExit }) {
  // Each player has scores: { ones: null, twos: null, ..., yahtzee: null, chance: null, yahtzeeBonus: 0 }
  const initScores = () => {
    const s = {}; YZ_ALL.forEach((c) => s[c.key] = null);
    s.yahtzeeBonus = 0;
    return s;
  };
  const [players, setPlayers] = useState(initialPlayers.map((p) => ({ ...p, scores: initScores() })));
  const [editingCell, setEditingCell] = useState(null); // { playerId, key }
  const [editValue, setEditValue] = useState("");
  const [finished, setFinished] = useState(false);

  const setScore = (pid, key, val) => {
    setPlayers(players.map((p) => {
      if (p.id !== pid) return p;
      const newScores = { ...p.scores, [key]: val };
      return { ...p, scores: newScores };
    }));
    setEditingCell(null); setEditValue("");
  };

  const addYahtzeeBonus = (pid) => {
    setPlayers(players.map((p) => p.id === pid ? { ...p, scores: { ...p.scores, yahtzeeBonus: p.scores.yahtzeeBonus + 100 } } : p));
  };

  const calcUpperTotal = (scores) => YZ_UPPER.reduce((s, c) => s + (scores[c.key] || 0), 0);
  const calcUpperBonus = (scores) => calcUpperTotal(scores) >= 63 ? 35 : 0;
  const calcLowerTotal = (scores) => YZ_LOWER.reduce((s, c) => s + (scores[c.key] || 0), 0);
  const calcGrandTotal = (scores) => calcUpperTotal(scores) + calcUpperBonus(scores) + calcLowerTotal(scores) + (scores.yahtzeeBonus || 0);

  const startEdit = (pid, key) => {
    const p = players.find((pl) => pl.id === pid);
    setEditingCell({ playerId: pid, key });
    setEditValue(p.scores[key] !== null ? String(p.scores[key]) : "");
  };

  const confirmEdit = () => {
    if (!editingCell) return;
    const val = editValue.trim() === "" ? null : parseInt(editValue);
    if (editValue.trim() !== "" && isNaN(val)) return;
    setScore(editingCell.playerId, editingCell.key, val);
  };

  const sorted = [...players].sort((a, b) => calcGrandTotal(b.scores) - calcGrandTotal(a.scores));

  if (finished) {
    return (
      <div style={{ padding: "40px 20px", minHeight: "100vh" }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4, color: C.orange }}>🎲 Final Scores!</h2>
        <p style={{ color: C.textDim, fontSize: 13, marginBottom: 24 }}>Yahtzee game complete</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
          {sorted.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, background: i === 0 ? C.orange + "22" : C.card, border: `1px solid ${i === 0 ? C.orange + "55" : C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: i === 0 ? C.orange : C.textDim, width: 30 }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>{p.name}</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: C.orange }}>{calcGrandTotal(p.scores)}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setFinished(false)} style={{ ...pill, flex: 1, padding: "12px 0", background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10 }}>← Back to scorecard</button>
          <button onClick={onExit} style={{ ...pill, flex: 1, padding: "12px 0", background: C.accent, color: C.bg, borderRadius: 10 }}>Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 8px", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{game.emoji} Yahtzee</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setFinished(true)} style={{ ...pill, background: `linear-gradient(135deg, ${C.orange}, #c87830)`, color: "#fff", fontSize: 12 }}>Finish</button>
          <button onClick={onExit} style={{ ...pill, background: C.surface, color: C.textDim, border: `1px solid ${C.border}`, fontSize: 12 }}>Exit</button>
        </div>
      </div>

      {/* Scorecard table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: "6px 8px", textAlign: "left", color: C.textDim, borderBottom: `2px solid ${C.border}`, position: "sticky", left: 0, background: C.bg, minWidth: 90 }}>Category</th>
              {players.map((p) => <th key={p.id} style={{ padding: "6px 8px", textAlign: "center", color: C.text, borderBottom: `2px solid ${C.border}`, minWidth: 60 }}>{p.name.slice(0, 6)}</th>)}
            </tr>
          </thead>
          <tbody>
            {/* Upper section */}
            <tr><td colSpan={players.length + 1} style={{ padding: "8px 8px 4px", fontSize: 10, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: 1 }}>Upper Section</td></tr>
            {YZ_UPPER.map((cat) => (
              <tr key={cat.key}>
                <td style={{ padding: "6px 8px", color: C.textDim, borderBottom: `1px solid ${C.border}22`, position: "sticky", left: 0, background: C.bg }}>
                  <div style={{ fontWeight: 600, color: C.text }}>{cat.label}</div>
                </td>
                {players.map((p) => (
                  <td key={p.id} style={{ padding: "4px 4px", textAlign: "center", borderBottom: `1px solid ${C.border}22` }}>
                    {editingCell?.playerId === p.id && editingCell?.key === cat.key ? (
                      <input value={editValue} onChange={(e) => { if (/^\d*$/.test(e.target.value)) setEditValue(e.target.value); }}
                        onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") setEditingCell(null); }}
                        onBlur={confirmEdit} autoFocus
                        style={{ width: 44, padding: "4px", borderRadius: 6, border: `2px solid ${C.orange}`, background: C.surface, color: C.text, fontSize: 14, fontWeight: 700, textAlign: "center", fontFamily: "inherit", outline: "none" }} />
                    ) : (
                      <button onClick={() => startEdit(p.id, cat.key)} style={{ ...pill, padding: "6px 4px", width: "100%", fontSize: 14, fontWeight: 700, background: p.scores[cat.key] !== null ? C.card : C.surface, color: p.scores[cat.key] !== null ? C.text : C.textDim + "66", border: `1px solid ${C.border}`, borderRadius: 6, minWidth: 44 }}>
                        {p.scores[cat.key] !== null ? p.scores[cat.key] : "—"}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {/* Upper totals */}
            <tr style={{ background: C.surface }}>
              <td style={{ padding: "6px 8px", fontWeight: 700, color: C.textDim, position: "sticky", left: 0, background: C.surface }}>Upper Total</td>
              {players.map((p) => <td key={p.id} style={{ padding: "6px 4px", textAlign: "center", fontWeight: 800, color: C.text }}>{calcUpperTotal(p.scores)}</td>)}
            </tr>
            <tr style={{ background: C.surface }}>
              <td style={{ padding: "4px 8px", fontSize: 11, color: C.textDim, position: "sticky", left: 0, background: C.surface }}>Bonus (≥63)</td>
              {players.map((p) => <td key={p.id} style={{ padding: "4px 4px", textAlign: "center", fontWeight: 700, fontSize: 11, color: calcUpperBonus(p.scores) > 0 ? C.green : C.textDim }}>{calcUpperBonus(p.scores) > 0 ? "+35" : `${calcUpperTotal(p.scores)}/63`}</td>)}
            </tr>

            {/* Lower section */}
            <tr><td colSpan={players.length + 1} style={{ padding: "8px 8px 4px", fontSize: 10, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: 1 }}>Lower Section</td></tr>
            {YZ_LOWER.map((cat) => (
              <tr key={cat.key}>
                <td style={{ padding: "6px 8px", color: C.textDim, borderBottom: `1px solid ${C.border}22`, position: "sticky", left: 0, background: C.bg }}>
                  <div style={{ fontWeight: 600, color: C.text, fontSize: 11 }}>{cat.label}</div>
                  <div style={{ fontSize: 9, color: C.textDim, marginTop: 1 }}>{cat.desc}</div>
                </td>
                {players.map((p) => (
                  <td key={p.id} style={{ padding: "4px 4px", textAlign: "center", borderBottom: `1px solid ${C.border}22` }}>
                    {editingCell?.playerId === p.id && editingCell?.key === cat.key ? (
                      <input value={editValue} onChange={(e) => { if (/^\d*$/.test(e.target.value)) setEditValue(e.target.value); }}
                        onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") setEditingCell(null); }}
                        onBlur={confirmEdit} autoFocus
                        style={{ width: 44, padding: "4px", borderRadius: 6, border: `2px solid ${C.orange}`, background: C.surface, color: C.text, fontSize: 14, fontWeight: 700, textAlign: "center", fontFamily: "inherit", outline: "none" }} />
                    ) : (
                      <button onClick={() => startEdit(p.id, cat.key)} style={{ ...pill, padding: "6px 4px", width: "100%", fontSize: 14, fontWeight: 700, background: p.scores[cat.key] !== null ? C.card : C.surface, color: p.scores[cat.key] !== null ? C.text : C.textDim + "66", border: `1px solid ${C.border}`, borderRadius: 6, minWidth: 44 }}>
                        {p.scores[cat.key] !== null ? p.scores[cat.key] : "—"}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Yahtzee bonus */}
            {settings.yzMultiple && (
              <tr>
                <td style={{ padding: "6px 8px", fontWeight: 600, color: C.text, fontSize: 11, position: "sticky", left: 0, background: C.bg }}>Yahtzee Bonus</td>
                {players.map((p) => (
                  <td key={p.id} style={{ padding: "4px 4px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: p.scores.yahtzeeBonus > 0 ? C.green : C.textDim }}>{p.scores.yahtzeeBonus > 0 ? `+${p.scores.yahtzeeBonus}` : "0"}</span>
                      <button onClick={() => addYahtzeeBonus(p.id)} style={{ ...pill, padding: "2px 6px", fontSize: 11, background: C.green + "22", color: C.green, border: `1px solid ${C.green}44`, borderRadius: 6 }}>+100</button>
                    </div>
                  </td>
                ))}
              </tr>
            )}

            {/* Grand total */}
            <tr style={{ background: C.card }}>
              <td style={{ padding: "10px 8px", fontWeight: 800, fontSize: 14, color: C.orange, position: "sticky", left: 0, background: C.card }}>Grand Total</td>
              {players.map((p) => <td key={p.id} style={{ padding: "10px 4px", textAlign: "center", fontWeight: 900, fontSize: 18, color: C.orange }}>{calcGrandTotal(p.scores)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
