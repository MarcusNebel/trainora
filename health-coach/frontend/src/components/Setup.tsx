import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./css/Setup.css";
import calendarIcon from "../assets/calendar.svg";
import heightIcon from "../assets/height.svg";
import weightIcon from "../assets/weight.svg";
import activityIcon from "../assets/activity.svg";
import goalIcon from "../assets/goal.svg";
import allergiesIcon from "../assets/allergies.svg";

export default function Setup() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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
      setLoading(false);
    }

    checkAuth();
  }, [navigate]);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    birthday: {
      day: "",
      month: "",
      year: "",
    },
    height_cm: "",
    weight_kg: "",
    activity_level: "",
    goal: "",
    allergies: ""
  });
  const [errors, setErrors] = useState<string | null>(null);

  const validateStep = (): boolean => {
    setErrors(null);
    switch (step) {
      case 0:
        if (!formData.birthday.day || !formData.birthday.month || !formData.birthday.year) {
          setErrors("Bitte geben Sie einen vollständigen Geburtstag ein.");
          return false;
        }
        break;
      case 1:
        if (!formData.height_cm || isNaN(Number(formData.height_cm))) {
          setErrors("Bitte geben Sie Ihre Größe ein.");
          return false;
        }
        break;
      case 2:
        if (!formData.weight_kg || isNaN(Number(formData.weight_kg))) {
          setErrors("Bitte geben Sie Ihr Gewicht ein.");
          return false;
        }
        break;
      case 3:
        if (!formData.activity_level) {
          setErrors("Bitte wählen Sie ein Aktivitätslevel aus.");
          return false;
        }
        break;
      case 4:
        if (!formData.goal.trim()) {
          setErrors("Bitte geben Sie ein Ziel ein.");
          return false;
        }
        break;
      case 5:
        if (!formData.allergies.trim()) {
          setErrors("Bitte geben Sie bekannte Allergien ein oder schreiben Sie 'Keine'.");
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleChange = (field: string, value: any) => {
    if (field === "birthday") {
      setFormData((prev) => ({
        ...prev,
        birthday: { ...prev.birthday, ...value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const submitSetup = async () => {
    console.log("submitSetup gestartet");
    setErrors(null);
    try {
      const payload = {
        ...formData,
        height_cm: Number(formData.height_cm),
        weight_kg: Number(formData.weight_kg),
      };

      console.log("anfrage an setup.go gestartet");
      const response = await fetch("/api/setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors(errorData.error || "Unbekannter Fehler");
        return;
      }

      const result = await response.json();
      if (result.message === "success") {
        setGenerating(true);

        console.log("anfrage an setup.go erfolgreich");

        try {
          console.log("anfrage an ollama.go gestartet");
          const genResponse = await fetch("/api/ollama/after-setup", {
            method: "POST",
            credentials: "include",
          });

          const genResult = await genResponse.json();
          if (!genResponse.ok) {
            setErrors(genResult.error || "Fehler bei der Generierung");
            setGenerating(false);
            return;
          }

          console.log("🎯 Generierte Inhalte von LLaMA3:", genResult.response);
          // Optional: Ergebnisse auch in der UI anzeigen
          window.location.href = "/dashboard";
        } catch (genError) {
          console.error("Fehler bei der Generierung:", genError);
          setErrors("Fehler beim Abrufen der generierten Daten.");
          setGenerating(false);
        }
      }
    } catch (error) {
      setErrors("Netzwerkfehler");
    }
  };

  if (loading) return <p>Lädt...</p>;
  if (!authorized) return null;

  if (generating) {
    return (
      <div className="setup-page">
        <div className="setup-wrapper">
          <div className="setup-card">
            <h2>Erste Daten werden generiert ...</h2>
            <p>Bitte warten Sie einen Moment.</p>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: "Geburtstag eingeben",
      icon: calendarIcon,
      description: "Bitte geben Sie Ihr Geburtsdatum an.",
      content: (
        <div className="input-row">
          <select
            value={formData.birthday.day}
            onChange={(e) => handleChange("birthday", { day: e.target.value })}
          >
            <option value="">Tag</option>
            {[...Array(31)].map((_, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                {i + 1}
              </option>
            ))}
          </select>
          <select
            value={formData.birthday.month}
            onChange={(e) => handleChange("birthday", { month: e.target.value })}
          >
            <option value="">Monat</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={String(m).padStart(2, "0")}>
                {["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"][m - 1]}
              </option>
            ))}
          </select>
          <select
            value={formData.birthday.year}
            onChange={(e) => handleChange("birthday", { year: e.target.value })}
          >
            <option value="">Jahr</option>
            {Array.from({ length: 100 }, (_, i) => 2025 - i).map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
      ),
    },
    {
      title: "Größe angeben",
      icon: heightIcon,
      description: "Wie groß sind Sie in Zentimetern?",
      content: (
        <input
          type="number"
          placeholder="z.B. 175"
          value={formData.height_cm}
          onChange={(e) => handleChange("height_cm", e.target.value)}
        />
      ),
    },
    {
      title: "Gewicht angeben",
      icon: weightIcon,
      description: "Wie viel wiegen Sie in Kilogramm?",
      content: (
        <input
          type="number"
          placeholder="z.B. 70"
          value={formData.weight_kg}
          onChange={(e) => handleChange("weight_kg", e.target.value)}
        />
      ),
    },
    {
      title: "Aktivitätslevel wählen",
      icon: activityIcon,
      description: "Wie aktiv sind Sie im Alltag?",
      content: (
        <select
          value={formData.activity_level}
          onChange={(e) => handleChange("activity_level", e.target.value)}
        >
          <option value="">Bitte wählen...</option>
          <option value="niedrig">Niedrig</option>
          <option value="mittel">Mittel</option>
          <option value="hoch">Hoch</option>
        </select>
      ),
    },
    {
      title: "Ziel eingeben",
      icon: goalIcon,
      description: "Was möchten Sie mit diesem Programm erreichen?",
      content: (
        <input
          type="text"
          placeholder="z.B. fitter werden, Muskeln aufbauen"
          value={formData.goal}
          onChange={(e) => handleChange("goal", e.target.value)}
        />
      ),
    },
    {
      title: "Allergien eingeben",
      icon: allergiesIcon,
      description: "Haben Sie bekannte Allergien?",
      content: (
        <input
          type="text"
          placeholder="z.B. Nüsse, Laktose oder 'Keine'"
          value={formData.allergies}
          onChange={(e) => handleChange("allergies", e.target.value)}
        />
      ),
    },
  ];

  return (
    <div className="setup-page">
      <div className="setup-wrapper">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="setup-card"
            initial={{ x: direction === 1 ? 300 : -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === 1 ? -300 : 300, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2>{steps[step].title}</h2>
            <img src={steps[step].icon} className="icon-animated" alt="Icon" />
            <p>{steps[step].description}</p>
            <div className="setup-content">{steps[step].content}</div>
            {errors && <p className="setup-error">{errors}</p>}
            <div className="setup-buttons">
              <div style={{ flex: 1 }}>
                {step > 0 && <button onClick={prevStep}>Zurück</button>}
              </div>
              <div>
                {step < steps.length - 1 ? (
                  <button onClick={nextStep}>Weiter</button>
                ) : (
                  <button onClick={submitSetup}>Abschließen</button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
