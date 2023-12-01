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

export interface OpenAIChatMessage {
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

export interface OpenAITool {
  type: "code_interpreter" | "retrieval" | "function";
}

export interface OpenAIAssistant {
  id: string;
  object: "assistant";
  created_at: number;
  name?: string;
  description?: string;
  model: OpenAIModel | CustomModel;
  instructions?: string;
  tools: OpenAITool[];
  file_ids: string[];
  metadata: Record<string, string>;
}

export interface AssistantFile {
  id: string;
  object: "assistant.file";
  created_at: number;
  assistant_id: string;
}

export type OpenAIFilePurpose =
  | "fine-tune"
  | "fine-tune-results"
  | "assistants"
  | "assistants_output";

export interface OpenAIFile {
  id: string;
  bytes: number;
  created_at: number;
  filename: string;
  object: "file";
  purpose: OpenAIFilePurpose;
  // The following properties are deprecated
  status?: "uploaded" | "processed" | "error";
  status_details?: string;
}

export interface OpenAIThread {
  id: string;
  object: "thread";
  created_at: number;
  metadata?: Record<string, string>;
}

interface TextContent {
  type: "text";
  text: {
    value: string;
    annotations?: any[];
  };
}

interface ImageFileContent {
  type: "image_file";
  image_file: {
    file_id: string;
    annotations?: any[];
  };
}

export interface OpenAIMessage {
  id: string;
  object: "thread.message";
  created_at: number;
  thread_id: string;
  role: "user" | "assistant";
  content: (TextContent | ImageFileContent)[];
  assistant_id?: string;
  run_id?: string;
  file_ids: string[];
  metadata: { [key: string]: string };
}

export interface OpenAIMessageFile {
  id: string;
  object: "thread.message.file";
  created_at: number;
  message_id: string;
}
