import { config } from 'dotenv';
config({ path: '.env.local' });

import { spawn } from 'node:child_process';

const child = spawn('node', ['./dist/mcp.js'], {
  env: {
    ...process.env,
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

child.stdout.on('data', (data) => {
  console.log('stdout:', data.toString());
});

child.stderr.on('data', (data) => {
  console.log('stderr:', data.toString());
});

child.on('close', (code) => {
  console.log('Process exited with code:', code);
});

// Send initialization message to the child process
child.stdin.write(
  JSON.stringify({
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
  }) + '\n'
);

// Send tools/list message to get available tools
child.stdin.write(
  JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  }) + '\n'
);
