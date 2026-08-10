import { auth } from "@clerk/tanstack-react-start/server";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { safeAppRedirect } from "./redirect";

export const getAuthUserId = createServerFn({ method: "GET" }).handler(
  async () => {
    const { userId } = await auth();
    return { userId };
  },
);

export async function requireAuth(returnPath: string) {
  const { userId } = await getAuthUserId();
  if (!userId) {
    throw redirect({
      to: "/login/$",
      params: { _splat: "" },
      search: { redirect: safeAppRedirect(returnPath) ?? "/dashboard" },
    });
  }
  return { userId };
}
