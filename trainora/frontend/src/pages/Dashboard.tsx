import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./css/Dashboard.css";

interface Task {
  id?: number;
  title: string;
  description: string;
  duration: number;
  day_period: string;
}

type WeekPlan = {
  [key: string]: Task[];
};

const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const dayPeriodTranslations: Record<string, string> = {
  morning: "Morgens",
  midday: "Mittags",
  afternoon: "Nachmittags",
  evening: "Abends",
  forenoon: "Vormittags",
  night: "Nachts",
  unknown: "Unbekannt",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeDay, setActiveDay] = useState<number>(0); // vorinitialisieren

  useEffect(() => {
    async function ensureNextWeekPlan() {
      try {
        await fetch("/api/ollama/generate-next-week", { method: "POST", credentials: "include" });
        // Optional: Du kannst hier eine Rückmeldung anzeigen oder ignorieren
      } catch (err) {
        // Optional: Fehlerbehandlung
      }
    }
    ensureNextWeekPlan();
  }, []);

  useEffect(() => {
    const jsDay = new Date().getDay(); // 0 (So) - 6 (Sa)
    const mappedDay = (jsDay + 6) % 7; // ergibt 0=Mo, 1=Di, ..., 6=So
    setActiveDay(mappedDay);
  }, []);

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

  useEffect(() => {
    async function fetchWeekPlan() {
      try {
        const res = await fetch("/api/get-week-plan", { credentials: "include" });
        if (!res.ok) throw new Error("Fehler beim Laden des Wochenplans");
        const data = await res.json();
        setWeekPlan(data.week_plan);
      } catch (err: any) {
        setError(err.message || "Unbekannter Fehler");
      }
    }
    if (authorized) fetchWeekPlan();
  }, [authorized]);

  useEffect(() => {
    if (selectedTask) {
      setTimeout(() => setIsVisible(true), 10);
    }
  }, [selectedTask]);

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => setSelectedTask(null), 300); // Dauer der CSS-Animation
  };

  if (!authorized) return null;
  if (error) return <p className="error">{error}</p>;

  const tasksToday = weekPlan[activeDay.toString()] ?? [];

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="content">
        <h1>Dein Wochenplan</h1>

        <div className="timeline-container">
          <div className="day-circles">
            {weekdays.map((day, index) => (
              <div
                key={index}
                className={`day-circle ${activeDay === index ? "active" : ""}`}
                onClick={() => setActiveDay(index)}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        <section>
          <h2>{weekdays[activeDay]} – Tagesplan</h2>
          {tasksToday.map((task, i) => (
            <div className="task-card" key={i} onClick={() => setSelectedTask(task)}>
              <div className="task-time">
                {dayPeriodTranslations[task.day_period] ?? task.day_period}
              </div>
              <div className="task-details">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <span className="duration">{task.duration} Minuten</span>
              </div>
            </div>
          ))}
          {tasksToday.length === 0 && (
            <p className="no-tasks">Keine Aufgaben für diesen Tag.</p>
          )}
        </section>

        {selectedTask && (
          <>
            <div className={`overlay-bg ${isVisible ? "show" : ""}`} onClick={closeModal} />
            <div className={`overlay ${isVisible ? "show" : ""}`} onClick={closeModal}>
              <div
                className={`task-detail-card ${isVisible ? "show" : ""}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="detail-main">
                  <div className="detail-header">
                    <h2 className="detail-title">{selectedTask.title}</h2>
                    <button className="close-button" onClick={closeModal}>✖</button>
                  </div>
                  <p><strong>Zeitraum:</strong> {dayPeriodTranslations[selectedTask.day_period] ?? selectedTask.day_period}</p>
                  <p>{selectedTask.description}</p>
                  <p><strong>Dauer:</strong> {selectedTask.duration} Minuten</p>
                </div>
                <div className="feedback-section">
                  <h3>Feedback</h3>
                  <button className="fb red">❌ Dann kann ich nicht</button>
                  <button className="fb orange">😕 Hat mir nicht gefallen</button>
                  <button className="fb blue">💪 War zu anstrengend</button>
                  <button className="fb green">✅ Alles gut!</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
