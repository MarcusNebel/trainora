import { useState } from "react";

interface HealthRequest {
  age: number;
  height: number;
  weight: number;
}

interface ParsedResponse {
  recipe: {
    title: string;
    ingredients: string[]; // angepasst: Array von Strings
    instructions: string;
  };
  exercise: {
    name: string;
    duration: number;
    description: string;
  };
}

export default function HealthAdvisor() {
  const [age, setAge] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [response, setResponse] = useState<string>("");
  const [parsedResponse, setParsedResponse] = useState<ParsedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    setParsedResponse(null);

    if (age === "" || height === "" || weight === "") {
      setError("Bitte alle Felder ausfüllen.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/health-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age, height, weight }),
      });

      const data = await res.json();

      if (data.response) {
        setResponse(data.response);

        // 🧠 Versuch, JSON aus der Textantwort zu extrahieren
        const match = data.response.match(/```json\n?([\s\S]*?)```|({[\s\S]*})/);
        const jsonText = match ? match[1] || match[0] : null;

        if (jsonText) {
          try {
            const parsed = JSON.parse(jsonText);
            setParsedResponse(parsed);
          } catch (err) {
            console.error("Parsing-Fehler:", err);
          }
        }
      } else {
        setError("Keine Antwort vom Server erhalten.");
      }
    } catch (err) {
      setError("Fehler bei der Anfrage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={{ textAlign: "center", paddingTop: "20px" }}>Health-Coach</h1>
      <h2>Gesundheitsberatung mit KI</h2>

      <label>
        Alter (Jahre):
        <input
          type="number"
          min={1}
          max={120}
          value={age}
          onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
          style={styles.input}
        />
      </label>

      <label>
        Größe (cm):
        <input
          type="number"
          min={50}
          max={250}
          value={height}
          onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
          style={styles.input}
        />
      </label>

      <label>
        Gewicht (kg):
        <input
          type="number"
          min={10}
          max={300}
          step={0.1}
          value={weight}
          onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
          style={styles.input}
        />
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading || age === "" || height === "" || weight === ""}
        style={styles.button}
      >
        {loading ? "Lädt..." : "Empfehlung erhalten"}
      </button>

      {error && <div style={styles.error}>{error}</div>}

      {parsedResponse && (
        <div style={styles.result}>
          <h3>Empfohlenes Rezept</h3>
          <strong>{parsedResponse.recipe.title}</strong>
          <p><u>Zutaten:</u></p>
          <ul>
            {parsedResponse.recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
          <p><u>Zubereitung:</u> {parsedResponse.recipe.instructions}</p>

          <h3>Empfohlene Übung</h3>
          <strong>
            {parsedResponse.exercise.name} ({parsedResponse.exercise.duration} Minuten)
          </strong>
          <p>{parsedResponse.exercise.description}</p>
        </div>
      )}

      {!parsedResponse && response && (
        <div style={styles.result}>
          <h3>KI Antwort (unformatiert)</h3>
          <pre>{response}</pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "2rem auto",
    padding: "1rem",
    fontFamily: "Arial, sans-serif",
  },
  input: {
    display: "block",
    marginTop: 4,
    marginBottom: 12,
    padding: 8,
    width: "100%",
    fontSize: 16,
  },
  button: {
    padding: "10px 20px",
    fontSize: 16,
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  error: {
    marginTop: 12,
    color: "red",
  },
  result: {
    marginTop: 20,
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 6,
    whiteSpace: "pre-wrap" as const,
  },
};
