import EventEmitter from "eventemitter3";
import { jsonrepair } from "jsonrepair";
import {
  OpenAIChatCompletionChunk,
  OpenAIModel,
  OpenAIFunction,
  OpenAIMessage,
  DebugLogger,
  NoopDebugLogger,
} from "./types";
import { ChatCompletion, FetchChatCompletionParams } from "./chat";

interface OpenAIConfiguration {
  apiKey: string;
  model?: OpenAIModel;
  debugLogger?: DebugLogger;
}

interface OpenAIEvents {
  content: string;
  partial: [string, string];
  error: any;
  function: {
    name: string;
    arguments: any;
  };
  end: void;
}

export class OpenAI extends EventEmitter<OpenAIEvents> {
  private apiKey: string;
  private model: OpenAIModel;
  private debug: DebugLogger;

  private completionClient: ChatCompletion | null = null;
  private mode: "function" | "message" | null = null;
  private functionCallName: string = "";
  private functionCallArguments: string = "";

  constructor(params: OpenAIConfiguration) {
    super();
    this.apiKey = params.apiKey;
    this.model = params.model || "gpt-4";
    this.debug = params.debugLogger || NoopDebugLogger;
  }

  public async queryChatCompletion(
    params: FetchChatCompletionParams & { maxTokens: number }
  ) {
    params.maxTokens ||= maxTokensForModel(this.model);
    params.functions ||= [];

    const prompt = this.buildPrompt(params);
    return await this.runPrompt({ prompt, ...params });
  }

  private buildPrompt(
    params: FetchChatCompletionParams & { maxTokens: number }
  ): OpenAIMessage[] {
    let maxTokens = params.maxTokens!;
    const messages = params.messages!;
    const functions = params.functions!;
    const functionsNumTokens = countFunctionsTokens(functions);
    if (functionsNumTokens > maxTokens) {
      throw new Error(
        `Too many tokens in function calls: ${functionsNumTokens} > ${maxTokens}`
      );
    }
    maxTokens -= functionsNumTokens;

    for (const message of messages) {
      if (message.role === "system") {
        const numTokens = message.numTokens || this.countTokens(message);
        maxTokens -= numTokens;

        if (maxTokens < 0) {
          throw new Error("Not enough tokens for system message.");
        }
      }
    }

    const result: OpenAIMessage[] = [];
    let cutoff: boolean = false;

    const reversedMessages = [...messages].reverse();
    for (const message of reversedMessages) {
      if (message.role === "system") {
        result.unshift(message);
        continue;
      } else if (cutoff) {
        continue;
      }
      let numTokens = message.numTokens || this.countTokens(message);
      if (maxTokens < numTokens) {
        cutoff = true;
        continue;
      }
      result.unshift(message);
      maxTokens -= numTokens;
    }

    return result;
  }

  private async runPrompt(
    params: FetchChatCompletionParams & { prompt: OpenAIMessage[] }
  ): Promise<void> {
    const model = this.model;
    const messages = params.prompt;
    const functions = params.functions;
    const functionCall = params.functionCall;
    const temperature = params.temperature;

    this.completionClient = new ChatCompletion({
      apiKey: this.apiKey,
      debugLogger: this.debug,
    });

    this.completionClient.on("data", this.onData);
    this.completionClient.on("error", this.onError);
    this.completionClient.on("end", this.onEnd);

    await this.completionClient.fetchChatCompletion({
      model,
      messages,
      functions: functions,
      functionCall,
      temperature,
    });
  }

  private onData = (data: OpenAIChatCompletionChunk) => {
    // In case we are in a function call but the next message is not a function call, flush it.
    if (this.mode === "function" && !data.choices[0].delta.function_call) {
      const success = this.tryFlushFunctionCall();
      if (!success) {
        return;
      }
    }

    this.mode = data.choices[0].delta.function_call ? "function" : "message";

    if (this.mode === "message") {
      // if we get a message, emit the content and return;

      if (data.choices[0].delta.content) {
        this.emit("content", data.choices[0].delta.content);
      }

      return;
    } else if (this.mode === "function") {
      // if we get a function call, we buffer the name and arguments, then emit a partial event.

      if (data.choices[0].delta.function_call!.name) {
        this.functionCallName = data.choices[0].delta.function_call!.name!;
      }
      if (data.choices[0].delta.function_call!.arguments) {
        this.functionCallArguments +=
          data.choices[0].delta.function_call!.arguments!;
      }
      this.emit("partial", this.functionCallName, this.functionCallArguments);

      return;
    }
  };

  private onError = (error: any) => {
    this.emit("error", error);
    this.cleanup();
  };

  private onEnd = () => {
    if (this.mode === "function") {
      const success = this.tryFlushFunctionCall();
      if (!success) {
        return;
      }
    }
    this.emit("end");
    this.cleanup();
  };

  private tryFlushFunctionCall(): boolean {
    let args: any = null;
    try {
      args = JSON.parse(fixJson(this.functionCallArguments));
    } catch (error) {
      this.emit("error", error);
      this.cleanup();
      return false;
    }
    this.emit("function", {
      name: this.functionCallName,
      arguments: args,
    });
    this.mode = null;
    this.functionCallName = "";
    this.functionCallArguments = "";
    return true;
  }

  private cleanup() {
    if (this.completionClient) {
      this.completionClient.off("data", this.onData);
      this.completionClient.off("error", this.onError);
      this.completionClient.off("end", this.onEnd);
    }
    this.completionClient = null;
    this.mode = null;
    this.functionCallName = "";
    this.functionCallArguments = "";
  }

  public countTokens(message: OpenAIMessage): number {
    if (message.content) {
      return estimateTokens(message.content);
    } else if (message.function_call) {
      return estimateTokens(JSON.stringify(message.function_call));
    }
    return 0;
  }
}

const maxTokensByModel: { [key in OpenAIModel]: number } = {
  "gpt-3.5-turbo": 4097,
  "gpt-3.5-turbo-16k": 16385,
  "gpt-4": 8192,
  "gpt-4-32k": 32768,
  "gpt-3.5-turbo-0301": 4097,
  "gpt-4-0314": 8192,
  "gpt-4-32k-0314": 32768,
  "gpt-3.5-turbo-0613": 4097,
  "gpt-4-0613": 8192,
  "gpt-4-32k-0613": 32768,
  "gpt-3.5-turbo-16k-0613": 16385,
};

// function functionsToOpenAIFormat(
//   functions?: FunctionDefinition[]
// ): OpenAIFunction[] | undefined {
//   if (functions === undefined) {
//     return undefined;
//   }
//   return functions.map((fun) => {
//     const args = fun.parameters;
//     let openAiProperties: { [key: string]: any } = {};
//     let required: string[] = [];

//     if (args) {
//       for (const [name, arg] of Object.entries(args)) {
//         const description = arg.description;
//         if (typeof arg.type === "string" || arg.type === undefined) {
//           const type = arg.type || "string";
//           openAiProperties[name] = {
//             type: arg.type,
//             ...(description ? { description } : {}),
//           };
//         } else if (Array.isArray(arg.type)) {
//           openAiProperties[name] = {
//             type: "enum",
//             enum: arg.type,
//             ...(description ? { description } : {}),
//           };
//         }

//         if (arg.optional !== true) {
//           required.push(name);
//         }
//       }
//     }

//     return {
//       name: fun.name,
//       description: fun.description,
//       parameters: {
//         type: "object",
//         properties: openAiProperties,
//         ...(required.length ? { required } : {}),
//       },
//     };
//   });
// }

function estimateTokens(text: string): number {
  return text.length / 3;
}

function maxTokensForModel(model: OpenAIModel): number {
  return maxTokensByModel[model];
}

function fixJson(json: string): string {
  if (json === "") {
    json = "{}";
  }
  json = json.trim();
  if (!json.startsWith("{")) {
    json = "{" + json;
  }
  if (!json.endsWith("}")) {
    json = json + "}";
  }
  return jsonrepair(json);
}

function countFunctionsTokens(functions: OpenAIFunction[]): number {
  if (functions.length === 0) {
    return 0;
  }
  const json = JSON.stringify(functions);
  return estimateTokens(json);
}
