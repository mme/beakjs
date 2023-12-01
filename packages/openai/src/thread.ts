import {
  DebugLogger,
  NoopDebugLogger,
  OpenAIChatMessage,
  OpenAIThread,
} from "./types";

export interface ThreadAPIConfiguration {
  apiKey?: string;
  baseUrl?: string;
  debugLogger?: DebugLogger;
}

export interface ListThreadsQueryParams {
  limit?: number;
  order?: "asc" | "desc";
  after?: string;
  before?: string;
}

const DEFAULT_BASE_URL = "https://api.openai.com";

export interface CreateThreadParams {
  messages?: Array<OpenAIChatMessage>;
  metadata?: Record<string, string>;
}

export class ThreadAPI {
  private apiKey?: string;
  private baseUrl: string;
  private debugLogger: DebugLogger;

  constructor({ apiKey, baseUrl, debugLogger }: ThreadAPIConfiguration) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");

    if (!apiKey && !baseUrl) {
      console.warn("No API key or base URL provided.");
    }
    this.debugLogger = debugLogger || NoopDebugLogger;
  }

  async create(params: CreateThreadParams): Promise<OpenAIThread> {
    const url = `${this.baseUrl}/v1/threads`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async retrieve(threadId: string): Promise<OpenAIThread> {
    const url = `${this.baseUrl}/v1/threads/${threadId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async modify(
    threadId: string,
    metadata: Record<string, string>
  ): Promise<OpenAIThread> {
    const url = `${this.baseUrl}/v1/threads/${threadId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ metadata }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async delete(threadId: string): Promise<{ id: string; deleted: boolean }> {
    const url = `${this.baseUrl}/v1/threads/${threadId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }
}
