import { NextApiRequest, NextApiResponse } from "next";
import { BeakProxy, BeakProxyProps, HttpAdapter } from "@beakjs/server";
import { FetchChatCompletionParams } from "@beakjs/openai";

export function createBeakHandler(
  beakProps: BeakProxyProps,
  getRateLimiterKey: (req: NextApiRequest) => Promise<string | undefined>
) {
  const beakProxy = new BeakProxy(beakProps);

  async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.url?.endsWith("/v1/chat/completions") && req.method === "POST") {
      const adapter = createHttpAdapter(res);

      try {
        const params = req.body as FetchChatCompletionParams;
        let rateLimiterKey: string | undefined = undefined;
        if (getRateLimiterKey) {
          rateLimiterKey = await getRateLimiterKey(req);
        }

        await beakProxy.handleRequest(params, adapter, rateLimiterKey);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error.");
      }
    } else {
      res.status(404).send("Not found");
    }
  }

  return handler;
}

function createHttpAdapter(res: NextApiResponse): HttpAdapter {
  return {
    onData(data: any) {
      res.write(`data: ${JSON.stringify(data)}\n`);
    },
    onEnd() {
      res.end("[DONE]\n");
    },
    onError(error: any) {
      console.error(error);
      res.status(500).send(`Error: ${error.message || "An error occurred"}`);
    },
  };
}
