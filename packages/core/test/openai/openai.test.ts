import { mockContentResponses, mockFunctionResponse } from "../utils";
import { OpenAI } from "../../src/openai/openai";
import { QueryChatCompletionParams, Message } from "../../src/types";

global.fetch = jest.fn();

describe("OpenAI", () => {
  it("should handle stream content events correctly", async () => {
    const model = "gpt-3.5-turbo";

    const mockStream = new ReadableStream({
      start(controller) {
        for (let data of mockContentResponses("Hello world!", model)) {
          controller.enqueue(new TextEncoder().encode(data));
        }
        controller.close();
      },
    });

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: mockStream,
    });

    const apiKey = "sk-xyz";
    const openai = new OpenAI({ apiKey, model });

    const onContentMock = jest.fn();
    const onFunctionMock = jest.fn();
    const onErrorMock = jest.fn();
    const onEndMock = jest.fn();

    openai.on("content", onContentMock);
    openai.on("function", onFunctionMock);
    openai.on("error", onErrorMock);
    openai.on("end", onEndMock);

    await openai.queryChatCompletion({
      messages: [new Message({ role: "user", content: "Hello!" })],
    });

    expect(onContentMock).toHaveBeenCalledTimes(3);
    expect(onFunctionMock).not.toHaveBeenCalled();
    expect(onErrorMock).not.toHaveBeenCalled();
    expect(onEndMock).toHaveBeenCalledTimes(1);

    const extractedData = onContentMock.mock.calls.map((call) => {
      return call[0];
    });

    expect(extractedData[0]).toEqual("Hell");
    expect(extractedData[1]).toEqual("o wo");
    expect(extractedData[2]).toEqual("rld!");
  });

  it("should handle function events correctly", async () => {
    const model = "gpt-3.5-turbo";

    // Set up the ReadableStream for the fetch mock
    const mockStream = new ReadableStream({
      start(controller) {
        for (let data of mockFunctionResponse(
          "sayHello",
          { name: "world" },
          model
        )) {
          controller.enqueue(new TextEncoder().encode(data));
        }
        controller.close();
      },
    });

    // Mock the fetch function
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: mockStream,
    });

    const apiKey = "sk-xyz";
    const openai = new OpenAI({ apiKey, model });

    const onContentMock = jest.fn();
    const onFunctionMock = jest.fn();
    const onErrorMock = jest.fn();
    const onEndMock = jest.fn();

    openai.on("content", onContentMock);
    openai.on("function", onFunctionMock);
    openai.on("error", onErrorMock);
    openai.on("end", onEndMock);

    await openai.queryChatCompletion({
      messages: [
        new Message({ role: "user", content: "Say hello to the world!" }),
      ],
      functions: [
        {
          name: "sayHello",
          description: "Say hello to someone",
          parameters: {
            name: {
              type: "string",
              description: "The name of the person to say hello to",
            },
          },
          handler: (params: any) => {
            return `Hello ${params.name}!`;
          },
        },
      ],
    });

    expect(onContentMock).not.toHaveBeenCalled();
    expect(onFunctionMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).not.toHaveBeenCalled();
    expect(onEndMock).toHaveBeenCalledTimes(1);

    const extractedData = onFunctionMock.mock.calls[0][0];

    expect(extractedData).toEqual({
      name: "sayHello",
      arguments: {
        name: "world",
      },
    });
  });

  it("should handle partial function events correctly", async () => {
    const model = "gpt-3.5-turbo";

    // Set up the ReadableStream for the fetch mock
    const mockStream = new ReadableStream({
      start(controller) {
        for (let data of mockFunctionResponse(
          "sayHello",
          { name: "world" },
          model
        )) {
          controller.enqueue(new TextEncoder().encode(data));
        }
        controller.close();
      },
    });

    // Mock the fetch function
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: mockStream,
    });

    const apiKey = "sk-xyz";

    const openai = new OpenAI({ apiKey, model });

    const onContentMock = jest.fn();
    const onFunctionMock = jest.fn();
    const onPartialMock = jest.fn();
    const onErrorMock = jest.fn();
    const onEndMock = jest.fn();

    openai.on("content", onContentMock);
    openai.on("function", onFunctionMock);
    openai.on("partial", onPartialMock);
    openai.on("error", onErrorMock);
    openai.on("end", onEndMock);

    const content = "Hello!";
    await openai.queryChatCompletion({
      messages: [new Message({ role: "user", content })],
      functions: [
        {
          name: "sayHello",
          description: "Say hello to someone",
          parameters: {
            name: {
              type: "string",
              description: "The name of the person to say hello to",
            },
          },
          handler: (params: any) => {
            return `Hello ${params.name}!`;
          },
        },
      ],
    });

    expect(onContentMock).not.toHaveBeenCalled();
    expect(onFunctionMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).not.toHaveBeenCalled();
    expect(onEndMock).toHaveBeenCalledTimes(1);

    const extractedData = onFunctionMock.mock.calls[0][0];

    expect(extractedData).toEqual({
      name: "sayHello",
      arguments: {
        name: "world",
      },
    });

    const extractedPartialData = onPartialMock.mock.calls.map((call) => {
      return {
        name: call[0],
        args: call[1],
      };
    });

    expect(extractedPartialData[0]).toEqual({ name: "sayHello", args: "" });
    expect(extractedPartialData[1]).toEqual({ name: "sayHello", args: '{"na' });
    expect(extractedPartialData[2]).toEqual({
      name: "sayHello",
      args: '{"name":',
    });
    expect(extractedPartialData[3]).toEqual({
      name: "sayHello",
      args: '{"name":"wor',
    });
    expect(extractedPartialData[4]).toEqual({
      name: "sayHello",
      args: '{"name":"world"}',
    });
    expect(extractedPartialData[5]).toEqual({
      name: "sayHello",
      args: '{"name":"world"}',
    });
  });

  it("should handle HTTP error events correctly", async () => {
    (fetch as any).mockRejectedValueOnce({
      response: {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      },
    });

    const apiKey = "sk-xyz";
    const model = "gpt-3.5-turbo";

    const openai = new OpenAI({ apiKey, model });

    const onContentMock = jest.fn();
    const onFunctionMock = jest.fn();
    const onErrorMock = jest.fn();
    const onEndMock = jest.fn();

    openai.on("content", onContentMock);
    openai.on("function", onFunctionMock);
    openai.on("error", onErrorMock);
    openai.on("end", onEndMock);

    await openai.queryChatCompletion({
      messages: [new Message({ role: "user", content: "Hello!" })],
    });

    expect(onContentMock).not.toHaveBeenCalled();
    expect(onFunctionMock).not.toHaveBeenCalled();
    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onEndMock).not.toHaveBeenCalled();
  });

  it("does not remove messages when enough tokens are available", async () => {
    let openai = new OpenAI({ apiKey: "sk-xyz", model: "gpt-3.5-turbo" });
    const messages: Message[] = [
      new Message({ role: "user", content: "Hello world!" }),
    ];
    let params: QueryChatCompletionParams = {
      messages: messages,
      maxTokens: 3,
      functions: [],
    };
    let prompt = (openai as any).buildPrompt(params);
    expect(prompt).toEqual(messages);
  });

  it("does not remove messages when enough tokens are available", async () => {
    let openai = new OpenAI({ apiKey: "sk-xyz", model: "gpt-3.5-turbo" });
    const messages: Message[] = [
      new Message({ role: "user", content: "Hello world!" }),
      new Message({ role: "user", content: "Hallo welt!" }),
    ];
    let params: QueryChatCompletionParams = {
      messages: messages,
      maxTokens: 6,
      functions: [],
    };
    let prompt = (openai as any).buildPrompt(params);
    expect(prompt).toEqual(messages);
  });

  it("does remove messages when too few tokens are available", async () => {
    let openai = new OpenAI({ apiKey: "sk-xyz", model: "gpt-3.5-turbo" });
    const messages: Message[] = [
      new Message({ role: "user", content: "Hello world!" }),
      new Message({ role: "user", content: "Hallo welt!" }),
    ];
    let params: QueryChatCompletionParams = {
      messages: messages,
      maxTokens: 5,
      functions: [],
    };
    let prompt = (openai as any).buildPrompt(params);
    expect(prompt).toEqual([
      {
        content: "Hallo welt!",
        role: "user",
      },
    ]);
  });

  it("does not remove system messages", async () => {
    let openai = new OpenAI({ apiKey: "sk-xyz", model: "gpt-3.5-turbo" });
    const messages: Message[] = [
      new Message({ role: "system", content: "Hola mundo!" }),
      new Message({ role: "user", content: "Hello world!" }),
      new Message({ role: "user", content: "Hallo welt!" }),
    ];
    let params: QueryChatCompletionParams = {
      messages: messages,
      maxTokens: 6,
      functions: [],
    };
    let prompt = (openai as any).buildPrompt(params);
    expect(prompt).toEqual([
      {
        content: "Hola mundo!",
        role: "system",
      },
      {
        content: "Hallo welt!",
        role: "user",
      },
    ]);
  });
});
