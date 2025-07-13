# v0-mcp

> This version is a conversion in development with frequent changes. Don't recommend to use it in production

This tool is built as an MCP (Model Context Protocol) server for using the v0 SDK, which is Vercel's AI-powered interface design tool that generates React components from natural language descriptions. The v0 SDK allows programmatic access to v0's code generation capabilities and enables management of UI components with proper TypeScript support, Tailwind CSS integration, and automatic dependency management. An AI assistant can ask v0 to create or fix components. This MCP server provides tools consisting of individual APIs that can be used in AI Code Assistant.

## Environment Variables

```bash
# Required: Your v0.dev API key
V0_API_KEY=your_v0_api_key_here

# Optional: Custom base URL (defaults to https://api.v0.dev/v1)
V0_BASE_URL=https://api.v0.dev/v1
```

### Getting your v0 API Key

1. Go to [v0.dev](https://v0.dev)
2. Sign in to your account
3. Navigate to your account settings
4. Generate an API key
5. Copy the key and add it to your `.env.local` file

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Tools

- `create_component`: Creates a new React component using v0 API based on the provided description

## MCP Configuration Example

Add this configuration to your MCP client (e.g., Claude Desktop, Continue, etc.):

### Your MCP host application config file

```json
{
  "mcpServers": {
    "v0-mcp": {
      "command": "node",
      "args": ["/path/to/v0-mcp/dist/mcp.js"],
      "env": {
        "V0_API_KEY": "your_v0_api_key_here"
      }
    }
  }
}
```

### Claude Code

```sh
claude mcp add v0-mcp -e V0_API_KEY=your_api_key -- npx v0-mcp

or

claude mcp add v0-mcp -e V0_API_KEY=your_api_key -- npx tsx ./src/index.ts
```

## How to test

Use mcp inspection or run code directly. You need to create `./env.local` and update with your API key.

```sh
npx tsx ./src/cli.ts --chatid=your-chat-id --prompt=your-prompt
```

## License

@MIT
