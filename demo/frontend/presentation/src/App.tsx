import { useState } from "react";
import {
  Beak,
  AssistantWindow,
  useBeakInfo,
  useBeakFunction,
} from "@beakjs/react";

import { DebugLogger } from "@beakjs/core";
import "./App.css";

const App = () => {
  const [openAIApiKey, setOpenAIApiKey] = useState(
    import.meta.env.VITE_OPENAI_API_KEY
  );

  const debugLogger = new DebugLogger(["chat-api"]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const apiKeyInputElement = form.elements.namedItem(
      "apiKey"
    ) as HTMLInputElement;

    if (apiKeyInputElement) {
      const apiKey = apiKeyInputElement.value;
      setOpenAIApiKey(apiKey);
    }
  };

  return (
    <div>
      {openAIApiKey ? (
        <Beak
          __unsafeOpenAIApiKey__={openAIApiKey}
          instructions="Assistant is running in a web app and gives presentations on any topic. The user can input any topic and the assistant will start presenting."
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
      ) : (
        <ApiKeyForm handleSubmit={handleSubmit} />
      )}
    </div>
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
          "A short message to display in the presentation slide, max 30 words.",
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
      className="slide"
      style={{
        backgroundImage,
      }}
    >
      {message}
    </div>
  );
};

const ApiKeyForm = ({ handleSubmit }: { handleSubmit: any }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          textAlign: "center",
          margin: "20px",
        }}
      >
        <label
          htmlFor="apiKey"
          style={{
            display: "block",
            marginBottom: "10px",
            fontSize: "18px",
          }}
        >
          Enter OpenAI API Key:
        </label>
        <input
          type="text"
          name="apiKey"
          placeholder="Enter API Key here"
          style={{
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            width: "300px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Set API Key
        </button>
      </form>
    </div>
  );
};

export default App;
