"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp } from "@/app/auth/actions";

export function AuthForm({ mode, registered = false, next = "" }: { mode: "login" | "register"; registered?: boolean; next?: string }) {
  const isRegister = mode === "register";
  const [state, action, pending] = useActionState(isRegister ? signUp : signIn, {});

  return (
    <section className="auth-panel" aria-labelledby="auth-heading">
      <div className="auth-heading">
        <p className="eyebrow">COMMONPLACE COMMUNITY</p>
        <h1 id="auth-heading">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p>{isRegister ? "Make a home for the work you want to share." : "Sign in to share projects and pick up where you left off."}</p>
      </div>
      {registered && <p className="form-notice" role="status">Account created. Check your email if confirmation is enabled, then sign in.</p>}
      <form action={action} className="form-stack">
        {!isRegister && <input type="hidden" name="next" value={next.startsWith("/") && !next.startsWith("//") ? next : ""} />}
        {isRegister && <>
          <label className="field-label" htmlFor="displayName">Display name<input className="form-control" id="displayName" name="displayName" autoComplete="name" minLength={2} maxLength={80} required /></label>
          <label className="field-label" htmlFor="username">Username<input className="form-control" id="username" name="username" autoComplete="username" pattern="[a-z0-9_]{3,30}" minLength={3} maxLength={30} required /><span className="field-help">Lowercase letters, numbers, and underscores.</span></label>
        </>}
        <label className="field-label" htmlFor="email">Email address<input className="form-control" id="email" name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label className="field-label" htmlFor="password">Password<input className="form-control" id="password" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 10 : 1} required />{isRegister && <span className="field-help">At least 10 characters.</span>}</label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={pending}>{pending ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</button>
      </form>
      <p className="auth-switch">{isRegister ? "Already have an account?" : "New to Commonplace?"} <Link href={isRegister ? "/auth/login" : "/auth/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
    </section>
  );
}