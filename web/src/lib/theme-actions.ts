"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { directusUpdateMe } from "@/lib/auth/directus-auth";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import { isTheme, THEME_COOKIE } from "@/lib/theme";

const YEAR_SECONDS = 365 * 24 * 60 * 60;

export async function setThemeAction(theme: string): Promise<void> {
  // Аргументи Server Action приходять з браузера — перевіряємо
  if (!isTheme(theme)) return;

  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // httpOnly не потрібен: у темі немає нічого секретного
  });

  // Залогінений користувач — зберігаємо і в профіль
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    await directusUpdateMe(accessToken, { theme }).catch(() => false);
  }

  revalidatePath("/", "layout");
}