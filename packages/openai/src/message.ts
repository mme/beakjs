import { DebugLogger, OpenAIMessage, NoopDebugLogger } from "./types";

export interface MessageAPIConfiguration {
  apiKey?: string;
  baseUrl?: string;
  debugLogger?: DebugLogger;
}

const DEFAULT_BASE_URL = "https://api.openai.com";

interface MessageAPICreateMessageParams {
  threadId: string;
  role: "user";
  content: string;
  fileIds?: string[];
  metadata?: Record<string, any>;
}

interface MessageAPIListMessagesOptions {
  threadId: string;
  limit?: number;
  order?: "asc" | "desc";
  after?: string;
  before?: string;
}

export class MessageAPI {
  private apiKey?: string;
  private baseUrl: string;
  private debugLogger: DebugLogger;

  constructor({ apiKey, baseUrl, debugLogger }: MessageAPIConfiguration) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");

    if (!apiKey && !baseUrl) {
      console.warn("No API key or base URL provided.");
    }
    this.debugLogger = debugLogger || NoopDebugLogger;
  }

  async create({
    threadId,
    role,
    content,
    fileIds,
    metadata,
  }: MessageAPICreateMessageParams) {
    const endpoint = `${this.baseUrl}/v1/threads/${threadId}/messages`;

    // Construct the request body with only provided fields
    const requestBody: any = { role, content };
    if (fileIds) requestBody.file_ids = fileIds;
    if (metadata) requestBody.metadata = metadata;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  }

  async retrieve(threadId: string, messageId: string): Promise<OpenAIMessage> {
    const endpoint = `${this.baseUrl}/v1/threads/${threadId}/messages/${messageId}`;

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

  async modify(threadId: string, messageId: string, metadata = {}) {
    const endpoint = `${this.baseUrl}/v1/threads/${threadId}/messages/${messageId}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ metadata }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  }

  async listMessages(options: MessageAPIListMessagesOptions) {
    const queryParams = new URLSearchParams();

    if (options.limit) queryParams.append("limit", options.limit.toString());
    if (options.order) queryParams.append("order", options.order);
    if (options.after) queryParams.append("after", options.after);
    if (options.before) queryParams.append("before", options.before);

    const endpoint = `${this.baseUrl}/v1/threads/${options.threadId}/messages?${queryParams}`;

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
