import { Attempt, Quiz, Store } from "./types";
export function finish(a: Attempt, q: Quiz, now = Date.now()) {
  if (a.status === "submitted") return;
  a.score = 0;
  for (const answer of a.answers) {
    const question = q.questions.find((x) => x.id === answer.questionId)!;
    answer.isCorrect = !!question.options.find(
      (o) => o.id === answer.selectedOptionId,
    )?.isCorrect;
    answer.marksAwarded = answer.selectedOptionId
      ? answer.isCorrect
        ? question.marks
        : -question.negativeMarks
      : 0;
    a.score += answer.marksAwarded;
  }
  a.percentage = Math.max(0, Math.round((a.score / q.totalMarks) * 100));
  a.submittedAt = new Date(Math.min(now, Date.parse(a.deadline))).toISOString();
  a.timeTaken = Math.max(
    0,
    Math.floor((Date.parse(a.submittedAt) - Date.parse(a.startedAt)) / 1000),
  );
  a.status = "submitted";
}
export function rankings(db: Store, quizId: string) {
  return db.attempts
    .filter((a) => a.quizId === quizId && a.status === "submitted")
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.timeTaken - b.timeTaken ||
        Date.parse(a.submittedAt!) - Date.parse(b.submittedAt!),
    )
    .map((a, i) => ({
      id: a.id,
      rank: i + 1,
      name:
        db.users.find((u) => u.id === a.userId)?.name ?? a.guestName ?? "Guest",
      score: a.score,
      percentage: a.percentage,
      timeTaken: a.timeTaken,
      submittedAt: a.submittedAt,
      correct: a.answers.filter((x) => x.isCorrect).length,
      userId: a.userId,
    }));
}
