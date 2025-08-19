import "./css/Home.css";
import { Link } from "react-router-dom";
import heroVisual from "../../public/App-Icon-Black.svg";
import featureRecipe from "../assets/feature-recipe.svg";
import featureWorkout from "../assets/feature-workout.svg";
import featureAi from "../assets/feature-ai.svg";
import featurePrivacy from "../assets/feature-privacy.svg";

export default function Home() {
  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo-trainora-text">
            <img src={heroVisual} alt="Trainora Illustration" />
            <h1 className="logo">Trainora</h1>
          </div>
          <ul className="nav-links">
            <li>
              <Link to="/register" className="btn btn-primary">
                Jetzt starten
              </Link>

              <Link to="/login" className="btn btn-secondary">
                Anmelden
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero-Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Willkommen bei Trainora</h1>
          <p>Dein persönlicher Fitness-Coach für zuhause.</p>
        </div>
      </section>

      {/* Warum Trainora */}
      <section className="about-trainora" id="about">
        <div className="about-content">
          <h2>Was ist Trainora?</h2>
          <p>
            Trainora ist mehr als nur eine App – es ist dein persönlicher Begleiter für Gesundheit und Fitness. Egal, ob du Muskeln aufbauen, fitter werden oder einfach mehr Bewegung in deinen Alltag bringen möchtest: Trainora passt sich an dich an und entwickelt einen Plan, der zu dir passt.
          </p>
          <p>
            Unsere KI schaut sich deine Ziele und dein Training an und erstellt daraus einen klaren Trainingsplan – von passenden Workouts bis hin zu praktischen Wochenübersichten. Alles unkompliziert, ohne stundenlang Einstellungen durchgehen zu müssen.
          </p>
          <p>
            Und das Beste: Deine Daten sind sicher auf einem verschlüsselten Server gespeichert – volle Kontrolle, volle Sicherheit.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <h2 className="section-title">Was Trainora für dich macht</h2>
        <div className="features-grid">
          <div className="feature-tile">
            <img src={featureWorkout} alt="Trainingsplan" className="feature-icon-img" />
            <h3>Personalisierter Trainingsplan</h3>
            <p>
              Erhalte Workouts, die zu deinem Fitnesslevel passen – egal ob Anfänger oder Fortgeschritten.
              Effektive Übungen für zuhause oder das Studio, angepasst an deine Ziele.
            </p>
          </div>
          <div className="feature-tile">
            <img src={featureRecipe} alt="Individuelle Rezepte" className="feature-icon-img" />
            <h3>Individuelle Rezepte</h3>
            <p>
              Leckere, gesunde Mahlzeiten, die deine Trainingsfortschritte unterstützen.
              Schnell zubereitet, eiweißreich und genau auf deine Bedürfnisse abgestimmt.
            </p>
          </div>
          <div className="feature-tile">
            <img src={featureAi} alt="KI-Unterstützung" className="feature-icon-img" />
            <h3>KI-gestützte Empfehlungen</h3>
            <p>
              Trainora verwendet LLaMA3, um deine Angaben zu analysieren
              und dir personalisierte Empfehlungen für Ernährung und Fitness zu geben – in Sekunden.
            </p>
          </div>
          <div className="feature-tile">
            <img src={featurePrivacy} alt="Datenschutz" className="feature-icon-img" />
            <h3>Volle Datensicherheit</h3>
            <p>
              Deine Daten bleiben auf deinem Gerät. Keine Cloud, keine Drittanbieter –
              nur du entscheidest, was mit deinen Informationen passiert.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
