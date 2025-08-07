import React, { useState } from "react";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import Header from "./Header";
import "./AuthPage.css";

// (In real world you'd persist JWT/session, here we just "emulate" login and pass up the user)
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [user, setUser] = useState(null);

  // PUBLIC_INTERFACE
  /**
   * Handle login/register success
   */
  const handleAuthSuccess = (userObj) => {
    setUser(userObj);
    if (onAuth) onAuth(userObj);
  };

  // Provide dark theme background on this page
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return (
    <div className="auth-page">
      <Header />
      <div className="auth-form-container">
        {mode === "register" ? (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onNavigateLogin={() => setMode("login")}
          />
        ) : (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onNavigateRegister={() => setMode("register")}
          />
        )}
      </div>
    </div>
  );
}

export default AuthPage;
