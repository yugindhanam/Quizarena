"use client";
import {
  X,
  LoaderCircle,
  ArrowUpRight,
  Clock,
  Users,
  Layers,
  MoreHorizontal,
  Code2,
  Palette,
  FlaskConical,
  Globe,
  Terminal,
  ChartNoAxesCombined,
} from "lucide-react";
import Link from "next/link";
export function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={28} />
      <span>Getting everything ready…</span>
    </div>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return message ? (
    <div role="alert" className="error">
      {message}
    </div>
  ) : null;
}
export function ConfirmationModal({
  title,
  children,
  onClose,
  onConfirm,
  label = "Confirm",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  label?: string;
}) {
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="icon-btn modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h2>{title}</h2>
        {children}
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={onConfirm}>
            {label}
          </button>
        </div>
      </section>
    </div>
  );
}
export const categories = [
  "All quizzes",
  "Development",
  "Design",
  "Science",
  "General Knowledge",
  "Marketing",
];
export const categoryStyle: Record<
  string,
  { icon: typeof Code2; color: string; label: string }
> = {
  Development: { icon: Code2, color: "purple", label: "DEVELOPMENT" },
  Design: { icon: Palette, color: "pink", label: "DESIGN" },
  Science: { icon: FlaskConical, color: "green", label: "SCIENCE" },
  "General Knowledge": {
    icon: Globe,
    color: "blue",
    label: "GENERAL KNOWLEDGE",
  },
  Marketing: { icon: ChartNoAxesCombined, color: "orange", label: "MARKETING" },
};
export function QuizCard({
  quiz,
  manage = false,
  onAction,
}: {
  quiz: any;
  manage?: boolean;
  onAction?: (action: string, q: any) => void;
}) {
  const theme = categoryStyle[quiz.category] ?? categoryStyle.Development;
  const Icon = quiz.title.includes("Python") ? Terminal : theme.icon;
  return (
    <article className="quiz-card">
      <div className="card-top">
        <span className={`quiz-icon ${theme.color}`}>
          <Icon size={25} />
        </span>
        <div className="card-top-right">
          <span className={`difficulty ${quiz.difficulty.toLowerCase()}`}>
            {quiz.difficulty}
          </span>
          {manage && (
            <button
              title="Share quiz"
              className="icon-btn"
              onClick={() => onAction?.("share", quiz)}
            >
              <MoreHorizontal size={19} />
            </button>
          )}
        </div>
      </div>
      <span className={`category-label ${theme.color}`}>{theme.label}</span>
      <h3>{quiz.title}</h3>
      <p>{quiz.description}</p>
      <div className="quiz-meta">
        <span>
          <Layers size={14} />
          {quiz.questionCount} questions
        </span>
        <span>
          <Clock size={14} />
          {quiz.duration} min
        </span>
        <span>
          <Users size={14} />
          {quiz.participants}
        </span>
      </div>
      <div className="card-footer">
        <span className={`status ${quiz.published ? "published" : "draft"}`}>
          <i />
          {quiz.published ? "Published" : "Draft"}
        </span>
        <Link
          href={
            manage ? `/quiz/${quiz.id}/results` : `/join?code=${quiz.quizCode}`
          }
          className="card-link"
        >
          {manage ? "View quiz" : "Take quiz"}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      {manage && (
        <div className="manage-actions">
          <Link href={`/create?id=${quiz.id}`}>Edit</Link>
          <button onClick={() => onAction?.("publish", quiz)}>
            {quiz.published ? "Unpublish" : "Publish"}
          </button>
          <button onClick={() => onAction?.("duplicate", quiz)}>
            Duplicate
          </button>
          <button onClick={() => onAction?.("delete", quiz)}>Delete</button>
        </div>
      )}
    </article>
  );
}
export function StatisticsCard({
  label,
  value,
  icon: Icon,
  color,
  detail,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  detail: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        {label}
        <span className={`stat-icon ${color}`}>
          <Icon size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}
