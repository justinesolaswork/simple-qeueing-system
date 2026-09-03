import { useState, useEffect, useRef, useCallback } from "react";
import { playClickSound } from "./src/sounds.js";
import logo from "./src/logo-web.png";

const CASHIER_IDS = [1, 2, 3, 4];
const MAX_TICKET = 200;
const STORAGE_KEY = "cashier-queue-state";
const ASSIGN_KEY = "assigned-cashier-id";

function defaultState() {
  const cashiers = {};
  CASHIER_IDS.forEach((id) => (cashiers[id] = { current: null, calledAt: 0, recallAt: 0 }));
  return { nextTicket: 1, cashiers };
}

const colors = {
  blue: "#012277",
  blueDark: "#011a5e",
  blueHover: "#1a3da6",
  bg: "#f3f5fa",
  card: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  accent: "#f4b41a",
  accentInk: "#5c4300",
  live: "#0a9250",
  rule: "#dfe5f0",
  danger: "#c43d2e",
};

async function loadState() {
  try {
    const result = await window.storage.get(STORAGE_KEY, true);
    return result && result.value ? JSON.parse(result.value) : defaultState();
  } catch (e) {
    return defaultState();
  }
}

async function saveState(state) {
  await window.storage.set(STORAGE_KEY, JSON.stringify(state), true);
}

export default function QueueCashierPanel() {
  const [myId, setMyId] = useState(null);
  const [checkingAssignment, setCheckingAssignment] = useState(true);
  const [state, setState] = useState(defaultState());
  const [toast, setToast] = useState("");
  const [customNum, setCustomNum] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  }, []);

  const refresh = useCallback(async () => {
    const s = await loadState();
    setState(s);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get(ASSIGN_KEY, false);
        if (saved && saved.value) {
          setMyId(parseInt(saved.value, 10));
        }
      } catch (e) {
        // no prior assignment
      }
      setCheckingAssignment(false);
    })();
  }, []);

  useEffect(() => {
    if (myId === null) return;
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [myId, refresh]);

  async function assignCashier(id) {
    setMyId(id);
    try {
      await window.storage.set(ASSIGN_KEY, String(id), false);
    } catch (e) {
      // non-fatal
    }
  }

  function switchWindow() {
    setMyId(null);
  }

  async function callNext() {
    const s = await loadState();
    const ticket = s.nextTicket || 1;
    const prev = s.cashiers[myId] || {};
    s.cashiers[myId] = { current: ticket, last: prev.current ?? null, calledAt: Date.now(), recallAt: Date.now() };
    s.nextTicket = ticket >= MAX_TICKET ? 1 : ticket + 1;
    await saveState(s);
    setState(s);
    showToast("Calling number " + ticket);
  }

  async function previousNumber() {
    const s = await loadState();
    const c = s.cashiers[myId];
    if (!c || c.last === null || c.last === undefined) return;
    const prev = c.current;
    c.last = prev ?? c.last;
    c.current = c.last;
    c.recallAt = Date.now();
    await saveState(s);
    setState(s);
    playClickSound();
    showToast("Previous number " + c.current);
  }

  async function callCustom(target) {
    const num = parseInt(target, 10);
    if (isNaN(num) || num < 1 || num > MAX_TICKET) return;
    const s = await loadState();
    const prev = s.cashiers[myId] || {};
    s.cashiers[myId] = { current: num, last: prev.current ?? null, calledAt: Date.now(), recallAt: Date.now() };
    s.nextTicket = num >= MAX_TICKET ? 1 : num + 1;
    await saveState(s);
    setState(s);
    showToast("Calling number " + num);
  }

  async function recall() {
    const s = await loadState();
    const c = s.cashiers[myId];
    if (!c || c.current === null || c.current === undefined) return;
    c.recallAt = Date.now();
    await saveState(s);
    setState(s);
    playClickSound();
    showToast("Recalled number " + c.current);
  }

  async function transferTo(targetId) {
    const s = await loadState();
    const mine = s.cashiers[myId];
    if (!mine || mine.current === null || mine.current === undefined) return;
    const num = mine.current;
    s.cashiers[targetId] = { current: num, last: mine.last ?? null, calledAt: Date.now(), recallAt: Date.now() };
    s.cashiers[myId] = { current: null, last: num, calledAt: mine.calledAt, recallAt: mine.recallAt };
    await saveState(s);
    setState(s);
    playClickSound();
    showToast("Transferred number " + num + " to Cashier " + targetId);
  }

  async function clearCurrent() {
    const s = await loadState();
    s.cashiers[myId] = { current: null, calledAt: Date.now(), recallAt: 0 };
    await saveState(s);
    setState(s);
    playClickSound();
    showToast("Cleared");
  }

  const fontStyles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,600;6..72,800&family=Funnel+Sans:wght@400;500;600;700&display=swap');
    `}</style>
  );

  if (checkingAssignment) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg }}>
        {fontStyles}
      </div>
    );
  }

  const btnBase = {
    width: "100%",
    border: "none",
    borderRadius: 12,
    padding: 18,
    fontFamily: "'Funnel Sans', sans-serif",
    fontWeight: 600,
    fontSize: 16,
    cursor: "pointer",
    marginBottom: 12,
  };

  const c = state.cashiers?.[myId] || { current: null };
  const hasNumber = c.current !== null && c.current !== undefined;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        fontFamily: "'Funnel Sans', sans-serif",
      }}
    >
      {fontStyles}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src={logo}
              alt="Logo"
              style={{ height: 44, width: "auto", borderRadius: 8, objectFit: "contain" }}
            />
            <h1 style={{ fontFamily: "'Newsreader', serif", fontWeight: 800, fontSize: 24, margin: 0, color: colors.blue }}>
              Cashier Panel{myId !== null ? ` — YOUR CASHIER #${myId}` : ""}
            </h1>
          </div>
          {myId !== null && (
            <button
              onClick={switchWindow}
              style={{
                color: colors.muted,
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "underline",
                background: "none",
                border: "none",
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              switch window
            </button>
          )}
        </div>

        {myId === null ? (
          <div style={{ paddingTop: "10vh", textAlign: "center" }}>
            <p style={{ color: colors.muted, marginBottom: 22, fontSize: 15 }}>
              Which cashier window is this?
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 14,
                maxWidth: 340,
                margin: "0 auto",
              }}
            >
              {CASHIER_IDS.map((id) => (
              <button
                key={id}
                onClick={() => {
                  playClickSound();
                  assignCashier(id);
                }}
                  style={{
                    fontFamily: "'Newsreader', serif",
                    fontWeight: 800,
                    fontSize: 28,
                    padding: "26px 0",
                    background: colors.card,
                    border: `1px solid ${colors.rule}`,
                    borderRadius: 14,
                    color: colors.blue,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(1,34,119,0.08)",
                  }}
                >
                  Cashier {id}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 380px", minWidth: 300 }}>
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.rule}`,
                  borderRadius: 16,
                  padding: "30px 20px",
                  textAlign: "center",
                  marginBottom: 22,
                  boxShadow: "0 4px 14px rgba(1,34,119,0.08)",
                }}
              >
                <div style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>
                  Cashier {myId}
                </div>
                <div
                  style={
                    hasNumber
                      ? {
                          fontFamily: "'Newsreader', serif",
                          fontWeight: 800,
                          fontSize: 88,
                          lineHeight: 1,
                          color: colors.blue,
                          fontVariantNumeric: "tabular-nums",
                        }
                      : { color: colors.muted, fontSize: 28, padding: "26px 0" }
                  }
                >
                  {hasNumber ? c.current : "No customer"}
                </div>
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  callNext();
                }}
                style={{ ...btnBase, background: colors.blue, color: "#ffffff" }}
              >
                Call next number
              </button>
              <button
                onClick={recall}
                disabled={!hasNumber}
                style={{
                  ...btnBase,
                  background: colors.card,
                  color: colors.text,
                  border: `1px solid ${colors.rule}`,
                  opacity: hasNumber ? 1 : 0.4,
                  cursor: hasNumber ? "pointer" : "not-allowed",
                }}
              >
                Recall (flash on screen)
              </button>

              <button
                onClick={previousNumber}
                disabled={!c.last}
                style={{
                  ...btnBase,
                  background: colors.card,
                  color: colors.blue,
                  border: `1px solid ${colors.rule}`,
                  opacity: c.last ? 1 : 0.4,
                  cursor: c.last ? "pointer" : "not-allowed",
                }}
              >
                Previous number
              </button>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <input
                  type="number"
                  min="1"
                  max={MAX_TICKET}
                  value={customNum}
                  placeholder="Custom number"
                  onChange={(e) => setCustomNum(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      callCustom(customNum);
                      setCustomNum("");
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${colors.rule}`,
                    background: colors.card,
                    color: colors.text,
                    fontFamily: "inherit",
                    fontSize: 15,
                  }}
                />
                <button
                  onClick={() => {
                    playClickSound();
                    callCustom(customNum);
                    setCustomNum("");
                  }}
                  style={{
                    padding: "0 20px",
                    borderRadius: 12,
                    border: "none",
                    background: colors.accent,
                    color: "#5c4300",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Call
                </button>
              </div>

              <div style={{ color: colors.muted, fontSize: 13, margin: "22px 0 8px" }}>
                Transfer current number to cashier:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
                {CASHIER_IDS.filter((id) => id !== myId).map((id) => (
                  <button
                    key={id}
                    onClick={() => transferTo(id)}
                    disabled={!hasNumber}
                    title={"Transfer to Cashier " + id}
                    style={{
                      padding: "12px 0",
                      borderRadius: 10,
                      border: `1px solid ${colors.rule}`,
                      background: colors.card,
                      color: colors.blue,
                      fontFamily: "'Newsreader', serif",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: hasNumber ? "pointer" : "not-allowed",
                      opacity: hasNumber ? 1 : 0.4,
                    }}
                  >
                    Cashier {id}
                  </button>
                ))}
              </div>

              <button
                onClick={clearCurrent}
                disabled={!hasNumber}
                style={{
                  ...btnBase,
                  background: "transparent",
                  color: colors.danger,
                  border: "1px solid rgba(196,61,46,0.4)",
                  opacity: hasNumber ? 1 : 0.4,
                  cursor: hasNumber ? "pointer" : "not-allowed",
                }}
              >
                Clear / done
              </button>
            </div>

            <div style={{ flex: "1 1 460px", minWidth: 360 }}>
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.rule}`,
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: "0 4px 14px rgba(1,34,119,0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{ fontFamily: "'Newsreader', serif", fontWeight: 800, fontSize: 18, margin: 0, color: colors.blue }}>
                    Queue View
                  </h2>
                  <button
                    onClick={() => setShowPreview((v) => !v)}
                    style={{
                      background: "none",
                      border: "none",
                      color: colors.muted,
                      fontSize: 12,
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontFamily: "inherit",
                      padding: 0,
                    }}
                  >
                    {showPreview ? "Hide" : "Show"}
                  </button>
                </div>

                {showPreview &&
                  CASHIER_IDS.map((id) => {
                    const row = state.cashiers?.[id];
                    const num = row?.current ?? null;
                    const serving = num !== null && num !== undefined;
                    return (
                      <div
                        key={id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          borderRadius: 10,
                          marginBottom: 8,
                          background: serving ? colors.bg : "#f8fafc",
                          border: `1px solid ${colors.rule}`,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: serving ? colors.text : colors.muted }}>
                          Cashier {id}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Newsreader', serif",
                            fontWeight: 800,
                            fontSize: 18,
                            color: serving ? colors.blue : "#c3c9d4",
                          }}
                        >
                          {serving ? "#" + num : "Waiting"}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            background: colors.blue,
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            opacity: toast ? 1 : 0,
            pointerEvents: "none",
            transition: "opacity 0.25s ease",
          }}
        >
          {toast}
        </div>
      </div>
    </div>
  );
}
