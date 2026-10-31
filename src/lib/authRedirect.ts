// Parse with URL as well as checking slashes: browsers normalize backslashes.
export function safeAuthNext(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return undefined;
  const origin = "https://h2o.invalid";
  try {
    const url = new URL(value, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : undefined;
  } catch {
    return undefined;
  }
}

export function authCallbackUrl(origin: string, next?: string): string {
  const url = new URL("/auth", origin);
  const destination = safeAuthNext(next);
  if (destination) url.searchParams.set("next", destination);
  return url.href;
}