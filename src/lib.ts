interface FetcherParams {
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ExtractedData {
  think: string;
  codeProject: string;
}

const V0_TEXT_EXTRACT_PATTERN =
  /(?:<Thinking>\s*([\s\S]*?)\s*<\/Thinking>)?\s*(?:<CodeProject[^>]*>\s*([\s\S]*?)\s*<\/CodeProject>)?/i;

export function extractV0Text(text: string): ExtractedData {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }
    const match = V0_TEXT_EXTRACT_PATTERN.exec(text);

    if (!match) {
      throw new Error('No match found');
    }

    const [, thinkingContent, codeProjectContent] = match;

    if (!codeProjectContent) {
      throw new Error('CodeProject section is empty');
    }

    return {
      think: thinkingContent ? thinkingContent.trim() : '',
      codeProject: cleanCode(codeProjectContent),
    };
  } catch (error) {
    console.error(error);
    return {
      think: '',
      codeProject: '',
    };
  }
}

export async function fetchV0Data(endpoint: string, method: string, params: FetcherParams = {}) {
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

function cleanCode(code: string) {
  return code
    .replace(/^```\w+\s+file=["']?[^"'\s]+["']?\s*\n/, '')
    .replace(/^```\w*\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();
}
