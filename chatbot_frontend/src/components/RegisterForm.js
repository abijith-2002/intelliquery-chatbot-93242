import React, { useState } from "react";
import "./RegisterForm.css";

// PUBLIC_INTERFACE
/**
 * RegisterForm component
 * User registration form with input validation, API integration, and error/loading states.
 *
 * @param {Object} props
 * @param {function} props.onSuccess - Called with user object on successful registration
 * @param {function} props.onNavigateLogin - Handler to switch to login view
 */
function RegisterForm({ onSuccess, onNavigateLogin }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
  const REGISTER_ENDPOINT = `${API_BASE_URL}/register`;

  // PUBLIC_INTERFACE
  /**
   * Input change handler
   */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setApiError(""); // Clear backend errors on change
  };

  // PUBLIC_INTERFACE
  /**
   * Simple synchronous form validation
   */
  const validate = () => {
    const errs = {};
    if (!form.username.trim() || form.username.length < 3)
      errs.username = "Username must be at least 3 characters";
    if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/))
      errs.email = "Valid email required";
    if (!form.password || form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (form.password.length > 128)
      errs.password = "Password too long (max. 128 chars)";
    if (form.username.length > 50)
      errs.username = "Username too long (max. 50 chars)";
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
      const resp = await fetch(REGISTER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (resp.status === 409) {
        setApiError("Username or email already registered.");
      } else if (resp.status === 400) {
        setApiError("Validation error. Please check your entries.");
      } else if (resp.status === 422) {
        setApiError("Malformed request.");
      } else if (!resp.ok) {
        setApiError(`Server error (${resp.status})`);
      } else {
        const resUser = await resp.json();
        setApiError("");
        setForm({ username: "", email: "", password: "" });
        if (onSuccess) onSuccess(resUser);
      }
    } catch (err) {
      setApiError("Network error. Try again.");
    }
    setLoading(false);
  };

  return (
    <form className="auth-form" autoComplete="off" onSubmit={handleSubmit} noValidate>
      <h2 className="auth-title">Create Account</h2>
      <div className="form-group">
        <label htmlFor="reg-username">Username</label>
        <input
          id="reg-username"
          name="username"
          type="text"
          autoFocus
          autoComplete="username"
          minLength={3}
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
        <label htmlFor="reg-email">Email</label>
        <input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          disabled={loading}
          required
          aria-invalid={errors.email ? "true" : undefined}
        />
        {errors.email && <div className="form-error">{errors.email}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="reg-password">Password</label>
        <input
          id="reg-password"
          name="password"
          type="password"
          minLength={6}
          maxLength={128}
          autoComplete="new-password"
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
        {loading ? "Registering..." : "Sign Up"}
      </button>
      <div className="switch-auth-link">
        Already have an account?{" "}
        <button
          type="button"
          className="switch-link-btn"
          onClick={onNavigateLogin}
          tabIndex={0}
        >
          Sign in
        </button>
      </div>
    </form>
  );
}

export default RegisterForm;
