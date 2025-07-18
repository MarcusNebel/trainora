import { useState } from "react";
import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import settingsIcon from "../assets/settings.svg";
import exitIcon from "../assets/exit.svg";
import "./css/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "GET",
      credentials: "include",
    });
    navigate("/login");
  };

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
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup für Sicherheit bei unmount
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
        <div className="sidebar-head">
          <NavLink to="/dashboard" style={{textDecoration: "none", color: "#2E7D67"}} onClick={() => setOpen(false)}>
            Health <br /> Pilot
          </NavLink>
        </div>

        <ul className="sidebar-links">
          <li>
            <NavLink
              to="/dashboard"
              onClick={() => setOpen(false)}
              className={({ isActive }) => isActive ? "active-link" : ""}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/fitness"
              onClick={() => setOpen(false)}
              className={({ isActive }) => isActive ? "active-link" : ""}
            >
              Fitness
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/recipes"
              onClick={() => setOpen(false)}
              className={({ isActive }) => isActive ? "active-link" : ""}
            >
              Rezepte
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about-us"
              onClick={() => setOpen(false)}
              className={({ isActive }) => isActive ? "active-link" : ""}
            >
              Über uns
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-foot">
          <NavLink
            to="/settings"
            onClick={() => setOpen(false)}
            className={({ isActive }) => isActive ? "active-link" : ""}
          >
            <img src={settingsIcon} alt="Einstellungen" className="settings-icon" /> Einstellungen
          </NavLink>

          <button
            onClick={handleLogout}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", textAlign: "left" }}
          >
            <img src={exitIcon} alt="Abmelden" className="exit-icon" /> Abmelden
          </button>

          <div>© {new Date().getFullYear()} HealthPilot</div>
        </div>
      </nav>

      {/* Overlay für mobile Ansicht */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
    </>
  );
}
