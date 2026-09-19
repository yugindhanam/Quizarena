import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "QuizArena — A little challenge. A lot of possibility.",
  description:
    "Create interactive quizzes, test your knowledge, and make every challenge count.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
