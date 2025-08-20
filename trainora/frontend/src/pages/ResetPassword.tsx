import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./css/ResetPassword.css";
import passwordIconHidden from "../assets/pw_hidden.svg";
import passwordIconVisible from "../assets/pw_visible.svg";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Reset-Code aus URL holen
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    if (!code) {
      setMsg("Fehler: Kein Reset-Code in der URL gefunden.");
      return;
    }

    if (password.length < 6) {
      setMsg("Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password }), // ✅ Code mitsenden
      });

      const data = await res.json();

      if (res.ok) {
        setMsg("Passwort erfolgreich zurückgesetzt! Weiterleitung...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMsg(data.error || "Fehler beim Zurücksetzen des Passworts.");
      }
    } catch {
      setMsg("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-tile">
        <Navbar />
        <h2>Passwort zurücksetzen</h2>
        <p style={{ textAlign: "center", marginBottom: "1rem" }}>
          Gib dein neues Passwort ein und bestätige es.
        </p>

        <form onSubmit={handleSubmit} className="reset-form">
          {/* Neues Passwort */}
          <div className="input-icon-wrapper password-with-toggle">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Neues Passwort"
              value={password}
              required
              minLength={6}
              onChange={(e) => {
                setPassword(e.target.value);
                setShowPassword(false);
              }}
            />
            <img
              src={showPassword ? passwordIconVisible : passwordIconHidden}
              alt="Toggle Password"
              className="input-icon clickable"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
            />
          </div>

          {/* Passwort bestätigen */}
          <div className="input-icon-wrapper password-with-toggle">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Passwort bestätigen"
              value={confirmPassword}
              required
              minLength={6}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setShowConfirmPassword(false);
              }}
            />
            <img
              src={showConfirmPassword ? passwordIconVisible : passwordIconHidden}
              alt="Toggle Password"
              className="input-icon clickable"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              title={showConfirmPassword ? "Passwort verbergen" : "Passwort anzeigen"}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Sende..." : "Passwort ändern"}
          </button>

          {msg && (
            <div className={`reset-msg ${msg.includes("erfolgreich") ? "success" : "error"}`}>
              {msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
