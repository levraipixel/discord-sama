import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/Reminder', () => ({
  Reminders: { getAllForUser: vi.fn(), delete: vi.fn() },
}));
vi.mock('../models/SavedMessage', () => ({
  SavedMessages: { getAllForUser: vi.fn(), delete: vi.fn() },
}));
vi.mock('../models/User', () => ({
  Users: { findOrCreateByDiscordUserId: vi.fn() },
}));
vi.mock('../helpers/discord', () => ({
  messageLink: vi.fn((r: any) => `https://discord.com/channels/${r.guildId}/${r.channelId}/${r.messageId}`),
  dateTag: vi.fn(() => '<t:9999:R>'),
}));

import { handleSlashCommand } from './slashCommands';
import { Reminders } from '../models/Reminder';
import { SavedMessages } from '../models/SavedMessage';
import { Users } from '../models/User';

const mockUser = { id: 'internal-user-1', discordUserId: 'user-1', dmChannelId: 'dm-1', language: 'en', timezone: 'Europe/Paris', dailyReminderHour: 9, dailyReminderMinutes: 0 };

const interaction = (name: string, action: string, userId = 'user-1') => ({
  data: { name, options: [{ name: 'action', value: action }] },
  member: { user: { id: userId } },
});

const savedMessage = (id: string) => ({
  id,
  userId: 'user-1',
  messageId: `msg-${id}`,
  channelId: 'chan-1',
  guildId: 'guild-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: null,
});

const reminder = (id: string) => ({
  id,
  userId: 'user-1',
  messageId: `msg-${id}`,
  channelId: 'chan-1',
  guildId: 'guild-1',
  remindAt: new Date('2030-06-01T10:00:00.000Z'),
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: null,
});

beforeEach(() => {
  vi.mocked(SavedMessages.getAllForUser).mockReset();
  vi.mocked(SavedMessages.delete).mockResolvedValue(undefined);
  vi.mocked(Reminders.getAllForUser).mockReset();
  vi.mocked(Reminders.delete).mockResolvedValue(undefined);
  vi.mocked(Users.findOrCreateByDiscordUserId).mockReset().mockResolvedValue(mockUser as any);
});

describe('/saved', () => {
  describe('list', () => {
    it('responds with "no saved messages" when the list is empty', async () => {
      vi.mocked(SavedMessages.getAllForUser).mockResolvedValue([]);
      const result = await handleSlashCommand(interaction('saved', 'list'));
      expect(JSON.parse(result!.body).data.content).toBe('You have no saved messages.');
    });

    it('lists all saved messages as links', async () => {
      vi.mocked(SavedMessages.getAllForUser).mockResolvedValue([savedMessage('1'), savedMessage('2')]);
      const result = await handleSlashCommand(interaction('saved', 'list'));
      const content = JSON.parse(result!.body).data.content;
      expect(content).toContain('https://discord.com/channels/guild-1/chan-1/msg-1');
      expect(content).toContain('https://discord.com/channels/guild-1/chan-1/msg-2');
    });
  });

  describe('clear', () => {
    it('responds with "nothing to clear" when the list is empty', async () => {
      vi.mocked(SavedMessages.getAllForUser).mockResolvedValue([]);
      const result = await handleSlashCommand(interaction('saved', 'clear'));
      expect(JSON.parse(result!.body).data.content).toBe('You have no saved messages to clear.');
    });

    it('deletes all saved messages and reports the count', async () => {
      vi.mocked(SavedMessages.getAllForUser).mockResolvedValue([savedMessage('1'), savedMessage('2')]);
      const result = await handleSlashCommand(interaction('saved', 'clear'));
      expect(SavedMessages.delete).toHaveBeenCalledWith('1');
      expect(SavedMessages.delete).toHaveBeenCalledWith('2');
      expect(JSON.parse(result!.body).data.content).toBe('Cleared 2 saved message(s).');
    });
  });
});

describe('/remind', () => {
  describe('list', () => {
    it('responds with "no reminders" when the list is empty', async () => {
      vi.mocked(Reminders.getAllForUser).mockResolvedValue([]);
      const result = await handleSlashCommand(interaction('remind', 'list'));
      expect(JSON.parse(result!.body).data.content).toBe('You have no scheduled reminders.');
    });

    it('lists all reminders as links with date tags', async () => {
      vi.mocked(Reminders.getAllForUser).mockResolvedValue([reminder('1'), reminder('2')]);
      const result = await handleSlashCommand(interaction('remind', 'list'));
      const content = JSON.parse(result!.body).data.content;
      expect(content).toContain('https://discord.com/channels/guild-1/chan-1/msg-1');
      expect(content).toContain('<t:9999:R>');
    });
  });

  describe('clear', () => {
    it('responds with "nothing to clear" when the list is empty', async () => {
      vi.mocked(Reminders.getAllForUser).mockResolvedValue([]);
      const result = await handleSlashCommand(interaction('remind', 'clear'));
      expect(JSON.parse(result!.body).data.content).toBe('You have no reminders to clear.');
    });

    it('deletes all reminders and reports the count', async () => {
      vi.mocked(Reminders.getAllForUser).mockResolvedValue([reminder('1'), reminder('2')]);
      const result = await handleSlashCommand(interaction('remind', 'clear'));
      expect(Reminders.delete).toHaveBeenCalledWith('1');
      expect(Reminders.delete).toHaveBeenCalledWith('2');
      expect(JSON.parse(result!.body).data.content).toBe('Cleared 2 reminder(s).');
    });
  });
});

describe('/hello', () => {
  it('responds with a greeting', async () => {
    const result = await handleSlashCommand({ data: { name: 'hello', options: [] }, member: { user: { id: 'u1' } } });
    expect(JSON.parse(result!.body).data.content).toContain('Hello!');
  });
});
