"use client";

import Link from "next/link";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submitLogin(event) {
    event.preventDefault();
    setMessage("");
    if (form.username.trim().length < 3 || form.password.length < 1) {
      setMessage("Enter your username and password to continue.");
      return;
    }
    try {
      await login(form);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="authPage">
      <div className="authShell">
        <aside className="authAside">
          <div className="authBrand"><img src="/Logo.jpeg" alt="PNWC" /><div><strong>PNWC</strong><span>Hospital equipment lending</span></div></div>
          <div className="authAsideCopy"><span>OPERATIONS HUB</span><h2>Keep every handover clear.</h2><p>Track equipment, borrowers, and returns from one calm workspace.</p></div>
          <div className="authFeatureList"><span><b>01</b> Lend with complete borrower context</span><span><b>02</b> Follow every item through its return</span><span><b>03</b> Keep a dependable equipment history</span></div>
        </aside>
        <section className="authPanel glass authFormPanel">
        <div className="authHeader">
          <div>
            <span className="authKicker">Secure workspace</span>
            <h1>Welcome back</h1>
            <p>Sign in to continue managing your lending desk.</p>
          </div>
        </div>
        <form className="authForm loginForm" onSubmit={submitLogin}>
          <label className="field">
            <span>Username</span>
            <input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder="Username" required />
          </label>
          <label className="field">
            <span>Password</span>
            <div className="passwordField"><input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Password" required /><button type="button" className="passwordToggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div>
          </label>
          {message && <p className="emptyText">{message}</p>}
          <button className="primaryButton">Login</button>
          <Link className="authLink" href="/signup">Create account</Link>
        </form>
        </section>
      </div>
    </main>
  );
}
