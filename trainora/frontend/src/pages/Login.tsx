import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./css/Login.css";
import userIcon from "../assets/user.svg";
import passwordIconHidden from "../assets/pw_hidden.svg";
import passwordIconVisible from "../assets/pw_visible.svg";

export default function Login() {
  const [form, setForm] = useState({ login: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

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

  const handleSubmit = async e => {
    e.preventDefault();
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

      if (res.ok && data.message?.toLowerCase().includes("erfolg")) {
        // 👇 Weiterleitung abhängig vom Setup-Status
        setTimeout(() => {
          setLoading(false);
          if (data.setup_completed === "yes") {
            navigate("/dashboard");
          } else {
            navigate("/setup");
          }
        }, 1000);
      } else {
        setMsg(data.error || "Ein Fehler ist aufgetreten");
        setLoading(false);
      }
    } catch (err) {
      setMsg("Netzwerkfehler");
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-tile">
        <h2>Anmelden</h2>
        <form onSubmit={handleSubmit} className="register-form">
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Anmelden..." : "Anmelden"}
            </button>

            {/* Feedback */}
            {msg && <div className={`register-msg${msg.toLowerCase().includes("erfolg") ? " success" : " error"}`}>{msg}</div>}
            </form>
        <div style={{ marginTop: "1.2rem", textAlign: "center", fontSize: "1rem" }}>
            Noch keinen Account? <br /> <Link style={{ textDecoration: "none", color: "#2E7D67", fontWeight: "bold" }} to="/register">Hier Registrieren</Link>
        </div>
      </div>
    </div>
  );
}