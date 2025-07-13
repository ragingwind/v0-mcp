import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { createComponent } from "./generate.js";

const server = new Server({
  name: "v0-mcp",
  version: "1.0.0",
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_component",
        description: "Creates a new React component using v0 API",
        inputSchema: {
          type: "object",
          properties: {
            chatId: {
              type: "string",
              description: "The ID of the chat to send the message to",
            },
            prompt: {
              type: "string",
              description: "The prompt to send to the chat",
            },
            required: ["chatId", "prompt"],
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "create_component": {
          const { chatId, prompt } = args as { chatId: string; prompt: string };
          const res = await createComponent(chatId, prompt);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(res, null, 2),
              },
            ],
          };
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("v0-mcp server started");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
