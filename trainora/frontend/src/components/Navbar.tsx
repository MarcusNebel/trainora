import { Link } from "react-router-dom";
import heroVisual from "../../public/App-Icon-Black.svg";
import "./css/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo-trainora-text">
          <Link to="/">
            <img src={heroVisual} alt="Trainora Illustration" />
          </Link>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <h1 className="logo" style={{ cursor: "pointer" }}>Trainora</h1>
          </Link>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/register" className="btn btn-register">
              Jetzt starten
            </Link>

            <Link to="/login" className="btn btn-login">
              Anmelden
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
