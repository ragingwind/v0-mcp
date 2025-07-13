import { config } from "dotenv";

const envPath = process.env.NODE_ENV !== "production" ? ".env.local" : ".env";

config({ path: envPath });

interface V0ClientConfig {
  apiKey?: string;
  baseUrl?: string;
}

interface FetcherParams {
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
}

export interface MessageResponse {
  id: string;
  object: "message";
  chatId: string;
  url: string;
  files?: {
    lang: string;
    meta: {
      [k: string]: string;
    };
    source: string;
  }[];
  demo?: string;
  text: string;
  modelConfiguration: {
    modelId: "v0-1.5-sm" | "v0-1.5-md" | "v0-1.5-lg";
    imageGenerations?: boolean;
    thinking?: boolean;
  };
}

function createFetcher(config: V0ClientConfig = {}) {
  const baseUrl =
    config.baseUrl || process.env.V0_BASE_URL || "https://api.v0.dev/v1";
  const apiKey = config.apiKey || process.env.V0_API_KEY;
  if (!apiKey) {
    throw new Error(
      "API key is required. Provide it via config.apiKey or V0_API_KEY environment variable"
    );
  }
  return async function fetcher(
    url: string,
    method: string,
    params: FetcherParams = {}
  ) {
    const queryString = params.query
      ? `?${new URLSearchParams(params.query).toString()}`
      : "";
    const finalUrl = baseUrl + url + queryString;
    const hasBody = method !== "GET" && params.body;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      ...params.headers,
    };
    if (hasBody) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(finalUrl, {
      method,
      headers,
      body: hasBody ? JSON.stringify(params.body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  };
}

// @TODO support prev
export async function enhancePrompt(prompt: string) {
  const fetcher = createFetcher({
    baseUrl: "https://v0.dev/chat/api/prompt-enhancement",
  });

  return await fetcher("/", "POST", {
    body: {
      prompt,
      prev: [],
    },
  });
}

export async function getChats() {
  const fetcher = createFetcher();
  return await fetcher("/chats", "GET");
}

export async function createChat(prompt: string) {
  const fetcher = createFetcher();
  return await fetcher("/chats", "POST", {
    body: {
      prompt,
    },
  });
}

export async function getChat(chatId: string) {
  const fetcher = createFetcher();
  return await fetcher(`/chats/${chatId}`, "GET");
}

export async function sendMessage(
  chatId: string,
  message: string
): Promise<MessageResponse> {
  const fetcher = createFetcher();
  return await fetcher(`/chats/${chatId}/messages`, "POST", {
    body: {
      message,
    },
  });
}
