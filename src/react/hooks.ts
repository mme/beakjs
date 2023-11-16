import { useEffect } from "react";
import { FunctionDefinition } from "@beakjs/core";
import { useBeakContext } from "./Beak";

export function useBeakFunction(definition: FunctionDefinition) {
  const context = useBeakContext();
  const beak = context.beak;
  if (beak == null) {
    throw new Error(
      "Beak not found in context. Did you forget to wrap your app in a <Beak> component?"
    );
  }
  useEffect(() => {
    beak.addFunction(definition);

    return () => {
      beak.removeFunction(definition);
    };
  }, [definition]);
}

export function useBeakInfo(data: any): void;
export function useBeakInfo(description: string, data: any): void;
export function useBeakInfo(descriptionOrData: any, data?: any): void {
  const context = useBeakContext();

  if (!context) {
    throw new Error("Context is not defined.");
  }

  const beak = context.beak;

  if (beak == null) {
    throw new Error(
      "Beak not found in context. Did you forget to wrap your app in a <Beak> component?"
    );
  }

  const actualDescription = data ? descriptionOrData : "data";
  const actualData = data ?? descriptionOrData;

  useEffect(() => {
    const id = beak.addInfo(actualData, actualDescription);

    return () => {
      beak.removeInfo(id);
    };
  }, [beak, actualDescription, actualData]);
}
