import { useState } from "react";
import QueueCashierPanel from "../QueueCashierPanel.jsx";
import QueueTVDisplay from "../QueueTVDisplay.jsx";
import Login from "./Login.jsx";

const VIEWS = {
  cashier: { label: "Cashier Panel", component: QueueCashierPanel },
  tv: { label: "TV Display", component: QueueTVDisplay },
};

const colors = {
  blue: "#012277",
  blueHover: "#1a3da6",
  bg: "#f3f5fa",
  surface: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  accent: "#f4b41a",
  accentInk: "#5c4300",
  rule: "#dfe5f0",
};

export default function App() {
  const [view, setView] = useState("cashier");
  const [showHint, setShowHint] = useState(true);
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("sqs:auth") === "1");

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  const View = VIEWS[view].component;

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: "'Funnel Sans', sans-serif" }}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          gap: 8,
          padding: "10px 14px",
          background: colors.blue,
          borderBottom: "none",
        }}
      >
        {Object.entries(VIEWS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: view === k ? colors.accent : "rgba(255,255,255,0.12)",
              color: view === k ? colors.accentInk : "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {v.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => {
            window.open(window.location.origin + window.location.pathname, "_blank");
            setShowHint(false);
          }}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "rgba(255,255,255,0.12)",
            color: "#ffffff",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Open in new tab
        </button>
      </div>

      {showHint && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: colors.surface,
            border: `1px solid ${colors.rule}`,
            color: colors.muted,
            padding: "8px 14px",
            borderRadius: 10,
            fontSize: 13,
            zIndex: 50,
          }}
        >
          Tip: open the same URL in two tabs — one for the cashier panel, one for the TV, then resize
          for fullscreen ({window.screen.width}).
        </div>
      )}

      <div style={{ paddingTop: 54 }}>
        <View />
      </div>
    </div>
  );
}
