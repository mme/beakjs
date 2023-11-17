export function mockContentResponses(
  sentence: string,
  model: string
): string[] {
  const responses: any[] = [];
  const chunks: string[] = [];
  let start = 0;
  const chunkSize = 4;

  while (start < sentence.length) {
    chunks.push(sentence.slice(start, start + chunkSize));
    start += chunkSize;
  }

  const id = `chatcmpl-aaaaaaaaaaaaaaaaaaaaaa`;
  const timestamp = Math.floor(Date.now() / 1000);

  responses.push(createJsonString(id, timestamp, model, ""));

  for (const chunk of chunks) {
    responses.push(createJsonString(id, timestamp, model, chunk));
  }

  responses.push(createJsonString(id, timestamp, model, null, "stop"));
  responses.push("data: [DONE]\n");

  return responses;
}

function createJsonString(
  id: string,
  timestamp: number,
  model: string,
  content: string | null,
  finishReason: string | null = null
): string {
  const jsonString = {
    id: id,
    object: "chat.completion.chunk",
    created: timestamp,
    model: model,
    choices: [
      {
        index: 0,
        delta: content !== null ? { content: content } : {},
        finish_reason: finishReason,
      },
    ],
  };

  return `data: ${JSON.stringify(jsonString)}\n`;
}

export function mockFunctionResponse(
  functionName: string,
  functionArgs: any,
  model: string
): string[] {
  const serializedArgs = JSON.stringify(functionArgs);
  const chunks: any[] = [];
  let start = 0;
  const chunkSize = 4;

  while (start < serializedArgs.length) {
    chunks.push(serializedArgs.slice(start, start + chunkSize));
    start += chunkSize;
  }

  const id = "chatcmpl-aaaaaaaaaaaaaaaaaaaaaa";
  const timestamp = Math.floor(Date.now() / 1000);

  let responses: string[] = [];

  responses.push(
    createFunctionJsonString(id, timestamp, model, functionName, null)
  );

  for (const chunk of chunks) {
    responses.push(createFunctionJsonString(id, timestamp, model, null, chunk));
  }

  responses.push(
    createFunctionJsonString(id, timestamp, model, null, null, "function_call")
  );

  responses.push("data: [DONE]\n");

  return responses;
}

function createFunctionJsonString(
  id: string,
  timestamp: number,
  model: string,
  name: string | null,
  content: string | null,
  finishReason: string | null = null
): string {
  let delta = {};
  if (content !== null) {
    delta = {
      function_call: {
        arguments: content,
      },
    };
  } else if (name !== null) {
    delta = {
      role: "assistant",
      content: null,
      function_call: {
        name: name,
        arguments: "",
      },
    };
  }
  const jsonString = {
    id: id,
    object: "chat.completion.chunk",
    created: timestamp,
    model: model,
    choices: [
      {
        index: 0,
        delta: delta,
        finish_reason: finishReason,
      },
    ],
  };

  return `data: ${JSON.stringify(jsonString)}\n`;
}
