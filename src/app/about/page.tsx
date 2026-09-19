import Link from "next/link";
import {
  Zap,
  ArrowRight,
  Plus,
  ClipboardCheck,
  Trophy,
  Clock,
  KeyRound,
  ChartNoAxesCombined,
} from "lucide-react";
export default function About() {
  return (
    <div className="landing">
      <nav>
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Zap size={22} fill="currentColor" />
          </span>
          QuizArena.
        </Link>
        <div>
          <Link href="/">Home</Link>
          <a href="#features">Features</a>
          <Link href="/create">Create Quiz</Link>
          <Link href="/join">Join Quiz</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup" className="btn primary">
            Sign up
          </Link>
        </div>
      </nav>
      <section className="landing-hero">
        <span className="eyebrow">BUILT FOR CURIOUS MINDS</span>
        <h1>
          Create. Compete.
          <br />
          <span>Conquer.</span>
        </h1>
        <p>
          Create interactive exams and quizzes, challenge your friends or
          students, and climb the leaderboard.
        </p>
        <div>
          <Link href="/create" className="btn primary">
            <Plus size={18} />
            Create Quiz
          </Link>
          <Link href="/join" className="btn secondary">
            Join Quiz
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section id="features" className="landing-features">
        {[
          [
            Plus,
            "Easy Quiz Creation",
            "Give your ideas a home with an intuitive question editor.",
          ],
          [
            ClipboardCheck,
            "Instant Results",
            "A clear picture of your progress, as soon as you submit.",
          ],
          [
            Trophy,
            "Live Leaderboard",
            "A little friendly competition makes learning better.",
          ],
          [
            Clock,
            "Timed Exams",
            "Stay focused with a reliable, server-validated timer.",
          ],
          [
            KeyRound,
            "Secure Quiz Codes",
            "Bring your people together with a simple shareable code.",
          ],
          [
            ChartNoAxesCombined,
            "Performance Analytics",
            "Understand every attempt and every question.",
          ],
        ].map(([Icon, title, text]: any) => (
          <article className="panel" key={title}>
            <span className="large-icon purple">
              <Icon size={24} />
            </span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <footer>
        © {new Date().getFullYear()} QuizArena. Made for curious minds.
      </footer>
    </div>
  );
}
