import { describe, it, expect } from 'vitest';
import { chats } from '../src/sdk.js';

describe('getChats', () => {
  it('should return chats', async () => {
    const res = await chats.find();
    expect(res).toBeDefined();
  });

  it('should return a chat', async () => {
    if (!process.env.TEST_CHATID) {
      throw new Error('V0_CHAT_ID is not set');
    }

    const chat = await chats.getById({ chatId: process.env.TEST_CHATID });
    expect(chat).toBeDefined();
    expect(chat.demo).toContain('vusercontent.net'); // https://preview-<key>.vusercontent.net/
  });
});
