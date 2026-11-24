// src/server/auth/auth.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";

import { getCurrentUser } from "./auth.server";

export const requireWorkspaceUser = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUser(getRequest());
  if (!user) throw redirect({ to: "/login" });
  return { id: user.id };
});
