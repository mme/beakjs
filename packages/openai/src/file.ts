import {
  DebugLogger,
  OpenAIFile,
  OpenAIFilePurpose,
  NoopDebugLogger,
} from "./types";

export interface FileAPIConfiguration {
  apiKey?: string;
  baseUrl?: string;
  debugLogger?: DebugLogger;
}

interface FileAPIDeletionStatus {
  id: string;
  object: string;
  deleted: boolean;
}

const DEFAULT_BASE_URL = "https://api.openai.com";

export class FileAPI {
  private apiKey?: string;
  private baseUrl: string;
  private debugLogger: DebugLogger;

  constructor({ apiKey, baseUrl, debugLogger }: FileAPIConfiguration) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");

    if (!apiKey && !baseUrl) {
      console.warn("No API key or base URL provided.");
    }
    this.debugLogger = debugLogger || NoopDebugLogger;
  }

  public async list(purpose?: OpenAIFilePurpose): Promise<OpenAIFile[]> {
    let query = new URLSearchParams();
    if (purpose) {
      query.append("purpose", purpose);
    }

    const url = `${this.baseUrl}/v1/files?${query.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: { data: OpenAIFile[] } = await response.json();
    return data.data;
  }

  public async upload(
    file: Blob,
    purpose: "fine-tune" | "assistants"
  ): Promise<OpenAIFile> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", purpose);

    const url = `${this.baseUrl}/v1/files`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OpenAIFile = await response.json();
    return data;
  }

  public async delete(fileId: string): Promise<FileAPIDeletionStatus> {
    const url = `${this.baseUrl}/v1/files/${fileId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  public async retrieve(fileId: string): Promise<OpenAIFile> {
    const url = `${this.baseUrl}/v1/files/${fileId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OpenAIFile = await response.json();
    return data;
  }

  public async retrieveContent(fileId: string): Promise<Blob> {
    const url = `${this.baseUrl}/v1/files/${fileId}/content`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.blob();
  }
}
