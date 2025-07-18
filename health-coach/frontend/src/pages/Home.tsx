import "./css/Home.css";
import { Link } from "react-router-dom";
import heroVisual from "../assets/hero-visual.svg";
import featureRecipe from "../assets/feature-recipe.svg";
import featureWorkout from "../assets/feature-workout.svg";
import featureAi from "../assets/feature-ai.svg";
import featurePrivacy from "../assets/feature-privacy.svg";

export default function Home() {
  // Smooth-Scroll Funktion
  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const features = document.getElementById("features");
    const hero = document.querySelector(".hero");
    if (features && hero) {
      const heroRect = hero.getBoundingClientRect();
      const scrollY = window.scrollY + heroRect.bottom;
      window.scrollTo({ top: scrollY, behavior: "smooth" });
    }
  };

  return (
    <div className="home-page">
      <div className="home">
        {/* Hero-Bereich */}
        <section className="hero">
          <div className="hero-content">
            <h1>Dein digitaler Gesundheitscoach</h1>
            <p className="hero-sub">
              Erhalte personalisierte Rezepte &amp; Fitness-Tipps – basierend auf deinen Daten, in Sekunden.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary">Jetzt starten</Link>
              <a href="#features" className="btn btn-secondary" onClick={scrollToFeatures}>Mehr erfahren</a>
            </div>
          </div>
          <div className="hero-visual">
            <img src={heroVisual} alt="Gesundheitscoach Illustration" className="hero-img" />
          </div>
        </section>

        {/* Features */}
        <section className="features" id="features">
          <div className="features-grid">
            <div className="feature-tile">
              <img src={featureRecipe} alt="Individuelle Rezepte" className="feature-icon-img" />
              <h3>Individuelle Rezepte</h3>
              <p>Leichte, proteinreiche Rezepte passend zu deinen Zielen.</p>
            </div>
            <div className="feature-tile">
              <img src={featureWorkout} alt="Smarte Workouts" className="feature-icon-img" />
              <h3>Smarte Workouts für zuhause</h3>
              <p>Effektiv in 5–10 Minuten – ohne Geräte.</p>
            </div>
            <div className="feature-tile">
              <img src={featureAi} alt="KI-Unterstützt" className="feature-icon-img" />
              <h3>KI-Unterstützt</h3>
              <p>Llama3 analysiert deine Angaben und erstellt Empfehlungen.</p>
            </div>
            <div className="feature-tile">
              <img src={featurePrivacy} alt="Datenschutz" className="feature-icon-img" />
              <h3>Datenschutz</h3>
              <p>Alle Daten bleiben lokal – keine Cloud nötig.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}