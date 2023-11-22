"use client";

import { useState } from "react";
import {
  Beak,
  AssistantWindow,
  useBeakInfo,
  useBeakFunction,
} from "@beakjs/react";

import { DebugLogger } from "@beakjs/core";

const App = () => {
  const debugLogger = new DebugLogger(["chat-api"]);
  return (
    <Beak
      baseUrl="/api/beak"
      instructions="Assistant is running in a web app and gives presentations on any topic."
      labels={{
        initial: "Hi you! 👋 I can give you a presentation on any topic.",
        thinking: "Presenting Slide...",
        done: "✅ Slide presented.",
      }}
      debugLogger={debugLogger}
    >
      <Presentation />
      <AssistantWindow />
    </Beak>
  );
};

const Presentation = () => {
  const [state, setState] = useState({
    message: "Hello World!",
    backgroundImage: "none",
  });

  useBeakInfo("current slide", state);

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

const Slide = ({ message, backgroundImage }: SlideProps) => {
  if (backgroundImage !== "none") {
    backgroundImage =
      'url("https://source.unsplash.com/featured/?' +
      encodeURIComponent(backgroundImage) +
      '")';
  }
  return (
    <div
      className="slide"
      style={{
        backgroundImage,
      }}
    >
      {message}
    </div>
  );
};

export default App;
