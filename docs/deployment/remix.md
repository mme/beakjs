# Setting up Remix

## Credentials

In the root of your project, create a `.env` file and add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-...
```

## Install Beak.js for Remix

```bash
npm install @beak/remix --save
# or
yarn add @beak/remix
```

## Add the Beak.js handler

Create a new wildcard API route in `app/routes/beak.$.tsx`:

```typescript
import { beakHandler } from "@beakjs/remix";
export const action = beakHandler();
```

## Configure Beak to use the Remix backend

```typescript
const App = () => {
  return <Beak baseUrl="/beak">... your app code goes here</Beak>;
};
```
