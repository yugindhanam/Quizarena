"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Check,
  X,
  Minus,
  Clock,
  ArrowRight,
  BookOpen,
  ArrowLeft,
  Target,
} from "lucide-react";
import Shell from "./shell";
import { Loading, ErrorBox } from "./ui";
import { api, time } from "@/lib/client";
export default function Result({ id }: { id: string }) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [review, setReview] = useState(false);
  useEffect(() => {
    api("attempts/" + id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <Shell>
      <ErrorBox message={error} />
      {!data ? (
        <Loading />
      ) : data.attempt.status !== "submitted" ? (
        <div className="panel empty">
          <h2>Your challenge is still in progress</h2>
          <Link className="btn primary" href={"/exam/" + id}>
            Resume quiz
          </Link>
        </div>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">ANOTHER CHALLENGE. A LITTLE WISER.</div>
              <h1>
                {data.attempt.percentage >= 80
                  ? "Look at you go!"
                  : data.attempt.percentage >= 50
                    ? "That’s progress worth celebrating."
                    : "Every challenge teaches you something."}
              </h1>
              <p>{data.quiz.title} · Quiz completed</p>
            </div>
            <Link className="btn secondary" href="/attempts">
              <ArrowLeft size={16} />
              My attempts
            </Link>
          </div>
          <section className="panel result-card">
            <div
              className="score-circle"
              style={{
                background: `conic-gradient(#7954d5 ${Math.max(0, data.attempt.percentage ?? 0)}%, #eee9f7 0)`,
              }}
            >
              <div>
                <Target size={23} />
                <strong>
                  {data.attempt.percentage === null
                    ? "✓"
                    : `${data.attempt.percentage}%`}
                </strong>
                <span>
                  {data.attempt.percentage === null
                    ? "Completed"
                    : "Your score"}
                </span>
              </div>
            </div>
            <div className="result-info">
              <span className="badge">CHALLENGE COMPLETED</span>
              <h2>
                {data.quiz.showScore
                  ? `${data.attempt.score} / ${data.quiz.totalMarks} marks`
                  : "Your answers have been submitted."}
              </h2>
              <p>
                {data.quiz.showScore
                  ? "Keep that curiosity going. Your next personal best is out there."
                  : "Your creator has chosen to keep scores private."}
              </p>
              <div className="result-highlights">
                {data.rank && (
                  <span>
                    <Trophy size={20} />
                    <div>
                      <strong>#{data.rank}</strong>
                      <small>Leaderboard rank</small>
                    </div>
                  </span>
                )}
                <span>
                  <Clock size={20} />
                  <div>
                    <strong>{time(data.attempt.timeTaken)}</strong>
                    <small>Time taken</small>
                  </div>
                </span>
                <span>
                  <BookOpen size={20} />
                  <div>
                    <strong>{data.quiz.questions.length}</strong>
                    <small>Total questions</small>
                  </div>
                </span>
              </div>
              <div className="result-buttons">
                {data.quiz.showAnswers && (
                  <button
                    className="btn primary"
                    onClick={() => setReview(!review)}
                  >
                    {review ? "Hide answers" : "Review answers"}
                    <BookOpen size={16} />
                  </button>
                )}
                {data.quiz.leaderboardEnabled && (
                  <Link
                    className="btn secondary"
                    href={`/leaderboard?quiz=${data.quiz.id}`}
                  >
                    View leaderboard
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </section>
          {data.quiz.showAnswers && (
            <div className="result-stats">
              {[
                [
                  "Correct",
                  data.attempt.answers.filter((a: any) => a.isCorrect).length,
                  Check,
                  "green",
                ],
                [
                  "Incorrect",
                  data.attempt.answers.filter(
                    (a: any) => a.selectedOptionId && !a.isCorrect,
                  ).length,
                  X,
                  "pink",
                ],
                [
                  "Unanswered",
                  data.quiz.questions.length -
                    data.attempt.answers.filter((a: any) => a.selectedOptionId)
                      .length,
                  Minus,
                  "orange",
                ],
              ].map(([label, value, Icon, color]: any) => (
                <div className="panel" key={label}>
                  <span className={`large-icon ${color}`}>
                    <Icon size={22} />
                  </span>
                  <div>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {review &&
            data.quiz.questions.map((q: any, i: number) => {
              const ans = data.attempt.answers.find(
                (a: any) => a.questionId === q.id,
              );
              return (
                <section className="panel answer-review" key={q.id}>
                  <span className="question-label">QUESTION {i + 1}</span>
                  <h3>{q.questionText}</h3>
                  {q.options.map((o: any) => (
                    <div
                      key={o.id}
                      className={`${o.isCorrect ? "correct" : ans?.selectedOptionId === o.id ? "incorrect" : ""}`}
                    >
                      <span>{o.optionText}</span>
                      {o.isCorrect ? (
                        <span>
                          <Check size={15} />
                          Correct answer
                        </span>
                      ) : ans?.selectedOptionId === o.id ? (
                        <span>
                          <X size={15} />
                          Your answer
                        </span>
                      ) : null}
                    </div>
                  ))}
                </section>
              );
            })}
          <div className="center-actions">
            <Link href="/" className="text-link">
              Back to dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        </>
      )}
    </Shell>
  );
}
