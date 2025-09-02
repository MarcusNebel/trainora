import React, { useEffect, useRef, useState } from "react";
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
  const [generating, setGenerating] = useState(false);

  // Refs für alle Eingaben
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLInputElement>(null);
  const allergiesRef = useRef<HTMLInputElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step < steps.length - 1) {
        nextStep();
      } else {
        submitSetup();
      }
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user_id) setAuthorized(true);
          else navigate("/login");
        } else navigate("/login");
      } catch {
        navigate("/login");
      }
    }
    checkAuth();
  }, [navigate]);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    birthday: { day: "", month: "", year: "" },
    height_cm: "",
    weight_kg: "",
    activity_level: "",
    goal: "",
    allergies: "",
  });
  const [errors, setErrors] = useState<string | null>(null);

  // 👉 Fokus setzen wenn Step sich ändert
  useEffect(() => {
    switch (step) {
      case 0:
        dayRef.current?.focus();
        break;
      case 1:
        heightRef.current?.focus();
        break;
      case 2:
        weightRef.current?.focus();
        break;
      case 3:
        activityRef.current?.focus();
        break;
      case 4:
        goalRef.current?.focus();
        break;
      case 5:
        allergiesRef.current?.focus();
        break;
    }
  }, [step]);

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
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };
  const prevStep = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleChange = (field: string, value: any) => {
    if (field === "birthday") {
      setFormData((prev) => ({ ...prev, birthday: { ...prev.birthday, ...value } }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const submitSetup = async () => {
    setErrors(null);
    try {
      const payload = {
        ...formData,
        height_cm: Number(formData.height_cm),
        weight_kg: Number(formData.weight_kg),
      };

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
        try {
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
          window.location.href = "/dashboard";
        } catch (genError) {
          setErrors("Fehler beim Abrufen der generierten Daten.");
          setGenerating(false);
        }
      }
    } catch (error) {
      setErrors("Netzwerkfehler");
    }
  };

  if (!authorized) return null;

  if (generating) {
    return (
      <div className="setup-page mobile">
        <div className="setup-wrapper">
          <div className="setup-card">
            <h2>Erste Daten werden generiert …</h2>
            <p className="muted">Wir erstellen personalisierte Inhalte für Sie.</p>
            <div className="spinner"></div>
            <button className="btn-setup primary full" onClick={() => (window.location.href = "/dashboard")}>Überspringen</button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: "Geburtstag",
      icon: calendarIcon,
      description: "Wann haben Sie Geburtstag?",
      content: (
        <div className="input-row">
          <input
            ref={dayRef}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="TT"
            min={1}
            max={31}
            maxLength={2}
            value={formData.birthday.day}
            onKeyDown={handleEnter}
            onChange={(e) => {
              const val = e.target.value.slice(0, 2);
              if (/^\d{0,2}$/.test(val)) {
                handleChange("birthday", { day: val });
                if (val.length === 2) monthRef.current?.focus();
              }
            }}
            className="input small"
          />
          <input
            ref={(el) => (monthRef.current = el)}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="MM"
            min={1}
            max={12}
            maxLength={2}
            value={formData.birthday.month}
            onKeyDown={handleEnter}
            onChange={(e) => {
              const val = e.target.value.slice(0, 2);
              if (/^\d{0,2}$/.test(val)) {
                handleChange("birthday", { month: val });
                if (val.length === 2) yearRef.current?.focus();
              }
            }}
            className="input small"
          />
          <input
            ref={(el) => (yearRef.current = el)}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="JJJJ"
            min={1900}
            maxLength={4}
            value={formData.birthday.year}
            onKeyDown={handleEnter}
            onChange={(e) => {
              const val = e.target.value.slice(0, 4);
              if (/^\d{0,4}$/.test(val)) handleChange("birthday", { year: val });
            }}
            className="input medium"
          />
        </div>
      ),
    },
    {
      title: "Größe",
      icon: heightIcon,
      description: "Wie groß sind Sie (cm)?",
      content: (
        <input
          ref={heightRef}
          className="input"
          type="number"
          placeholder="z.B. 175"
          value={formData.height_cm}
          onKeyDown={handleEnter}
          onChange={(e) => handleChange("height_cm", e.target.value)}
        />
      ),
    },
    {
      title: "Gewicht",
      icon: weightIcon,
      description: "Wie viel wiegen Sie (kg)?",
      content: (
        <input
          ref={weightRef}
          className="input"
          type="number"
          placeholder="z.B. 70"
          value={formData.weight_kg}
          onKeyDown={handleEnter}
          onChange={(e) => handleChange("weight_kg", e.target.value)}
        />
      ),
    },
    {
      title: "Aktivität",
      icon: activityIcon,
      description: "Wie aktiv sind Sie im Alltag?",
      content: (
        <div ref={activityRef} className="segmented" onKeyDown={handleEnter} tabIndex={0}>
          <button
            className={`seg ${formData.activity_level === "niedrig" ? "active" : ""}`}
            onClick={() => handleChange("activity_level", "niedrig")}
          >
            Niedrig
          </button>
          <button
            className={`seg ${formData.activity_level === "mittel" ? "active" : ""}`}
            onClick={() => handleChange("activity_level", "mittel")}
          >
            Mittel
          </button>
          <button
            className={`seg ${formData.activity_level === "hoch" ? "active" : ""}`}
            onClick={() => handleChange("activity_level", "hoch")}
          >
            Hoch
          </button>
        </div>
      ),
    },
    {
      title: "Ziel",
      icon: goalIcon,
      description: "Was ist Ihr Ziel?",
      content: (
        <input
          ref={goalRef}
          className="input"
          type="text"
          placeholder="z.B. fitter werden"
          value={formData.goal}
          onKeyDown={handleEnter}
          onChange={(e) => handleChange("goal", e.target.value)}
        />
      ),
    },
    {
      title: "Allergien",
      icon: allergiesIcon,
      description: "Haben Sie Allergien?",
      content: (
        <input
          ref={allergiesRef}
          className="input"
          type="text"
          placeholder="z.B. Nüsse, Pollen oder 'Keine'"
          value={formData.allergies}
          onKeyDown={handleEnter}
          onChange={(e) => handleChange("allergies", e.target.value)}
        />
      ),
    },
  ];

  return (
    <div className="setup-page mobile">
      <div className="setup-wrapper">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="setup-card"
            initial={{ x: direction === 1 ? 300 : -300, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: direction === 1 ? -300 : 300, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.32 }}
          >
            <div className="progress-row">
              <div className="dots">
                {steps.map((_, i) => (
                  <div key={i} className={`dot ${i === step ? "active" : i < step ? "done" : ""}`} />
                ))}
              </div>
              <div className="step-count">{step + 1}/{steps.length}</div>
            </div>

            <div className="icon-wrap">
              <img src={steps[step].icon} alt="icon" className="icon-animated" />
            </div>

            <h2 className="card-title">{steps[step].title}</h2>
            <p className="muted">{steps[step].description}</p>

            <div className="setup-content">{steps[step].content}</div>

            {errors && <p className="setup-error">{errors}</p>}

            <div className="setup-buttons bottom">
              <button className="btn-setup secondary" onClick={prevStep} disabled={step === 0}>Zurück</button>
              {step < steps.length - 1 ? (
                <button className="btn-setup primary" onClick={nextStep}>Weiter</button>
              ) : (
                <button className="btn-setup primary" onClick={submitSetup}>Abschließen</button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
