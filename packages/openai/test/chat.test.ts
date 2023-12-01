import { mockContentResponses, mockFunctionResponse } from "./utils";
import { ChatCompletion } from "../src/chat";
import { OpenAIFunction, OpenAIChatMessage } from "../src/types";

global.fetch = jest.fn();

describe("ChatCompletion", () => {
  it("should stream chat completion events correctly", async () => {
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
    const chatCompletion = new ChatCompletion({ apiKey });

    const onDataMock = jest.fn();
    const onErrorMock = jest.fn();
    const onEndMock = jest.fn();
    chatCompletion.on("data", onDataMock);
    chatCompletion.on("error", onErrorMock);
    chatCompletion.on("end", onEndMock);

    const messages: OpenAIChatMessage[] = [
      {
        role: "user",
        content: "Hello!",
      },
    ];
    await chatCompletion.fetchChatCompletion({
      model,
      messages,
    });

    expect(onDataMock).toHaveBeenCalledTimes(5);
    expect(onErrorMock).not.toHaveBeenCalled();
    expect(onEndMock).toHaveBeenCalledTimes(1);

    const extractedData = onDataMock.mock.calls.map((call) => {
      const arg = call[0];
      const choice = arg.choices[0];
      return {
        delta: choice.delta,
        finish_reason: choice.finish_reason,
      };
    });

    expect(extractedData[0].delta).toEqual({ content: "" });
    expect(extractedData[0].finish_reason).toBe(null);
    expect(extractedData[1].delta).toEqual({ content: "Hell" });
    expect(extractedData[1].finish_reason).toBe(null);
    expect(extractedData[2].delta).toEqual({ content: "o wo" });
    expect(extractedData[2].finish_reason).toBe(null);
    expect(extractedData[3].delta).toEqual({ content: "rld!" });
    expect(extractedData[3].finish_reason).toBe(null);
    expect(extractedData[4].delta).toEqual({});
    expect(extractedData[4].finish_reason).toBe("stop");
  });

  it("should stream chat completion function events correctly", async () => {
    const model = "gpt-3.5-turbo";

    const mockStream = new ReadableStream({
      start(controller) {
        for (let data of mockFunctionResponse(
          "sayHi",
          { name: "Markus" },
          model
        )) {
          controller.enqueue(new TextEncoder().encode(data));
        }
        controller.close();
      },
    });

    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: mockStream,
    });

    const apiKey = "sk-xyz";
    const chatCompletion = new ChatCompletion({ apiKey });

    const onDataMock = jest.fn();
    const onErrorMock = jest.fn();
    const onEndMock = jest.fn();
    chatCompletion.on("data", onDataMock);
    chatCompletion.on("error", onErrorMock);
    chatCompletion.on("end", onEndMock);

    const messages: OpenAIChatMessage[] = [
      {
        role: "user",
        content: "Hello!",
      },
    ];
    const functions: OpenAIFunction[] = [
      {
        name: "sayHi",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
          },
        },
        description: "Say hi to someone.",
      },
    ];
    await chatCompletion.fetchChatCompletion({
      model,
      messages,
      functions,
    });

    expect(onDataMock).toHaveBeenCalledTimes(7);
    expect(onErrorMock).not.toHaveBeenCalled();
    expect(onEndMock).toHaveBeenCalledTimes(1);

    const extractedData = onDataMock.mock.calls.map((call) => {
      const arg = call[0];
      const choice = arg.choices[0];
      return {
        delta: choice.delta,
        finish_reason: choice.finish_reason,
      };
    });

    expect(extractedData[0].delta).toEqual({
      role: "assistant",
      content: null,
      function_call: {
        name: "sayHi",
        arguments: "",
      },
    });
    expect(extractedData[0].finish_reason).toBe(null);
    expect(extractedData[1].delta).toEqual({
      function_call: {
        arguments: '{"na',
      },
    });
    expect(extractedData[1].finish_reason).toBe(null);
    expect(extractedData[2].delta).toEqual({
      function_call: {
        arguments: 'me":',
      },
    });
    expect(extractedData[2].finish_reason).toBe(null);
    expect(extractedData[3].delta).toEqual({
      function_call: {
        arguments: '"Mar',
      },
    });
    expect(extractedData[3].finish_reason).toBe(null);
    expect(extractedData[4].delta).toEqual({
      function_call: {
        arguments: 'kus"',
      },
    });
    expect(extractedData[4].finish_reason).toBe(null);
    expect(extractedData[5].delta).toEqual({
      function_call: {
        arguments: "}",
      },
    });
    expect(extractedData[5].finish_reason).toBe(null);
    expect(extractedData[6].delta).toEqual({});
    expect(extractedData[6].finish_reason).toBe("function_call");
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
    const chatCompletion = new ChatCompletion({ apiKey });

    const onDataMock = jest.fn();
    const onErrorMock = jest.fn();
    const onEndMock = jest.fn();
    chatCompletion.on("data", onDataMock);
    chatCompletion.on("error", onErrorMock);
    chatCompletion.on("end", onEndMock);

    const model = "gpt-3.5-turbo";
    const messages: OpenAIChatMessage[] = [
      {
        role: "user",
        content: "Hello!",
      },
    ];

    await chatCompletion.fetchChatCompletion({
      model,
      messages,
    });

    expect(onDataMock).not.toHaveBeenCalled();
    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onEndMock).not.toHaveBeenCalled();
  });
});
