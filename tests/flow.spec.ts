import { test, expect, request } from "@playwright/test";
test("creator can register, author a question, and publish through the interface", async ({
  page,
}) => {
  await page.goto("http://localhost:3000/signup");
  await page.getByLabel("Full name").fill("Creator UI Test");
  await page.getByLabel("Email address").fill(`ui-${Date.now()}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("CreatorTest123!");
  await page.getByLabel("Confirm password").fill("CreatorTest123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Let’s make knowledge count/ }),
  ).toBeVisible();
  await page.goto("http://localhost:3000/create");
  await page.getByLabel("Quiz title").fill("A freshly published test");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Created in an actual browser.");
  await page
    .getByPlaceholder("Write your question here…")
    .fill("Which number is even?");
  for (const [i, v] of ["2", "3", "5", "7"].entries())
    await page
      .getByRole("textbox", { name: `Option ${i + 1}`, exact: true })
      .fill(v);
  await page.getByRole("button", { name: "Publish quiz", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "A freshly published test",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Published", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/creator-analytics.png",
    fullPage: true,
  });
  const id = new URL(page.url()).pathname.split("/")[2];
  await page.request.delete(`http://localhost:3000/api/quizzes/${id}`, {
    data: {},
  });
});
test("expired attempts use saved answers and obey hidden results settings", async () => {
  const owner = await request.newContext({ baseURL: "http://localhost:3000" }),
    participant = await request.newContext({
      baseURL: "http://localhost:3000",
    });
  let id = "";
  try {
    await owner.post("/api/auth/login", {
      data: { email: "demo@quizarena.app", password: "QuizArena123!" },
    });
    const source = await (await owner.get("/api/quizzes/quiz-0/edit")).json();
    const quiz = await (
      await owner.post("/api/quizzes", {
        data: {
          ...source,
          title: "Deadline and privacy test",
          endTime: new Date(Date.now() + 4000).toISOString(),
          showScore: false,
          showAnswers: false,
          leaderboardEnabled: false,
        },
      })
    ).json();
    id = quiz.id;
    expect(id).toBeTruthy();
    const attempt = await (
      await participant.post(`/api/quizzes/${id}/start`, {
        data: { name: "Deadline tester" },
      })
    ).json();
    const exam = await (
      await participant.get("/api/attempts/" + attempt.id)
    ).json();
    const q = exam.quiz.questions[0];
    await participant.post(`/api/attempts/${attempt.id}/save`, {
      data: {
        answers: [
          {
            questionId: q.id,
            selectedOptionId: q.options[1].id,
            review: false,
          },
        ],
      },
    });
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        Math.max(0, Date.parse(exam.attempt.deadline) - Date.now()) + 100,
      ),
    );
    const result = await (
      await participant.post(`/api/attempts/${attempt.id}/submit`, {
        data: { answers: [] },
      })
    ).json();
    expect(result.attempt.status).toBe("submitted");
    expect(result.attempt.score).toBeNull();
    expect(JSON.stringify(result)).not.toContain("isCorrect");
    expect(result.attempt.answers).toHaveLength(1);
    expect(
      (await participant.get(`/api/quizzes/${id}/leaderboard`)).ok(),
    ).toBeFalsy();
    const analytics = await (
      await owner.get(`/api/quizzes/${id}/analytics`)
    ).json();
    expect(analytics.rows[0].score).toBe(10);
    expect(
      (
        await participant.post(`/api/quizzes/${id}/start`, {
          data: { name: "Deadline tester" },
        })
      ).ok(),
    ).toBeFalsy();
  } finally {
    if (id) await owner.delete("/api/quizzes/" + id, { data: {} });
    await owner.dispose();
    await participant.dispose();
  }
});
test("creator to guest flow enforces privacy, ownership, scoring, and attempt limits", async () => {
  const creator = await request.newContext({
    baseURL: "http://localhost:3000",
  });
  const guest = await request.newContext({ baseURL: "http://localhost:3000" });
  const other = await request.newContext({ baseURL: "http://localhost:3000" });
  let quizId = "";
  try {
    let r = await creator.post("/api/auth/signup", {
      data: {
        name: "Test Creator",
        email: `flow-${Date.now()}@example.com`,
        password: "StrongTest123!",
      },
    });
    expect(r.ok()).toBeTruthy();
    const input = {
      title: "Integration Test Quiz",
      description: "Tests the complete secure exam flow.",
      category: "Development",
      difficulty: "Easy",
      duration: 15,
      startTime: null,
      endTime: null,
      leaderboardEnabled: true,
      showScore: true,
      showAnswers: true,
      allowGuests: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      maxAttempts: 1,
      published: true,
      questions: [
        {
          id: "q1",
          questionText: "What is 2 + 2?",
          marks: 10,
          negativeMarks: 2,
          position: 0,
          options: [
            { id: "a", optionText: "4", isCorrect: true },
            { id: "b", optionText: "5", isCorrect: false },
            { id: "c", optionText: "6", isCorrect: false },
            { id: "d", optionText: "7", isCorrect: false },
          ],
        },
      ],
    };
    r = await creator.post("/api/quizzes", { data: input });
    expect(r.ok()).toBeTruthy();
    const q = await r.json();
    quizId = q.id;
    r = await guest.get(`/api/quizzes/${q.quizCode}`);
    const preview = await r.json();
    expect(preview.questions).toBeUndefined();
    expect(preview.totalMarks).toBe(10);
    r = await other.get(`/api/quizzes/${quizId}/edit`);
    expect(r.ok()).toBeFalsy();
    r = await guest.post(`/api/quizzes/${quizId}/start`, {
      data: { name: "Test Participant" },
    });
    expect(r.ok()).toBeTruthy();
    const { id } = await r.json();
    r = await guest.get(`/api/attempts/${id}`);
    let exam = await r.json();
    expect(JSON.stringify(exam)).not.toContain("isCorrect");
    const deadline = exam.attempt.deadline;
    r = await other.get(`/api/attempts/${id}`);
    expect(r.ok()).toBeFalsy();
    r = await guest.post(`/api/quizzes/${quizId}/start`, {
      data: { name: "Test Participant" },
    });
    expect((await r.json()).id).toBe(id);
    const question = exam.quiz.questions[0];
    r = await guest.post(`/api/attempts/${id}/save`, {
      data: {
        answers: [
          {
            questionId: question.id,
            selectedOptionId: "forged",
            review: false,
          },
        ],
      },
    });
    expect(r.ok()).toBeFalsy();
    const answers = [
      {
        questionId: question.id,
        selectedOptionId: question.options.find(
          (o: any) => o.optionText === "4",
        ).id,
        review: true,
      },
    ];
    r = await guest.post(`/api/attempts/${id}/save`, { data: { answers } });
    expect(r.ok()).toBeTruthy();
    r = await guest.get(`/api/attempts/${id}`);
    exam = await r.json();
    expect(exam.attempt.deadline).toBe(deadline);
    expect(exam.attempt.answers[0].selectedOptionId).toBe(
      answers[0].selectedOptionId,
    );
    r = await guest.post(`/api/attempts/${id}/submit`, {
      data: { answers, score: 999999 },
    });
    const result = await r.json();
    expect(result.attempt.score).toBe(10);
    expect(result.attempt.percentage).toBe(100);
    expect(result.rank).toBe(1);
    r = await guest.post(`/api/attempts/${id}/submit`, {
      data: { answers: [] },
    });
    expect((await r.json()).attempt.score).toBe(10);
    r = await guest.post(`/api/quizzes/${quizId}/start`, {
      data: { name: "Test Participant" },
    });
    expect(r.ok()).toBeFalsy();
    r = await creator.get(`/api/quizzes/${quizId}/analytics`);
    expect((await r.json()).rows[0].name).toBe("Test Participant");
    r = await creator.put(`/api/quizzes/${quizId}`, { data: input });
    expect(r.ok()).toBeFalsy();
  } finally {
    if (quizId) await creator.delete("/api/quizzes/" + quizId, { data: {} });
    await Promise.all([creator.dispose(), guest.dispose(), other.dispose()]);
  }
});
test("responsive dashboard, join and exam screens work in a browser", async ({
  page,
}) => {
  await page.goto("http://localhost:3000");
  await expect(
    page.getByRole("heading", { name: "Explore quizzes" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "UI / UX Design Principles" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "JavaScript Essentials" }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "All quizzes", exact: true }).click();
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(
    page.getByRole("link", { name: "My Attempts", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close menu" }).click();
  await page.goto("http://localhost:3000/join?code=QZ48291");
  await expect(
    page.getByRole("heading", { name: "JavaScript Essentials" }),
  ).toBeVisible();
  await page
    .getByPlaceholder("How should we introduce you?")
    .fill("Browser Tester");
  await page.getByRole("button", { name: "Start quiz", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Which keyword declares a block-scoped variable in JavaScript?",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "B let", exact: true }).click();
  await page.getByRole("button", { name: "Next question" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "B let", exact: true }),
  ).toHaveClass("selected");
  await page.screenshot({
    path: "test-results/exam-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Submit quiz", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Submit quiz", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "10 / 50 marks" }),
  ).toBeVisible();
});
