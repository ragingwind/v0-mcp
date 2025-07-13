import { describe, it, expect } from 'vitest';
import { getChat, getChats } from '../src/sdk.js';

describe('getChats', () => {
  it('should return chats', async () => {
    const chats = await getChats();
    expect(chats).toBeDefined();
  });

  it('should return a chat', async () => {
    if (!process.env.V0_CHAT_ID) {
      throw new Error('V0_CHAT_ID is not set');
    }
    
    const chat = await getChat(process.env.V0_CHAT_ID || '');
    expect(chat).toBeDefined();
    expect(chat.demo).toContain('vusercontent.net'); // https://preview-<key>.vusercontent.net/
  });
});