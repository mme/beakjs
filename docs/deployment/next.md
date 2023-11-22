# Setting up Next.js

## Credentials

In the root of your project, create a `.env` file and add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-...
```

## Install Beak.js for Next.js

```bash
npm install @beak/next --save
# or
yarn add @beak/next
```

## Add the Beak.js handler

Create a new wildcard API route in `pages/api/beak/[...path].ts`:

```typescript
import { beakHandler } from "@beakjs/next";

const handler = beakHandler();

export default handler;
```

## Configure Beak to use the Next.js backend

```typescript
const App = () => {
  return <Beak baseUrl="/api/beak">... your app code goes here</Beak>;
};
```
