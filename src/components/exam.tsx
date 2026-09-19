"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Clock,
  Check,
  ArrowLeft,
  ArrowRight,
  Flag,
  Maximize,
  CloudCheck,
  LoaderCircle,
} from "lucide-react";
import { api, time } from "@/lib/client";
import { Answer, Question } from "@/lib/types";
import { Loading, ErrorBox, ConfirmationModal } from "./ui";
export function ExamTimer({
  deadline,
  onExpire,
}: {
  deadline: string;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.ceil((Date.parse(deadline) - Date.now()) / 1000)),
  );
  const expire = useRef(onExpire);
  expire.current = onExpire;
  useEffect(() => {
    const tick = () => {
      const value = Math.max(
        0,
        Math.ceil((Date.parse(deadline) - Date.now()) / 1000),
      );
      setRemaining(value);
      if (value === 0) expire.current();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline]);
  return (
    <div className={`timer ${remaining <= 300 ? "warning" : ""}`}>
      <Clock size={18} />
      <strong>{time(remaining)}</strong>
      <span>{remaining <= 300 ? "Time is running low" : "remaining"}</span>
    </div>
  );
}
export function QuestionNavigator({
  questions,
  index,
  answers,
  setIndex,
}: {
  questions: Question[];
  index: number;
  answers: Answer[];
  setIndex: (i: number) => void;
}) {
  return (
    <div className="question-navigator">
      {questions.map((q, i) => {
        const a = answers.find((a) => a.questionId === q.id);
        return (
          <button
            key={q.id}
            onClick={() => setIndex(i)}
            className={`${a?.selectedOptionId ? "answered" : ""} ${a?.review ? "review" : ""} ${i === index ? "current" : ""}`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
export default function Exam({ id }: { id: string }) {
  const [data, setData] = useState<any>(null),
    [answers, setAnswers] = useState<Answer[]>([]),
    [index, setIndex] = useState(0),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [tabWarning, setTabWarning] = useState(false);
  const ref = useRef<Answer[]>([]),
    chain = useRef<Promise<any>>(Promise.resolve()),
    submitting = useRef(false);
  const router = useRouter();
  useEffect(() => {
    api("attempts/" + id)
      .then((d) => {
        if (d.attempt.status === "submitted") {
          router.replace("/results/" + id);
          return;
        }
        setData(d);
        setAnswers(d.attempt.answers);
        ref.current = d.attempt.answers;
      })
      .catch((e) => setError(e.message));
    const visibility = () => {
      if (document.hidden) setTabWarning(true);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [id, router]);
  function update(selectedOptionId: string | null, review: boolean) {
    const q = data.quiz.questions[index];
    const next = [
      ...ref.current.filter((a) => a.questionId !== q.id),
      { questionId: q.id, selectedOptionId, review },
    ];
    ref.current = next;
    setAnswers(next);
    setSaving(true);
    setError("");
    chain.current = chain.current
      .catch(() => {})
      .then(() => api(`attempts/${id}/save`, "POST", { answers: next }))
      .then((d) => {
        setSaving(false);
        if (d.attempt.status === "submitted") router.replace("/results/" + id);
      })
      .catch((e) => {
        setSaving(false);
        setError(
          "Answer could not be saved. " +
            e.message +
            " Your current choices will be retried on submission.",
        );
      });
  }
  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      await chain.current;
      await api(`attempts/${id}/submit`, "POST", { answers: ref.current });
      router.replace("/results/" + id);
    } catch (e: any) {
      setError(e.message);
      submitting.current = false;
      setBusy(false);
      setConfirm(false);
    }
  }
  if (!data)
    return (
      <>
        <ErrorBox message={error} />
        <Loading />
      </>
    );
  const q: Question = data.quiz.questions[index],
    answer = answers.find((a) => a.questionId === q.id),
    answered = answers.filter((a) => a.selectedOptionId).length;
  return (
    <div className="exam-page">
      <header className="exam-header">
        <div className="brand">
          <span className="brand-icon">
            <Zap size={22} fill="currentColor" />
          </span>
          QuizArena.
        </div>
        <div className="exam-header-title">{data.quiz.title}</div>
        <ExamTimer deadline={data.attempt.deadline} onExpire={submit} />
        <button
          className="icon-btn"
          title="Enter fullscreen"
          onClick={() => document.documentElement.requestFullscreen?.()}
        >
          <Maximize size={19} />
        </button>
      </header>
      <div className="exam-container">
        <div className="exam-progress-top">
          <span>
            {answered} of {data.quiz.questions.length} answered
          </span>
          <span>
            {saving ? (
              <>
                <LoaderCircle size={14} />
                Saving…
              </>
            ) : (
              <>
                <CloudCheck size={15} />
                Answers saved
              </>
            )}
          </span>
        </div>
        <div className="progress-track">
          <div
            style={{
              width: `${(answered / data.quiz.questions.length) * 100}%`,
            }}
          />
        </div>
        <ErrorBox message={error} />
        {tabWarning && (
          <div className="exam-warning">
            Stay focused! You switched away from the quiz. Your timer is still
            running.
            <button onClick={() => setTabWarning(false)}>Dismiss</button>
          </div>
        )}
        <div className="exam-layout">
          <section className="panel exam-question">
            <div className="question-editor-top">
              <span className="question-label">
                QUESTION {String(index + 1).padStart(2, "0")} /{" "}
                {String(data.quiz.questions.length).padStart(2, "0")}
              </span>
              <span className="badge">
                {q.marks} marks
                {q.negativeMarks > 0
                  ? ` · −${q.negativeMarks} for incorrect`
                  : ""}
              </span>
            </div>
            <h1>{q.questionText}</h1>
            <p>Select one answer below.</p>
            <div className="exam-options">
              {q.options.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() => update(o.id, answer?.review ?? false)}
                  className={
                    answer?.selectedOptionId === o.id ? "selected" : ""
                  }
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {o.optionText}
                  <i>
                    {answer?.selectedOptionId === o.id && <Check size={16} />}
                  </i>
                </button>
              ))}
            </div>
            <div className="answer-actions">
              <button onClick={() => update(null, answer?.review ?? false)}>
                Clear answer
              </button>
              <button
                className={answer?.review ? "marked" : ""}
                onClick={() =>
                  update(answer?.selectedOptionId ?? null, !answer?.review)
                }
              >
                <Flag size={15} />
                {answer?.review ? "Marked for review" : "Mark for review"}
              </button>
            </div>
            <div className="question-bottom">
              <button
                disabled={index === 0}
                className="btn secondary"
                onClick={() => setIndex(index - 1)}
              >
                <ArrowLeft size={16} />
                Previous
              </button>
              {index < data.quiz.questions.length - 1 ? (
                <button
                  className="btn primary"
                  onClick={() => setIndex(index + 1)}
                >
                  Next question
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  className="btn primary"
                  onClick={() => setConfirm(true)}
                >
                  Review & submit
                  <Check size={16} />
                </button>
              )}
            </div>
          </section>
          <aside className="panel exam-side">
            <h3>Your questions</h3>
            <p>Every question is a new opportunity.</p>
            <QuestionNavigator
              questions={data.quiz.questions}
              answers={answers}
              index={index}
              setIndex={setIndex}
            />
            <div className="navigator-legend">
              <span>
                <i className="answered" />
                Answered
              </span>
              <span>
                <i />
                Not answered
              </span>
              <span>
                <i className="review" />
                For review
              </span>
              <span>
                <i className="current" />
                Current
              </span>
            </div>
            <div className="exam-summary">
              <span>
                Answered<strong>{answered}</strong>
              </span>
              <span>
                Remaining
                <strong>{data.quiz.questions.length - answered}</strong>
              </span>
              <span>
                Marked for review
                <strong>{answers.filter((a) => a.review).length}</strong>
              </span>
            </div>
            <button
              className="btn primary full-width"
              disabled={busy}
              onClick={() => setConfirm(true)}
            >
              Submit quiz
              <ArrowRight size={16} />
            </button>
          </aside>
        </div>
        <p className="exam-encouragement">
          Take a breath. Trust what you know.
        </p>
      </div>
      {confirm && (
        <ConfirmationModal
          title="Ready to make it count?"
          label={busy ? "Submitting…" : "Submit quiz"}
          onClose={() => setConfirm(false)}
          onConfirm={submit}
        >
          <p>
            Are you sure you want to submit? You won’t be able to change your
            answers afterward.
          </p>
          <div className="submit-summary">
            <span>
              <strong>{answered}</strong>Answered
            </span>
            <span>
              <strong>{data.quiz.questions.length - answered}</strong>Unanswered
            </span>
            <span>
              <strong>{answers.filter((a) => a.review).length}</strong>For
              review
            </span>
          </div>
        </ConfirmationModal>
      )}
    </div>
  );
}
