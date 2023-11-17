import { EventEmitter } from "eventemitter3";
import { OpenAI, OpenAIModel } from "@beakjs/openai";
import {
  LLMAdapter,
  Message,
  FunctionDefinition,
  FunctionCall,
  QueryChatCompletionParams,
  DebugLogger,
} from "./types";
import { v4 as uuidv4 } from "uuid";
import { OpenAIAdapter } from "./openai";

const DEFAULT_INSTRUCTIONS =
  "Assistant is running inside a web application. Assistant never returns JSON " +
  "as a text reply, always uses the correct format for function calls.";

const FORMATTING_INSTRUCTIONS =
  "Never provide instructions for executing function calls to the user, instead " +
  "use the function call interface.";

export interface BeakConfiguration {
  openAIApiKey: string;
  openAIModel?: OpenAIModel;
  maxFeedback?: number;
  instructions?: string;
  temperature?: number;
  maxTokens?: number;
  debugLogger?: DebugLogger;
  formattingInstructions?: string;
}

interface BeakEvents {
  change: (messages: Message) => void;
  partial: (name: string, args: any) => void;
  function: (functionCall: FunctionCall) => void;
  content: (content: string) => void;
  error: (error: Error) => void;
  end: () => void;
}

interface BeakInfo {
  description: string;
  data: any;
}

export class BeakCore extends EventEmitter<BeakEvents> {
  public _messages: Message[] = [];

  private instructionsMessage: Message;
  private formattingInstructionsMessage?: Message;
  public configuration: BeakConfiguration;
  public functions: Record<string, FunctionDefinition> = {};
  public info: Record<string, BeakInfo> = {};
  private debug: DebugLogger;

  constructor(configuration: BeakConfiguration) {
    super();
    this.configuration = configuration;

    let client = this.newAdapter();
    this.instructionsMessage = new Message({
      role: "system",
      content: this.configuration.instructions || DEFAULT_INSTRUCTIONS,
      status: "success",
    });
    this.instructionsMessage.calculateNumTokens(client);

    if (this.configuration.formattingInstructions !== "") {
      this.formattingInstructionsMessage = new Message({
        role: "system",
        content:
          this.configuration.formattingInstructions || FORMATTING_INSTRUCTIONS,
        status: "success",
      });
      this.formattingInstructionsMessage.calculateNumTokens(client);
    }

    this.debug = configuration.debugLogger || new DebugLogger();
  }

  public addFunction(fun: FunctionDefinition) {
    this.functions[fun.name] = fun;
  }

  public removeFunction(fun: FunctionDefinition | string) {
    if (typeof fun === "string") {
      delete this.functions[fun];
    } else {
      delete this.functions[fun.name];
    }
  }

  public addInfo(data: any, description: string = "data"): string {
    const id = uuidv4();
    this.info[id] = { description, data };
    return id;
  }

  public removeInfo(id: string) {
    delete this.info[id];
  }

  private infoMessage(): Message | undefined {
    const info = Object.values(this.info);
    if (info.length == 0) {
      return undefined;
    }
    const infoStrings = info.map(
      (c) => c.description + ": " + JSON.stringify(c.data)
    );
    infoStrings.sort();
    const ctxString = infoStrings.join("\n");
    return new Message({
      role: "system",
      content:
        "Partial snapshot of the application's current state:\n\n" + ctxString,
    });
  }

  public get messages(): Message[] {
    return this._messages
      .filter((message) => message.role != "system")
      .map((message) => message.copy());
  }

  public async runChatCompletion(content: string): Promise<void> {
    this.debug.log(
      "beak-complete",
      "Running runChatCompletion with content:",
      content
    );

    const userMessage = new Message({
      role: "user",
      content: content,
      status: "success",
    });
    userMessage.calculateNumTokens(this.newAdapter());

    this._messages.push(userMessage);
    this.emit("change", userMessage.copy());

    const maxIterations = (this.configuration.maxFeedback || 2) + 1;
    this.debug.log("beak-complete", "Max iterations:", maxIterations);

    let functionCall: "auto" | "none" = "auto";

    for (let i = 0; i < maxIterations; i++) {
      this.debug.log("beak-complete", "Iteration:", i);

      let message = new Message({ role: "assistant", status: "pending" });
      this._messages.push(message);
      this.emit("change", message.copy());

      const client = this.newAdapter();

      const contextMessage = this.infoMessage();
      let newMessages: Message[] = [];
      try {
        newMessages = await this.runChatCompletionAsync(client, {
          maxTokens: this.configuration.maxTokens,
          messages: [
            this.instructionsMessage,
            ...(this.formattingInstructionsMessage !== undefined
              ? [this.formattingInstructionsMessage]
              : []),
            ...(contextMessage !== undefined ? [contextMessage] : []),
            // we leave out the last message, because it is the one we are currently working on
            ...this._messages.slice(0, this._messages.length - 1),
          ],
          functions: Object.values(this.functions),
          functionCall: functionCall,
          temperature: this.configuration.temperature,
        });

        this.debug.log(
          "beak-complete",
          "runChatCompletionAsync returned message:",
          message
        );
      } catch (error) {
        console.error(error);
        return;
      }

      let hasFeedback = false;

      // first, filter out any empty messages
      for (const message of newMessages) {
        if (!message.functionCall && !message.content) {
          this.debug.log(
            "beak-complete",
            "No content, removing message:",
            message
          );
          this._messages = this._messages.filter((m) => m.id !== message.id);
          this.emit("change", this._messages.slice(-1)[0].copy());
        }
      }

      for (const message of newMessages) {
        message.calculateNumTokens(client);

        // handle text message
        if (!message.functionCall) {
          message.status = "success";
          this.debug.log(
            "beak-complete",
            "No function call, finalizing message:",
            message
          );
          this.emit("change", message.copy());

          continue; // next message
        }

        // handle function call
        const currentCall = message.functionCall;

        // handle function call not found
        if (!(currentCall.name in this.functions)) {
          message.status = "error";
          message.calculateNumTokens(client);
          this.emit("change", message.copy());

          // Insert a new message for the error message
          const errorMessage = new Message({
            role: "function",
            name: currentCall.name,
            status: "error",
            content: `Error: Function ${currentCall.name} not found.`,
          });
          errorMessage.calculateNumTokens(client);

          this._messages.push(errorMessage);
          this.emit("change", errorMessage.copy());

          continue; // next message
        }

        const fun = this.functions[currentCall.name];

        this.debug.log(
          "beak-complete",
          "Calling function:",
          currentCall.name,
          "with arguments:",
          currentCall.arguments
        );

        try {
          const result = await fun.handler(currentCall.arguments);

          message.status = "success";

          const resultString =
            typeof result === "string" ? result : JSON.stringify(result);
          const resultMessage = new Message({
            role: "function",
            name: currentCall.name,
            status: "success",
            content: resultString,
            result: result,
          });
          resultMessage.calculateNumTokens(client);
          this._messages.push(resultMessage);

          this.emit("change", resultMessage.copy());

          // in case the function wants feedback, signal that the result should be fed back to the LLM
          if (fun.feedback !== "none") {
            hasFeedback = true;
          }

          // if the function only wants text feedback, set function call to none
          if (fun.feedback === "text") {
            functionCall = "none";
          }

          continue; // next message
        } catch (error) {
          this.debug.log("beak-complete", "Error calling function:", error);

          message.status = "error";

          const errorMessage = new Message({
            role: "function",
            name: currentCall.name,
            status: "error",
            content: `Error: ${error}`,
          });
          errorMessage.calculateNumTokens(client);
          this._messages.push(errorMessage);

          this.emit("change", errorMessage.copy());

          // feed back the error message to the llm
          if (fun.feedback !== "none") {
            hasFeedback = true;
          }

          continue; // next message
        }
      }

      if (!hasFeedback) {
        break;
      }
    }

    this.debug.log("beak-complete", "Done running runChatCompletion");

    return;
  }

  private async runChatCompletionAsync(
    client: LLMAdapter,
    params: QueryChatCompletionParams
  ) {
    return new Promise<Message[]>((resolve, reject) => {
      const newMessages: Message[] = this._messages.slice(-1);

      const cleanup = () => {
        client.off("partial");
        client.off("function");
        client.off("content");
        client.off("error");
        client.off("end");
      };
      client.on("partial", (name, args) => {
        let [message] = newMessages.slice(-1);

        if (message.content) {
          // finalize this text message
          message.status = "success";
          message.calculateNumTokens(client);

          // create a new message for the function call
          message = new Message({ role: "assistant" });
          newMessages.push(message);
          this._messages.push(message);
        }

        message.status = "partial";
        this.emit("partial", name, args);
        this.emit("change", message.copy());
      });

      client.on("function", (functionCall: FunctionCall) => {
        const [message] = newMessages.slice(-1);
        message.functionCall = functionCall;

        this.emit("function", functionCall);
        this.emit("change", message.copy());
      });

      client.on("content", (content: string) => {
        let [message] = newMessages.slice(-1);

        if (message.functionCall) {
          // we leave the function call message unfinished and create a new one
          // for the text message
          message = new Message({ role: "assistant" });
          newMessages.push(message);
          this._messages.push(message);
        }

        message.content = message.content ? message.content + content : content;

        this.emit("content", content);
        this.emit("change", message.copy());
      });

      client.on("error", (error: Error) => {
        const [message] = newMessages.slice(-1);
        message.status = "error";
        message.content = "Error: " + error;

        this.emit("error", error);
        this.emit("change", message.copy());
        cleanup();
        reject(error);
      });

      client.on("end", () => {
        const [message] = newMessages.slice(-1);

        this.emit("end");
        cleanup();
        resolve(newMessages);
      });

      client.queryChatCompletion(params);
    });
  }

  private newAdapter(): LLMAdapter {
    return new OpenAIAdapter(
      new OpenAI({
        apiKey: this.configuration.openAIApiKey,
        model: this.configuration.openAIModel,
        debugLogger: this.configuration.debugLogger,
      })
    );
  }
}
