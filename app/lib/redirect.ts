/** Same-origin relative paths only (blocks protocol-relative / absolute URLs). */
export function safeAppRedirect(
  redirect: string | undefined,
): string | undefined {
  if (!redirect) return undefined;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return undefined;
  return redirect;
}
