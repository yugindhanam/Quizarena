import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hash, compare } from "bcryptjs";
import { randomUUID, randomInt } from "crypto";
import { z } from "zod";
import { identity, login, guest } from "@/lib/auth";
import { transact } from "@/lib/store";
import { finish, rankings } from "@/lib/exam";
import { Quiz, Attempt } from "@/lib/types";
export const runtime = "nodejs";
const option = z.object({
  id: z.string(),
  optionText: z.string().trim().min(1).max(1000),
  isCorrect: z.boolean(),
});
const question = z.object({
  id: z.string(),
  questionText: z.string().trim().min(1).max(5000),
  marks: z.number().positive().max(1000),
  negativeMarks: z.number().min(0).max(1000),
  position: z.number().int(),
  options: z
    .array(option)
    .length(4)
    .refine(
      (x) => new Set(x.map((o) => o.id)).size === 4,
      "Option IDs must be unique",
    )
    .refine(
      (x) => x.filter((o) => o.isCorrect).length === 1,
      "Select exactly one correct answer",
    ),
});
const quizSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().max(3000),
  category: z.string().min(1),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  duration: z.number().int().min(1).max(300),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  leaderboardEnabled: z.boolean(),
  showAnswers: z.boolean(),
  showScore: z.boolean(),
  allowGuests: z.boolean(),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
  maxAttempts: z.number().int().min(1).max(100),
  published: z.boolean(),
  questions: z
    .array(question)
    .min(1)
    .refine(
      (x) => new Set(x.map((q) => q.id)).size === x.length,
      "Question IDs must be unique",
    ),
});
const shuffle = <T>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const origin = req.headers.get("origin");
    if (
      req.method !== "GET" &&
      origin &&
      new URL(origin).host !== req.headers.get("host")
    )
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const parts = (await params).path;
    const [area, id, action] = parts;
    const uid = await identity();
    const gid = await guest();
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const result = await transact(async (db) => {
      const user = db.users.find((u) => u.id === uid);
      const safeUser = user
        ? { id: user.id, name: user.name, email: user.email }
        : null;
      const fail = (message: string): never => {
        throw new Error(message);
      };
      for (const a of db.attempts)
        if (a.status === "active" && Date.parse(a.deadline) <= Date.now())
          finish(
            a,
            db.quizzes.find((q) => q.id === a.quizId)!,
          );
      if (area === "auth") {
        if (req.method !== "POST") fail("Method not allowed.");
        if (id === "logout") {
          (await cookies()).delete("qa_session");
          return { ok: true };
        }
        if (id === "signup") {
          const data = z
            .object({
              name: z.string().trim().min(2).max(80),
              email: z.email().max(254),
              password: z.string().min(8).max(128),
            })
            .parse(body);
          data.email = data.email.toLowerCase();
          if (db.users.some((u) => u.email === data.email))
            fail("An account already exists with this email.");
          const u = {
            id: randomUUID(),
            name: data.name,
            email: data.email,
            passwordHash: await hash(data.password, 12),
            createdAt: new Date().toISOString(),
          };
          db.users.push(u);
          await login(u.id);
          return { ok: true };
        }
        if (id === "login") {
          const data = z
            .object({ email: z.email(), password: z.string().max(128) })
            .parse(body);
          const u = db.users.find((u) => u.email === data.email.toLowerCase());
          if (!u || !(await compare(data.password, u.passwordHash)))
            fail("Email or password is incorrect.");
          await login(u!.id);
          return { ok: true };
        }
      }
      if (area === "dashboard")
        return {
          user: safeUser,
          quizzes: db.quizzes
            .filter((q) => q.published || q.creatorId === uid)
            .map((q) => ({
              ...q,
              questions: undefined,
              questionCount: q.questions.length,
              participants: db.attempts.filter((a) => a.quizId === q.id).length,
              creatorName: db.users.find((u) => u.id === q.creatorId)?.name,
            })),
          attempts: db.attempts
            .filter((a) => (uid ? a.userId === uid : a.guestToken === gid))
            .map((a) => ({
              ...a,
              guestToken: undefined,
              answers: undefined,
              title: db.quizzes.find((q) => q.id === a.quizId)?.title,
              score: db.quizzes.find((q) => q.id === a.quizId)?.showScore
                ? a.score
                : null,
              percentage: db.quizzes.find((q) => q.id === a.quizId)?.showScore
                ? a.percentage
                : null,
              rank: db.quizzes.find((q) => q.id === a.quizId)
                ?.leaderboardEnabled
                ? rankings(db, a.quizId).find((r) => r.id === a.id)?.rank
                : null,
            })),
        };
      if (area === "profile") {
        if (req.method !== "POST") fail("Method not allowed.");
        if (!user) fail("Please log in to continue.");
        user!.name = z.string().trim().min(2).max(80).parse(body.name);
        return { ok: true };
      }
      if (area === "quizzes") {
        if ((req.method === "POST" && !id) || req.method === "PUT") {
          if (!user) fail("Please log in to create a quiz.");
          const data = quizSchema.parse(body);
          for (const t of [data.startTime, data.endTime])
            if (t && !Number.isFinite(Date.parse(t)))
              fail("Invalid schedule date.");
          if (
            data.startTime &&
            data.endTime &&
            Date.parse(data.startTime) >= Date.parse(data.endTime)
          )
            fail("End time must be after start time.");
          const old = id ? db.quizzes.find((q) => q.id === id) : null;
          if (id && (!old || old.creatorId !== uid))
            fail("Quiz not found or access denied.");
          if (old && db.attempts.some((a) => a.quizId === id))
            fail(
              "This quiz has attempts. Duplicate it to change its questions.",
            );
          let code = "";
          do {
            code = `QZ${randomInt(10000, 99999)}`;
          } while (db.quizzes.some((q) => q.quizCode === code));
          const q: Quiz = {
            ...data,
            id: old?.id ?? randomUUID(),
            creatorId: uid!,
            quizCode: old?.quizCode ?? code,
            createdAt: old?.createdAt ?? new Date().toISOString(),
            totalMarks: data.questions.reduce((sum, q) => sum + q.marks, 0),
            questions: data.questions.map((q, i) => {
              const previous = old?.questions.find((x) => x.id === q.id);
              return {
                ...q,
                id: previous?.id ?? randomUUID(),
                position: i,
                options: q.options.map((o) => ({
                  ...o,
                  id:
                    previous?.options.find((x) => x.id === o.id)?.id ??
                    randomUUID(),
                })),
              };
            }),
          };
          if (old) db.quizzes[db.quizzes.indexOf(old)] = q;
          else db.quizzes.push(q);
          return { id: q.id, quizCode: q.quizCode };
        }
        const q = db.quizzes.find(
          (q) => q.id === id || q.quizCode === id?.toUpperCase(),
        );
        if (!q) fail("Quiz not found. Please check the quiz code.");
        const quiz = q!;
        const owner = uid === quiz.creatorId;
        if (req.method === "DELETE") {
          if (!owner) fail("Access denied.");
          db.attempts = db.attempts.filter((a) => a.quizId !== quiz.id);
          db.quizzes = db.quizzes.filter((q) => q.id !== quiz.id);
          return { ok: true };
        }
        if (action === "publish") {
          if (req.method !== "POST") fail("Method not allowed.");
          if (!owner) fail("Access denied.");
          quiz.published = !quiz.published;
          return { ok: true };
        }
        if (action === "edit") {
          if (!owner) fail("Access denied.");
          return quiz;
        }
        if (!quiz.published && !owner) fail("This quiz is not published.");
        if (action === "leaderboard") {
          if (!quiz.leaderboardEnabled && !owner)
            fail("Leaderboard is disabled for this quiz.");
          return {
            quiz: {
              id: quiz.id,
              title: quiz.title,
              totalMarks: quiz.totalMarks,
            },
            rows: rankings(db, quiz.id),
            userId: uid,
          };
        }
        if (action === "analytics") {
          if (!owner) fail("Access denied.");
          const attempts = db.attempts.filter(
            (a) => a.quizId === quiz.id && a.status === "submitted",
          );
          return {
            quiz,
            rows: rankings(db, quiz.id),
            questions: quiz.questions.map((q) => ({
              text: q.questionText,
              correct: attempts.filter((a) =>
                a.answers.some(
                  (ans) => ans.questionId === q.id && ans.isCorrect,
                ),
              ).length,
              total: attempts.length,
            })),
          };
        }
        if (action === "start") {
          if (req.method !== "POST") fail("Method not allowed.");
          if (!quiz.published) fail("This quiz is not published.");
          if (!user && !quiz.allowGuests)
            fail("Please log in to join this quiz.");
          const now = Date.now();
          if (quiz.startTime && now < Date.parse(quiz.startTime))
            fail("This quiz has not started yet.");
          if (quiz.endTime && now >= Date.parse(quiz.endTime))
            fail("This quiz has ended.");
          const mine = db.attempts.filter(
            (a) =>
              a.quizId === quiz.id &&
              (uid ? a.userId === uid : a.guestToken === gid),
          );
          const active = mine.find((a) => a.status === "active");
          if (active) return { id: active.id };
          if (mine.length >= quiz.maxAttempts)
            fail("You have reached the maximum number of attempts.");
          const name =
            user?.name ?? z.string().trim().min(2).max(80).parse(body.name);
          const a: Attempt = {
            id: randomUUID(),
            quizId: quiz.id,
            userId: uid,
            guestName: user ? null : name,
            guestToken: user ? null : gid,
            startedAt: new Date(now).toISOString(),
            deadline: new Date(
              Math.min(
                now + quiz.duration * 60000,
                quiz.endTime ? Date.parse(quiz.endTime) : Infinity,
              ),
            ).toISOString(),
            submittedAt: null,
            score: 0,
            percentage: 0,
            timeTaken: 0,
            status: "active",
            questionOrder: (quiz.shuffleQuestions
              ? shuffle(quiz.questions)
              : quiz.questions
            ).map((q) => q.id),
            optionOrder: Object.fromEntries(
              quiz.questions.map((q) => [
                q.id,
                (quiz.shuffleOptions ? shuffle(q.options) : q.options).map(
                  (o) => o.id,
                ),
              ]),
            ),
            answers: [],
          };
          db.attempts.push(a);
          return { id: a.id };
        }
        return {
          ...quiz,
          questions: undefined,
          questionCount: quiz.questions.length,
          creatorName: db.users.find((u) => u.id === quiz.creatorId)?.name,
        };
      }
      if (area === "attempts") {
        const a = db.attempts.find(
          (a) => a.id === id && (uid ? a.userId === uid : a.guestToken === gid),
        );
        if (!a) fail("Attempt not found or access denied.");
        const attempt = a!;
        const q = db.quizzes.find((q) => q.id === attempt.quizId)!;
        if (req.method === "POST" && attempt.status === "active") {
          if (Date.now() >= Date.parse(attempt.deadline)) finish(attempt, q);
          else {
            if (body.answers) {
              const answers = z
                .array(
                  z.object({
                    questionId: z.string(),
                    selectedOptionId: z.string().nullable(),
                    review: z.boolean(),
                  }),
                )
                .parse(body.answers);
              if (
                new Set(answers.map((a) => a.questionId)).size !==
                answers.length
              )
                fail("Duplicate answers.");
              for (const ans of answers) {
                const question = q.questions.find(
                  (x) => x.id === ans.questionId,
                );
                if (
                  !question ||
                  (ans.selectedOptionId &&
                    !question.options.some(
                      (o) => o.id === ans.selectedOptionId,
                    ))
                )
                  fail("Invalid answer.");
              }
              attempt.answers = answers;
            }
            if (action === "submit") finish(attempt, q);
          }
        }
        const done = attempt.status === "submitted";
        return {
          attempt: {
            ...attempt,
            guestToken: undefined,
            score: done && q.showScore ? attempt.score : null,
            percentage: done && q.showScore ? attempt.percentage : null,
            answers: attempt.answers.map((a) => ({
              questionId: a.questionId,
              selectedOptionId: a.selectedOptionId,
              review: a.review,
              ...(done && q.showAnswers
                ? { isCorrect: a.isCorrect, marksAwarded: a.marksAwarded }
                : {}),
            })),
          },
          quiz: {
            ...q,
            questions: attempt.questionOrder
              .map((id) => q.questions.find((x) => x.id === id)!)
              .map((x) => ({
                ...x,
                options: attempt.optionOrder[x.id]
                  .map((id) => x.options.find((o) => o.id === id)!)
                  .map((o) => ({
                    id: o.id,
                    optionText: o.optionText,
                    ...(done && q.showAnswers
                      ? { isCorrect: o.isCorrect }
                      : {}),
                  })),
              })),
          },
          rank:
            done && q.leaderboardEnabled
              ? rankings(db, q.id).find((r) => r.id === attempt.id)?.rank
              : null,
        };
      }
      fail("Not found.");
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues[0].message
            : error instanceof Error
              ? error.message
              : "Something went wrong.",
      },
      { status: 400 },
    );
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
