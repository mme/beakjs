import express from "express";
import { beakHandler } from "@beakjs/express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use("/beak", beakHandler());

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
