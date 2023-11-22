# Setting up Express

## Credentials

In the root of your project, create a `.env` file and add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-...
```

Then install the `dotenv` package if you haven't already:

```bash
npm install dotenv --save
# or
yarn add dotenv
```

## Install Beak.js for Express

```bash
npm install @beak/express --save
# or
yarn add @beak/express
```

## Add the middleware

For example:

```typescript
import express from "express";
import { beakHandler } from "@beakjs/express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

app.use("/beak", beakHandler());

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
```

## Configure Beak to use the Express backend

```typescript
const App = () => {
  return <Beak baseUrl="/beak">... your app code goes here</Beak>;
};
```
