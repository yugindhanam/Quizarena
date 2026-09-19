"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Plus,
  ArrowUpRight,
  Files,
  ClipboardCheck,
  Target,
  Trophy,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Flame,
  Sparkles,
  BookOpen,
  Check,
  Copy,
  X,
} from "lucide-react";
import Shell from "./shell";
import { api } from "@/lib/client";
import {
  categories,
  QuizCard,
  StatisticsCard,
  Loading,
  ErrorBox,
  ConfirmationModal,
} from "./ui";
export default function Dashboard({
  mode = "dashboard",
}: {
  mode?: "dashboard" | "quizzes" | "attempts" | "profile";
}) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All quizzes"),
    [sort, setSort] = useState("recent"),
    [modal, setModal] = useState<any>(null),
    [code, setCode] = useState(""),
    [name, setName] = useState(""),
    [saved, setSaved] = useState(false);
  const router = useRouter();
  const load = () =>
    api("dashboard")
      .then((d) => {
        setData(d);
        setName(d.user?.name ?? "");
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
    setSearch(new URLSearchParams(window.location.search).get("search") ?? "");
  }, []);
  async function action(type: string, q: any) {
    setError("");
    try {
      if (type === "delete") {
        setModal({ type, q });
        return;
      }
      if (type === "share") {
        setModal({ type, q });
        return;
      }
      if (type === "duplicate") {
        const source = await api(`quizzes/${q.id}/edit`);
        await api("quizzes", "POST", {
          ...source,
          title: source.title + " (copy)",
          published: false,
        });
      } else await api(`quizzes/${q.id}/publish`, "POST", {});
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }
  const quizzes = (data?.quizzes ?? [])
    .filter(
      (q: any) =>
        (mode !== "quizzes" || q.creatorId === data?.user?.id) &&
        (category === "All quizzes" || q.category === category) &&
        (q.title + " " + q.description)
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a: any, b: any) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "popular"
          ? b.participants - a.participants
          : Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  const attempts =
    data?.attempts?.filter((a: any) => a.status === "submitted") ?? [];
  const visibleScores = attempts.filter((a: any) => a.percentage !== null);
  const avg = visibleScores.length
    ? Math.round(
        visibleScores.reduce((sum: number, a: any) => sum + a.percentage, 0) /
          visibleScores.length,
      )
    : 0;
  return (
    <Shell search={search} onSearch={setSearch}>
      {!data ? (
        <>
          <ErrorBox message={error} />
          <Loading />
        </>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR LEARNING, LEVELLED UP</div>
              <h1>
                {mode === "dashboard"
                  ? `Let’s make knowledge count${data.user ? ", " + data.user.name.split(" ")[0] : ""}.`
                  : mode === "quizzes"
                    ? "Your quizzes. Endless possibilities."
                    : mode === "attempts"
                      ? "Every attempt is a step forward."
                      : "Make yourself at home."}
                <span className="heading-wave">
                  {mode === "dashboard" ? "✦" : ""}
                </span>
              </h1>
              <p>
                {mode === "dashboard"
                  ? "Create a challenge, put your skills to the test, and keep growing."
                  : mode === "quizzes"
                    ? "Create, manage, and share your next great challenge."
                    : mode === "attempts"
                      ? "A little reflection. A lot of progress. Explore your quiz history."
                      : "Manage your personal account and profile."}
              </p>
            </div>
            <Link className="btn primary heading-create" href="/create">
              <Plus size={17} />
              Create a quiz
            </Link>
          </div>
          <ErrorBox message={error} />
          {mode === "dashboard" && (
            <>
              <section className="hero-banner">
                <div className="hero-copy">
                  <span className="hero-pill">
                    <span /> A LITTLE CHALLENGE. A LOT OF POSSIBILITY.
                  </span>
                  <h2>
                    Create. Compete.
                    <br />
                    <span>Conquer.</span>
                  </h2>
                  <p>
                    Your next big idea starts with a question.
                    <br />
                    Build a quiz, bring people together, and let curiosity win.
                  </p>
                  <div className="hero-actions">
                    <Link className="btn hero-button" href="/create">
                      <Plus size={17} />
                      Create a quiz
                      <ArrowUpRight size={17} />
                    </Link>
                    <Link href="/join" className="hero-join">
                      Join a quiz <ArrowRight size={17} />
                    </Link>
                  </div>
                  <div className="hero-note">
                    <span className="mini-avatars">
                      <i>A</i>
                      <i>J</i>
                      <i>M</i>
                      <i>S</i>
                    </span>
                    <span>Built for curious minds, everywhere.</span>
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="art-grid" />
                  <span className="art-star star-one">✦</span>
                  <span className="art-star star-two">✧</span>
                  <span className="art-star star-three">+</span>
                  <div className="floating-label label-top">
                    <span className="label-icon">
                      <Check size={16} />
                    </span>
                    Challenge accepted!
                  </div>
                  <div className="trophy-orbit orbit-one" />
                  <div className="trophy-orbit orbit-two" />
                  <div className="trophy-card">
                    <div className="trophy-card-top">
                      <span>QUIZARENA</span>
                      <span>✦</span>
                    </div>
                    <div className="trophy-illustration">
                      <div className="cup-handle left" />
                      <div className="cup-handle right" />
                      <div className="cup-bowl">
                        <span>★</span>
                      </div>
                      <div className="cup-stem" />
                      <div className="cup-base" />
                    </div>
                    <div className="trophy-card-title">
                      You’re on top of your game.
                    </div>
                    <div className="trophy-card-sub">
                      A little wiser. A little higher.
                    </div>
                    <div className="trophy-card-bottom">
                      <span>KEEP CHALLENGING YOURSELF</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                  <div className="floating-label label-bottom">
                    <span className="label-icon lavender">
                      <Trophy size={17} />
                    </span>
                    <div>
                      Next stop? <strong>The leaderboard.</strong>
                    </div>
                    <span>↗</span>
                  </div>
                  <span className="art-circle" />
                </div>
              </section>
              <div className="stats-grid">
                <StatisticsCard
                  label="Quizzes created"
                  value={
                    data.user
                      ? data.quizzes.filter(
                          (q: any) => q.creatorId === data.user.id,
                        ).length
                      : 0
                  }
                  icon={Files}
                  color="purple"
                  detail="Ideas turned into challenges"
                />
                <StatisticsCard
                  label="Quizzes attempted"
                  value={attempts.length}
                  icon={ClipboardCheck}
                  color="blue"
                  detail="Every attempt is progress"
                />
                <StatisticsCard
                  label="Average score"
                  value={`${avg}%`}
                  icon={Target}
                  color="orange"
                  detail={
                    attempts.length
                      ? "Across your completed quizzes"
                      : "Your journey starts here"
                  }
                />
                <StatisticsCard
                  label="Best score"
                  value={`${visibleScores.length ? Math.max(...visibleScores.map((a: any) => a.percentage)) : 0}%`}
                  icon={Trophy}
                  color="green"
                  detail="Your personal best, so far"
                />
              </div>
            </>
          )}
          {(mode === "dashboard" || mode === "quizzes") && (
            <div className={mode === "dashboard" ? "dashboard-columns" : ""}>
              <section className="quiz-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      {mode === "quizzes" ? "My quizzes" : "Explore quizzes"}{" "}
                      <span className="count-badge">{quizzes.length}</span>
                    </h2>
                    <p>
                      {mode === "quizzes"
                        ? "A home for all your brilliant questions."
                        : "Find your next challenge. Discover something new."}
                    </p>
                  </div>
                  {mode === "dashboard" && (
                    <Link href="/quizzes" className="text-link">
                      My quizzes <ArrowUpRight size={15} />
                    </Link>
                  )}
                </div>
                <div className="category-tabs">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={category === c ? "selected" : ""}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="quiz-toolbar">
                  <label className="quiz-search">
                    <Search size={17} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search quizzes..."
                    />
                  </label>
                  <label className="sort-control">
                    <SlidersHorizontal size={15} />
                    <select
                      aria-label="Sort quizzes"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="recent">Most recent</option>
                      <option value="popular">Most popular</option>
                      <option value="title">A to Z</option>
                    </select>
                    <ChevronDown size={13} />
                  </label>
                </div>
                {quizzes.length ? (
                  <div className="quiz-grid">
                    {quizzes.map((q: any) => (
                      <QuizCard
                        key={q.id}
                        quiz={q}
                        manage={mode === "quizzes"}
                        onAction={action}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty">
                    <BookOpen size={30} />
                    <h3>
                      {mode === "quizzes" && !data.user
                        ? "Your ideas belong here"
                        : "No quizzes found"}
                    </h3>
                    <p>
                      {mode === "quizzes" && !data.user
                        ? "Log in to start creating your own quizzes."
                        : "Try another search or create something new."}
                    </p>
                    <Link
                      className="btn primary"
                      href={data.user ? "/create" : "/login"}
                    >
                      {data.user ? "Create a quiz" : "Log in"}
                    </Link>
                  </div>
                )}
              </section>
              {mode === "dashboard" && (
                <aside className="right-rail">
                  <section className="join-card">
                    <div className="rail-icon">
                      <ZapIcon />
                    </div>
                    <h3>Got a quiz code?</h3>
                    <p>A new challenge is just a code away.</p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        router.push("/join?code=" + encodeURIComponent(code));
                      }}
                    >
                      <input
                        aria-label="Quiz code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Enter quiz code"
                        required
                      />
                      <button className="btn primary" type="submit">
                        Join quiz <ArrowRight size={16} />
                      </button>
                    </form>
                    <small>
                      No invite? Try{" "}
                      <button onClick={() => setCode("QZ48291")}>
                        QZ48291
                      </button>
                    </small>
                  </section>
                  <section className="getting-started">
                    <div className="rail-heading">
                      <span className="small-icon orange">
                        <Flame size={18} />
                      </span>
                      <h3>Make your first move</h3>
                    </div>
                    <p>Great things start with a little curiosity.</p>
                    <Link href="/create">
                      <span className="step-number">1</span>
                      <div>
                        <strong>Create something great</strong>
                        <small>Turn your knowledge into a quiz</small>
                      </div>
                      <ArrowUpRight size={16} />
                    </Link>
                    <Link href="/join">
                      <span className="step-number">2</span>
                      <div>
                        <strong>Rise to the challenge</strong>
                        <small>Put your skills to the test</small>
                      </div>
                      <ArrowUpRight size={16} />
                    </Link>
                    <Link href="/leaderboard">
                      <span className="step-number">3</span>
                      <div>
                        <strong>Find your place at the top</strong>
                        <small>See how you stack up</small>
                      </div>
                      <ArrowUpRight size={16} />
                    </Link>
                  </section>
                  <section className="tip-card">
                    <Sparkles size={19} />
                    <span>THE CURIOSITY CORNER</span>
                    <blockquote>
                      “The beautiful thing about learning is that nobody can
                      take it away from you.”
                    </blockquote>
                    <small>— B. B. King</small>
                  </section>
                </aside>
              )}
            </div>
          )}
          {mode === "attempts" && (
            <section className="panel">
              <h2>My attempts</h2>
              {!data.attempts.length ? (
                <div className="empty">
                  <ClipboardCheck size={34} />
                  <h3>Your story is just getting started</h3>
                  <p>Complete a quiz to see your progress here.</p>
                  <Link href="/join" className="btn primary">
                    Join a quiz
                  </Link>
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Quiz</th>
                        <th>Score</th>
                        <th>Rank</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {data.attempts.map((a: any) => (
                        <tr key={a.id}>
                          <td>{a.title}</td>
                          <td>
                            {a.percentage === null
                              ? "Hidden"
                              : `${a.percentage}%`}
                          </td>
                          <td>{a.rank ? "#" + a.rank : "—"}</td>
                          <td>{new Date(a.startedAt).toLocaleDateString()}</td>
                          <td>
                            <span className="badge">{a.status}</span>
                          </td>
                          <td>
                            <Link
                              className="text-link"
                              href={
                                a.status === "active"
                                  ? `/exam/${a.id}`
                                  : `/results/${a.id}`
                              }
                            >
                              {a.status === "active" ? "Resume" : "View result"}
                              <ArrowUpRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {mode === "profile" && (
            <section className="panel profile-panel">
              {data.user ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await api("profile", "POST", { name });
                      setSaved(true);
                      load();
                    } catch (e: any) {
                      setError(e.message);
                    }
                  }}
                >
                  <span className="avatar profile-avatar">{name[0]}</span>
                  <h2>Your profile</h2>
                  <label>
                    Full name
                    <input
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setSaved(false);
                      }}
                    />
                  </label>
                  <label>
                    Email address
                    <input disabled value={data.user.email} />
                  </label>
                  <button className="btn primary">
                    {saved ? (
                      <>
                        <Check size={16} />
                        Saved
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </form>
              ) : (
                <div className="empty">
                  <h2>Make it personal</h2>
                  <p>Log in to manage your profile and track your progress.</p>
                  <Link className="btn primary" href="/login">
                    Log in
                  </Link>
                </div>
              )}
            </section>
          )}
        </>
      )}
      {modal?.type === "delete" && (
        <ConfirmationModal
          title="Delete this quiz?"
          onClose={() => setModal(null)}
          label="Delete quiz"
          onConfirm={async () => {
            try {
              await api(`quizzes/${modal.q.id}`, "DELETE", {});
              setModal(null);
              load();
            } catch (e: any) {
              setError(e.message);
              setModal(null);
            }
          }}
        >
          <p>This permanently deletes “{modal.q.title}” and its attempts.</p>
        </ConfirmationModal>
      )}
      {modal?.type === "share" && (
        <div className="modal-backdrop">
          <section className="modal">
            <button
              className="icon-btn modal-close"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <X />
            </button>
            <h2>Good challenges are worth sharing.</h2>
            <p>Invite someone to {modal.q.title}</p>
            <div className="share-code">{modal.q.quizCode}</div>
            <button
              className="btn primary"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `${location.origin}/join?code=${modal.q.quizCode}`,
                );
                setSaved(true);
              }}
            >
              {saved ? <Check size={16} /> : <Copy size={16} />}{" "}
              {saved ? "Link copied" : "Copy quiz link"}
            </button>
          </section>
        </div>
      )}
    </Shell>
  );
}
function ZapIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="m13 2-9 12h7l-1 8 10-13h-7z" />
    </svg>
  );
}
