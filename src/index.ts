#!/usr/bin/env node

if (!process.env.V0_API_KEY) {
  console.error('V0_API_KEY is required.');
  process.exit(1);
}

export * from './mcp.js';
