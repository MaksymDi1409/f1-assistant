const DIRECTUS_URL = process.env.DIRECTUS_URL ?? "http://localhost:8055";

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires: number; // скільки мілісекунд діє access_token
};

export type DirectusMe = {
  id: string;
  first_name: string | null;
  email: string;
  role: { name: string } | null;
  favorite_driver: string | null;
  favorite_team: string | null;
};

function post(path: string, body: unknown): Promise<Response> {
  return fetch(`${DIRECTUS_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store", // відповіді з токенами ніколи не кешуємо
  });
}

// null — неправильний email або пароль
export async function directusLogin(email: string, password: string): Promise<AuthTokens | null> {
  const res = await post("/auth/login", { email, password, mode: "json" });
  if (res.status === 400 || res.status === 401) return null;
  if (!res.ok) throw new Error(`Directus login error ${res.status}`);
  return (await res.json()).data as AuthTokens;
}

export async function directusRegister(
  email: string,
  password: string,
  firstName: string,
): Promise<boolean> {
  const res = await post("/users/register", { email, password, first_name: firstName });
  return res.ok;
}

export async function directusRefresh(refreshToken: string): Promise<AuthTokens | null> {
  const res = await post("/auth/refresh", { refresh_token: refreshToken, mode: "json" });
  if (!res.ok) return null;
  return (await res.json()).data as AuthTokens;
}

export async function directusLogout(refreshToken: string): Promise<void> {
  await post("/auth/logout", { refresh_token: refreshToken, mode: "json" });
}

export async function directusMe(accessToken: string): Promise<DirectusMe | null> {
  const res = await fetch(
        `${DIRECTUS_URL}/users/me?fields=id,first_name,email,role.name,favorite_driver,favorite_team`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store", // дані користувача в спільний кеш класти не можна
    },
  );
  if (!res.ok) return null;
  return (await res.json()).data as DirectusMe;
}

// Змінити власний профіль. Які саме поля можна змінювати, вирішує Directus
// (права політики Site User), а не наш код
export async function directusUpdateMe(
  accessToken: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  const res = await fetch(`${DIRECTUS_URL}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  return res.ok;
}