import { createBeakHandler } from "@beakjs/remix";

const beakHandler = createBeakHandler({
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

export const action = beakHandler;
