import { enhancePrompt, chats } from './sdk.js';

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
  const { files, text } = await chats.sendMessage({ chatId, message });
  const { think, codeProject } = extractV0Text(text);

  return {
    chatId,
    files,
    think,
    codeProject,
  };
}
