import { cache } from "react";
import { cookies } from "next/headers";
import { directusMe, type AuthTokens } from "./directus-auth";

export const ACCESS_COOKIE = "f1_access";
export const REFRESH_COOKIE = "f1_refresh";
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 днів, як у Directus за замовчуванням

export type UserRole = "user" | "editor" | "admin";

export type CurrentUser = {
  id: string;
  firstName: string | null;
  email: string;
  role: UserRole;
};

type CookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

type CookieWriter = {
  set(name: string, value: string, options: CookieOptions): unknown;
};

function cookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true, // недоступна для JavaScript у браузері
    sameSite: "lax", // не надсилається з чужих сайтів (захист від CSRF)
    secure: process.env.NODE_ENV === "production", // лише HTTPS на продакшені
    path: "/",
    maxAge,
  };
}

export function setSessionCookies(store: CookieWriter, tokens: AuthTokens): void {
  store.set(ACCESS_COOKIE, tokens.access_token, cookieOptions(Math.floor(tokens.expires / 1000)));
  store.set(REFRESH_COOKIE, tokens.refresh_token, cookieOptions(REFRESH_TTL_SECONDS));
}

function toRole(roleName: string | undefined): UserRole {
  if (roleName === "Administrator") return "admin";
  if (roleName === "Editor") return "editor";
  return "user";
}

// cache: в межах одного запиту Directus питаємо лише раз,
// навіть якщо користувача потребують і шапка, і сама сторінка
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  try {
    const me = await directusMe(accessToken);
    if (!me) return null;

    return {
      id: me.id,
      firstName: me.first_name,
      email: me.email,
      role: toRole(me.role?.name),
    };
  } catch {
    return null; // Directus недоступний — працюємо як з гостем
  }
});