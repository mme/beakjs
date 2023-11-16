# 🐦 Beak.js ![npm (scoped)](https://img.shields.io/npm/v/%40beakjs/react)

Beak.js lets you integrate custom conversational assistants into your React applications.

**Key Features:**

- **Built-in UI** - Comes with a beautiful, fully customizable chat window.
- **Easy to Use** - Integrates with your existing React app in just a few lines of code.
- **Open Source** - Beak.js is open source and free to use.

<img src="docs/img/screenshot.png" width="500" alt="Beak.js Screenshot">

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
    openAIApiKey="sk-..."
    instructions="Assistant is running in a web app and helps the user with XYZ."
  >
    <MyApp />
    <AssistantWindow />
  </Beak>
);
```

Now, you've got a chat window ready in the bottom right corner of your website. Give it a try!

**Note:** Don't expose your API key in public-facing apps. We will be adding a solution for securely using your API key soon.

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

## Issues

Feel free to submit issues and enhancement requests.

## License

MIT

Copyright (c) 2023, Markus Ecker
