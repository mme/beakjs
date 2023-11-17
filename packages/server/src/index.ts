import Bottleneck from "bottleneck";
import { FetchChatCompletionParams } from "@beakjs/core";

interface BeakProxyProps {
  openAIApiKey: string;
  rateLimiterOptions?: RateLimiterOptions;
}

interface RateLimiterOptions {
  requestsPerSecond?: number;
  maxConcurrent?: number;
  requestPerSecondByClient?: number;
  maxConcurrentByClient?: number;
}

interface HttpAdapter {
  onEnd: () => void;
  onData: (data: any) => void;
  onError: (error: any) => void;
}

class BeakProxy {
  private openAIApiKey: string;
  private rateLimiter: Bottleneck;
  private rateLimiterGroup: Bottleneck.Group;

  constructor({ openAIApiKey, rateLimiterOptions }: BeakProxyProps) {
    this.openAIApiKey = openAIApiKey;

    rateLimiterOptions ||= {};
    rateLimiterOptions.requestsPerSecond ||= 10;
    rateLimiterOptions.maxConcurrent ||= 2;
    rateLimiterOptions.requestPerSecondByClient ||= 0.5;
    rateLimiterOptions.maxConcurrentByClient ||= 1;

    this.rateLimiter = new Bottleneck({
      maxConcurrent: rateLimiterOptions.maxConcurrent,
      minTime: 1000 / rateLimiterOptions.requestsPerSecond,
    });

    this.rateLimiterGroup = new Bottleneck.Group({
      maxConcurrent: rateLimiterOptions.maxConcurrentByClient,
      minTime: 1000 / rateLimiterOptions.requestPerSecondByClient,
    });
  }

  private handleRequestImplementation(
    params: FetchChatCompletionParams,
    adapter: HttpAdapter
  ) {}

  // }

  // public async fetchChatCompletion({
  //   model,
  //   messages,
  //   functions,
  //   functionCall,
  //   temperature,
  // }: FetchChatCompletionParams): Promise<void> {
  //   await this.cleanup();

  //   functionCall ||= "auto";
  //   temperature ||= 0.5;
  //   functions ||= [];

  //   if (functions.length == 0) {
  //     functionCall = undefined;
  //   }

  //   try {
  //     this.debug.log("chat-api", "Fetching chat completion...");
  //     this.debug.table("chat-api", "Params", {
  //       model,
  //       functionCall,
  //       temperature,
  //     });
  //     this.debug.table("chat-api", "Functions", functions);
  //     this.debug.table("chat-api", "Messages", messages);

  //     const response = await fetch(this.API_CHAT_COMPLETION_URL, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${this.apiKey}`,
  //       },
  //       body: JSON.stringify({
  //         model,
  //         messages,
  //         stream: true,
  //         ...(functions.length ? { functions } : {}),
  //         ...(temperature ? { temperature } : {}),
  //         ...(functionCall && functions.length
  //           ? { function_call: functionCall }
  //           : {}),
  //       }),
  //     });
}
