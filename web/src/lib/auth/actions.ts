"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { directusLogin, directusLogout, directusRegister } from "./directus-auth";
import { ACCESS_COOKIE, REFRESH_COOKIE, setSessionCookies } from "./session";

export type AuthFormState = { error?: string } | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Куди повернути після входу. Лише адреси нашого сайту:
// інакше посилання /login?next=https://evil.com перекинуло б користувача на чужий сайт
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Введи email і пароль" };

  try {
    const tokens = await directusLogin(email, password);
    if (!tokens) return { error: "Неправильний email або пароль" };
    setSessionCookies(await cookies(), tokens);
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Сервер авторизації недоступний, спробуй пізніше" };
  }

  // redirect «кидає» спеціальний виняток, тому він поза try/catch
  redirect(safeNext(formData.get("next")));
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!firstName || firstName.length > 50) return { error: "Вкажи ім'я (до 50 символів)" };
  if (!EMAIL_PATTERN.test(email)) return { error: "Неправильний формат email" };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Пароль має містити щонайменше ${MIN_PASSWORD_LENGTH} символів` };
  }

  try {
    const registered = await directusRegister(email, password, firstName);
    if (!registered) return { error: "Не вдалося зареєструватися" };

    // Одразу входимо, щоб не просити ввести пароль ще раз
    const tokens = await directusLogin(email, password);
    if (!tokens) {
      return { error: "Не вдалося увійти. Можливо, цей email уже зареєстрований" };
    }
    setSessionCookies(await cookies(), tokens);
  } catch (error) {
    console.error("Register error:", error);
    return { error: "Сервер авторизації недоступний, спробуй пізніше" };
  }

  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  // Повідомляємо Directus, щоб refresh-токен перестав діяти і на сервері
  if (refreshToken) {
    await directusLogout(refreshToken).catch(() => {});
  }

  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  redirect("/");
}