import { DebugLogger, OpenAIAssistant, NoopDebugLogger } from "./types";

export interface AssistantAPIConfiguration {
  apiKey?: string;
  baseUrl?: string;
  debugLogger?: DebugLogger;
}

export interface ListAssistantsQueryParams {
  limit?: number;
  order?: "asc" | "desc";
  after?: string;
  before?: string;
}

const DEFAULT_BASE_URL = "https://api.openai.com";

export class AssistantAPI {
  private apiKey?: string;
  private baseUrl: string;
  private debugLogger: DebugLogger;

  constructor({ apiKey, baseUrl, debugLogger }: AssistantAPIConfiguration) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");

    if (!apiKey && !baseUrl) {
      console.warn("No API key or base URL provided.");
    }
    this.debugLogger = debugLogger || NoopDebugLogger;
  }

  public async create(
    assistantData: Partial<OpenAIAssistant>
  ): Promise<OpenAIAssistant> {
    const url = `${this.baseUrl}/v1/assistants`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v1",
      },
      body: JSON.stringify(assistantData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OpenAIAssistant = await response.json();
    return data;
  }

  public async retrieve(assistantId: string): Promise<OpenAIAssistant> {
    const url = `${this.baseUrl}/v1/assistants/${assistantId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v1",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OpenAIAssistant = await response.json();
    return data;
  }

  public async modify(
    assistantId: string,
    updateData: Partial<OpenAIAssistant>
  ): Promise<OpenAIAssistant> {
    const url = `${this.baseUrl}/v1/assistants/${assistantId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v1",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OpenAIAssistant = await response.json();
    return data;
  }

  public async delete(assistantId: string): Promise<void> {
    const url = `${this.baseUrl}/v1/assistants/${assistantId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v1",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  public async list(
    queryParams?: ListAssistantsQueryParams
  ): Promise<OpenAIAssistant[]> {
    let query = new URLSearchParams();
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}/v1/assistants?${query.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v1",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: { data: OpenAIAssistant[] } = await response.json();
    return data.data;
  }
}
