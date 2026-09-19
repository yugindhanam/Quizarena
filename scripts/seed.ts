import { transact } from "../src/lib/store";
import { seed } from "../src/lib/seed";
async function main() {
  await transact((db) => {
    const sample = seed();
    if (!db.users.some((u) => u.email === "demo@quizarena.app"))
      db.users.push(...sample.users);
    for (const q of sample.quizzes)
      if (!db.quizzes.some((existing) => existing.quizCode === q.quizCode))
        db.quizzes.push(q);
  });
  console.log("Seed complete. Demo: demo@quizarena.app / QuizArena123!");
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
