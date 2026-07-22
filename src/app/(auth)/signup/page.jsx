"use client";

import Link from "next/link";
import { useState } from "react";
import { FaEye, FaEyeSlash, FaWandMagicSparkles } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitSignup(event) {
    event.preventDefault();
    setMessage("");
    if (form.name.trim().length < 2) {
      setMessage("Enter your full name.");
      return;
    }
    if (!/^[a-z0-9][a-z0-9._-]{2,23}$/.test(form.username)) {
      setMessage("Username must be 3-24 characters using lowercase letters, numbers, dot, dash, or underscore.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(form.password)) {
      setMessage("Password needs 8 characters, one uppercase letter, one lowercase letter, and one number.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      await signup(form);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function suggestUsername() {
    const base = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "pnwc.user";
    updateForm("username", `${base.slice(0, 18)}${Math.floor(10 + Math.random() * 90)}`);
  }

  function suggestPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    updateForm("password", password);
    updateForm("confirmPassword", password);
    setShowPassword(true);
  }

  return (
    <main className="authPage">
      <div className="authShell">
        <aside className="authAside signupAside">
          <div className="authBrand"><img src="/Logo.jpeg" alt="PNWC" /><div><strong>PNWC</strong><span>Hospital equipment lending</span></div></div>
          <div className="authAsideCopy"><span>TEAM ACCESS</span><h2>Build a stronger lending desk.</h2><p>Create your workspace identity and help keep every handover accountable.</p></div>
          <div className="authFeatureList"><span><b>01</b> Choose a username people can remember</span><span><b>02</b> Use a strong password you control</span><span><b>03</b> Join as a volunteer and get started</span></div>
        </aside>
        <section className="authPanel glass authFormPanel">
        <div className="authHeader">
          <div>
            <span className="authKicker">Team access</span>
            <h1>Create your account</h1>
            <p>Set your details once, then keep your lending work in one place.</p>
          </div>
        </div>
        <form className="authForm signupForm" onSubmit={submitSignup}>
          <label className="field">
            <span>Full Name</span>
            <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Volunteer name" required />
          </label>
          <label className="field">
            <span>Username</span>
            <div className="suggestionField"><input value={form.username} onChange={(event) => updateForm("username", event.target.value.toLowerCase().replace(/\s/g, ""))} placeholder="volunteer" minLength="3" maxLength="24" required /><button type="button" className="suggestionButton" onClick={suggestUsername} title="Suggest username" aria-label="Suggest username"><FaWandMagicSparkles /></button></div>
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="volunteer@pnwc.org" />
          </label>
          <label className="field">
            <span>Phone</span>
            <input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} placeholder="Phone number" />
          </label>
          <label className="field">
            <span>Password</span>
            <div className="passwordField"><input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => updateForm("password", event.target.value)} minLength="8" required /><button type="button" className="passwordToggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button><button type="button" className="passwordSuggestButton" onClick={suggestPassword}>Suggest</button></div>
            <small className={`passwordHint ${passwordStrength(form.password).tone}`}>{passwordStrength(form.password).label}</small>
          </label>
          <label className="field">
            <span>Confirm Password</span>
            <input type="password" value={form.confirmPassword} onChange={(event) => updateForm("confirmPassword", event.target.value)} required />
          </label>
          {message && <p className="emptyText">{message}</p>}
          <button className="primaryButton">Create Account</button>
          <Link className="authLink" href="/login">Back to login</Link>
        </form>
        </section>
      </div>
    </main>
  );
}

function passwordStrength(value) {
  if (!value) return { label: "Use 8+ characters with upper, lower, and number.", tone: "neutral" };
  if (value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)) return { label: "Strong password", tone: "strong" };
  return { label: "Add uppercase, lowercase, and a number.", tone: "weak" };
}
