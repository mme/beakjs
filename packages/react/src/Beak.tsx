import React, { useMemo } from "react";
import { BeakCore, OpenAIModel, DebugLogger } from "@beakjs/core";
import * as DefaultIcons from "./Icons";

const DEFAULT_DEBUG_LOGGER = new DebugLogger([]);

export type BeakColorScheme = "auto" | "light" | "dark";

export interface BeakIcons {
  openIcon?: React.ReactNode;
  closeIcon?: React.ReactNode;
  headerCloseIcon?: React.ReactNode;
  sendIcon?: React.ReactNode;
  activityIcon?: React.ReactNode;
  spinnerIcon?: React.ReactNode;
}

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
  icons: Required<BeakIcons>;
  colorScheme: BeakColorScheme;
  debugLogger: DebugLogger;
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

interface BeakProps {
  openAIApiKey: string;
  openAIModel?: OpenAIModel;
  temperature?: number;
  instructions?: string;
  maxFeedback?: number;
  labels?: BeakLabels;
  debugLogger?: DebugLogger;
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
          title: "Assistant",
          placeholder: "Type a message...",
          thinking: "Thinking...",
          done: "✅ Done",
          error: "❌ An error occurred. Please try again.",
        },
        ...labels,
      },

      debugLogger: debugLogger || DEFAULT_DEBUG_LOGGER,
      colorScheme: "auto" as BeakColorScheme,
      icons: {
        openIcon: DefaultIcons.OpenIcon,
        closeIcon: DefaultIcons.CloseIcon,
        headerCloseIcon: DefaultIcons.HeaderCloseIcon,
        sendIcon: DefaultIcons.SendIcon,
        activityIcon: DefaultIcons.ActivityIcon,
        spinnerIcon: DefaultIcons.SpinnerIcon,
      },
    }),
    [labels, debugLogger]
  );
  return (
    <BeakContext.Provider value={context}>{children}</BeakContext.Provider>
  );
};
