import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./css/Login.css";
import userIcon from "../assets/user.svg";
import passwordIconHidden from "../assets/pw_hidden.svg";
import passwordIconVisible from "../assets/pw_visible.svg";
import Navbar from "../components/Navbar";

export default function Login() {
  const [form, setForm] = useState({ login: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const [cooldown, setCooldown ] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  
  const delays = [3, 5, 10, 30, 60];

  useEffect(() => {
    fetch("/api/me", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          // Wenn Session existiert → Weiterleitung
          navigate("/dashboard");
        }
      })
      .catch(() => {
        // Fehler ignorieren → einfach Login-Seite anzeigen
      });
  }, []);

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wenn noch Cooldown aktiv → abbrechen
    if (cooldown > 0) {
      setMsg(`Bitte warte noch ${cooldown} Sekunden...`);
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.message?.toLowerCase().includes("erfolg")) {
        // ✅ Login erfolgreich
        setFailedAttempts(0);
        setCooldown(0);
        setMsg("Login erfolgreich! Weiterleitung...");

        // Weiterleitung
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        // ❌ Fehlversuch
        setMsg(data.error || "Login fehlgeschlagen");

        setFailedAttempts((prev) => {
          const next = prev + 1;
          const wait = delays[Math.min(next - 1, delays.length - 1)];

          setCooldown(wait);

          // Countdown runterzählen
          let t = wait;
          const interval = setInterval(() => {
            t--;
            setCooldown(t);
            if (t <= 0) clearInterval(interval);
          }, 1000);

          return next;
        });
      }
    } catch {
      setMsg("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-tile">
        <Navbar />
        <h2>Anmelden</h2>
        <form onSubmit={handleSubmit} className="login-form">
            <div className="input-icon-wrapper">
                <input
                name="login"
                type="text"
                placeholder="Benutzername oder E-Mail"
                value={form.login}
                onChange={handleChange}
                required
                autoFocus
                />
                <img src={userIcon} alt="User Icon" className="input-icon" />
            </div>

            {/* Passwort */}
            <div className="input-icon-wrapper password-with-toggle">
                <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Passwort"
                value={form.password}
                required
                minLength={6}
                onChange={(e) => {
                    const pwd = e.target.value;
                    setForm({ ...form, password: pwd });
                    setShowPassword(false);
                    handleChange(e);
                }}
                />
                <img
                src={showPassword ? passwordIconVisible : passwordIconHidden}
                alt="Toggle Password"
                className="input-icon clickable"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                />
            </div>

            <div style={{ marginTop: "0.25rem", textAlign: "center", fontSize: "1rem" }}>
              <Link style={{ textDecoration: "none", color: "#2E7D67", fontWeight: "bold" }} to="/forgot-password">Passwort vergessen?</Link>
            </div>

            <div className="remember-me">
                <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{cursor: "pointer"}}
                />
                <label style={{cursor: "pointer"}} htmlFor="remember"> Angemeldet bleiben</label>
            </div>

            {/* Button */}
            <button type="submit" className="btn btn-primary" disabled={loading || cooldown > 0}>
              {cooldown > 0 ? `Warten (${cooldown}s)` : loading ? "Anmelden..." : "Anmelden"}
            </button>

            {/* Feedback */}
            {msg && <div className={`login-msg${msg.toLowerCase().includes("erfolg") ? " success" : " error"}`}>{msg}</div>}
            </form>
        <div style={{ marginTop: "1.2rem", textAlign: "center", fontSize: "1rem" }}>
            Noch keinen Account? <br /> <Link style={{ textDecoration: "none", color: "#2E7D67", fontWeight: "bold" }} to="/register">Hier Registrieren</Link>
        </div>
      </div>
    </div>
  );
}