import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./css/Login.css";
import userIconBlack from "../assets/userBlack.svg";
import userIconWhite from "../assets/userWhite.svg";
import passwordIconHiddenBlack from "../assets/pw_hiddenBlack.svg";
import passwordIconHiddenWhite from "../assets/pw_hiddenWhite.svg";
import passwordIconVisibleBlack from "../assets/pw_visibleBlack.svg";
import passwordIconVisibleWhite from "../assets/pw_visibleWhite.svg";
import Navbar from "../components/Navbar";
import { getCurrentTheme } from "../components/themeUtils";

const userIcon = getCurrentTheme() === "dark" ? userIconWhite : userIconBlack;
const passwordIconHidden = getCurrentTheme() === "dark" ? passwordIconHiddenWhite : passwordIconHiddenBlack;
const passwordIconVisible = getCurrentTheme() === "dark" ? passwordIconVisibleWhite : passwordIconVisibleBlack;

export default function Login() {
  const [form, setForm] = useState({ login: "", password: "" });
  const [twofaCode, setTwofaCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [twofaRequired, setTwofaRequired] = useState(false);

  const delays = [3, 5, 10, 30, 60];

  useEffect(() => {
    fetch("/api/me", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) navigate("/dashboard");
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldown > 0) {
      setMsg(`Bitte warte noch ${cooldown} Sekunden...`);
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`/api/login?remember=${rememberMe}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.twofa_required) {
        // ✅ Passwort korrekt, 2FA erforderlich
        setTwofaRequired(true);
        setMsg("Bitte gib deinen 2FA Code ein.");
      } else if (res.ok && data.message?.toLowerCase().includes("erfolg")) {
        // ✅ Login ohne 2FA erfolgreich
        setMsg("Login erfolgreich! Weiterleitung...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        // ❌ Fehlversuch
        setMsg(data.error || "Login fehlgeschlagen");
        setFailedAttempts((prev) => {
          const next = prev + 1;
          const wait = delays[Math.min(next - 1, delays.length - 1)];
          setCooldown(wait);
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

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: twofaCode }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMsg("2FA erfolgreich! Weiterleitung...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setMsg(data.error || "Ungültiger 2FA Code");
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

        {!twofaRequired ? (
          // -------------------
          // LOGIN MIT PASSWORT
          // -------------------
          <form onSubmit={handleLogin} className="login-form">
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
                onChange={handleChange}
              />
              <img
                src={showPassword ? passwordIconVisible : passwordIconHidden}
                alt="Toggle Password"
                className="input-icon clickable"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              />
            </div>

            <div
              style={{
                marginTop: "0.25rem",
                textAlign: "center",
                fontSize: "1rem",
              }}
            >
              <Link
                style={{
                  textDecoration: "none",
                  color: "#2E7D67",
                  fontWeight: "bold",
                }}
                to="/forgot-password"
              >
                Passwort vergessen?
              </Link>
            </div>

            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <label style={{ cursor: "pointer" }} htmlFor="remember">
                {" "}
                Angemeldet bleiben
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || cooldown > 0}
            >
              {cooldown > 0
                ? `Warten (${cooldown}s)`
                : loading
                ? "Anmelden..."
                : "Anmelden"}
            </button>

            {msg && (
              <div
                className={`login-msg${
                  msg.toLowerCase().includes("erfolg") ? " success" : " error"
                }`}
              >
                {msg}
              </div>
            )}
          </form>
        ) : (
          // -------------------
          // 2FA CODE EINGABE
          // -------------------
          <form onSubmit={handleVerify2FA} className="twofa-form">
            <div className="twofa-inputs" style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={twofaCode[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/, ""); // nur Zahlen
                    if (!val && !twofaCode[i]) return; // leer lassen erlaubt
                    const newCode = twofaCode.split("");
                    newCode[i] = val;
                    setTwofaCode(newCode.join(""));

                    // automatisch weiter springen
                    if (val && i < 5) {
                      const next = document.getElementById(`twofa-${i + 1}`);
                      (next as HTMLInputElement)?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !twofaCode[i] && i > 0) {
                      const prev = document.getElementById(`twofa-${i - 1}`);
                      (prev as HTMLInputElement)?.focus();
                    }
                  }}
                  id={`twofa-${i}`}
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    textAlign: "center",
                    fontSize: "1.5rem",
                  }}
                  required
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || twofaCode.length < 6}
              style={{ marginTop: "1rem" }}
            >
              {loading ? "Prüfen..." : "Code bestätigen"}
            </button>

            {msg && (
              <div
                className={`login-msg${
                  msg.toLowerCase().includes("erfolg") ? " success" : " error"
                }`}
              >
                {msg}
              </div>
            )}
          </form>
        )}

        {!twofaRequired && (
          <div
            style={{ marginTop: "1.2rem", textAlign: "center", fontSize: "1rem" }}
          >
            Noch keinen Account? <br />{" "}
            <Link
              style={{
                textDecoration: "none",
                color: "#2E7D67",
                fontWeight: "bold",
              }}
              to="/register"
            >
              Hier Registrieren
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
