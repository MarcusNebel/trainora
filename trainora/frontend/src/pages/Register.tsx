import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./css/Register.css";
import mailIcon from "../assets/mail.svg";
import userIcon from "../assets/user.svg";
import passwordIconHidden from "../assets/pw_hidden.svg";
import passwordIconVisible from "../assets/pw_visible.svg";
import successIcon from "../assets/success.svg";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<{ level: string, color: string }>({ level: "", color: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (form.email) {
      fetch(`/api/check-email?email=${form.email}`)
        .then(res => res.json())
        .then(data => setEmailStatus(data.exists ? "Diese E-Mail existiert bereits" : "E-Mail ist verfügbar"));
    } else setEmailStatus("");
  }, [form.email]);

  useEffect(() => {
    if (form.username) {
      fetch(`/api/check-username?username=${form.username}`)
        .then(res => res.json())
        .then(data => setUsernameStatus(data.exists ? "Benutzername existiert bereits" : "Benutzername ist verfügbar"));
    } else setUsernameStatus("");
  }, [form.username]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.message && data.message.toLowerCase().includes("erfolg")) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMsg(data.error || "Ein Fehler ist aufgetreten");
      }
    } catch (err) {
      setMsg("Netzwerkfehler");
    }

    setLoading(false);
  };

  function getPasswordStrength(password: string): { level: string, color: string } {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        return { level: "schwach", color: "red" };
      case 2:
        return { level: "gut", color: "orange" };
      case 3:
        return { level: "stark", color: "blue" };
      case 4:
        return { level: "sehr stark", color: "green" };
      default:
        return { level: "schwach", color: "red" };
    }
  }

  return (
    <div className="register-page">
      <div className="register-tile">
        {success ? (
          <div style={{ textAlign: "center", fontSize: "1.8rem", color: "green", padding: "2rem" }}>
            <img src={successIcon} style={{ width: "75px", height: "75px" }} alt="Success Icon" />
            <p style={{fontSize: "25px"}}>Registrierung erfolgreich</p>
            <br />
            <p>Weiterleitung...</p>
          </div>
        ) : (
          <>
            <h2>Registrieren</h2>
            <form onSubmit={handleSubmit} className="register-form">
              <div className="input-icon-wrapper">
                <input
                  name="username"
                  placeholder="Benutzername"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoFocus
                />
                <img src={userIcon} alt="User Icon" className="input-icon" />
              </div>
              {usernameStatus && <div className={`status-msg ${usernameStatus.includes("verf") ? "success" : "error"}`}>{usernameStatus}</div>}

              <div className="input-icon-wrapper">
                <input
                  name="email"
                  type="email"
                  placeholder="E-Mail"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <img src={mailIcon} alt="Mail Icon" className="input-icon" />
              </div>
              {emailStatus && <div className={`status-msg ${emailStatus.includes("verf") ? "success" : "error"}`}>{emailStatus}</div>}

              <div className="input-icon-wrapper password-with-toggle">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Passwort"
                  value={form.password}
                  onChange={(e) => {
                    const pwd = e.target.value;
                    setForm({ ...form, password: pwd });
                    setPasswordStrength(getPasswordStrength(pwd));
                    setShowPassword(false);
                  }}
                  required
                  minLength={6}
                />
                <img
                  src={showPassword ? passwordIconVisible : passwordIconHidden}
                  alt="Toggle Password"
                  className="input-icon clickable"
                  onClick={() => setShowPassword(prev => !prev)}
                  title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                />
              </div>

              {form.password && (
                <div style={{ color: passwordStrength.color, marginBottom: "0.5rem" }}>
                  Passwortstärke: {passwordStrength.level}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Registriere..." : "Registrieren"}
              </button>

              {msg && <div className={`register-msg${msg.toLowerCase().includes("erfolg") ? " success" : " error"}`}>{msg}</div>}
            </form>

            <div style={{ marginTop: "1.2rem", textAlign: "center", fontSize: "1rem" }}>
              Schon einen Account? <br />
              <Link to="/login" style={{ textDecoration: "none", color: "#2E7D67", fontWeight: "bold" }}>
                Hier anmelden
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
