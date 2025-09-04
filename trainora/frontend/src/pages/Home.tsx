import "./css/Home.css";
import featureWorkoutBlack from "../assets/feature-workout-Black.svg";
import featureWorkoutWhite from "../assets/feature-workout-White.svg";
import featureAiBlack from "../assets/feature-ai-Black.svg";
import featureAiWhite from "../assets/feature-ai-White.svg";
import featurePrivacyBlack from "../assets/feature-privacy-Black.svg";
import featurePrivacyWhite from "../assets/feature-privacy-White.svg";
import Navbar from "../components/Navbar";
import { getCurrentTheme } from "../components/themeUtils";

export default function Home() {
  const featureWorkout = getCurrentTheme() === "dark" ? featureWorkoutWhite : featureWorkoutBlack;
  const featureAi = getCurrentTheme() === "dark" ? featureAiWhite : featureAiBlack;
  const featurePrivacy = getCurrentTheme() === "dark" ? featurePrivacyWhite : featurePrivacyBlack;

  return (
    <div className="home-page">
      <Navbar />

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
