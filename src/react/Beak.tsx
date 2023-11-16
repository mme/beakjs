import React, { useMemo } from "react";
import { BeakCore, OpenAIModel } from "@beakjs/core";
import { DebugLogger } from "@beakjs/core";

const DEFAULT_DEBUG_LOGGER = new DebugLogger([]);

interface BeakLabels {
  initial?: string | string[];
  title?: string;
  placeholder?: string;
  thinking?: string;
  done?: string;
  error?: string;
}

interface BeakContext {
  beak: BeakCore;
  labels: Required<BeakLabels>;
  debugLogger: DebugLogger;
  theme: BeakTheme;
}

export const BeakContext = React.createContext<BeakContext | undefined>(
  undefined
);

export function useBeakContext(): BeakContext {
  const context = React.useContext(BeakContext);
  if (context === undefined) {
    throw new Error(
      "Context not found. Did you forget to wrap your app in a <Beak> component?"
    );
  }
  return context;
}

type BeakTheme = "auto" | "light" | "dark";

interface BeakProps {
  openAIApiKey: string;
  openAIModel?: OpenAIModel;
  temperature?: number;
  instructions?: string;
  maxFeedback?: number;
  labels?: BeakLabels;
  debugLogger?: DebugLogger;
  theme?: BeakTheme;
  children?: React.ReactNode;
}

export const Beak: React.FC<BeakProps> = ({
  openAIApiKey,
  openAIModel,
  temperature,
  instructions,
  maxFeedback,
  labels,
  debugLogger,
  theme,
  children,
}) => {
  const beak = useMemo(
    () =>
      new BeakCore({
        openAIApiKey: openAIApiKey,
        openAIModel: openAIModel,
        maxFeedback: maxFeedback,
        instructions: instructions,
        temperature: temperature,
        debugLogger: debugLogger,
      }),
    [
      openAIApiKey,
      openAIModel,
      maxFeedback,
      instructions,
      temperature,
      debugLogger,
    ]
  );
  const context = useMemo(
    () => ({
      beak: beak,
      labels: {
        ...{
          initial: "",
          title: "Copilot Chat",
          placeholder: "Type a message...",
          thinking: "Thinking...",
          done: "✅ Done",
          error: "❌ An error occurred. Please try again.",
        },
        ...labels,
      },

      debugLogger: debugLogger || DEFAULT_DEBUG_LOGGER,
      theme: theme || "auto",
    }),
    [labels, debugLogger, theme]
  );
  return (
    <BeakContext.Provider value={context}>{children}</BeakContext.Provider>
  );
};
