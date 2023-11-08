import { Role } from "../types";

export type OpenAIModel =
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-16k"
  | "gpt-4"
  | "gpt-4-32k"
  | "gpt-3.5-turbo-0301"
  | "gpt-4-0314"
  | "gpt-4-32k-0314"
  | "gpt-3.5-turbo-0613"
  | "gpt-4-0613"
  | "gpt-4-32k-0613"
  | "gpt-3.5-turbo-16k-0613";

export interface OpenAIChatCompletionChunk {
  choices: {
    delta: {
      role: Role;
      content?: string | null;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
  }[];
}

export interface OpenAIFunction {
  name: string;
  parameters: Record<string, unknown>;
  description?: string;
}

export interface OpenAIMessage {
  content?: string;
  role: Role;
  numTokens?: number;
  name?: string;
  function_call?: any;
}
