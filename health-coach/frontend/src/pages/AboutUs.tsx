import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/AboutUs.css"; 
import Sidebar from "../components/Sidebar";

export default function AboutUs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    }

    checkAuth();
  }, [navigate]);

  if (loading) return <p>Lädt...</p>;

  if (!authorized) return null;

  return (
    <div className="about-us-page">
      <Sidebar />
      <h1>Über uns</h1>
    </div>
  );
}