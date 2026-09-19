"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  KeyRound,
  Clock,
  Layers,
  Target,
  RotateCcw,
  UserRound,
} from "lucide-react";
import Shell from "@/components/shell";
import { ErrorBox } from "@/components/ui";
import { api } from "@/lib/client";
export default function Join() {
  const [code, setCode] = useState(""),
    [quiz, setQuiz] = useState<any>(null),
    [name, setName] = useState(""),
    [user, setUser] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  async function find(c: string) {
    setBusy(true);
    setError("");
    setQuiz(null);
    try {
      setQuiz(await api("quizzes/" + encodeURIComponent(c.trim())));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    api("dashboard").then((d) => setUser(d.user));
    const c = new URLSearchParams(location.search).get("code");
    if (c) {
      setCode(c);
      find(c);
    }
  }, []);
  return (
    <Shell>
      <div className="join-page">
        <div className="join-intro">
          <span className="large-icon purple">
            <KeyRound size={30} />
          </span>
          <div className="eyebrow">YOUR NEXT CHALLENGE AWAITS</div>
          <h1>Ready to enter the arena?</h1>
          <p>A little courage. A little curiosity. One quiz code.</p>
        </div>
        <section className="panel join-panel">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              find(code);
            }}
          >
            <label>
              Enter quiz code
              <div className="join-code-row">
                <input
                  required
                  placeholder="QZ48291"
                  maxLength={12}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <button disabled={busy} className="btn primary">
                  {busy ? "Finding…" : "Find quiz"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </label>
          </form>
          <ErrorBox message={error} />
          {quiz && (
            <div className="quiz-preview">
              <span className="badge">
                {quiz.category} · {quiz.difficulty}
              </span>
              <h2>{quiz.title}</h2>
              <p>{quiz.description}</p>
              <div className="creator-byline">
                <UserRound size={15} />
                Created by {quiz.creatorName}
              </div>
              <div className="preview-stats">
                <span>
                  <Layers size={20} />
                  <strong>{quiz.questionCount}</strong>Questions
                </span>
                <span>
                  <Clock size={20} />
                  <strong>{quiz.duration} min</strong>Duration
                </span>
                <span>
                  <Target size={20} />
                  <strong>{quiz.totalMarks}</strong>Marks
                </span>
                <span>
                  <RotateCcw size={20} />
                  <strong>{quiz.maxAttempts}</strong>Attempts
                </span>
              </div>
              {quiz.startTime && (
                <p>Starts: {new Date(quiz.startTime).toLocaleString()}</p>
              )}
              {!user && quiz.allowGuests && (
                <label>
                  Your name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="How should we introduce you?"
                    minLength={2}
                  />
                </label>
              )}
              <p className="field-hint">
                Once you start, the timer keeps running, even if you leave or
                refresh. Your answers save automatically.
              </p>
              <button
                className="btn primary full-width"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    const a = await api(`quizzes/${quiz.id}/start`, "POST", {
                      name,
                    });
                    router.push("/exam/" + a.id);
                  } catch (e: any) {
                    setError(e.message);
                    setBusy(false);
                  }
                }}
              >
                Start quiz
                <ArrowRight size={17} />
              </button>
            </div>
          )}
          {!quiz && (
            <div className="join-help">
              Just exploring? Try our JavaScript quiz with code{" "}
              <button
                onClick={() => {
                  setCode("QZ48291");
                  find("QZ48291");
                }}
              >
                QZ48291
              </button>
              .
            </div>
          )}
        </section>
        <p className="join-bottom">
          Stay curious. You know more than you think.
        </p>
      </div>
    </Shell>
  );
}
