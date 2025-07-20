import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Settings.css"; 
import Sidebar from "../components/Sidebar";

export default function Settings() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  async function handleDeleteAccount() {
  if (confirm("Sind Sie sicher, dass Sie Ihr Konto löschen möchten?")) {
    const res = await fetch("/api/delete-account", {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      alert("Ihr Konto wurde erfolgreich gelöscht.");
      await fetch("/api/logout", {
        method: "GET",
        credentials: "include",
      });
      navigate("/login");
    } else {
      alert("Beim Löschen Ihres Kontos ist ein Fehler aufgetreten.");
    }
  }
}

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user_id) {
            setAuthorized(true);
          } else {
            navigate("/login");
          }
        } else {
          navigate("/login");
        }
      } catch {
        navigate("/login");
      }
    }

    checkAuth();
  }, [navigate]);

  if (!authorized) return null;

  return (
    <div className="settings-page">
      <Sidebar />
      <h1>Einstellungen</h1>
      <p>Hier können Sie Ihre Einstellungen anpassen.</p>
      <button onClick={handleDeleteAccount}>Account löschen</button>
    </div>
  );
}
