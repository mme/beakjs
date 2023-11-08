import { Beak } from "../core/beak";
import { mockContentResponses, mockFunctionResponse } from "./utils";

global.fetch = jest.fn();

describe("Beak", () => {
  it("should update messages", async () => {
    const openAIModel = "gpt-3.5-turbo";

    const mockStream = new ReadableStream({
      start(controller) {
        for (let data of mockContentResponses("Hello world!", openAIModel)) {
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

    const openAIApiKey = "sk-xyz";
    const beak = new Beak({ openAIApiKey, openAIModel });

    const onChangeMock = jest.fn();
    const onErrorMock = jest.fn();

    beak.on("change", onChangeMock);
    beak.on("error", onErrorMock);

    await beak.runChatCompletion("Hello!");

    expect(onErrorMock).not.toHaveBeenCalled();
    expect(onChangeMock).toHaveBeenCalledTimes(6);

    expect(onChangeMock.mock.calls[0][0].content).toEqual("Hello!");
    expect(onChangeMock.mock.calls[0][0].role).toEqual("user");
    expect(onChangeMock.mock.calls[0][0].status).toEqual("success");

    expect(onChangeMock.mock.calls[1][0].content).toEqual("");
    expect(onChangeMock.mock.calls[1][0].role).toEqual("assistant");
    expect(onChangeMock.mock.calls[1][0].status).toEqual("pending");

    expect(onChangeMock.mock.calls[2][0].content).toEqual("Hell");
    expect(onChangeMock.mock.calls[2][0].role).toEqual("assistant");
    expect(onChangeMock.mock.calls[2][0].status).toEqual("pending");

    expect(onChangeMock.mock.calls[3][0].content).toEqual("Hello wo");
    expect(onChangeMock.mock.calls[3][0].role).toEqual("assistant");
    expect(onChangeMock.mock.calls[3][0].status).toEqual("pending");

    expect(onChangeMock.mock.calls[4][0].content).toEqual("Hello world!");
    expect(onChangeMock.mock.calls[4][0].role).toEqual("assistant");
    expect(onChangeMock.mock.calls[4][0].status).toEqual("pending");

    expect(onChangeMock.mock.calls[5][0].content).toEqual("Hello world!");
    expect(onChangeMock.mock.calls[5][0].role).toEqual("assistant");
    expect(onChangeMock.mock.calls[5][0].status).toEqual("success");
  });

  it("should call functions", async () => {
    const openAIApiKey = "gpt-3.5-turbo";

    // Set up the ReadableStream for the fetch mock
    const mockStream = new ReadableStream({
      start(controller) {
        for (let data of mockFunctionResponse(
          "sayHello",
          { name: "world" },
          openAIApiKey
        )) {
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

    const openAIModel = "gpt-3.5-turbo";
    const beak = new Beak({ openAIApiKey, openAIModel });
    beak.addFunction({
      name: "sayHello",
      parameters: {
        name: {
          type: "string",
        },
      },
      handler: (args) => {
        return `Hello ${args.name}!`;
      },
    });
    const onChangeMock = jest.fn();
    const onErrorMock = jest.fn();

    beak.on("change", onChangeMock);
    beak.on("error", onErrorMock);

    await beak.runChatCompletion("Say hello to the world!");

    expect(onErrorMock).not.toHaveBeenCalled();
    expect(onChangeMock).toHaveBeenCalledTimes(4);

    expect(onChangeMock.mock.calls[0][0].content).toEqual(
      "Say hello to the world!"
    );
    expect(onChangeMock.mock.calls[0][0].role).toEqual("user");
    expect(onChangeMock.mock.calls[0][0].status).toEqual("success");

    expect(onChangeMock.mock.calls[1][0].content).toEqual("");
    expect(onChangeMock.mock.calls[1][0].role).toEqual("assistant");
    expect(onChangeMock.mock.calls[1][0].status).toEqual("pending");

    expect(onChangeMock.mock.calls[2][0].content).toEqual("");
    expect(onChangeMock.mock.calls[2][0].role).toEqual("function");
    expect(onChangeMock.mock.calls[2][0].status).toEqual("pending");

    expect(onChangeMock.mock.calls[3][0].content).toEqual(
      '{"status":"success","result":"Hello world!"}'
    );
    expect(onChangeMock.mock.calls[3][0].role).toEqual("function");
    expect(onChangeMock.mock.calls[3][0].status).toEqual("success");
    expect(onChangeMock.mock.calls[3][0].functionCall).toEqual({
      name: "sayHello",
      arguments: { name: "world" },
    });
  });
});
