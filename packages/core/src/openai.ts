import {
  OpenAI,
  FetchChatCompletionParams,
  OpenAIFunction,
  OpenAIMessage,
} from "@beakjs/openai";
import {
  FunctionCall,
  FunctionDefinition,
  LLMAdapter,
  LLMEvent,
  Message,
  QueryChatCompletionParams,
} from "./types";

export class OpenAIAdapter implements LLMAdapter {
  constructor(private openai: OpenAI) {}

  countTokens(message: Message): number {
    return this.openai.countTokens(message);
  }

  async queryChatCompletion(params: QueryChatCompletionParams): Promise<void> {
    const openAIParams: FetchChatCompletionParams = {
      messages: params.messages.map(messageToOpenAI),
      functions: functionsToOpenAIFormat(params.functions),
      maxTokens: params.maxTokens,
      temperature: params.temperature,
    };
    return await this.openai.queryChatCompletion(openAIParams);
  }

  on(event: LLMEvent, listener: (...args: any[]) => void): this {
    this.openai.on(event, listener);
    return this;
  }

  off(event: LLMEvent, listener?: (...args: any[]) => void): this {
    this.openai.off(event, listener);
    return this;
  }
}

function messageToOpenAI(message: Message): OpenAIMessage {
  const content = message.content || "";
  if (message.role === "system") {
    return { role: message.role, content };
  } else if (message.role === "function") {
    return {
      role: message.role,
      content,
      name: message.name,
    };
  } else {
    let functionCall = functionCallToOpenAI(message.functionCall);

    return {
      role: message.role,
      content,
      ...(functionCall !== undefined && { function_call: functionCall }),
    };
  }
}

function functionsToOpenAIFormat(
  functions?: FunctionDefinition[]
): OpenAIFunction[] | undefined {
  if (functions === undefined) {
    return undefined;
  }
  return functions.map((fun) => {
    const args = fun.parameters;
    let openAiProperties: { [key: string]: any } = {};
    let required: string[] = [];

    if (args) {
      for (const [name, arg] of Object.entries(args)) {
        const description = arg.description;
        if (typeof arg.type === "string" || arg.type === undefined) {
          const type = arg.type || "string";
          openAiProperties[name] = {
            type: arg.type,
            ...(description ? { description } : {}),
          };
        } else if (Array.isArray(arg.type)) {
          openAiProperties[name] = {
            type: "enum",
            enum: arg.type,
            ...(description ? { description } : {}),
          };
        }

        if (arg.optional !== true) {
          required.push(name);
        }
      }
    }

    return {
      name: fun.name,
      description: fun.description,
      parameters: {
        type: "object",
        properties: openAiProperties,
        ...(required.length ? { required } : {}),
      },
    };
  });
}

function functionCallToOpenAI(functionCall?: FunctionCall): any {
  if (functionCall === undefined) {
    return undefined;
  }
  return {
    name: functionCall.name,
    arguments: JSON.stringify(functionCall.arguments),
  };
}
