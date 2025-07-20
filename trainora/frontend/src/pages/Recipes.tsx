import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Recipes.css"; 
import Sidebar from "../components/Sidebar";

export default function Recipes() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

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

  if (!authorized) return null;

  return (
    <div className="recipes-page">
      <Sidebar />
      <h1>Rezepte</h1>
    </div>
  );
}
