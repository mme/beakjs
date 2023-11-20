import { createBeakHandler } from "@beakjs/next";

const handler = createBeakHandler({
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

export default handler;
