// import { ChatCompletion } from "../lib/openai/chat";
// import { OpenAIFunction } from "../lib/openai/types";
// import { IMessage } from "../lib/types";

export function mockContentResponses(
  sentence: string,
  model: string
): string[] {
  const responses = [];
  const chunks = [];
  let start = 0;
  const chunkSize = 4;

  while (start < sentence.length) {
    chunks.push(sentence.slice(start, start + chunkSize));
    start += chunkSize;
  }

  const id = `chatcmpl-aaaaaaaaaaaaaaaaaaaaaa`;
  const timestamp = Math.floor(Date.now() / 1000);

  responses.push(createJsonString(id, timestamp, model, ""));

  for (const chunk of chunks) {
    responses.push(createJsonString(id, timestamp, model, chunk));
  }

  responses.push(createJsonString(id, timestamp, model, null, "stop"));
  responses.push("data: [DONE]\n");

  return responses;
}

function createJsonString(
  id: string,
  timestamp: number,
  model: string,
  content: string | null,
  finishReason: string | null = null
): string {
  const jsonString = {
    id: id,
    object: "chat.completion.chunk",
    created: timestamp,
    model: model,
    choices: [
      {
        index: 0,
        delta: content !== null ? { content: content } : {},
        finish_reason: finishReason,
      },
    ],
  };

  return `data: ${JSON.stringify(jsonString)}\n`;
}

// export async function collectChatCompletionData(params: {
//   chatCompletion: ChatCompletion;
//   model: string;
//   messages: IMessage[];
//   functions?: OpenAIFunction[];
//   functionCall?: "none" | "auto";
//   temperature?: number;
// }): Promise<any[]> {
//   const results: any[] = [];

//   return new Promise((resolve, reject) => {
//     params.chatCompletion.on("data", (data) => {
//       results.push({ type: "data", value: data });
//     });

//     params.chatCompletion.on("error", (error) => {
//       results.push({ type: "error", value: error });
//       resolve(results);
//     });

//     params.chatCompletion.on("end", () => {
//       resolve(results);
//     });

//     params.chatCompletion.fetchChatCompletion(params).catch((err) => {
//       reject(err);
//     });
//   });
// }

export function mockFunctionResponse(
  functionName: string,
  functionArgs: any,
  model: string
): string[] {
  const serializedArgs = JSON.stringify(functionArgs);
  const chunks = [];
  let start = 0;
  const chunkSize = 4;

  while (start < serializedArgs.length) {
    chunks.push(serializedArgs.slice(start, start + chunkSize));
    start += chunkSize;
  }

  const id = "chatcmpl-aaaaaaaaaaaaaaaaaaaaaa";
  const timestamp = Math.floor(Date.now() / 1000);

  let responses: string[] = [];

  responses.push(
    createFunctionJsonString(id, timestamp, model, functionName, null)
  );

  for (const chunk of chunks) {
    responses.push(createFunctionJsonString(id, timestamp, model, null, chunk));
  }

  responses.push(
    createFunctionJsonString(id, timestamp, model, null, null, "function_call")
  );

  responses.push("data: [DONE]\n");

  return responses;
}

function createFunctionJsonString(
  id: string,
  timestamp: number,
  model: string,
  name: string | null,
  content: string | null,
  finishReason: string | null = null
): string {
  let delta = {};
  if (content !== null) {
    delta = {
      function_call: {
        arguments: content,
      },
    };
  } else if (name !== null) {
    delta = {
      role: "assistant",
      content: null,
      function_call: {
        name: name,
        arguments: "",
      },
    };
  }
  const jsonString = {
    id: id,
    object: "chat.completion.chunk",
    created: timestamp,
    model: model,
    choices: [
      {
        index: 0,
        delta: delta,
        finish_reason: finishReason,
      },
    ],
  };

  return `data: ${JSON.stringify(jsonString)}\n`;
}

import { EventEmitter } from "events";

export class CachedEventEmitter extends EventEmitter {
  private expectedEvents: Set<string>;
  private eventCache: { event: string; args: any[] }[] = [];

  constructor(expectedEvents: string[]) {
    super();
    this.expectedEvents = new Set(expectedEvents);
  }

  on(event: string, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    this.expectedEvents.delete(event);

    // Check if all expected events have been registered
    if (this.expectedEvents.size === 0) {
      this.flushCache();
    }

    return this;
  }

  // Overrides the emit method to cache events if all expected listeners aren't registered yet
  emit(event: string, ...args: any[]): boolean {
    if (this.expectedEvents.size > 0) {
      this.eventCache.push({ event, args });
      return false; // Event wasn't emitted because it was cached
    }
    return super.emit(event, ...args);
  }

  private flushCache() {
    for (const cached of this.eventCache) {
      super.emit(cached.event, ...cached.args);
    }
    this.eventCache = [];
  }
}
