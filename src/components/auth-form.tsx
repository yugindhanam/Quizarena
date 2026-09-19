"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { api } from "@/lib/client";
import { ErrorBox } from "./ui";
export default function AuthForm({ signup = false }: { signup?: boolean }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    if (signup && f.get("password") !== f.get("confirm")) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api(
        `auth/${signup ? "signup" : "login"}`,
        "POST",
        Object.fromEntries(f),
      );
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Zap size={23} fill="currentColor" />
          </span>
          QuizArena.
        </Link>
        <div>
          <span className="eyebrow">STAY CURIOUS. GO FURTHER.</span>
          <h1>
            A world of knowledge.
            <br />
            An arena for you.
          </h1>
          <p>
            Create a challenge. Discover a new passion.
            <br />
            Make your next question count.
          </p>
          <div className="auth-check">
            <Check size={17} />
            Thoughtful quizzes, made simple
          </div>
          <div className="auth-check">
            <Check size={17} />
            Real progress, one question at a time
          </div>
          <div className="auth-check">
            <Check size={17} />A little friendly competition
          </div>
        </div>
        <small>Built for curious minds, everywhere.</small>
      </section>
      <section className="auth-form-wrap">
        <Link className="text-link" href="/">
          ← Back to overview
        </Link>
        <form onSubmit={submit}>
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>{signup ? "Find your arena." : "Welcome back."}</h1>
          <p>
            {signup
              ? "Create your free account and let curiosity lead."
              : "Good to see you. Ready for your next challenge?"}
          </p>
          <ErrorBox message={error} />
          {signup && (
            <label>
              Full name
              <input
                name="name"
                placeholder="Alex Morgan"
                required
                minLength={2}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <div className="password-input">
              <input
                name="password"
                type={show ? "text" : "password"}
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete={signup ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="icon-btn"
                aria-label="Toggle password visibility"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {signup && (
            <label>
              Confirm password
              <input
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="One more time"
              />
            </label>
          )}
          <button className="btn primary" disabled={busy}>
            {busy ? "Just a moment…" : signup ? "Create account" : "Log in"}
            <ArrowRight size={17} />
          </button>
          <p className="auth-switch">
            {signup ? "Already part of the arena?" : "New to QuizArena?"}{" "}
            <Link href={signup ? "/login" : "/signup"}>
              {signup ? "Log in" : "Create an account"}
            </Link>
          </p>
          {!signup && (
            <div className="demo-note">
              <strong>Take a look around</strong>
              <p>
                Demo email: demo@quizarena.app
                <br />
                Password: QuizArena123!
              </p>
              <button
                type="button"
                className="text-link"
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api("auth/login", "POST", {
                      email: "demo@quizarena.app",
                      password: "QuizArena123!",
                    });
                    router.push("/");
                    router.refresh();
                  } catch (e: any) {
                    setError(e.message);
                    setBusy(false);
                  }
                }}
              >
                Explore the demo <ArrowRight size={14} />
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
