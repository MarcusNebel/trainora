import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Fitness from "./pages/Fitness";
import Recipes from "./pages/Recipes";
import Settings from "./pages/Settings";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Setup from "./components/Setup";
import ForgotPassword from "./pages/ForgotPassword";
import EnterCode from "./pages/EnterCode";
import ResetPassword from "./pages/ResetPassword";
import QuickWorkoutPage from "./pages/QuickFunction";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fitness" element={<Fitness />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/quick" element={<QuickWorkoutPage />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/enter-code" element={<EnterCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;