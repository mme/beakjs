import EventEmitter from "eventemitter3";
import {
  OpenAIMessage,
  OpenAIFunction,
  DebugLogger,
  NoopDebugLogger,
  DEFAULT_MODEL,
} from "./types";

interface ChatCompletionConfiguration {
  apiKey?: string;
  baseUrl?: string;
  debugLogger?: DebugLogger;
}

interface ChatCompletionEvents {
  end: void;
  data: any;
  error: any;
}

export interface FetchChatCompletionParams {
  model?: string;
  messages: OpenAIMessage[];
  functions?: OpenAIFunction[];
  functionCall?: "none" | "auto";
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_BASE_URL = "https://api.openai.com";
const COMPLETIONS_PATH = "/v1/chat/completions";

export class ChatCompletion extends EventEmitter<ChatCompletionEvents> {
  private apiKey?: string;
  private buffer = new Uint8Array();
  private bodyReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private debug: DebugLogger;
  private url: string;

  constructor({ apiKey, baseUrl, debugLogger }: ChatCompletionConfiguration) {
    super();
    this.apiKey = apiKey;
    this.debug = debugLogger || NoopDebugLogger;
    this.url =
      (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "") + COMPLETIONS_PATH;

    if (!apiKey && !baseUrl) {
      console.warn("No API key or base URL provided.");
    }
  }

  private async cleanup() {
    this.debug.log("chat-internal", "Cleaning up...");

    if (this.bodyReader) {
      try {
        await this.bodyReader.cancel();
      } catch (error) {
        console.warn("Failed to cancel body reader:", error);
      }
    }
    this.bodyReader = null;
    this.buffer = new Uint8Array();
  }

  public async fetchChatCompletion({
    model,
    messages,
    functions,
    functionCall,
    temperature,
  }: FetchChatCompletionParams): Promise<void> {
    await this.cleanup();

    functionCall ||= "auto";
    temperature ||= 0.5;
    functions ||= [];
    model ||= DEFAULT_MODEL;

    if (functions.length == 0) {
      functionCall = undefined;
    }

    try {
      this.debug.log("chat-api", "Fetching chat completion...");
      this.debug.table("chat-api", "Params", {
        model,
        functionCall,
        temperature,
      });
      this.debug.table("chat-api", "Functions", functions);
      this.debug.table("chat-api", "Messages", messages);

      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          ...(functions.length ? { functions } : {}),
          ...(temperature ? { temperature } : {}),
          ...(functionCall && functions.length
            ? { function_call: functionCall }
            : {}),
        }),
      });

      this.debug.table("chat-api", "Response", {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        try {
          const errorText = await response.text();
          await this.cleanup();
          const msg = `Error ${response.status}: ${errorText}`;
          this.debug.error("chat-api", msg);
          this.emit("error", new Error(msg));
        } catch (_error) {
          await this.cleanup();
          const msg = `Error ${response.status}: ${response.statusText}`;
          this.debug.error("chat-api", msg);
          this.emit("error", new Error(msg));
        }
        return;
      }

      if (response.body == null) {
        await this.cleanup();
        const msg = "Response body is null";
        this.debug.error("chat-api", msg);
        this.emit("error", new Error(msg));
        return;
      }

      this.bodyReader = response.body.getReader();

      await this.streamBody();
    } catch (error) {
      await this.cleanup();
      this.debug.error("chat-api", error);
      this.emit("error", error);
      return;
    }
  }

  private async streamBody() {
    while (true) {
      try {
        const { done, value } = await this.bodyReader!.read();

        if (done) {
          await this.cleanup();
          this.emit("end");
          return;
        }

        const shouldContinue = await this.processData(value);

        if (!shouldContinue) {
          return;
        }
      } catch (error) {
        await this.cleanup();
        this.emit("error", error);
        return;
      }
    }
  }

  private async processData(data: Uint8Array): Promise<boolean> {
    // Append new data to the temp buffer
    const newBuffer = new Uint8Array(this.buffer.length + data.length);
    newBuffer.set(this.buffer);
    newBuffer.set(data, this.buffer.length);
    this.buffer = newBuffer;

    const dataString = new TextDecoder("utf-8").decode(this.buffer);
    this.debug.log("chat-internal", "Received data chunk:", dataString);

    let lines = dataString.split("\n").filter((line) => line.trim() !== "");

    // If the last line isn't complete, keep it in the buffer for next time
    if (!dataString.endsWith("\n")) {
      const lastLine = lines.pop() || "";
      const remainingBytes = new TextEncoder().encode(lastLine);
      this.buffer = new Uint8Array(remainingBytes);
    } else {
      this.buffer = new Uint8Array();
    }

    for (const line of lines) {
      const cleanedLine = line.replace(/^data: /, "");

      if (cleanedLine === "[DONE]") {
        this.debug.log("chat-internal", "Received DONE signal.");
        await this.cleanup();
        this.emit("end");
        return false;
      }

      let json;
      try {
        json = JSON.parse(cleanedLine);
      } catch (error) {
        console.error("Failed to parse JSON:", error);
        continue;
      }
      this.debug.log("chat-internal", "Parsed JSON from line:", json);

      this.emit("data", json);
    }
    return true;
  }
}
