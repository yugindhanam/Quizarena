"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Check,
  Save,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import Shell from "./shell";
import { ErrorBox, Loading, categories } from "./ui";
import { api } from "@/lib/client";
import { Question } from "@/lib/types";
const newQuestion = (): Question => ({
  id: crypto.randomUUID(),
  questionText: "",
  marks: 10,
  negativeMarks: 0,
  position: 0,
  options: Array.from({ length: 4 }, (_, i) => ({
    id: crypto.randomUUID(),
    optionText: "",
    isCorrect: i === 0,
  })),
});
export default function QuizEditor() {
  const [loading, setLoading] = useState(true),
    [user, setUser] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editId, setEditId] = useState("");
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    category: "Development",
    difficulty: "Medium",
    duration: 15,
    startTime: null,
    endTime: null,
    leaderboardEnabled: true,
    showAnswers: true,
    showScore: true,
    allowGuests: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    maxAttempts: 1,
    published: false,
    questions: [],
  });
  const router = useRouter();
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("id");
    api("dashboard")
      .then(async (d) => {
        setUser(d.user);
        if (id) {
          setEditId(id);
          setForm(await api(`quizzes/${id}/edit`));
        } else setForm((f: any) => ({ ...f, questions: [newQuestion()] }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const field = (key: string, value: any) => setForm({ ...form, [key]: value });
  const update = (i: number, q: Question) =>
    field(
      "questions",
      form.questions.map((x: Question, j: number) => (j === i ? q : x)),
    );
  function move(i: number, dir: number) {
    const qs = [...form.questions];
    [qs[i], qs[i + dir]] = [qs[i + dir], qs[i]];
    field("questions", qs);
  }
  async function save(published: boolean) {
    setBusy(true);
    setError("");
    try {
      const result = await api(
        editId ? `quizzes/${editId}` : "quizzes",
        editId ? "PUT" : "POST",
        {
          ...form,
          published,
          questions: form.questions.map((q: Question, i: number) => ({
            ...q,
            position: i,
          })),
        },
      );
      router.push(`/quiz/${result.id}/results?created=1`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="page-heading">
        <div>
          <div className="eyebrow">GREAT CHALLENGES START HERE</div>
          <h1>
            {editId ? "Refine your challenge." : "What will you ask the world?"}
          </h1>
          <p>A few good questions can open a whole new world.</p>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : !user ? (
        <div className="panel empty">
          <Layers size={38} />
          <h2>Let’s make it yours</h2>
          <p>
            Log in to create quizzes, share challenges, and follow your
            participants’ progress.
          </p>
          <Link href="/login" className="btn primary">
            Log in to create <ArrowUpRight size={16} />
          </Link>
          <Link href="/signup" className="text-link">
            Or create a free account
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(true);
          }}
        >
          <ErrorBox message={error} />
          <div className="editor-layout">
            <div>
              <section className="panel">
                <div className="panel-title">
                  <span className="step-number">1</span>
                  <div>
                    <h2>The essentials</h2>
                    <p>Give your quiz a little personality.</p>
                  </div>
                </div>
                <label>
                  Quiz title
                  <input
                    required
                    minLength={3}
                    maxLength={160}
                    value={form.title}
                    onChange={(e) => field("title", e.target.value)}
                    placeholder="e.g. The ultimate JavaScript challenge"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) => field("description", e.target.value)}
                    placeholder="What will participants discover?"
                    rows={3}
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Category
                    <select
                      value={form.category}
                      onChange={(e) => field("category", e.target.value)}
                    >
                      {categories.slice(1).map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Difficulty
                    <select
                      value={form.difficulty}
                      onChange={(e) => field("difficulty", e.target.value)}
                    >
                      {["Easy", "Medium", "Hard"].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Duration (minutes)
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={form.duration}
                      onChange={(e) => field("duration", +e.target.value)}
                    />
                  </label>
                  <label>
                    Maximum attempts
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={form.maxAttempts}
                      onChange={(e) => field("maxAttempts", +e.target.value)}
                    />
                  </label>
                </div>
              </section>
              <div className="questions-title">
                <h2>
                  Questions{" "}
                  <span className="count-badge">{form.questions.length}</span>
                </h2>
                <span>
                  {form.questions.reduce(
                    (s: number, q: Question) => s + q.marks,
                    0,
                  )}{" "}
                  total marks
                </span>
              </div>
              {form.questions.map((q: Question, i: number) => (
                <section key={q.id} className="panel question-editor">
                  <div className="question-editor-top">
                    <span className="question-label">
                      QUESTION {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Move up"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Move down"
                        disabled={i === form.questions.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Duplicate question"
                        onClick={() =>
                          field("questions", [
                            ...form.questions,
                            {
                              ...q,
                              id: crypto.randomUUID(),
                              options: q.options.map((o) => ({
                                ...o,
                                id: crypto.randomUUID(),
                              })),
                            },
                          ])
                        }
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Delete question"
                        disabled={form.questions.length === 1}
                        onClick={() =>
                          field(
                            "questions",
                            form.questions.filter(
                              (_: Question, j: number) => j !== i,
                            ),
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    required
                    value={q.questionText}
                    onChange={(e) =>
                      update(i, { ...q, questionText: e.target.value })
                    }
                    placeholder="Write your question here…"
                    rows={2}
                  />
                  <p className="field-hint">
                    Add four options. Select the circle next to the correct
                    answer.
                  </p>
                  <div className="option-editor-grid">
                    {q.options.map((o, j) => (
                      <div
                        key={o.id}
                        className={`option-editor ${o.isCorrect ? "correct" : ""}`}
                      >
                        <button
                          type="button"
                          aria-label={`Mark option ${j + 1} as correct`}
                          onClick={() =>
                            update(i, {
                              ...q,
                              options: q.options.map((x) => ({
                                ...x,
                                isCorrect: x.id === o.id,
                              })),
                            })
                          }
                        >
                          {o.isCorrect ? (
                            <Check size={15} />
                          ) : (
                            String.fromCharCode(65 + j)
                          )}
                        </button>
                        <input
                          required
                          aria-label={`Option ${j + 1}`}
                          placeholder={`Option ${String.fromCharCode(65 + j)}`}
                          value={o.optionText}
                          onChange={(e) =>
                            update(i, {
                              ...q,
                              options: q.options.map((x) =>
                                x.id === o.id
                                  ? { ...x, optionText: e.target.value }
                                  : x,
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="marks-row">
                    <label>
                      Marks
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={q.marks}
                        onChange={(e) =>
                          update(i, { ...q, marks: +e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Negative marks
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        value={q.negativeMarks}
                        onChange={(e) =>
                          update(i, { ...q, negativeMarks: +e.target.value })
                        }
                      />
                    </label>
                  </div>
                </section>
              ))}
              <button
                type="button"
                className="add-question"
                onClick={() =>
                  field("questions", [...form.questions, newQuestion()])
                }
              >
                <Plus size={18} />
                Add another question
              </button>
            </div>
            <aside>
              <section className="panel settings-panel">
                <h2>Make it your own</h2>
                <p>A few finishing touches.</p>
                {[
                  [
                    "leaderboardEnabled",
                    "Show leaderboard",
                    "A little healthy competition.",
                  ],
                  [
                    "showScore",
                    "Show results",
                    "Let participants see their score.",
                  ],
                  [
                    "showAnswers",
                    "Reveal answers",
                    "Help participants learn afterward.",
                  ],
                  [
                    "allowGuests",
                    "Welcome guests",
                    "No account needed to participate.",
                  ],
                  [
                    "shuffleQuestions",
                    "Shuffle questions",
                    "A fresh order for every attempt.",
                  ],
                  [
                    "shuffleOptions",
                    "Shuffle options",
                    "Mix up the answer choices.",
                  ],
                ].map(([key, label, desc]) => (
                  <label className="toggle-row" key={key}>
                    <div>
                      <strong>{label}</strong>
                      <small>{desc}</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => field(key, e.target.checked)}
                    />
                  </label>
                ))}
                <div className="schedule-fields">
                  <h3>
                    Schedule <small>Optional</small>
                  </h3>
                  <label>
                    Starts at
                    <input
                      type="datetime-local"
                      value={
                        form.startTime
                          ? new Date(
                              Date.parse(form.startTime) -
                                new Date().getTimezoneOffset() * 60000,
                            )
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        field(
                          "startTime",
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        )
                      }
                    />
                  </label>
                  <label>
                    Ends at
                    <input
                      type="datetime-local"
                      value={
                        form.endTime
                          ? new Date(
                              Date.parse(form.endTime) -
                                new Date().getTimezoneOffset() * 60000,
                            )
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        field(
                          "endTime",
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        )
                      }
                    />
                  </label>
                </div>
                <button className="btn primary" disabled={busy}>
                  <Check size={17} />
                  {busy ? "Saving…" : "Publish quiz"}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => save(false)}
                >
                  <Save size={16} />
                  Save as draft
                </button>
                <small className="publish-note">
                  Your unique quiz code is generated when you save.
                </small>
              </section>
            </aside>
          </div>
        </form>
      )}
    </Shell>
  );
}
