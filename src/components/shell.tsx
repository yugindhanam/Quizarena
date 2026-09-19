"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Zap,
  LayoutDashboard,
  Plus,
  Files,
  ClipboardCheck,
  Trophy,
  UserRound,
  LogOut,
  ArrowUpRight,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { api } from "@/lib/client";
export default function Shell({
  children,
  search,
  onSearch,
}: {
  children: React.ReactNode;
  search?: string;
  onSearch?: (v: string) => void;
}) {
  const path = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [user, setUser] = useState<any>(null),
    [notice, setNotice] = useState(false);
  useEffect(() => {
    api("dashboard")
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);
  const links = [
    ["Dashboard", "/", LayoutDashboard],
    ["Create Quiz", "/create", Plus],
    ["My Quizzes", "/quizzes", Files],
    ["My Attempts", "/attempts", ClipboardCheck],
    ["Leaderboard", "/leaderboard", Trophy],
  ] as const;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Zap fill="currentColor" size={23} />
          </span>
          Quiz<span>Arena</span>
          <span className="brand-dot">.</span>
        </Link>
        <button
          className="mobile-close icon-btn"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X />
        </button>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {links.map(([name, href, Icon]) => (
            <Link
              onClick={() => setOpen(false)}
              key={name}
              href={href}
              className={`nav-item ${path === href ? "active" : ""}`}
            >
              <Icon size={19} />
              {name}
              {name === "Create Quiz" && <span className="nav-plus">+</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="challenge-card">
            <span className="challenge-icon">
              <Zap size={19} />
            </span>
            <h4>Big ideas. Great quizzes.</h4>
            <p>
              Turn what you know into
              <br />
              something worth sharing.
            </p>
            <Link href="/create">
              Create your first quiz <ArrowUpRight size={15} />
            </Link>
            <span className="challenge-orbit" />
          </div>
          <Link
            className={`nav-item ${path === "/profile" ? "active" : ""}`}
            href="/profile"
          >
            <UserRound size={19} />
            My Profile
          </Link>
          <Link className="nav-item" href="/about">
            <HelpCircle size={19} />
            Help & getting started
            <ArrowUpRight size={14} />
          </Link>
          <div className="sidebar-user">
            <span className="avatar">
              {user?.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2) ?? "QA"}
            </span>
            <div>
              <strong>{user?.name ?? "Welcome, explorer"}</strong>
              <small>
                {user ? "Personal account" : "Your next challenge awaits"}
              </small>
            </div>
            <button
              className="icon-btn"
              title={user ? "Log out" : "Log in"}
              onClick={async () => {
                if (user) await api("auth/logout", "POST", {});
                router.push("/login");
                router.refresh();
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}
      <div className="main-wrap">
        <header className="topbar">
          <button
            className="mobile-menu icon-btn"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {path === "/"
                ? "Overview"
                : path.startsWith("/quiz")
                  ? "My Quizzes"
                  : path.startsWith("/create")
                    ? "Create Quiz"
                    : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
            </strong>
          </div>
          <div className="topbar-right">
            <div className="top-search">
              <Search size={16} />
              <input
                aria-label="Search quizzes"
                placeholder="Search anything..."
                value={search ?? ""}
                onChange={(e) =>
                  onSearch
                    ? onSearch(e.target.value)
                    : router.push(
                        "/?search=" + encodeURIComponent(e.target.value),
                      )
                }
              />
              <kbd>⌘ K</kbd>
            </div>
            <button
              className="notification icon-btn"
              aria-label="Notifications"
              onClick={() => setNotice(!notice)}
            >
              <Bell size={19} />
              <i />
            </button>
            <span className="topbar-divider" />
            <Link
              href={user ? "/profile" : "/login"}
              className="top-avatar avatar"
            >
              {user?.name?.[0] ?? "Q"}
            </Link>
            <ChevronDown size={14} />
          </div>
          {notice && (
            <div className="notification-popup">
              <strong>You’re all caught up</strong>
              <p>New quiz activity will appear in your results dashboard.</p>
            </div>
          )}
        </header>
        <main className="main-content">{children}</main>
        <footer className="app-footer">
          <span>
            © {new Date().getFullYear()} QuizArena. Made for curious minds.
          </span>
          <span>
            <span className="green-dot" />
            All systems ready <span className="footer-sep">·</span>
            <Link href="/about">
              Help center <ArrowUpRight size={12} />
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
