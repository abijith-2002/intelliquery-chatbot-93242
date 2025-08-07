import React, { useState } from "react";
import "./LoginForm.css";

// PUBLIC_INTERFACE
/**
 * LoginForm component
 * User login form with validation, API call, error/loading.
 *
 * @param {Object} props
 * @param {function} props.onSuccess - Called with user object on successful login
 * @param {function} props.onNavigateRegister - Handler to switch to registration view
 */
function LoginForm({ onSuccess, onNavigateRegister }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
  const LOGIN_ENDPOINT = `${API_BASE_URL}/login`;

  // PUBLIC_INTERFACE
  /**
   * Input change handler
   */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setApiError("");
  };

  // PUBLIC_INTERFACE
  /**
   * Simple synchronous form validation
   */
  const validate = () => {
    const errs = {};
    if (!form.username.trim())
      errs.username = "Username is required";
    if (!form.password)
      errs.password = "Password is required";
    if (form.username.length > 50)
      errs.username = "Username too long";
    if (form.password.length > 128)
      errs.password = "Password too long";
    return errs;
  };

  // PUBLIC_INTERFACE
  /**
   * Form submit handler
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setLoading(true);
    setApiError("");
    try {
      const resp = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (resp.status === 401) {
        setApiError("Incorrect username or password.");
      } else if (resp.status === 400) {
        setApiError("Validation error. Please check your entries.");
      } else if (resp.status === 422) {
        setApiError("Malformed request.");
      } else if (!resp.ok) {
        setApiError(`Server error (${resp.status})`);
      } else {
        const resUser = await resp.json();
        setApiError("");
        setForm({ username: "", password: "" });
        if (onSuccess) onSuccess(resUser);
      }
    } catch (err) {
      setApiError("Network error. Try again.");
    }
    setLoading(false);
  };

  return (
    <form className="auth-form" autoComplete="off" onSubmit={handleSubmit} noValidate>
      <h2 className="auth-title">Sign In</h2>
      <div className="form-group">
        <label htmlFor="login-username">Username</label>
        <input
          id="login-username"
          name="username"
          type="text"
          autoFocus
          autoComplete="username"
          maxLength={50}
          value={form.username}
          onChange={handleChange}
          disabled={loading}
          required
          aria-invalid={errors.username ? "true" : undefined}
        />
        {errors.username && <div className="form-error">{errors.username}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          maxLength={128}
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          disabled={loading}
          required
          aria-invalid={errors.password ? "true" : undefined}
        />
        {errors.password && <div className="form-error">{errors.password}</div>}
      </div>
      {apiError && (
        <div className="form-api-error" role="alert">{apiError}</div>
      )}
      <button
        type="submit"
        className="auth-btn"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Sign In"}
      </button>
      <div className="switch-auth-link">
        Don't have an account?{" "}
        <button
          type="button"
          className="switch-link-btn"
          onClick={onNavigateRegister}
          tabIndex={0}
        >
          Sign up
        </button>
      </div>
    </form>
  );
}

export default LoginForm;
