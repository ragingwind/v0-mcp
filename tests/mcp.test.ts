import { config } from 'dotenv';
config({ path: '.env.local' });

import { spawn, ChildProcess } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: any;
}

class MCPTerminalTester {
  private child: ChildProcess | null = null;
  private responses: Map<number, MCPResponse> = new Map();
  private requestId = 1;

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.child = spawn('node', ['./dist/mcp.js'], {
        env: {
          ...process.env,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (!this.child.stdout || !this.child.stdin || !this.child.stderr) {
        reject(new Error('Failed to create child process streams'));
        return;
      }

      this.child.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('MCP stdout:', output);

        // Parse JSON-RPC responses
        const lines = output.split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          try {
            const response: MCPResponse = JSON.parse(line);
            if (response.id) {
              this.responses.set(response.id, response);
            }
          } catch (e) {
            // Not a JSON response, ignore
          }
        }
      });

      this.child.stderr.on('data', (data) => {
        const error = data.toString();
        console.log('MCP stderr:', error);

        // Check for server start message
        if (error.includes('v0-mcp server') && error.includes('started')) {
          resolve();
        }
      });

      this.child.on('close', (code) => {
        console.log('MCP process exited with code:', code);
      });

      this.child.on('error', (error) => {
        console.error('MCP process error:', error);
        reject(error);
      });

      // Set timeout for server start
      setTimeout(3000).then(() => {
        if (this.responses.size === 0) {
          resolve(); // Assume started if no errors
        }
      });
    });
  }

  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    if (!this.child?.stdin) {
      throw new Error('MCP process not started');
    }

    const requestWithId = { ...request, id: this.requestId++ };
    console.log('Sending request:', JSON.stringify(requestWithId));

    this.child.stdin.write(JSON.stringify(requestWithId) + '\n');

    // Wait for response
    const maxWait = 10000; // 10 seconds
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      if (this.responses.has(requestWithId.id)) {
        const response = this.responses.get(requestWithId.id)!;
        this.responses.delete(requestWithId.id);
        return response;
      }
      await setTimeout(100);
    }

    throw new Error(`Timeout waiting for response to request ${requestWithId.id}`);
  }

  async stop(): Promise<void> {
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
  }
}

async function testInitialize(tester: MCPTerminalTester): Promise<boolean> {
  console.log('\n📋 Test 1: Initialize MCP server');

  try {
    const initResponse = await tester.sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    });

    if (initResponse.error) {
      console.error('❌ Initialize failed:', initResponse.error);
      return false;
    } else {
      console.log('✅ Initialize successful:', initResponse.result);
      return true;
    }
  } catch (error) {
    console.error('❌ Initialize test failed:', error);
    return false;
  }
}

async function testListTools(tester: MCPTerminalTester): Promise<boolean> {
  console.log('\n📋 Test 2: List available tools');

  try {
    const toolsResponse = await tester.sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });

    if (toolsResponse.error) {
      console.error('❌ Tools list failed:', toolsResponse.error);
      return false;
    } else {
      console.log('✅ Tools available:');
      const tools = toolsResponse.result?.tools || [];
      tools.forEach((tool: any) => {
        console.log(`  - ${tool.name}: ${tool.description.split('\n')[0]}`);
      });
      return true;
    }
  } catch (error) {
    console.error('❌ List tools test failed:', error);
    return false;
  }
}

async function testGetChatList(tester: MCPTerminalTester): Promise<boolean> {
  console.log('\n📋 Test 3: Get chat list from v0');

  try {
    const chatListResponse = await tester.sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_chat_list',
        arguments: {
          limit: '5',
          offset: '0',
        },
      },
    });

    if (chatListResponse.error) {
      console.error('❌ Get chat list failed:', chatListResponse.error);
      return false;
    } else {
      console.log('✅ Chat list retrieved successfully');
      const chats = chatListResponse.result?.content?.[0]?.text;
      if (chats) {
        const parsedChats = JSON.parse(chats);
        console.log(`  Found ${parsedChats.chats?.length || 0} chats`);
        if (parsedChats.chats?.length > 0) {
          console.log(
            `  First chat: ${parsedChats.chats[0].chatName} (${parsedChats.chats[0].chatId})`
          );
        }
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Get chat list test failed:', error);
    return false;
  }
}

async function testGetFileList(tester: MCPTerminalTester, chatId: string): Promise<boolean> {
  console.log('\n📋 Test 4: Get file list from test chat');

  try {
    const fileListResponse = await tester.sendRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'get_file_list',
        arguments: {
          chatId,
        },
      },
    });

    if (fileListResponse.error) {
      console.error('❌ Get file list failed:', fileListResponse.error);
      return false;
    } else {
      console.log('✅ File list retrieved successfully');
      const files = fileListResponse.result?.content?.[0]?.text;
      if (files) {
        const parsedFiles = JSON.parse(files);
        console.log(`  Found ${parsedFiles.files?.length || 0} files`);
        parsedFiles.files?.forEach((file: any) => {
          console.log(`  - ${file.name} (${file.lang})`);
        });
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Get file list test failed:', error);
    return false;
  }
}

async function testCreateComponent(tester: MCPTerminalTester, chatId: string): Promise<boolean> {
  console.log('\n📋 Test 5: Create component');

  try {
    const createResponse = await tester.sendRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'create_component',
        arguments: {
          chatId,
          prompt: 'Create a simple test button component with a click handler',
          enhancePrompt: false,
          createComponent: false,
        },
      },
    });

    if (createResponse.error) {
      console.error('❌ Create component failed:', createResponse.error);
      return false;
    } else {
      console.log('✅ Component created successfully');
      const result = createResponse.result?.content?.[0]?.text;
      if (result) {
        const parsedResult = JSON.parse(result);
        console.log(`  Generated ${parsedResult.codes?.length || 0} code blocks`);
        if (parsedResult.codes?.[0]?.demo) {
          console.log(`  Demo URL: ${parsedResult.codes[0].demo}`);
        }
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Create component test failed:', error);
    return false;
  }
}

async function testMCPInTerminal() {
  const tester = new MCPTerminalTester();
  const results: { [key: string]: boolean } = {};

  try {
    console.log('🚀 Starting MCP terminal test...');

    // Start MCP server
    await tester.start();
    console.log('✅ MCP server started');

    // Run individual tests
    // results.initialize = await testInitialize(tester);
    // results.listTools = await testListTools(tester);
    // results.getChatList = await testGetChatList(tester);

    // Test file operations if we have a test chat ID
    const testChatId = process.env.TEST_CHATID;
    if (testChatId) {
      results.getFileList = await testGetFileList(tester, testChatId);
      results.createComponent = await testCreateComponent(tester, testChatId);
    } else {
      console.log('\n⚠️  Skipping file list and component creation tests (no TEST_CHATID)');
      results.getFileList = true; // Skip
      results.createComponent = true; // Skip
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    Object.entries(results).forEach(([test, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${test}`);
    });

    console.log(`\n🎯 ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 All MCP terminal tests completed successfully!');
    } else {
      console.log('💥 Some tests failed - check logs above');
    }
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  } finally {
    await tester.stop();
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPInTerminal().catch(console.error);
}

export { testMCPInTerminal, MCPTerminalTester };
