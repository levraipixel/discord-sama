import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messageLink, dateTag, findDirectMessageChannelId, sendMessage, sendDirectMessage } from './discord';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  fetchMock.mockReset();
  process.env.DISCORD_BOT_TOKEN = 'test-token';
});

describe('messageLink', () => {
  it('builds a guild message link', () => {
    expect(messageLink({ guildId: 'g1', channelId: 'c1', messageId: 'm1' }))
      .toBe('https://discord.com/channels/g1/c1/m1');
  });

  it('uses @me for DMs when guildId is null', () => {
    expect(messageLink({ guildId: null, channelId: 'c1', messageId: 'm1' }))
      .toBe('https://discord.com/channels/@me/c1/m1');
  });
});

describe('dateTag', () => {
  it('formats a date as a Discord relative timestamp tag', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    expect(dateTag(date)).toBe(`<t:${Math.floor(date.getTime() / 1000)}:R>`);
  });
});

describe('findDirectMessageChannelId', () => {
  it('opens a DM channel and returns its id', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'dm-channel-id' }),
    });

    const result = await findDirectMessageChannelId('u1');

    expect(result).toBe('dm-channel-id');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://discord.com/api/v10/users/@me/channels',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bot test-token' }),
        body: JSON.stringify({ recipient_id: 'u1' }),
      }),
    );
  });

  it('throws when the request fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, text: async () => 'Forbidden' });

    await expect(findDirectMessageChannelId('u1')).rejects.toThrow('403');
  });
});

describe('sendMessage', () => {
  it('posts a message to the given channel', async () => {
    fetchMock.mockResolvedValue({ ok: true });

    await sendMessage('c1', 'Hello!');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://discord.com/api/v10/channels/c1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bot test-token' }),
        body: JSON.stringify({ content: 'Hello!' }),
      }),
    );
  });

  it('throws when the request fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'Internal Server Error' });

    await expect(sendMessage('c1', 'Hello!')).rejects.toThrow('500');
  });
});

describe('sendDirectMessage', () => {
  it('opens a DM channel then sends the message', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'dm-channel-id' }) })
      .mockResolvedValueOnce({ ok: true });

    await sendDirectMessage('u1', 'Hey!');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('https://discord.com/api/v10/channels/dm-channel-id/messages');
  });
});
