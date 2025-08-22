import { useState } from "react";
import "./css/QuickFunction.css";
import Sidebar from "../components/Sidebar";

interface QuickWorkoutResult {
  title: string;
  description: string;
  duration: number;
}

export default function QuickWorkoutPage() {
  const [duration, setDuration] = useState("");
  const [focus, setFocus] = useState("");
  const [equipment, setEquipment] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickWorkoutResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = async () => {
    if (!duration || !focus || !equipment) return;
    setIsGenerating(true); // Auswahlelement nach links verschieben
    setShowResult(false);
    setResult(null);

    try {
      const res = await fetch("/api/quick-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: parseInt(duration),
          goal: focus,
          equipment,
        }),
      });

      const data: QuickWorkoutResult = await res.json();
      setResult(data);

      // Nach kurzer Verzögerung zum smoothen Einblenden
      setTimeout(() => setShowResult(true), 300);
    } catch (err) {
      console.error("Fehler bei Quick Workout:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatBold = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };

  return (
    <div className="quick-page">
      <Sidebar />
      <div className="quick-card-wrapper">
        {/* Auswahlkarte */}
        <div className={`quick-card selection-card ${isGenerating ? "shift-left" : ""}`}>
          <div className="quick-header">
            <h1>Quick Workout</h1>
            <p>Stelle dein Workout in wenigen Klicks zusammen.</p>
          </div>

          <div className="quick-form">
            {/* Dauer */}
            <div className="quick-input">
              <label className="option-labels">Dauer</label>
              <div className="option-grid">
                {["1", "2", "5", "10", "15", "20", "25", "30"].map((val) => (
                  <button
                    key={val}
                    className={`option-card ${duration === val ? "active" : ""}`}
                    onClick={() => setDuration(val)}
                    type="button"
                  >
                    {val} Min
                  </button>
                ))}
              </div>
            </div>

            {/* Ziel / Fokus */}
            <div className="quick-input">
              <label className="option-labels">Ziel / Fokus</label>
              <div className="option-grid">
                {[
                  { val: "fullbody", label: "Ganzkörper" },
                  { val: "upper", label: "Oberkörper" },
                  { val: "lower", label: "Unterkörper" },
                  { val: "core", label: "Core" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    className={`option-card ${focus === opt.val ? "active" : ""}`}
                    onClick={() => setFocus(opt.val)}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="quick-input">
              <label className="option-labels">Equipment</label>
              <div className="option-grid">
                {[
                  { val: "bodyweight", label: "Eigengewicht" },
                  { val: "dumbbells", label: "Hanteln" },
                  { val: "bands", label: "Widerstandsbänder" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    className={`option-card ${equipment === opt.val ? "active" : ""}`}
                    onClick={() => setEquipment(opt.val)}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="quick-action">
            <button onClick={handleGenerate}>Workout generieren</button>
          </div>
        </div>

        {/* Ergebnis-Karte */}
        <div className={`quick-card result-card ${isGenerating ? "show" : ""}`}>
          {loading ? (
            <div className="spinner"></div> // Spinner anstelle von Text
          ) : result ? (
            <div className="exercise-container">
              <h2>{result.title}</h2>
              <p style={{ marginLeft: "1rem" }}><strong>Dauer:</strong> {result.duration} Minuten</p>

              {result.description.match(/\d+\.\s[^\n]+/g) ? (
                <div className="exercise-grid">
                  {result.description.match(/\d+\.\s[^\n]+/g)?.map((exercise, idx) => (
                    <div
                      key={idx}
                      className="exercise-card slide-down"
                      dangerouslySetInnerHTML={{ __html: formatBold(exercise.replace(/^\d+\.\s/, "")) }}
                    />
                  ))}
                </div>
              ) : (
                <>
                  {result.description.split("\n\n").map((paragraph, idx) => (
                    <p
                      key={idx}
                      className="slide-down"
                      dangerouslySetInnerHTML={{ __html: formatBold(paragraph) }}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="spinner"></div> // Spinner anstelle von Text
          )}
        </div>
      </div>
    </div>
  );
}
