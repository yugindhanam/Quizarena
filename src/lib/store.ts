import { promises as fs } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { Store } from "./types";
import { seed } from "./seed";
const globals = globalThis as unknown as {
  prisma?: PrismaClient;
  queue?: Promise<unknown>;
};
const file = path.join(process.cwd(), ".data", "store.json");
const postgres = process.env.DATA_MODE === "postgres";
const prisma = () => (globals.prisma ??= new PrismaClient());
export async function transact<T>(
  fn: (db: Store) => T | Promise<T>,
): Promise<T> {
  const work = async () => {
    if (postgres)
      return prisma().$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(729184)`;
          const raw = {
            users: await tx.user.findMany(),
            quizzes: await tx.quiz.findMany({
              include: {
                questions: {
                  include: { options: true },
                  orderBy: { position: "asc" },
                },
              },
            }),
            attempts: await tx.quizAttempt.findMany({
              include: { answers: true },
            }),
          };
          const db = JSON.parse(JSON.stringify(raw)) as Store;
          const result = await fn(db);
          const oldQuizIds = raw.quizzes
            .map((q) => q.id)
            .filter((id) => !db.quizzes.some((q) => q.id === id));
          await tx.quiz.deleteMany({ where: { id: { in: oldQuizIds } } });
          for (const u of db.users)
            await tx.user.upsert({ where: { id: u.id }, create: u, update: u });
          for (const q of db.quizzes) {
            const { questions, ...data } = q;
            await tx.quiz.upsert({
              where: { id: q.id },
              create: data,
              update: data,
            });
            await tx.question.deleteMany({
              where: {
                quizId: q.id,
                id: { notIn: questions.map((x) => x.id) },
              },
            });
            for (const question of questions) {
              const { options, ...qd } = question;
              await tx.question.upsert({
                where: { id: question.id },
                create: { ...qd, quizId: q.id },
                update: qd,
              });
              await tx.option.deleteMany({
                where: {
                  questionId: question.id,
                  id: { notIn: options.map((o) => o.id) },
                },
              });
              for (const o of options)
                await tx.option.upsert({
                  where: { id: o.id },
                  create: {
                    ...o,
                    isCorrect: !!o.isCorrect,
                    questionId: question.id,
                  },
                  update: {
                    optionText: o.optionText,
                    isCorrect: !!o.isCorrect,
                  },
                });
            }
          }
          for (const a of db.attempts) {
            const { answers, ...data } = a;
            await tx.quizAttempt.upsert({
              where: { id: a.id },
              create: data,
              update: data,
            });
            await tx.participantAnswer.deleteMany({
              where: {
                attemptId: a.id,
                questionId: {
                  notIn: answers.map((answer) => answer.questionId),
                },
              },
            });
            for (const ans of answers) {
              const id = `${a.id}-${ans.questionId}`;
              await tx.participantAnswer.upsert({
                where: { id },
                create: { ...ans, id, attemptId: a.id },
                update: ans,
              });
            }
          }
          return result;
        },
        { timeout: 30000 },
      );
    let db: Store;
    try {
      db = JSON.parse(await fs.readFile(file, "utf8"));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      db = seed();
    }
    const result = await fn(db);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = file + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(db));
    await fs.rename(tmp, file);
    return result;
  };
  const p = (globals.queue ?? Promise.resolve()).then(work);
  globals.queue = p.catch(() => {});
  return p;
}
