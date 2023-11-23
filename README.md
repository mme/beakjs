# 🐦 Beak.js [![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/mme_xyz?style=flat&logo=x)](https://twitter.com/mme_xyz) [![npm (scoped)](https://img.shields.io/npm/v/%40beakjs/react)](https://www.npmjs.com/package/@beakjs/react)

Beak.js contains everything you need to create custom AI-powered assistants for your React app.

**Key Features:**

- **Built-in UI** - Comes with a beautiful, fully customizable chat window.
- **Easy to Use** - Integrates with your existing React app in just a few lines of code.
- **Open Source** - Beak.js is open source and free to use.

<img src="https://github.com/mme/beakjs/raw/main/docs/img/screenshot.png" width="500" alt="Beak.js Screenshot">

## Getting Started

### Installation

First up, add Beak.js to your project:

```bash
npm install @beakjs/react --save

# or with yarn
yarn add @beakjs/react
```

### Setup

Next, wrap your app in the `Beak` component and add the assistant window:

```jsx
import { Beak } from "@beakjs/react";

const App = () => (
  <Beak
    __unsafeOpenAIApiKey__="sk-..."
    instructions="Assistant is running in a web app and helps the user with XYZ."
  >
    <MyApp />
    <AssistantWindow />
  </Beak>
);
```

Now, you've got a chat window ready in the bottom right corner of your website. Give it a try!

**Note:** Don't expose your API key in public-facing apps - this is for development only. See [Deployment](#deployment) for information on how to securely deploy your app without compromising your API key.

### Making Beak.js work with your app

You can let the assistant carry out tasks in your app by setting up functions with `useBeakFunction`:

```jsx
import { useBeakFunction } from "@beakjs/react";

const MyApp = () => {
  const [message, setMessage] = useState("Hello World!");

  useBeakFunction({
    name: "updateMessage",
    description: "This function updates the app's display message.",
    parameters: {
      message: {
        description: "A short message to display on screen.",
      },
    },
    handler: ({ message }) => {
      setMessage(message);

      return `Updated the message to: "${message}"`;
    },
  });

  return <div>{message}</div>;
};
```

Note that functions become available to the assistant as soon as their respective component is mounted. This is a powerful concept, ensuring that the assistant will be able to call functions relevant to the current context of your app.

### Let the Assistant Know What's Happening On Screen

You can easily let the assistant know what it currently on screen by using `useBeakInfo`:

```jsx
import { useBeakInfo } from "@beakjs/react";

const MyApp = () => {
  const [message, setMessage] = useState("Hello World!");

  useBeakInfo("current message", message);

  // ...
};
```

By using `useBeakFunction` together with `useBeakInfo`, your assistant can see what's happening on the screen and take action within your app depending on the current context.

## Deployment

To keep your API key safe, we support a server side handler that forwards your assistant's requests to OpenAI. Furthermore, this handler can be used to add authentication and rate limiting to your assistant.

Currently, we support the following frameworks:

- [Next.js](/docs/deployment/next.md)
- [Remix](/docs/deployment/remix.md)
- [Express](/docs/deployment/express.md)

Read more about secure deployment by clicking the links above.

## Run the Demo

To run the demo, build the project and start the demo app:

```bash
git clone git@github.com:mme/beakjs.git && cd beakjs
yarn && yarn build
cd demo/presentation
echo "VITE_OPENAI_API_KEY=sk-your-openai-key" > .env
yarn && yarn dev
```

Then go to http://localhost:5173/ to see the demo.

## Issues

Feel free to submit issues and enhancement requests.

## License

MIT

Copyright (c) 2023, Markus Ecker
