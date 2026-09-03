import { useState, useEffect, useRef } from "react";
import { playCallSound, playRecallSound } from "./src/sounds.js";
import logo from "./src/logo-web.png";

const CASHIER_IDS = [1, 2, 3, 4];
const STORAGE_KEY = "cashier-queue-state";

function defaultState() {
  const cashiers = {};
  CASHIER_IDS.forEach((id) => (cashiers[id] = { current: null, calledAt: 0, recallAt: 0 }));
  return { nextTicket: 1, cashiers };
}

export default function QueueTVDisplay() {
  const [state, setState] = useState(defaultState());
  const [lastSync, setLastSync] = useState("syncing…");
  const [clock, setClock] = useState("--:--");
  const [flashing, setFlashing] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef(null);
  const prevStateRef = useRef(defaultState());
  const flashTimers = useRef({});

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      (rootRef.current?.requestFullscreen?.() || Promise.resolve())
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    async function poll() {
      try {
        const result = await window.storage.get(STORAGE_KEY, true);
        const next = result && result.value ? JSON.parse(result.value) : defaultState();

        const prev = prevStateRef.current;
        const newFlashes = {};
        CASHIER_IDS.forEach((id) => {
          const p = prev.cashiers?.[id];
          const c = next.cashiers?.[id];
          if (p && c && (p.current !== c.current || p.recallAt !== c.recallAt)) {
            newFlashes[id] = true;
          }
        });
        if (Object.keys(newFlashes).length) {
          setFlashing((f) => ({ ...f, ...newFlashes }));
          const anyCall = CASHIER_IDS.some((id) => {
            const p = prev.cashiers?.[id];
            const c = next.cashiers?.[id];
            return p && c && p.current !== c.current;
          });
          if (anyCall) {
            playCallSound();
          } else {
            playRecallSound();
          }
          Object.keys(newFlashes).forEach((id) => {
            clearTimeout(flashTimers.current[id]);
            flashTimers.current[id] = setTimeout(() => {
              setFlashing((f) => ({ ...f, [id]: false }));
            }, 1600);
          });
        }

        prevStateRef.current = next;
        setState(next);
        setLastSync("updated " + new Date().toLocaleTimeString());
      } catch (e) {
        setLastSync("waiting for first call…");
      }
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function tick() {
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const colors = {
    blue: "#012277",
    blueDark: "#011a5e",
    blueHover: "#1a3da6",
    bg: "#f3f5fa",
    card: "#ffffff",
    text: "#1f2937",
    muted: "#6b7280",
    accent: "#f4b41a",
    live: "#0a9250",
    rule: "#dfe5f0",
  };

  return (
    <div
      ref={rootRef}
      style={{
        height: "100vh",
        width: "100%",
        background: colors.bg,
        color: colors.text,
        fontFamily: "'Funnel Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: "clamp(14px,2vw,32px)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,600;6..72,800&family=Funnel+Sans:wght@400;500;600;700&display=swap');
        @keyframes queueFlash {
          0% { box-shadow: 0 0 0 0 rgba(244,180,26,0); }
          15% { box-shadow: 0 0 0 8px rgba(244,180,26,0.4); }
          100% { box-shadow: 0 0 0 0 rgba(244,180,26,0); }
        }
      `}</style>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "clamp(12px,2vh,24px)",
          borderBottom: `3px solid ${colors.blue}`,
          marginBottom: "clamp(16px,2.5vh,32px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px,1.2vw,20px)" }}>
          <img
            src={logo}
            alt="Logo"
            style={{
              height: "clamp(44px,6vh,72px)",
              width: "auto",
              borderRadius: 8,
              objectFit: "contain",
            }}
          />
          <h1
            style={{
              fontFamily: "'Newsreader', serif",
              fontWeight: 800,
              fontSize: "clamp(22px,2.4vw,36px)",
              margin: 0,
              color: colors.blue,
              letterSpacing: "-0.01em",
            }}
          >
            Now Serving
          </h1>
        </div>
        <div
          style={{
            fontVariantNumeric: "tabular-nums",
            color: colors.blue,
            fontWeight: 600,
            fontFamily: "'Newsreader', serif",
            fontSize: "clamp(32px,3.2vw,52px)",
          }}
        >
          {clock}
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "clamp(12px,1.6vw,24px)",
          minHeight: 0,
        }}
      >
        {CASHIER_IDS.map((id) => {
          const c = state.cashiers?.[id] || { current: null };
          const hasNumber = c.current !== null && c.current !== undefined;
          return (
            <div
              key={id}
              style={{
                background: colors.card,
                border: `1px solid ${colors.rule}`,
                borderRadius: 14,
                boxShadow: hasNumber ? "0 8px 20px rgba(1,34,119,0.12)" : "0 2px 8px rgba(1,34,119,0.06)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transition: "box-shadow 0.4s ease, border-color 0.4s ease",
                animation: flashing[id] ? "queueFlash 1.6s ease" : "none",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "18px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(13px,1.1vw,17px)",
                    color: hasNumber ? colors.blue : colors.muted,
                    letterSpacing: "0.04em",
                    fontWeight: 600,
                  }}
                >
                  Cashier {id}
                </div>
                <div
                  style={{
                    fontFamily: "'Newsreader', serif",
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "clamp(64px,9vw,140px)",
                    lineHeight: 1.05,
                    color: hasNumber ? colors.blue : "#d3d9e6",
                  }}
                >
                  {hasNumber ? c.current : "—"}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "clamp(12px,1vw,15px)",
                    color: colors.muted,
                    fontWeight: 500,
                  }}
                >
                  {hasNumber ? "Now serving" : "Waiting"}
                </div>
              </div>
              <div
                style={{
                  padding: "clamp(12px,1.6vh,18px)",
                  background: hasNumber ? colors.blue : "#e9edf6",
                  color: hasNumber ? "#ffffff" : colors.muted,
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "clamp(12px,1vw,15px)",
                  transition: "background 0.4s ease, color 0.4s ease",
                }}
              >
                {hasNumber ? "Cashier " + id + " · Serving" : "Cashier " + id + " · Available"}
              </div>
            </div>
          );
        })}
      </div>

      <footer
        style={{
          marginTop: "clamp(14px,2vh,22px)",
          display: "flex",
          justifyContent: "space-between",
          color: colors.muted,
          fontSize: "clamp(11px,0.9vw,14px)",
        }}
      >
        <span>
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: colors.live,
              marginRight: 6,
              verticalAlign: "middle",
            }}
          />
          Live
        </span>
        <button
          onClick={toggleFullscreen}
          style={{
            background: isFullscreen ? "transparent" : colors.blue,
            color: isFullscreen ? colors.muted : "#ffffff",
            border: isFullscreen ? `1px solid ${colors.rule}` : "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: "clamp(11px,0.9vw,14px)",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
        <span>{lastSync}</span>
      </footer>
    </div>
  );
}
