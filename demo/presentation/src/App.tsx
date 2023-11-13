import { useState } from "react";
import { Copilot, useBeakContext, useBeakFunction } from "@beakjs/react";

import "./App.css";
import { DebugLogger } from "@beakjs/core";

const App = () => {
  const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const debugLogger = new DebugLogger(["chat-api"]);
  return (
    <Copilot
      openAIApiKey={openAIApiKey}
      instructions="Assistant is running in a web app and gives presentations on any topic."
      messages={{
        initial: "Hi you! 👋 I can give you a presentation on any topic.",
        thinking: "Presenting Slide...",
        done: "✅ Slide presented.",
      }}
      debugLogger={debugLogger}
      defaultOpen={false}
    >
      <Presentation />
    </Copilot>
  );
};

const Presentation = () => {
  const [state, setState] = useState({
    message: "Hello World!",
    backgroundImage: "none",
  });

  useBeakContext("current slide", state);

  useBeakFunction({
    name: "presentSlide",
    description: "Present a slide in the presentation you are giving.",
    feedback: "auto",
    parameters: {
      message: {
        description:
          "A short message to display in the presentation slide, max 40 words.",
      },
      backgroundImage: {
        description:
          "What to display in the background of the slide (i.e. 'dog' or 'house'), or 'none' for a white background",
      },
    },
    handler: ({ message, backgroundImage }) => {
      setState({
        message: message,
        backgroundImage: backgroundImage,
      });

      return `Presented slide with message "${message}" and background image "${backgroundImage}"`;
    },
  });

  return <Slide {...state} />;
};

type SlideProps = {
  message: string;
  backgroundImage: string;
};

export const Slide = ({ message, backgroundImage }: SlideProps) => {
  if (backgroundImage !== "none") {
    backgroundImage =
      'url("https://source.unsplash.com/featured/?' +
      encodeURIComponent(backgroundImage) +
      '")';
  }
  return (
    <div
      style={{
        backgroundImage,
        inset: 0,
        display: "flex",
        fontFamily: "sans-serif",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "5rem",
        padding: "10rem",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        textShadow: "-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white",
      }}
    >
      {message}
    </div>
  );
};

export default App;
