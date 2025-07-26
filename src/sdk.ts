import { createClient } from 'v0-sdk';

const v0 = createClient({
  apiKey: process.env.V0_API_KEY,
});

interface FetcherParams {
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ChatResponse {
  chatId: string;
  chatName?: string;
}

interface SourceFile {
  lang: string;
  file: string;
  source?: string;
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

// @FIXME: ✗ Validation Error: Tool has an output schema but did not return structured content
export async function getChats(limit?: string, offset?: string): Promise<ChatResponse[]> {
  const res = await v0.chats.find({
    limit,
    offset,
  });

  return res.data.map((chat) => ({
    chatId: chat.id,
    chatName: chat.name,
  }));
}

// @TODO: Uses a flash data cache to keep a list of files for a short period of time.
export async function getFileList(chatId: string): Promise<SourceFile[]> {
  const res = await v0.chats.getById({
    chatId,
  });

  if (!res.files) {
    return [];
  }

  return res.files.map(({ lang, meta }) => ({
    lang,
    file: meta.file,
  }));
}

// @TODO: Uses a flash data cache to keep a list of files for a short period of time.
export async function getFileContent(
  chatId: string,
  files?: string[],
  offsets?: { start: number; end: number }[]
): Promise<SourceFile[]> {
  const res = await v0.chats.getById({
    chatId,
  });

  if (!res.files) {
    return [];
  }

  return res.files
    .filter(({ meta }) => (files && files?.length > 0 ? files.includes(meta.file) : true))
    .map(({ lang, meta, source }) => ({
      lang,
      file: meta.file,
      source: offsets
        ? source.slice(
            offsets[0].start,
            offsets[0].end !== undefined ? offsets[0].end : source.length
          )
        : source,
    }));
}

interface ExtractedData {
  think: string;
  codeProject: string;
}

const V0_TEXT_EXTRACT_PATTERN =
  /(?:<Thinking>\s*([\s\S]*?)\s*<\/Thinking>)?\s*(?:<CodeProject[^>]*>\s*([\s\S]*?)\s*<\/CodeProject>)?/i;

function cleanCode(code: string) {
  return code
    .replace(/^```\w+\s+file=["']?[^"'\s]+["']?\s*\n/, '')
    .replace(/^```\w*\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();
}

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

// @FIXME: move to system prompt
const CREATE_COMPONENT_SYSTEM_PROMPT = `MUST ONLY CREATE COMPONENT CODE
Creates a new React component using v0 API based on the provided description
1) exclusively for component generation only
2) do not for modifying existing components or non-component code.
1) only create component code
2) do not modify existing code.
3) do not create example or demo code for app and demo file.
4) must make a sing file for a component.
5) add detail description for component and function
---------------------------------------------------------------------------------
Here is the prompt to generate a component:`;

export async function createComponent(chatId: string, prompt: string) {
  const { prompt: enhancedPrompt } = await enhancePrompt(prompt);
  const message = `${CREATE_COMPONENT_SYSTEM_PROMPT}\n${enhancedPrompt}`;
  const { files, text } = await v0.chats.sendMessage({ chatId, message });
  const { think, codeProject } = extractV0Text(text);

  return {
    chatId,
    files,
    think,
    codeProject,
  };
}
