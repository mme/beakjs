import { AssistantFile, DebugLogger, NoopDebugLogger } from "./types";

export interface AssistantFileAPIConfiguration {
  apiKey?: string;
  baseUrl?: string;
  debugLogger?: DebugLogger;
}

interface ListAssistantFilesQueryParams {
  limit?: number;
  order?: "asc" | "desc";
  after?: string;
  before?: string;
}

const DEFAULT_BASE_URL = "https://api.openai.com";

export class AssistantFileAPI {
  private apiKey?: string;
  private baseUrl: string;
  private debugLogger: DebugLogger;

  constructor({ apiKey, baseUrl, debugLogger }: AssistantFileAPIConfiguration) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");

    if (!apiKey && !baseUrl) {
      console.warn("No API key or base URL provided.");
    }
    this.debugLogger = debugLogger || NoopDebugLogger;
  }

  public async create(
    assistantId: string,
    fileId: string
  ): Promise<AssistantFile> {
    const url = `${this.baseUrl}/v1/assistants/${assistantId}/files`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v1",
      },
      body: JSON.stringify({ file_id: fileId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AssistantFile = await response.json();
    return data;
  }

  public async retrieve(
    assistantId: string,
    fileId: string
  ): Promise<AssistantFile> {
    const url = `${this.baseUrl}/v1/assistants/${assistantId}/files/${fileId}`;
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

    const data: AssistantFile = await response.json();
    return data;
  }

  public async delete(assistantId: string, fileId: string): Promise<void> {
    const url = `${this.baseUrl}/v1/assistants/${assistantId}/files/${fileId}`;
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
    assistantId: string,
    queryParams?: ListAssistantFilesQueryParams
  ): Promise<AssistantFile[]> {
    let query = new URLSearchParams();
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString());
        }
      });
    }

    const url = `${
      this.baseUrl
    }/v1/assistants/${assistantId}/files?${query.toString()}`;
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

    const data: { data: AssistantFile[] } = await response.json();
    return data.data;
  }
}
