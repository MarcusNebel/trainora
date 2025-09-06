import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import settingsIconBlack from "../assets/settings.svg";
import settingsIconWhite from "../assets/settingsWhite.svg";
import exitIcon from "../assets/exit.svg";
import "./css/Sidebar.css";
import { getCurrentTheme } from "./themeUtils";

const settingsIcon = getCurrentTheme() === "dark" ? settingsIconWhite : settingsIconBlack;

export default function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);

  const apiBaseUrl = "/api/profile";

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "GET",
      credentials: "include",
    });
    navigate("/login");
  };

  useEffect(() => {
  fetch("/api/me", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      setUserId(data.user_id);
    })
    .catch(err => console.error(err));
}, []);

  useEffect(() => {
    fetch("/api/get-username")
      .then(res => res.json())
      .then(data => setUsername(data.username))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`${apiBaseUrl}/pictures/${userId}`, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.blob();
        throw new Error("Kein Bild");
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setProfileImage(url);
      })
      .catch(() => setProfileImage(null));
  }, [userId]);

  // Initialen erzeugen
  const initials = username
    ? username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  // Viewport Fix
  useEffect(() => {
    const setVH = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${vh * 0.01}px`);
    };
    setVH();
    window.visualViewport?.addEventListener("resize", setVH);
    window.addEventListener("scroll", setVH);

    return () => {
      window.visualViewport?.removeEventListener("resize", setVH);
      window.removeEventListener("scroll", setVH);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        className={`sidebar-hamburger${open ? " open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Menü öffnen"
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-profile">
          <div className="profile-image-wrapper">
            {profileImage ? (
              <img src={profileImage} alt="Profilbild" className="profile-image" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <p className="username">{username}</p>
        </div>

        <ul className="sidebar-links">
          <li>
            <NavLink
              to="/dashboard"
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/quick"
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              Quick Workout
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-foot">
          <NavLink
            to="/settings"
            onClick={() => setOpen(false)}
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            <img src={settingsIcon} alt="Einstellungen" className="settings-icon" /> Einstellungen
          </NavLink>

          <button
            onClick={handleLogout}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", textAlign: "left" }}
          >
            <img src={exitIcon} alt="Abmelden" className="exit-icon" /> Abmelden
          </button>
        </div>
      </nav>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
    </>
  );
}
