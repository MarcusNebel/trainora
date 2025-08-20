import { useState } from "react";
import { Link } from "react-router-dom";
import "./css/ForgotPassword.css";
import Navbar from "../components/Navbar";
import userIcon from "../assets/user.svg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/sendcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/enter-code";
      } else {
        setMsg(data.error || "Fehler beim Senden der E-Mail.");
      }
    } catch {
      setMsg("❌ Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-tile">
        <Navbar />
        <h2>Passwort vergessen</h2>
        <p style={{ textAlign: "center", marginBottom: "1rem" }}>
          Gib deine E-Mail-Adresse ein, um einen Bestätigungscode zu erhalten.
        </p>
        <form onSubmit={handleSubmit} className="forgot-form">
          {/* E-Mail Eingabe */}
          <div className="input-icon-wrapper">
            <input
              type="email"
              name="email"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <img src={userIcon} alt="User Icon" className="input-icon" />
          </div>

          {/* Button */}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Sende..." : "Code senden"}
          </button>

          {/* Feedback */}
          {msg && <div className={`forgot-msg${msg.startsWith("✅") ? " success" : " error"}`}>{msg}</div>}
        </form>

        <div style={{ marginTop: "1.2rem", textAlign: "center", fontSize: "1rem" }}>
          <Link
            style={{ textDecoration: "none", color: "#2E7D67", fontWeight: "bold" }}
            to="/login"
          >
            Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}
