import express from "express";
import { createBeakHandler } from "@beakjs/express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(
  "/beak",
  createBeakHandler({ openAIApiKey: process.env.OPENAI_API_KEY! })
);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
