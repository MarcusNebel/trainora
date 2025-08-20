import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/EnterCode.css";
import Navbar from "../components/Navbar";

export default function EnterResetCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState(Array(6).fill(""));
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value;

    if (!/^\d?$/.test(val)) return;

    const newCode = [...code];
    newCode[idx] = val;
    setCode(newCode);

    if (val && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }

    if (newCode.every((c) => c !== "")) {
      handleSubmit(newCode.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleSubmit = async (fullCode: string) => {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Code in URL mitgeben
        navigate(`/reset-password?code=${fullCode}`);
      } else {
        setMsg(data.error || "Fehler beim Verifizieren des Codes.");
        setCode(Array(6).fill(""));
        inputsRef.current[0]?.focus();
      }
    } catch {
      setMsg("❌ Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-page">
      <div className="code-tile">
        <Navbar />
        <h2>Bestätigungscode eingeben</h2>
        <p style={{ textAlign: "center", marginBottom: "1rem" }}>
          Gib den 6-stelligen Code ein, den du per E-Mail erhalten hast.
        </p>

        <div className="code-input-wrapper">
          {code.map((c, idx) => (
            <input
              key={idx}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={c}
              ref={(el) => (inputsRef.current[idx] = el)}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              disabled={loading}
              className="code-input"
            />
          ))}
        </div>

        {msg && <div className={`code-msg error`} style={{ marginTop: "1rem" }}>{msg}</div>}
      </div>
    </div>
  );
}
