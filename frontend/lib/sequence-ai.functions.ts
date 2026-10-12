//frontend\lib\sequence-ai.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generateSequenceWithAi } from "../../src/server/sequences/sequence-ai.server";

const GenerateInput = z.object({
  prompt: z.string().min(3),
  audience: z.string().optional(),
  tone: z.string().optional(),
  stepCount: z.number().min(2).max(8).optional(),
});

export const generateSequence = createServerFn({ method: "POST" })
  .validator((data: unknown) => GenerateInput.parse(data))
  .handler(async ({ data }) => generateSequenceWithAi(data));
