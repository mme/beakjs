import { OpenAIMessageFile, DebugLogger, NoopDebugLogger } from "./types";

export interface MessageFileAPIConfiguration {
  apiKey?: string;
  baseUrl?: string;
  debugLogger?: DebugLogger;
}

const DEFAULT_BASE_URL = "https://api.openai.com";

interface ListMessageFilesOptions {
  limit?: number;
  order?: "asc" | "desc";
  after?: string;
  before?: string;
}

export class MessageFileAPI {
  private apiKey?: string;
  private baseUrl: string;
  private debugLogger: DebugLogger;

  constructor({ apiKey, baseUrl, debugLogger }: MessageFileAPIConfiguration) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");

    if (!apiKey && !baseUrl) {
      console.warn("No API key or base URL provided.");
    }
    this.debugLogger = debugLogger || NoopDebugLogger;
  }

  async retrieve(
    threadId: string,
    messageId: string,
    fileId: string
  ): Promise<OpenAIMessageFile> {
    const endpoint = `${this.baseUrl}/v1/threads/${threadId}/messages/${messageId}/files/${fileId}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  }

  async list(
    threadId: string,
    messageId: string,
    options: ListMessageFilesOptions = {}
  ) {
    const queryParams = new URLSearchParams();

    if (options.limit) queryParams.append("limit", options.limit.toString());
    if (options.order) queryParams.append("order", options.order);
    if (options.after) queryParams.append("after", options.after);
    if (options.before) queryParams.append("before", options.before);

    const endpoint = `${this.baseUrl}/v1/threads/${threadId}/messages/${messageId}/files?${queryParams}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  }
}
