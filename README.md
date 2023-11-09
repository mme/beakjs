# 🐦 Beak.js ![npm (scoped)](https://img.shields.io/npm/v/%40beakjs/react)

Beak.js is a powerful and flexible React library designed to integrate conversational copilots into your web applications.

**Key Features:**

- **Easy to Use** - Beak.js integrates with your existing React app in just a few lines of code.
- **Customizable** - Customize the look and feel to fit your app.
- **Open Source** - Beak.js is open source and free to use.

## Getting Started

### Installation

First up, you need to add Beak.js to your project:

```bash
npm install @beakjs/react --save

# or with yarn
yarn add @beakjs/react
```

### Set Up the Chat Assistant

Next, wrap your app in the `Copilot` component:

```jsx
import { Copilot } from "@beakjs/react";

const App = () => (
  <Copilot
    openAIApiKey="sk-..."
    instructions="Assistant is running in a web app and helps the user with XYZ."
  >
    <MyApp />
  </Copilot>
);
```

Now, you've got a chat box ready to help out in the bottom right corner of your website. Give it a try!

### Making the Assistant Work with Your App

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

Note that the function will automatically be made available to the copilot when your component is mounted. This is a powerful concept, ensuring that the copilot is always in sync with the current context of your app, providing relevant assistance to the user.

### Let the Assistant Know What's Happening On Screen

You can easily let the copilot know what it currently on screen by using `useBeakContext`:

```jsx
import { useBeakContext } from "@beakjs/react";

const MyApp = () => {
  const [message, setMessage] = useState("Hello World!");

  useBeakContext("current message", message);

  // ...
};
```

By using `useBeakFunction` together with `useBeakContext`, your copilot can see what's happening on the screen and take action within your app depending on the current context.

### A Word of Warning About API Keys

:warning: Exposing the key in public-facing apps can pose security risks. We're actively developing a solution for this.
