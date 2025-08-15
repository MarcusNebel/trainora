import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Settings.css"; 
import Sidebar from "../components/Sidebar";
import clearIcon from "../assets/clear.svg"; // Assuming you have a clear icon

export default function Settings() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    birthday: { day: "", month: "", year: "" },
    height_cm: "",
    weight_kg: "",
    activity_level: "",
    goal: "",
    allergies: "",
    email: "",
  username: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Lädt initial die Daten
  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) return navigate("/login");
        const data = await res.json();
        if (!data.user_id) return navigate("/login");
        setAuthorized(true);

        const infoRes = await fetch("/api/settings/user-info", { credentials: "include" });
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          setPersonalInfo({
            birthday: {
              day: infoData.birthday_day || "",
              month: infoData.birthday_month || "",
              year: infoData.birthday_year || "",
            },
            height_cm: infoData.height_cm?.toString() || "",
            weight_kg: infoData.weight_kg?.toString() || "",
            activity_level: infoData.activity_level || "",
            goal: infoData.goal || "",
            allergies: infoData.allergies || "",
            email: infoData.email || "",
            username: infoData.username || "",
          });
        }
      } catch {
        navigate("/login");
      }
    }
    checkAuthAndLoad();
  }, [navigate]);

  // Account löschen
  async function handleDeleteAccount() {
    if (!confirm("Sind Sie sicher, dass Sie Ihr Konto löschen möchten?")) return;
    const res = await fetch("/api/delete-account", { method: "DELETE", credentials: "include" });
    if (res.ok) {
      alert("Ihr Konto wurde erfolgreich gelöscht.");
      await fetch("/api/logout", { method: "GET", credentials: "include" });
      navigate("/login");
    } else {
      alert("Fehler beim Löschen Ihres Kontos.");
    }
  }

  // Persönliche Infos ändern
  const handlePersonalInfoChange = (field: string, value: any) => {
    if (field === "birthday") {
      setPersonalInfo(prev => ({ ...prev, birthday: { ...prev.birthday, ...value } }));
    } else {
      setPersonalInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  async function savePersonalInfo() {
    try {
      const payload = {
        ...personalInfo,
        height_cm: Number(personalInfo.height_cm),
        weight_kg: Number(personalInfo.weight_kg),
      };
      const res = await fetch("/api/settings/update-user-info", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) alert("Persönliche Informationen gespeichert.");
      else alert("Fehler beim Speichern.");
    } catch {
      alert("Netzwerkfehler beim Speichern.");
    }
  }

  // Passwort ändern
  async function changePassword() {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Neue Passwörter stimmen nicht überein.");
      return;
    }
    const res = await fetch("/api/settings/update-password", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
      }),
    });
    if (res.ok) {
      alert("Passwort erfolgreich geändert.");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      const err = await res.json();
      alert(err.error || "Fehler beim Ändern des Passworts.");
    }
  }

  async function saveAccountInfo() {
    try {
      const payload = {
        email: personalInfo.email,
        username: personalInfo.username,
      };
      const res = await fetch("/api/settings/update-account-info", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) alert("Kontoinformationen gespeichert.");
      else {
        const err = await res.json();
        alert(err.error || "Fehler beim Speichern.");
      }
    } catch {
      alert("Netzwerkfehler beim Speichern.");
    }
  }

  function clearBirthday() {
    setPersonalInfo(prev => ({
      ...prev,
      birthday: { day: "", month: "", year: "" }
    }));
  }

  const handleBirthdayInput = (field: "day" | "month" | "year", value: string, maxLength: number) => {
    setPersonalInfo(prev => ({
      ...prev,
      birthday: { ...prev.birthday, [field]: value.slice(0, maxLength) }
    }));

    // Auto-Fokus auf das nächste Feld, wenn maxLength erreicht
    if (value.length >= maxLength) {
      switch (field) {
        case "day":
          document.getElementById("birthday-month")?.focus();
          break;
        case "month":
          document.getElementById("birthday-year")?.focus();
          break;
        default:
          break;
      }
    }
  };

  if (!authorized) return null;

  return (
    <div className="settings-page">
      <Sidebar />
      <div className="settings-page-head">
        <h1 className="h1-settings-head">Einstellungen</h1>
        <p>Verwalte deine Kontodetails</p>
      </div>

      <div className="settings-content">
        <div className="account-settings">
          <h2>Kontoeinstellungen</h2>
          <input className="smaler-input-box-width" type="text" placeholder="Benutzername" value={personalInfo.username} onChange={e => handlePersonalInfoChange("username", e.target.value)} />
          <input className="smaler-input-box-width" type="email" placeholder="Email-Adresse" value={personalInfo.email} onChange={e => handlePersonalInfoChange("email", e.target.value)} />
          <button className="save-info-btn" onClick={saveAccountInfo}>Speichern</button>
        </div>

        <div className="password-settings">
          <h2>Passwort ändern</h2>
          <input className="smaler-input-box-width" type="password" placeholder="Altes Passwort" value={passwordData.oldPassword} onChange={e => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))} />
          <input className="smaler-input-box-width" type="password" placeholder="Neues Passwort" value={passwordData.newPassword} onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} />
          <input className="smaler-input-box-width" type="password" placeholder="Passwort bestätigen" value={passwordData.confirmPassword} onChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} />
          <button className="save-info-btn" onClick={changePassword}>Passwort ändern</button>
        </div>

        <div className="personal-information">
          <h2>Persönliche Informationen</h2>
          <h3>Geburtstag</h3>
          <div className="input-row" style={{display: "flex", gap: "1rem", justifyContent: "flex-start"}}>
            <input
              type="number"
              placeholder="TT"
              value={personalInfo.birthday.day}
              onChange={e => {
                const val = e.target.value.slice(0, 2);
                handlePersonalInfoChange("birthday", { day: val });
                if (val.length === 2) document.getElementById("birthday-month")?.focus();
              }}
              id="birthday-day"
              style={{ width: "60px", cursor: "text" }}
            />
            <input
              type="number"
              placeholder="MM"
              value={personalInfo.birthday.month}
              onChange={e => {
                const val = e.target.value.slice(0, 2);
                handlePersonalInfoChange("birthday", { month: val });
                if (val.length === 2) document.getElementById("birthday-year")?.focus();
              }}
              id="birthday-month"
              style={{ width: "60px", cursor: "text" }}
            />
            <input
              type="number"
              placeholder="JJJJ"
              value={personalInfo.birthday.year}
              onChange={e => {
                const val = e.target.value.slice(0, 4);
                handlePersonalInfoChange("birthday", { year: val });
              }}
              id="birthday-year"
              style={{ width: "80px", cursor: "text" }}
            />
            <button
              className="clear-birthday-btn"
              onClick={clearBirthday}
            >
              <img
                src={clearIcon}
                style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
                alt=""
              />
            </button>
          </div>

          <h3>Größe (cm)</h3>
          <input className="smaler-input-box-width" type="number" placeholder="z.B. 175" value={personalInfo.height_cm} onChange={e => handlePersonalInfoChange("height_cm", e.target.value)} />

          <h3>Gewicht (kg)</h3>
          <input className="smaler-input-box-width" type="number" placeholder="z.B. 70" value={personalInfo.weight_kg} onChange={e => handlePersonalInfoChange("weight_kg", e.target.value)} />

          <h3>Aktivitätslevel</h3>
          <select className="smaler-input-box-width" value={personalInfo.activity_level} onChange={e => handlePersonalInfoChange("activity_level", e.target.value)}>
            <option value="">Bitte wählen...</option>
            <option value="niedrig">Niedrig</option>
            <option value="mittel">Mittel</option>
            <option value="hoch">Hoch</option>
          </select>

          <h3>Ziel</h3>
          <input className="smaler-input-box-width" type="text" placeholder="z.B. fitter werden, Muskeln aufbauen" value={personalInfo.goal} onChange={e => handlePersonalInfoChange("goal", e.target.value)} />

          <h3>Allergien</h3>
          <input className="smaler-input-box-width" type="text" placeholder="z.B. Nüsse, Laktose oder 'Keine'" value={personalInfo.allergies} onChange={e => handlePersonalInfoChange("allergies", e.target.value)} />

          <button className="save-info-btn" onClick={savePersonalInfo}>Speichern</button>
        </div>

        <div className="delete-account">
          <h2 className="delete-account-header">Konto löschen</h2>
          <button className="delete-account-button" onClick={handleDeleteAccount}>Konto löschen</button>
          <p className="warning-text">
            Lösche dein Trainora Konto, inklusive aller persönlichen Daten und Inhalte.
            Das Konto wird sofort gelöscht. Eine Löschung Ihres Kontos ist nicht rückgängig zu machen.
          </p>
        </div>
      </div>
    </div>
  );
}
