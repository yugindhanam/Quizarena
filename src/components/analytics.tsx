"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Target,
  Trophy,
  Clock,
  Download,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDown,
  ChartColumn,
} from "lucide-react";
import Shell from "./shell";
import Leaderboard from "./leaderboard";
import { Loading, ErrorBox, StatisticsCard } from "./ui";
import { api, time } from "@/lib/client";
export default function Analytics({ id }: { id: string }) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    const load = () =>
      api(`quizzes/${id}/analytics`)
        .then(setData)
        .catch((e) => setError(e.message));
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [id]);
  function csv() {
    const cols = [
      "Rank",
      "Participant",
      "Score",
      "Percentage",
      "Correct",
      "Time (seconds)",
      "Submitted",
    ];
    const rows = data.rows.map((r: any) => [
      r.rank,
      r.name,
      r.score,
      r.percentage,
      r.correct,
      r.timeTaken,
      r.submittedAt,
    ]);
    const text = [cols, ...rows]
      .map((row) =>
        row
          .map(
            (x: any) =>
              '"' +
              String(x)
                .replace(/^[=+@-]/, "'$&")
                .replaceAll('"', '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "quizarena-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const rows = data?.rows ?? [],
    avg = rows.length
      ? Math.round(
          rows.reduce((s: number, r: any) => s + r.percentage, 0) / rows.length,
        )
      : 0;
  return (
    <Shell>
      <ErrorBox message={error} />
      {!data ? (
        error ? null : (
          <Loading />
        )
      ) : (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">THE BIGGER PICTURE</div>
              <h1>{data.quiz.title}</h1>
              <p>Meet your participants. Discover what’s clicking.</p>
            </div>
            <Link className="btn secondary" href={`/create?id=${id}`}>
              Edit quiz
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="share-banner">
            <div>
              <span
                className={`status ${data.quiz.published ? "published" : "draft"}`}
              >
                <i />
                {data.quiz.published ? "Published" : "Draft"}
              </span>
              <span>
                Quiz code <strong>{data.quiz.quizCode}</strong>
              </span>
            </div>
            <button
              className="btn secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `${location.origin}/join?code=${data.quiz.quizCode}`,
                );
                setCopied(true);
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
              {copied ? "Link copied" : "Copy quiz link"}
            </button>
          </div>
          <div className="stats-grid">
            <StatisticsCard
              label="Completed attempts"
              value={rows.length}
              icon={Users}
              color="purple"
              detail="Every participant counts"
            />
            <StatisticsCard
              label="Average score"
              value={avg + "%"}
              icon={Target}
              color="blue"
              detail="Across completed attempts"
            />
            <StatisticsCard
              label="Highest score"
              value={rows[0]?.score ?? "—"}
              icon={Trophy}
              color="orange"
              detail={`Out of ${data.quiz.totalMarks} marks`}
            />
            <StatisticsCard
              label="Average time"
              value={
                rows.length
                  ? time(
                      Math.round(
                        rows.reduce((s: number, r: any) => s + r.timeTaken, 0) /
                          rows.length,
                      ),
                    )
                  : "—"
              }
              icon={Clock}
              color="green"
              detail="Time spent exploring"
            />
          </div>
          <div className="analytics-grid">
            <section className="panel">
              <h2>Score distribution</h2>
              <p>Where your participants landed.</p>
              <div className="bar-chart">
                {[0, 20, 40, 60, 80].map((n) => {
                  const count = rows.filter(
                    (r: any) =>
                      r.percentage >= n &&
                      (n === 80 ? r.percentage <= 100 : r.percentage < n + 20),
                  ).length;
                  return (
                    <div key={n}>
                      <strong>{count}</strong>
                      <div className="bar-area">
                        <i
                          style={{
                            height: `${rows.length ? (count / rows.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span>
                        {n}–{n === 80 ? 100 : n + 19}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="analytics-foot">
                <span>
                  Pass rate (≥50%){" "}
                  <strong>
                    {rows.length
                      ? Math.round(
                          (rows.filter((r: any) => r.percentage >= 50).length /
                            rows.length) *
                            100,
                        )
                      : 0}
                    %
                  </strong>
                </span>
                <span>
                  Lowest score{" "}
                  <strong>
                    {rows.length ? rows[rows.length - 1].score : "—"}
                  </strong>
                </span>
              </div>
            </section>
            <section className="panel">
              <h2>Question insights</h2>
              <p>Correct answers by question.</p>
              <div className="question-bars">
                {data.questions.map((q: any, i: number) => (
                  <div key={i}>
                    <div>
                      <span title={q.text}>
                        {i + 1}. {q.text}
                      </span>
                      <strong>
                        {q.total ? Math.round((q.correct / q.total) * 100) : 0}%
                      </strong>
                    </div>
                    <div className="progress-track">
                      <div
                        style={{
                          width: `${q.total ? (q.correct / q.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <section className="panel">
            <div className="section-heading">
              <h2>
                Participant results{" "}
                <span className="count-badge">{rows.length}</span>
              </h2>
              <button
                className="btn secondary"
                onClick={csv}
                disabled={!rows.length}
              >
                <Download size={15} />
                Export CSV
              </button>
            </div>
            <Leaderboard rows={rows} />
          </section>
        </>
      )}
    </Shell>
  );
}
