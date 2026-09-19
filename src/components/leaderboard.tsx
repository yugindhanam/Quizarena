"use client";
import { Trophy, Medal } from "lucide-react";
import { time } from "@/lib/client";
export function LeaderboardPodium({ rows }: { rows: any[] }) {
  return (
    <div className="podium">
      {[1, 0, 2].map((index) => {
        const row = rows[index];
        return row ? (
          <div key={row.id} className={`podium-person place-${index + 1}`}>
            <div className="podium-medal">
              {index === 0 ? <Trophy size={26} /> : <Medal size={23} />}
            </div>
            <span className="podium-avatar">
              {row.name
                .split(" ")
                .map((s: string) => s[0])
                .join("")
                .slice(0, 2)}
            </span>
            <h3>{row.name}</h3>
            <p>{row.score} marks</p>
            <div className="podium-block">
              <strong>{index + 1}</strong>
              <span>{row.percentage}% accuracy</span>
            </div>
          </div>
        ) : (
          <div
            key={index}
            className={`podium-person podium-empty place-${index + 1}`}
          >
            <div className="podium-block">
              <strong>{index + 1}</strong>
              <span>Your place awaits</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default function Leaderboard({
  rows,
  userId,
}: {
  rows: any[];
  userId?: string;
}) {
  return rows.length ? (
    <>
      <LeaderboardPodium rows={rows.slice(0, 3)} />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Participant</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Correct</th>
              <th>Time</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={userId && r.userId === userId ? "your-row" : ""}
              >
                <td>
                  <span className={`rank-number rank-${r.rank}`}>
                    {r.rank < 4 ? <Medal size={16} /> : null}
                    {r.rank}
                  </span>
                </td>
                <td>
                  <span className="table-person">
                    <span className="avatar">{r.name[0]}</span>
                    {r.name}
                    {userId && r.userId === userId && (
                      <span className="badge">You</span>
                    )}
                  </span>
                </td>
                <td>
                  <strong>{r.score}</strong>
                </td>
                <td>{r.percentage}%</td>
                <td>{r.correct}</td>
                <td>{time(r.timeTaken)}</td>
                <td>{new Date(r.submittedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <div className="empty">
      <Trophy size={38} />
      <h3>The podium is waiting</h3>
      <p>Complete a quiz to claim the first spot.</p>
    </div>
  );
}
