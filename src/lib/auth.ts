import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
const globals = globalThis as unknown as { devSecret?: string };
const DEFAULT_SECRET =
  "quizarena-production-default-secret-key-952b63df72d335e58c1ab08295d501c8";

function key() {
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}
export async function identity() {
  const c = await cookies();
  const token = c.get("qa_session")?.value;
  if (token)
    try {
      return (await jwtVerify(token, key())).payload.sub ?? null;
    } catch {}
  return null;
}
export async function login(id: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
  (await cookies()).set("qa_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
}
export async function guest() {
  const c = await cookies();
  let token = c.get("qa_guest")?.value;
  if (!token) {
    token = randomBytes(32).toString("hex");
    c.set("qa_guest", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
  }
  return token;
}
