import { BeakProxy, BeakProxyProps, HttpAdapter } from "@beakjs/server";
import { FetchChatCompletionParams } from "@beakjs/openai";
import { ActionFunction, DataFunctionArgs } from "@remix-run/node";

export function createBeakHandler(
  beakProps: BeakProxyProps<Request>
): ActionFunction {
  const beakProxy = new BeakProxy(beakProps);

  return async ({ request }: DataFunctionArgs) => {
    const url = new URL(request.url);

    if (
      url.pathname.endsWith("/v1/chat/completions") &&
      request.method === "POST"
    ) {
      // Set up a ReadableStream to stream the response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const params: FetchChatCompletionParams = await request.json();
            const adapter = createStreamingHttpAdapter(controller);
            await beakProxy.handleRequest(request, params, adapter);
          } catch (error) {
            console.error(error);
            controller.error("Internal Server Error");
          }
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain" },
      });
    } else {
      return new Response("Not found", { status: 404 });
    }
  };
}

function createStreamingHttpAdapter(
  controller: ReadableStreamDefaultController
): HttpAdapter {
  return {
    onData(data: any) {
      controller.enqueue(`data: ${JSON.stringify(data)}\n`);
    },
    onEnd() {
      controller.close();
    },
    onError(error: any) {
      console.error(error);
      controller.error(`Error: ${error.message || "An error occurred"}`);
    },
  };
}
