import Bottleneck from "bottleneck";
import { ChatCompletion, FetchChatCompletionParams } from "@beakjs/openai";

export interface BeakProxyProps {
  openAIApiKey: string;
  rateLimiterOptions?: RateLimiter;
}

interface RateLimiter {
  requestsPerSecond?: number;
  maxConcurrent?: number;
  requestPerSecondByClient?: number;
  maxConcurrentByClient?: number;
  redis?: RedisConfiguration;
}

interface RedisConfiguration {
  host: string;
  port?: number;
}

export interface HttpAdapter {
  onEnd: () => void;
  onData: (data: any) => void;
  onError: (error: any) => void;
}

export class BeakProxy {
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

    const datastore = rateLimiterOptions.redis ? "redis" : "local";
    let clientOptions: any = {};
    if (rateLimiterOptions.redis) {
      clientOptions["clientOptions"] = {
        host: rateLimiterOptions.redis.host,
        port: rateLimiterOptions.redis.port || 6379,
      };
    }

    this.rateLimiter = new Bottleneck({
      maxConcurrent: rateLimiterOptions.maxConcurrent,
      minTime: Math.round(1000 / rateLimiterOptions.requestsPerSecond),
      datastore,
      ...clientOptions,
    });

    this.rateLimiterGroup = new Bottleneck.Group({
      maxConcurrent: rateLimiterOptions.maxConcurrentByClient,
      minTime: Math.round(1000 / rateLimiterOptions.requestPerSecondByClient),
      datastore,
      ...clientOptions,
    });
  }

  private async handleRequestImplementation(
    params: FetchChatCompletionParams,
    adapter: HttpAdapter
  ) {
    const chat = new ChatCompletion({ apiKey: this.openAIApiKey });
    chat.on("data", (data) => adapter.onData(data));
    chat.on("error", (error) => adapter.onError(error));
    chat.on("end", () => adapter.onEnd());
    await chat.fetchChatCompletion(params);
  }

  async handleRequest(
    params: FetchChatCompletionParams,
    adapter: HttpAdapter,
    rateLimiterKey?: string
  ) {
    if (rateLimiterKey) {
      await this.rateLimiter.schedule(async () => {});
      await this.rateLimiterGroup.key(rateLimiterKey).schedule(async () => {
        await this.handleRequestImplementation(params, adapter);
      });
    } else {
      await this.rateLimiter.schedule(async () => {
        await this.handleRequestImplementation(params, adapter);
      });
    }
  }
}
