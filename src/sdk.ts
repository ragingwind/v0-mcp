import { createClient } from 'v0-sdk';

const v0 = createClient({
  apiKey: process.env.V0_API_KEY,
});

interface FetcherParams {
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
}

async function fetch_v0(endpoint: string, method: string, params: FetcherParams = {}) {
  const queryString = params.query ? `?${new URLSearchParams(params.query).toString()}` : '';
  const url = endpoint + queryString;
  const hasBody = method !== 'GET' && params.body;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.V0_API_KEY}`,
    ...params.headers,
  };

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: hasBody ? JSON.stringify(params.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

// @TODO support prev options
export async function enhancePrompt(prompt: string) {
  return await fetch_v0('https://v0.dev/chat/api/prompt-enhancement', 'POST', {
    body: {
      prompt,
      prev: [],
    },
  });
}

export const chats = {
  ...v0.chats,
  enhancePrompt,
};
