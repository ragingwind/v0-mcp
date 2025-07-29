import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
const {
  default: { version: pkgVersion },
} = await import('../package.json', {
  with: { type: 'json' },
});
import { createV0Component, getChats, getFileContent, getFileList } from './sdk.js';

const server = new Server({
  name: 'v0-mcp',
  version: pkgVersion,
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_component',
        description: `This tool SHOULD BE used when the user wants to create a new component on v0 with a specific chat id and description. 
        If the user request to create a component, you MUST use this tool to create a new component in v0.
        You MUST apply the source code to the code base.
        
        Query Process:
        1. Analyze the prompt to figure out which component the user is creating.
        2. V0 will create a new component with the given description in response.
        3. "text" field MUST contain the code of the component or <CodeProject>, which has file paths.
        4. If "text" field has <CodeProject>, you have two of options:
          - Pick the file paths from it and call 'get_file_content' with the file paths to get the source code
          - Search for the file paths in "files". If there is no exact match, you can call 'get_file_content' with the file paths to get the source code.
        5. If "text" field has the source code, return it as the response.
        6. If "demo" field is present, it will contain the URL of the component demo to preview to reference if you need to show the component.
        7. You MUST apply the source code to the code base.
        `,
        inputSchema: {
          type: 'object',
          properties: {
            chatId: {
              type: 'string',
              description: 'The ID of the chat to get source files',
            },
            prompt: {
              type: 'string',
              description:
                'The prompt to create the component. It can be a description of the component.',
            },
            enhancePrompt: {
              type: 'boolean',
              description: 'Whether to enhance the prompt before creating the component.',
            },
            createComponent: {
              type: 'boolean',
              description:
                'Whether to create a new component. mostly false to not create a component in code base.',
            },
          },
          required: ['chatId', 'prompt'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description:
                  'Text content have the source code of the component or text message including <CodeProject>, which has file paths',
              },
              demo: { type: 'string', description: 'The url of the component demo to preview' },
              files: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    lang: { type: 'string', description: 'The programming language of the file.' },
                    file: { type: 'string', description: 'The name of the file.' },
                    source: { type: 'string', description: 'The source code of the file.' },
                  },
                },
              },
            },
          },
          required: ['text', 'files'],
        },
      },
      {
        name: 'get_chat_list',
        description: `This tool SHOULD BE used when the user wants to GET a list of chats or read file content.
        You can get all chats from v0 and an array of chat with id, name, and demo url.
        If the user request to get a chat list or read file content?, you MUST use this tool to get the list of chats.

        Query Process:
        1. Analyze the prompt to figure out which chat the user is looking for
          - Users can pass specific chat id, chat name, file name, component name to retrieve the content.
          - Chat id is the unique identifier for each chat. It looks like a UUID.
          - Chat name is the name of the chat, which is usually a descriptive title.
          - File name is the name of the file in the chat, which is usually a descriptive, ending with a file extension, having hyphens. for example, 'my-component.tsx'.
          - Component name is the name of the component in the chat, which is usually a descriptive title. having camelCase or PascalCase.
          - If the user provides a chat id, you can directly use it to get the file list.
        2. Query the v0 chat list to find the chat you need.
        3. You SHOULD need to ask users to check the chat is valid in the list.
        4. You SHOULD need to call 'get_file_list' with the chatId the user checked to get the list of chat files.
        5. You SHOULD need to call 'get_file_content' with the specific file name to request the file content.
        6. When it comes to the large size of content, you SHOULD call 'get_file_content' with offset to read content partially
        7. Extract the source code that you need to use for the update.
        `,
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'string',
              default: '10',
              description: 'The maximum number of chats to return',
            },
            offset: {
              type: 'string',
              default: '0',
              description: 'The offset for pagination',
            },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            chats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  chatId: { type: 'string', description: 'The selected chat id' },
                  chatName: { type: 'string', description: 'The name of the chat' },
                },
              },
            },
          },
        },
      },
      {
        name: 'get_file_list',
        description: 'Get source file list from v0 chat with a specific id',
        inputSchema: {
          type: 'object',
          properties: {
            chatId: {
              type: 'string',
              description: 'The ID of the chat to get source files from',
            },
          },
          required: ['chatId'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  lang: { type: 'string', description: 'The programming language of the file' },
                  name: { type: 'string', description: 'The name of the file' },
                },
              },
            },
          },
        },
      },
      {
        name: 'get_file_content',
        description: 'Get files content from v0 with a specific chat id and file names',
        inputSchema: {
          type: 'object',
          properties: {
            chatId: {
              type: 'string',
              description: 'The ID of the chat to get source files from',
            },
            files: {
              type: 'array',
              items: { type: 'string' },
              description: 'The names of the files to retrieve',
            },
            offset: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  start: { type: 'number', description: 'The start offset for reading the file.' },
                  end: { type: 'number', description: 'The end offset for reading the file' },
                },
              },
              description:
                'The offset for reading the file content. index is matched with files array',
            },
          },
          required: ['chatId'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  lang: { type: 'string', description: 'The programming language of the file.' },
                  name: { type: 'string', description: 'The name of the file.' },
                  source: { type: 'string', description: 'The source code of the file.' },
                },
              },
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_chat_list': {
        const limit = args?.limit as string | undefined;
        const offset = args?.offset as string | undefined;
        const chats = await getChats(limit, offset);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ chats: chats }, null, 2),
            },
          ],
          structuredContent: {
            chats,
          },
        };
      }
      case 'get_file_list': {
        const chatId = args?.chatId as string;
        const files = await getFileList(chatId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ files: files }, null, 2),
            },
          ],
          structuredContent: {
            files,
          },
        };
      }
      case 'get_file_content': {
        const chatId = args?.chatId as string;
        const files = args?.files as string[] | undefined;
        const offsets = args?.offsets as { start: number; end: number }[] | undefined;
        const fileContents = await getFileContent(chatId, files, offsets);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ files: fileContents }, null, 2),
            },
          ],
          structuredContent: {
            files: fileContents,
          },
        };
      }
      case 'create_component': {
        const chatId = args?.chatId as string;
        const prompt = args?.prompt as string;
        const enhancePrompt = args?.enhance as boolean | false;
        const createComponent = args?.create as boolean | false;

        const result = await createV0Component(chatId, prompt, {
          enhancePrompt,
          createComponent,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent: result,
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`v0-mcp server ${pkgVersion} started`);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
