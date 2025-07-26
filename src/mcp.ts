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
import { getChats, getFileContent, getFileList } from './sdk.js';

const server = new Server({
  name: 'v0-mcp',
  version: pkgVersion,
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_chat_list',
        description: `Get all chats from v0 and an array of chat with id, name, and demo url. 

        Query Process:
        1. Analyze the prompt to figure out which chat the user is looking for, or the user can specify a specific file in the format 'v0, chatId, fileNames' to retrieve the content.
        2. Query the v0 chat list to find the chat you need.
        3. You SHOULD need to ask the user to check the chat in the list.
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
