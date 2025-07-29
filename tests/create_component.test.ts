import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('Starting MCP test...', process.env.V0_API_KEY);

import { createV0Component, CreateV0ComponentOptions } from '../src/sdk.js';

async function testCreateComponent(options: CreateV0ComponentOptions = {}) {
  const prompt = 'Create another simple button component';
  const chatId = process.env.TEST_CHATID;

  if (!chatId) {
    throw new Error('Chat ID is not defined');
  }

  console.log(
    `Testing createV0Component with chatId: ${chatId}, prompt: "${prompt}", options: ${options.enhancePrompt}`
  );

  try {
    const result = await createV0Component(chatId, prompt, {
      enhancePrompt: options.enhancePrompt,
      createComponent: options.createComponent,
    });
    console.log('Component creation result:', result);
  } catch (error) {
    console.error('Error during component creation:', error);
  }
}

// await testCreateComponent({
//   enhancePrompt: true,
//   createComponent: true,
// });

await testCreateComponent({
  enhancePrompt: false,
  createComponent: false,
});
