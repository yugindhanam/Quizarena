import { hashSync } from "bcryptjs";
import { Store, Quiz } from "./types";
export function seed(): Store {
  const users = [
    {
      id: "demo",
      name: "Alex Morgan",
      email: "demo@quizarena.app",
      passwordHash: hashSync("QuizArena123!", 10),
      createdAt: new Date().toISOString(),
    },
  ];
  const topics = [
    [
      "JavaScript Essentials",
      "Development",
      "Medium",
      "Test your JavaScript knowledge, from the fundamentals to modern ES6 features.",
      "JS",
    ],
    [
      "UI / UX Design Principles",
      "Design",
      "Easy",
      "Explore the principles behind intuitive interfaces and great digital experiences.",
      "UX",
    ],
    [
      "The Science of Everything",
      "Science",
      "Medium",
      "A little curiosity goes a long way. Discover how our world really works.",
      "SC",
    ],
    [
      "World Geography Challenge",
      "General Knowledge",
      "Hard",
      "How well do you know the world? Put your geography knowledge to the test.",
      "GE",
    ],
    [
      "Python Fundamentals",
      "Development",
      "Easy",
      "Build confidence in the essentials of Python programming.",
      "PY",
    ],
    [
      "Digital Marketing 101",
      "Marketing",
      "Medium",
      "Explore the fundamentals of reaching audiences online.",
      "MK",
    ],
  ];
  const banks: Record<string, [string, string[], number][]> = {
    Development: [
      [
        "Which keyword declares a block-scoped variable in JavaScript?",
        ["var", "let", "define", "static"],
        1,
      ],
      [
        "What does JSON stand for?",
        [
          "JavaScript Object Notation",
          "Java Standard Object Name",
          "Joined Script Object Network",
          "JavaScript Online Node",
        ],
        0,
      ],
      [
        "Which method transforms every element in an array?",
        ["find()", "map()", "some()", "pop()"],
        1,
      ],
      [
        "Which value represents an intentional absence of an object?",
        ["NaN", "false", "null", "0"],
        2,
      ],
      ["Which operator checks strict equality?", ["=", "==", "===", "!="], 2],
    ],
    Design: [
      [
        "What does UX stand for?",
        [
          "User Experience",
          "Universal Extension",
          "User Execution",
          "Unified Example",
        ],
        0,
      ],
      [
        "Which principle groups nearby items?",
        ["Proximity", "Contrast", "Saturation", "Motion"],
        0,
      ],
      [
        "What helps text readability?",
        ["Low contrast", "Tiny type", "Clear hierarchy", "Many fonts"],
        2,
      ],
    ],
    Science: [
      ["What is the chemical symbol for gold?", ["Ag", "Au", "Fe", "Cu"], 1],
      [
        "Which planet is closest to the Sun?",
        ["Venus", "Mars", "Mercury", "Earth"],
        2,
      ],
      [
        "What powers photosynthesis?",
        ["Sound", "Sunlight", "Gravity", "Wind"],
        1,
      ],
    ],
    "General Knowledge": [
      [
        "What is the largest ocean?",
        ["Atlantic", "Indian", "Pacific", "Arctic"],
        2,
      ],
      [
        "Which country contains Kyoto?",
        ["China", "Japan", "Thailand", "Korea"],
        1,
      ],
      [
        "What is the capital of Australia?",
        ["Sydney", "Melbourne", "Perth", "Canberra"],
        3,
      ],
    ],
    Marketing: [
      [
        "What does SEO stand for?",
        [
          "Search Engine Optimization",
          "Social Engagement Output",
          "Sales Event Operations",
          "Search Email Organization",
        ],
        0,
      ],
      [
        "What measures clicks divided by impressions?",
        ["ROI", "CTR", "CPC", "CPM"],
        1,
      ],
      [
        "Which is an owned marketing channel?",
        ["Company newsletter", "Paid billboard", "TV ad", "Sponsored post"],
        0,
      ],
    ],
  };
  const quizzes: Quiz[] = topics.map((t, i) => ({
    id: `quiz-${i}`,
    quizCode: `QZ${48291 + i}`,
    title: t[0],
    description: t[3],
    category: t[1],
    difficulty: t[2],
    duration: 15 + i * 5,
    totalMarks: 0,
    startTime: null,
    endTime: null,
    leaderboardEnabled: true,
    showAnswers: true,
    showScore: true,
    allowGuests: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    maxAttempts: 3,
    published: i !== 4,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    creatorId: "demo",
    questions: (i === 4
      ? ([
          [
            "Which keyword defines a Python function?",
            ["func", "def", "function", "fn"],
            1,
          ],
          [
            "Which Python collection is immutable?",
            ["list", "dict", "tuple", "set"],
            2,
          ],
        ] as [string, string[], number][])
      : banks[t[1]]
    ).map((b, j) => ({
      id: `q-${i}-${j}`,
      questionText: b[0],
      marks: 10,
      negativeMarks: 0,
      position: j,
      options: b[1].map((s, k) => ({
        id: `o-${i}-${j}-${k}`,
        optionText: s,
        isCorrect: k === b[2],
      })),
    })),
  }));
  quizzes.forEach(
    (q) => (q.totalMarks = q.questions.reduce((a, b) => a + b.marks, 0)),
  );
  return { users, quizzes, attempts: [] };
}
