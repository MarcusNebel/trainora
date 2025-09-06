import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import "./css/Settings.css"; 
import Sidebar from "../components/Sidebar";
import clearIconBlack from "../assets/clearBlack.svg";
import clearIconWhite from "../assets/clearWhite.svg";
import successIconBlack from "../assets/successBlack.svg";
import ErrorIconBlack from "../assets/errorBlack.svg";
import ErrorIconWhite from "../assets/errorWhite.svg";
import FalseIconBlack from "../assets/false-black.svg";
import FalseIconWhite from "../assets/false-white.svg";
import TrueIconBlack from "../assets/successBlack.svg";
import TrueIconWhite from "../assets/successWhite.svg";
import DarkModeToggle from "../components/DarkModeToggle";
import CustomDropdown from "../components/CustomDropdown";
import { getCurrentTheme } from "../components/themeUtils";

interface ProfilePictureProps {
  userId: string;
  apiBaseUrl?: string; // Standard: "/api/profile"
}

const ErrorIcon = getCurrentTheme() === "dark" ? ErrorIconWhite : ErrorIconBlack;
const FalseIcon = getCurrentTheme() === "dark" ? FalseIconWhite : FalseIconBlack;
const TrueIcon = getCurrentTheme() === "dark" ? TrueIconWhite : TrueIconBlack;

const userId = localStorage.getItem("user_id") || "";
const apiBaseUrl = "/api/profile";

export default function Settings() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [authorized, setAuthorized] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteModalShow, setDeleteModalShow] = useState(false); // für Animation
  const [enabled, setEnabled] = useState(false);

  const [twoFAModalVisible, setTwoFAModalVisible] = useState(false);
  const [twoFAQRCode, setTwoFAQRCode] = useState("");
  const [twoFASecret, setTwoFASecretCode] = useState("");
  const [twoFACode, setTwoFACode] = useState("");

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  const [deletePictureModalVisible, setDeletePictureModalVisible] = useState(false);
  const [deletePictureModalShow, setDeletePictureModalShow] = useState(false);

  const handleDeletePicture = () => {
    setDeletePictureModalVisible(true);
    setTimeout(() => setDeletePictureModalShow(true), 10); // für CSS-Transition
  };

  const confirmDeletePicture = async () => {
    setDeletePictureModalShow(false); // Modal fade-out starten
    setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/delete/${userId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Löschen fehlgeschlagen");

        setCurrentImage(null);
        setNewFile(null);
        setPreview(null);
        showToast("Profilbild gelöscht!", "success");
      } catch (err) {
        console.error(err);
        showToast("Löschen fehlgeschlagen!", "error");
      } finally {
        setLoading(false);
        setDeletePictureModalVisible(false); // Modal komplett schließen
      }
    }, 300); // Wartezeit für die CSS-Transition
  };

  function generateMonogram(name: string, size = 150): string {
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    
    // Text
    ctx.fillStyle = "var(--white)";
    ctx.font = `${size / 2}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, size / 2, size / 2);
    
    return canvas.toDataURL(); // Base64-Bild
  }

  useEffect(() => {
    fetch("/api/get-username")
      .then(res => res.json())
      .then(data => setUsername(data.username))
      .catch(err => console.error(err));
  }, []);

  const userInitials = username
  ? username
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
  : "?";

  useEffect(() => {
    async function loadUser() {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.user_id);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`${apiBaseUrl}/pictures/${userId}`)
      .then(res => {
        if (res.ok) return res.blob();
        throw new Error("Kein Bild");
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        setCurrentImage(url);
      })
      .catch(() => setCurrentImage(null)); // <-- wichtig für Fallback
  }, [userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!newFile) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("profile_picture", newFile);

    try {
      const response = await fetch(`${apiBaseUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload fehlgeschlagen");

      setCurrentImage(preview || null);
      setNewFile(null);
      setPreview(null);
      alert("Profilbild erfolgreich hochgeladen!");
    } catch (err) {
      console.error(err);
      alert("Upload fehlgeschlagen!");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000); // nach 3s ausblenden
  };

  // ---------- 2FA Funktionen ----------
  const handle2FASwitch = async (checked: boolean) => {
    if (checked) {
      // Setup starten
      try {
        const res = await fetch("/api/2fa/setup", { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error("Fehler beim 2FA-Setup");
        const data = await res.json();
        setTwoFAQRCode(data.otpauth_url);
        setTwoFASecretCode(data.secret);
        setTwoFAModalVisible(true); // Modal öffnen
      } catch {
        showToast("Fehler beim Setup der Zwei-Faktor-Authentifizierung.", "error");
        setEnabled(false);
      }
    } else {
      // Deaktivieren
      try {
        const res = await fetch("/api/2fa/disable", { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error("Fehler beim Deaktivieren");
        showToast("2FA erfolgreich deaktiviert.", "success");
        setEnabled(false);
      } catch {
        showToast("Fehler beim Deaktivieren der 2FA.", "error");
        setEnabled(true);
      }
    }
  };

  const confirm2FA = async () => {
    try {
      const res = await fetch("/api/2fa/enable", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFACode }),
      });
      if (res.ok) {
        showToast("2FA erfolgreich aktiviert!", "success");
        setEnabled(true);
        setTwoFAModalVisible(false);
        setTwoFACode("");
      } else {
        const err = await res.json();
        showToast(err.error || "Ungültiger Code.", "error");
      }
    } catch {
      showToast("Netzwerkfehler.", "error");
    }
  };

  useEffect(() => {
    if (twoFAModalVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [twoFAModalVisible]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      confirm2FA(); // Deine Funktion zum Aktivieren der 2FA
    }
  };

  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const res = await fetch("/api/2fa/status", { credentials: "include" });
        if (!res.ok) throw new Error("Fehler beim Abrufen des 2FA-Status");
        const data = await res.json();
        setEnabled(data.enabled);  // true oder false
      } catch (err) {
        console.error(err);
        showToast("Fehler beim Laden des 2FA-Status.", "error");
      }
    };

    if (authorized) {
      fetch2FAStatus();
    }
  }, [authorized]);

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

  useEffect(() => {
    if (!deleteModalShow && deleteModalVisible) {
      const timer = setTimeout(() => setDeleteModalVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [deleteModalShow, deleteModalVisible]);

  // Account löschen
  async function handleDeleteAccountConfirmed() {
    setDeleteModalShow(false); // fade-out starten
    setTimeout(async () => {
      try {
        const res = await fetch("/api/delete-account", { method: "DELETE", credentials: "include" });
        if (res.ok) {
          showToast("Ihr Konto wurde erfolgreich gelöscht.", "success");
          await fetch("/api/logout", { method: "GET", credentials: "include" });
          navigate("/login");
        } else {
          showToast("Fehler beim Löschen Ihres Kontos.", "error");
        }
      } catch {
        showToast("Netzwerkfehler beim Löschen.", "error");
      } finally {
        setDeleteModalVisible(false);
      }
    }, 300); // Zeit für die CSS-Transition
  }

  // Persönliche Infos ändern
  const handlePersonalInfoChange = (field: string, value: any) => {
    if (field === "birthday") {
      setPersonalInfo(prev => ({ ...prev, birthday: { ...prev.birthday, ...value } }));
    } else {
      setPersonalInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  // Persönliche Infos speichern
  async function savePersonalInfo() {
    try {
      const payload = { ...personalInfo, height_cm: Number(personalInfo.height_cm), weight_kg: Number(personalInfo.weight_kg) };
      const res = await fetch("/api/settings/update-user-info", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) showToast("Persönliche Informationen gespeichert.", "success");
      else showToast("Fehler beim Speichern.", "error");
    } catch {
      showToast("Netzwerkfehler beim Speichern.", "error");
    }
  }

  // Passwort ändern
  async function changePassword() {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Neue Passwörter stimmen nicht überein.", "error");
      return;
    }
    try {
      const res = await fetch("/api/settings/update-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: passwordData.oldPassword, new_password: passwordData.newPassword }),
      });
      if (res.ok) {
        showToast("Passwort erfolgreich geändert.", "success");
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const err = await res.json();
        showToast(err.error || "Fehler beim Ändern des Passworts.", "error");
      }
    } catch {
      showToast("Netzwerkfehler beim Ändern des Passworts.", "error");
    }
  }

  // Kontoinfos speichern
  async function saveAccountInfo() {
    try {
      const payload = { email: personalInfo.email, username: personalInfo.username };
      const res = await fetch("/api/settings/update-account-info", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) showToast("Kontoinformationen gespeichert.", "success");
      else {
        const err = await res.json();
        showToast(err.error || "Fehler beim Speichern.", "error");
      }
    } catch {
      showToast("Netzwerkfehler beim Speichern.", "error");
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
        <div className="profile-picture-section">
          <h2>Profilbild verwalten</h2>
          <div className="profile-image-wrapper">
            {currentImage ? (
              <img src={currentImage} className="profile-image" />
            ) : username ? (
              userInitials
            ) : (
              "?"
            )}
          </div>
          {/* verstecktes File-Input */}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={inputRef}
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setNewFile(file);
                setPreview(URL.createObjectURL(file));

                // Upload direkt auslösen
                setLoading(true);
                const formData = new FormData();
                formData.append("profile_picture", file);

                try {
                  const response = await fetch(`${apiBaseUrl}/upload`, {
                    method: "POST",
                    body: formData,
                  });

                  if (!response.ok) throw new Error("Upload fehlgeschlagen");

                  setCurrentImage(URL.createObjectURL(file));
                  setNewFile(null);
                  setPreview(null);
                  showToast("Profilbild erfolgreich hochgeladen!", "success");
                } catch (err) {
                  console.error(err);
                  showToast("Upload fehlgeschlagen!", "error");
                } finally {
                  setLoading(false);
                }
              }
            }}
          />

          <div>
            <button
              className="upload-button"
              onClick={() => inputRef.current?.click()} // öffnet das File-Input
              disabled={loading}
            >
              Profilbild auswählen & hochladen
            </button>
            <button className="delete-button" onClick={handleDeletePicture} disabled={loading}>
              Löschen
            </button>
          </div>
        </div>

        <div className="account-settings">
          <h2>Konto-Einstellungen</h2>
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

        {/* --- 2FA Einstellungen --- */}
        <div className="two-fa-settings">
          <h2>Zwei-Faktor-Authentifizierung</h2>

          <div className="two-fa-switch-container" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label className="switch">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => handle2FASwitch(e.target.checked)}
              />
              <span className="slider"></span>
            </label>

            <span className="two-fa-status" style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "1rem" }}>
              <img
                src={enabled ? TrueIcon : FalseIcon}
                alt={enabled ? "2FA aktiviert" : "2FA deaktiviert"}
                style={{ width: "20px", height: "20px" }}
              />
              {enabled ? "2FA ist aktiviert" : "2FA ist deaktiviert"}
            </span>
          </div>
          <p className="warning-text">Aktiviere die Zwei-Faktor-Authentifizierung für zusätzliche Sicherheit.</p>

          {twoFAModalVisible && (
            <div className="modal-overlay show">
              <div className="modal show">
                <h2>2FA einrichten</h2>
                <p>Scanne den QR-Code mit deiner Authenticator-App und gib den Code ein.</p>
                <div style={{ textAlign: "center", margin: "1rem 0" }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(twoFAQRCode)}&size=200x200`} alt="QR Code" />
                </div>
                {/* Secret Key anzeigen */}
                {twoFASecret && (
                  <p>Secret Key: <strong>{twoFASecret}</strong></p>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Code aus Authenticator-App"
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value)}
                  onKeyDown={handleKeyDown} // Enter-Taste abfangen
                />
                <div className="modal-actions">
                  <button className="btn cancel" onClick={() => setTwoFAModalVisible(false)}>Abbrechen</button>
                  <button className="btn save" onClick={confirm2FA}>Aktivieren</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="personal-information">
          <h2>Persönliche Informationen</h2>
          <h3>Geburtstag</h3>
          <div className="input-row" style={{display: "flex", gap: "1rem", justifyContent: "flex-start"}}>
            <input
              type="number"
              className="smaler-input-box-width"
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
              className="smaler-input-box-width"
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
              className="smaler-input-box-width"
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
                src={getCurrentTheme() === "dark" ? clearIconBlack : clearIconWhite}
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
          <CustomDropdown
            value={personalInfo.activity_level}
            onChange={val => handlePersonalInfoChange("activity_level", val)}
            options={[
              { label: "Niedrig", value: "niedrig" },
              { label: "Mittel", value: "mittel" },
              { label: "Hoch", value: "hoch" }
            ]}
            placeholder="Bitte wählen..."
          />

          <h3>Ziel</h3>
          <input className="smaler-input-box-width" type="text" placeholder="z.B. fitter werden, Muskeln aufbauen" value={personalInfo.goal} onChange={e => handlePersonalInfoChange("goal", e.target.value)} />

          <h3>Allergien</h3>
          <input className="smaler-input-box-width" type="text" placeholder="z.B. Nüsse, Laktose oder 'Keine'" value={personalInfo.allergies} onChange={e => handlePersonalInfoChange("allergies", e.target.value)} />

          <button className="save-info-btn" onClick={savePersonalInfo}>Speichern</button>
        </div>

        <div className="design-settings">
          <h2>Design-Einstellungen</h2>

          <DarkModeToggle />
        </div>

        <div className="delete-account">
          <h2 className="delete-account-header">Konto löschen</h2>
          <button className="delete-account-button" onClick={() => {setDeleteModalVisible(true); setTimeout(() => setDeleteModalShow(true), 10);}}>Konto löschen</button>
          <p className="warning-text">
            Lösche dein Trainora Konto, inklusive aller persönlichen Daten und Inhalte.
            Das Konto wird sofort gelöscht. Eine Löschung Ihres Kontos ist nicht rückgängig zu machen.
          </p>
        </div>
      </div>

      {/* Löschen-Modal */}
      {deleteModalVisible && (
        <div className={`modal-overlay ${deleteModalShow ? "show" : ""}`} onClick={() => setDeleteModalShow(false)}>
          <div className={`modal ${deleteModalShow ? "show" : ""}`} onClick={(e) => e.stopPropagation()}>
            <h2 className="delete-account-header">Konto löschen?</h2>
            <p className="warning-text">Alle Daten werden unwiderruflich gelöscht. Bist du sicher?</p>
            <div className="modal-actions">
              <button className="btn cancel" onClick={() => setDeleteModalShow(false)}>Abbrechen</button>
              <button className="btn delete" onClick={handleDeleteAccountConfirmed}>Löschen</button>
            </div>
          </div>
        </div>
      )}

      {deletePictureModalVisible && (
        <div
          className={`modal-overlay ${deletePictureModalShow ? "show" : ""}`}
          onClick={() => setDeletePictureModalShow(false)}
        >
          <div
            className={`modal ${deletePictureModalShow ? "show" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="delete-account-header">Profilbild löschen?</h2>
            <p className="warning-text">Dein aktuelles Profilbild wird unwiderruflich gelöscht.</p>
            <div className="modal-actions">
              <button className="btn cancel" onClick={() => setDeletePictureModalShow(false)}>
                Abbrechen
              </button>
              <button className="btn delete" onClick={confirmDeletePicture}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}
        >
          {toast.text}
          <img
            src={toast.type === "success" ? successIconBlack : ErrorIcon}
            style={{ width: "20px", height: "20px", marginLeft: "8px" }}
            alt={toast.type === "success" ? "Success Icon" : "Error Icon"}
          />
        </div>
      )}
    </div>
  );
}
