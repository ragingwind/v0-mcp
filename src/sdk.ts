import { createClient } from 'v0-sdk';
import { fetchV0Data } from './lib.js';

const V0_MODEL_ID = process.env.V0_MODEL_ID ?? 'v0-1.5-sm';

const v0 = createClient({
  apiKey: process.env.V0_API_KEY,
});

export interface ChatResponse {
  chatId: string;
  chatName?: string;
}

export interface SourceFile {
  lang: string;
  file: string;
  source?: string;
}

export interface CreateV0ComponentOptions {
  createComponent?: boolean;
  enhancePrompt?: boolean;
}

// @TODO support prev options
export async function enhancePrompt(prompt: string) {
  return await fetchV0Data('https://v0.dev/chat/api/prompt-enhancement', 'POST', {
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

const SYSTEM_PROMPT_CREATE_COMPONENT = (
  create: boolean
) => `MUST GENERATE CREATE COMPONENT CODE FOLLOWING THE RULES BELOW:
- SHOULD creates a new React component using v0 API based on the provided description. exclusively action for component generation only
- ${
  create
    ? 'MUST create and add a new component file with the name of the component.'
    : 'MUST generate code only for the component without creating a new file.'
}
- NEVER modify existing components or non-component code.
- NEVER generate example, or demo page, or app to demonstrate how app and demo files work for this component.
- MUST create a single file for each component.
- SHOULD add detail description comment for new component and function
- MUST newst component code in the text field of the response.
---------------------------------------------------------------------------------
Here is the prompt to generate a component:`;

export async function createV0Component(
  chatId: string,
  prompt: string,
  options: CreateV0ComponentOptions = {}
): Promise<{
  text: string;
  preview: string;
  files: SourceFile[];
}> {
  const { prompt: updatedPrompt } = options?.enhancePrompt
    ? await enhancePrompt(prompt)
    : { prompt };
  const message = `${SYSTEM_PROMPT_CREATE_COMPONENT(
    options?.createComponent ?? true
  )}\n\n${updatedPrompt}`;
  const { text, demo, files } = await v0.chats.sendMessage({
    chatId,
    message,
    modelConfiguration: {
      modelId: V0_MODEL_ID as any,
    },
  });

  return {
    text: text,
    preview: demo ?? '',
    files:
      files?.map((file) => ({
        lang: file.lang,
        file: file.meta.file,
        source: file.source,
      })) || [],
  };
}
