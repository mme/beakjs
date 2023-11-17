import { v4 as uuidv4 } from "uuid";

export type Role = "system" | "user" | "assistant" | "function";

export type MessageStatus = "pending" | "partial" | "success" | "error";

export type MessageOptions = {
  role?: Role;
  content?: string;
  status?: MessageStatus;
  functionCall?: FunctionCall;
  name?: string;
  result?: any;
};

/**
 * A message in BeakJs.
 */
export class Message {
  /**
   * The unique identifier for the message.
   * @type {string}
   */
  public id: string = uuidv4();

  /**
   * The role of the message. Can be "system", "user", "assistant" or "function".
   * @type {Role}
   */
  public role: Role = "user";

  /**
   * Optional content of the message.
   * @type {string}
   */
  public content?: string;

  /**
   * The status of the message. Can be "pending", "partial", "success" or "error".
   * @type {MessageStatus}
   */
  public status: MessageStatus = "pending";

  /**
   * An optional function call returned by the assistant.
   * @type {FunctionCall}
   */
  public functionCall?: FunctionCall;

  /**
   * The name of the function called. Only available if the role is "function".
   * @type {string}
   */
  public name?: string;

  /**
   * The result of the function call as object. Only available if the role is "function".
   *
   * Note that a string representation of the call will also be available in the content field.
   * @type {any}
   */
  public result?: any;

  /**
   * The number of tokens in the message.
   * @type {number}
   */
  public numTokens: number = 0;

  /**
   * The date the message was created.
   * @type {Date}
   */
  public createdAt: Date = new Date();

  constructor(options?: MessageOptions) {
    options ||= {};
    Object.assign(this, options);
  }

  calculateNumTokens(llm: LLMAdapter) {
    this.numTokens = llm.countTokens(this);
  }

  copy(): Message {
    return Object.assign(new Message({}), this);
  }
}

export type FunctionHandler = (args: { [key: string]: any }) => any;

export type Feedback = "none" | "auto" | "text";

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters?: { [key: string]: FunctionParameter };
  feedback?: Feedback;
  handler: FunctionHandler;
}

export interface FunctionParameter {
  description?: string;
  type?: "string" | "number" | string[];
  optional?: boolean;
}

export interface FunctionCall {
  name: string;
  arguments: { [key: string]: any };
}

export type LLMEvent = "content" | "function" | "partial" | "error" | "end";

export abstract class LLMAdapter {
  abstract countTokens(message: Message): number;

  abstract queryChatCompletion(
    params: QueryChatCompletionParams
  ): Promise<void>;

  abstract on(event: LLMEvent, listener: (...args: any[]) => void): this;

  abstract off(event: LLMEvent, listener?: (...args: any[]) => void): this;
}

export interface QueryChatCompletionParams {
  messages: Message[];
  functions?: FunctionDefinition[];
  functionCall?: "none" | "auto";
  maxTokens?: number;
  temperature?: number;
}

type DebugEvent = "chat-internal" | "chat-api" | "beak-complete";

export class DebugLogger {
  private debugEvents: DebugEvent[] = [];

  constructor(debugEvents?: DebugEvent[]) {
    this.debugEvents = debugEvents || [];
  }

  log(debugEvent: DebugEvent, ...args: any[]) {
    if (this.debugEvents.includes(debugEvent)) {
      console.log(`[${debugEvent}]`, ...args);
    }
  }
  table(debugEvent: DebugEvent, message: string, ...args: any[]) {
    if (this.debugEvents.includes(debugEvent)) {
      console.log(`[${debugEvent}] - ${message}:`);
      console.table(...args);
    }
  }
  warn(debugEvent: DebugEvent, ...args: any[]) {
    if (this.debugEvents.includes(debugEvent)) {
      console.warn(`[${debugEvent}]`, ...args);
    }
  }
  error(debugEvent: DebugEvent, ...args: any[]) {
    if (this.debugEvents.includes(debugEvent)) {
      console.error(`[${debugEvent}]`, ...args);
    }
  }
}
