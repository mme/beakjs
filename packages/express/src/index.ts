import { Request, Response } from "express";
import {
  BeakServer,
  BeakServerProps,
  HttpAdapter,
  FetchChatCompletionParams,
} from "@beakjs/server";

export function beakHandler(beakProps?: BeakServerProps<Request>) {
  const beakServer = new BeakServer(beakProps);

  return async function handler(req: Request, res: Response) {
    if (req.path.endsWith("/v1/chat/completions") && req.method === "POST") {
      const adapter = createHttpAdapter(res);
      try {
        const params = await parseBody<FetchChatCompletionParams>(req);
        await beakServer.handleRequest(req, params, adapter);
      } catch (error: any) {
        console.error(error);
        res.status(500).send("Internal Server Error.");
      }
    } else {
      res.status(404).send("Not found");
    }
  };
}

function createHttpAdapter(res: Response): HttpAdapter {
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

async function parseBody<T>(req: Request): Promise<T> {
  if (req.body) {
    return req.body as T;
  }
  if (!req.readable) {
    throw new Error("No body found.");
  }
  const rawData = await new Promise<string>((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", (err) => reject(err));
  });

  return JSON.parse(rawData) as T;
}
