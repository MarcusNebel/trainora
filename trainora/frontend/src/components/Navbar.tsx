import { useState } from "react";
import { Link } from "react-router-dom";
import logoBlack from "../../public/App-Icon-Black.svg";
import logoWhite from "../../public/App-Icon-White.svg";
import "./css/Navbar.css";
import { getCurrentTheme } from "./themeUtils";

const heroVisual = getCurrentTheme() === "dark" ? logoWhite : logoBlack;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo + Text */}
        <div className="logo-trainora-text">
          <Link to="/">
            <img src={heroVisual} alt="Trainora Illustration" />
          </Link>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <h1 className="logo" style={{ cursor: "pointer" }}>Trainora</h1>
          </Link>
        </div>

        {/* Hamburger Menü */}
        <div 
          className={`hamburger ${isOpen ? "active" : ""}`} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Links */}
        <ul className={`nav-links ${isOpen ? "open" : ""}`}>
          <li>
            <Link to="/register" className="btn btn-register" onClick={() => setIsOpen(false)}>
              Jetzt starten
            </Link>
            <Link to="/login" className="btn btn-login" onClick={() => setIsOpen(false)}>
              Anmelden
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
