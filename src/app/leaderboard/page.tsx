"use client";
import { useEffect, useState } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import Shell from "@/components/shell";
import Leaderboard from "@/components/leaderboard";
import { api } from "@/lib/client";
import { ErrorBox, Loading } from "@/components/ui";
export default function Page() {
  const [quizzes, setQuizzes] = useState<any[]>([]),
    [id, setId] = useState(""),
    [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api("dashboard")
      .then((d) => {
        const qs = d.quizzes.filter((q: any) => q.leaderboardEnabled);
        setQuizzes(qs);
        setId(
          new URLSearchParams(location.search).get("quiz") ?? qs[0]?.id ?? "",
        );
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!id) return;
    setData(null);
    const load = () =>
      api(`quizzes/${id}/leaderboard`)
        .then((d) => {
          setData(d);
          setError("");
        })
        .catch((e) => setError(e.message));
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [id]);
  return (
    <Shell>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE FRIENDLY COMPETITION</div>
          <h1>Meet the curious. Celebrate the best.</h1>
          <p>Every question counts. See who’s leading the way.</p>
        </div>
        <span className="live-badge">
          <span className="green-dot" />
          Updates live
        </span>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>
            <Trophy size={21} />
            Leaderboard
          </h2>
          <select
            className="leaderboard-select"
            aria-label="Select quiz"
            value={id}
            onChange={(e) => setId(e.target.value)}
          >
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>
        <ErrorBox message={error} />
        {data ? (
          <Leaderboard rows={data.rows} userId={data.userId} />
        ) : error ? null : quizzes.length ? (
          <Loading />
        ) : (
          <div className="empty">No public leaderboards yet.</div>
        )}
        <p className="leaderboard-note">
          <RefreshCw size={13} />
          Ranked by score, then completion time, then earliest submission.
          Refreshes every 10 seconds.
        </p>
      </section>
    </Shell>
  );
}
