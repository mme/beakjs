export type OpenAIRole = "system" | "user" | "assistant" | "function";

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

export class CustomModel {
  constructor(public name: string) {}
}

export interface OpenAIChatCompletionChunk {
  choices: {
    delta: {
      role: OpenAIRole;
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
  role: OpenAIRole;
  numTokens?: number;
  name?: string;
  function_call?: any;
}

type DebugEvent = "chat-internal" | "chat-api" | "beak-complete";

export interface DebugLogger {
  log(debugEvent: DebugEvent, ...args: any[]): void;
  table(debugEvent: DebugEvent, message: string, ...args: any[]): void;
  warn(debugEvent: DebugEvent, ...args: any[]): void;
  error(debugEvent: DebugEvent, ...args: any[]): void;
}

export const NoopDebugLogger: DebugLogger = {
  log() {},
  table() {},
  warn() {},
  error() {},
};

export const DEFAULT_MODEL = "gpt-4";
