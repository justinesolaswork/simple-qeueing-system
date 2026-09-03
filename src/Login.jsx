import { useState } from "react";
import logo from "./logo-web.png";

const PASSCODE = "Marikina1961";
const AUTH_KEY = "sqs:auth";

const colors = {
  blue: "#012277",
  blueDark: "#011a5e",
  bg: "#f3f5fa",
  card: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  accent: "#f4b41a",
  danger: "#c43d2e",
  rule: "#dfe5f0",
};

export default function Login({ onLogin }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (code === PASSCODE) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onLogin();
    } else {
      setError("Incorrect passcode, please try again.");
      setCode("");
    }
  }

  const fontStyles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,600;6..72,800&family=Funnel+Sans:wght@400;500;600;700&display=swap');
    `}</style>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        fontFamily: "'Funnel Sans', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      {fontStyles}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: colors.card,
          border: `1px solid ${colors.rule}`,
          borderRadius: 16,
          padding: "32px 28px",
          boxShadow: "0 8px 24px rgba(1,34,119,0.12)",
          textAlign: "center",
        }}
      >
        <img
          src={logo}
          alt="Logo"
          style={{ height: 60, width: "auto", borderRadius: 10, objectFit: "contain", marginBottom: 16 }}
        />
        <h1
          style={{
            fontFamily: "'Newsreader', serif",
            fontWeight: 800,
            fontSize: 28,
            color: colors.blue,
            margin: "0 0 4px",
            letterSpacing: "-0.01em",
          }}
        >
          SSAM
        </h1>
        <p style={{ color: colors.muted, fontSize: 14, margin: "0 0 22px" }}>
          Enter passcode to open the dashboard
        </p>

        <form onSubmit={submit}>
          <input
            type="password"
            value={code}
            autoFocus
            placeholder="Passcode"
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 16px",
              borderRadius: 12,
              border: `1px solid ${error ? colors.danger : colors.rule}`,
              background: colors.bg,
              color: colors.text,
              fontFamily: "inherit",
              fontSize: 16,
              outline: "none",
              marginBottom: 12,
            }}
          />
          {error && (
            <div style={{ color: colors.danger, fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 12,
              border: "none",
              background: colors.blue,
              color: "#ffffff",
              fontFamily: "'Funnel Sans', sans-serif",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
