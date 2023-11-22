import { NextApiRequest, NextApiResponse } from "next";
import {
  BeakServer,
  BeakServerProps,
  HttpAdapter,
  FetchChatCompletionParams,
} from "@beakjs/server";

export function beakHandler(beakProps?: BeakServerProps<NextApiRequest>) {
  const beakServer = new BeakServer(beakProps);

  async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.url?.endsWith("/v1/chat/completions") && req.method === "POST") {
      const adapter = createHttpAdapter(res);

      try {
        const params = req.body as FetchChatCompletionParams;
        await beakServer.handleRequest(req, params, adapter);
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
