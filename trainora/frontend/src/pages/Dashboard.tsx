import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Dashboard.css"; 
import Sidebar from "../components/Sidebar";

type Recipe = {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string;
};

type Exercise = {
  id: number;
  name: string;
  duration: number;
  description: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ Immer ausführen
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
    }

    checkAuth();
  }, [navigate]);

  // ✅ Auch dieser Hook muss immer ausgeführt werden
  useEffect(() => {
    async function fetchData() {
      try {
        const [recipesRes, exercisesRes] = await Promise.all([
          fetch("/api/get-recipes", { credentials: "include" }),
          fetch("/api/get-exercises", { credentials: "include" }),
        ]);

        if (!recipesRes.ok) throw new Error("Fehler beim Laden der Rezepte");
        if (!exercisesRes.ok) throw new Error("Fehler beim Laden der Übungen");

        const recipesData: Recipe[] = await recipesRes.json();
        const exercisesData: Exercise[] = await exercisesRes.json();

        setRecipes(recipesData);
        setExercises(exercisesData);
      } catch (err: any) {
        setError(err.message || "Unbekannter Fehler");
      }
    }

    if (authorized) {
      fetchData(); // 🔒 Nur Daten laden, wenn authorisiert
    }
  }, [authorized]);

  // 🔄 Jetzt ist es sicher, hier zu returnen
  if (!authorized) return null;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="dashboard-page">
      <Sidebar />
      <h1>Dashboard</h1>

      <section>
        <h2>Rezepte</h2>
        <div className="grid">
          {recipes.length === 0 && <p>Keine Rezepte gefunden.</p>}
          {recipes.map((r) => (
            <div key={r.id} className="card">
              <h3>{r.title}</h3>
              <strong>Zutaten:</strong>
              <ul>
                {r.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
              <strong>Zubereitung:</strong>
              <p>{r.instructions}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Übungen</h2>
        <div className="grid">
          {exercises.length === 0 && <p>Keine Übungen gefunden.</p>}
          {exercises.map((ex) => (
            <div key={ex.id} className="card">
              <h3>{ex.name}</h3>
              <p><strong>Dauer:</strong> {ex.duration} Minuten</p>
              <p>{ex.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
