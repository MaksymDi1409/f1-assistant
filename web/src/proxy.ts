import { NextResponse, type NextRequest } from "next/server";
import { directusRefresh } from "@/lib/auth/directus-auth";
import { ACCESS_COOKIE, REFRESH_COOKIE, setSessionCookies } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const hasAccessToken = request.cookies.has(ACCESS_COOKIE);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Або все гаразд, або користувач не входив — нічого не робимо
  if (hasAccessToken || !refreshToken) return NextResponse.next();

  const tokens = await directusRefresh(refreshToken).catch(() => null);

  // Не вдалося оновити: працюємо як з гостем. Cookie не видаляємо — можливо,
  // паралельний запит (браузер часто шле кілька одночасно) уже отримав нові токени
  if (!tokens) return NextResponse.next();

  // Нові токени: для поточного запиту (щоб сторінка вже бачила користувача)...
  request.cookies.set(ACCESS_COOKIE, tokens.access_token);
  request.cookies.set(REFRESH_COOKIE, tokens.refresh_token);
  const response = NextResponse.next({ request });

  // ...і для браузера
  setSessionCookies(response.cookies, tokens);
  return response;
}

export const config = {
  // Усі адреси, крім статичних файлів
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};