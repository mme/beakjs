import { useContext, useEffect } from "react";
import { FunctionDefinition } from "@beakjs/core";
import { CopilotContext } from "./Copilot";

export function useBeakFunction(definition: FunctionDefinition) {
  const context = useContext(CopilotContext);
  const beak = context.beak;
  if (beak == null) {
    throw new Error(
      "Beak not found in context. Did you forget to wrap your app in a <Copilot> component?"
    );
  }
  useEffect(() => {
    beak.addFunction(definition);

    return () => {
      beak.removeFunction(definition);
    };
  }, [definition]);
}

export function useBeakContext(data: any): void;
export function useBeakContext(description: string, data: any): void;
export function useBeakContext(descriptionOrData: any, data?: any): void {
  const context = useContext(CopilotContext);

  if (!context) {
    throw new Error("Context is not defined.");
  }

  const beak = context.beak;

  if (beak == null) {
    throw new Error(
      "Beak not found in context. Did you forget to wrap your app in a <Copilot> component?"
    );
  }

  const actualDescription = data ? descriptionOrData : "data";
  const actualData = data ?? descriptionOrData;

  useEffect(() => {
    const id = beak.addContext(actualData, actualDescription);

    return () => {
      beak.removeContext(id);
    };
  }, [beak, actualDescription, actualData]);
}
