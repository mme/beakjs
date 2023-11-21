import { NextApiRequest, NextApiResponse } from "next";
import {
  BeakProxy,
  BeakProxyProps,
  HttpAdapter,
  FetchChatCompletionParams,
} from "@beakjs/server";

export function createBeakHandler(beakProps: BeakProxyProps<NextApiRequest>) {
  const beakProxy = new BeakProxy(beakProps);

  async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.url?.endsWith("/v1/chat/completions") && req.method === "POST") {
      const adapter = createHttpAdapter(res);

      try {
        const params = req.body as FetchChatCompletionParams;
        await beakProxy.handleRequest(req, params, adapter);
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
