import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/Reminder', () => ({
  Reminders: { create: vi.fn() },
}));
vi.mock('../models/SavedMessage', () => ({
  SavedMessages: { create: vi.fn() },
}));
vi.mock('../helpers/discord', () => ({
  dateTag: vi.fn(() => '<t:9999:R>'),
}));

import { handleContextMenuCommand } from './contextMenuCommands';
import { Reminders } from '../models/Reminder';
import { SavedMessages } from '../models/SavedMessage';

const interaction = (name: string, overrides: Record<string, unknown> = {}) => ({
  data: { name, target_id: 'msg-1' },
  member: { user: { id: 'user-1' } },
  channel_id: 'chan-1',
  guild_id: 'guild-1',
  ...overrides,
});

beforeEach(() => {
  vi.mocked(Reminders.create).mockReset().mockResolvedValue('00000000-0000-0000-0000-000000000001');
  vi.mocked(SavedMessages.create).mockReset().mockResolvedValue('00000000-0000-0000-0000-000000000002');
});

describe('handleContextMenuCommand', () => {
  describe('"Remind me in 1 hour"', () => {
    it('creates a reminder ~1 hour from now and responds', async () => {
      const before = Date.now();
      const result = await handleContextMenuCommand(interaction('Remind me in 1 hour'));
      const after = Date.now();

      expect(Reminders.create).toHaveBeenCalledOnce();
      const { remindAt } = vi.mocked(Reminders.create).mock.calls[0][0];
      expect(remindAt.getTime()).toBeGreaterThanOrEqual(before + 60 * 60 * 1000);
      expect(remindAt.getTime()).toBeLessThanOrEqual(after + 60 * 60 * 1000);

      const body = JSON.parse(result!.body);
      expect(body.data.content).toContain('<t:9999:R>');
    });
  });

  describe('"Remind me tomorrow"', () => {
    it('creates a reminder for tomorrow at 9am Paris and responds', async () => {
      const result = await handleContextMenuCommand(interaction('Remind me tomorrow'));

      expect(Reminders.create).toHaveBeenCalledOnce();
      const { remindAt } = vi.mocked(Reminders.create).mock.calls[0][0];
      expect(remindAt).toBeInstanceOf(Date);

      const body = JSON.parse(result!.body);
      expect(body.data.content).toContain('<t:9999:R>');
    });
  });

  describe('"Remind me on specific date"', () => {
    it('returns a modal with the correct custom_id', async () => {
      const result = await handleContextMenuCommand(interaction('Remind me on specific date'));
      const body = JSON.parse(result!.body);

      expect(body.data.custom_id).toBe('remind_date:chan-1:msg-1');
      expect(body.data.title).toBe('Schedule a reminder');
    });
  });

  describe('"Save for later"', () => {
    it('creates a saved message and responds', async () => {
      const result = await handleContextMenuCommand(interaction('Save for later'));

      expect(SavedMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', messageId: 'msg-1', channelId: 'chan-1', guildId: 'guild-1' }),
      );
      const body = JSON.parse(result!.body);
      expect(body.data.content).toContain('Saved!');
    });
  });

  describe('userId resolution', () => {
    it('falls back to interaction.user.id when member is absent', async () => {
      const i = { data: { name: 'Save for later', target_id: 'msg-1' }, user: { id: 'dm-user' }, channel_id: 'c1' };
      await handleContextMenuCommand(i);

      expect(SavedMessages.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'dm-user' }));
    });
  });

  describe('guildId', () => {
    it('stores null when there is no guild_id', async () => {
      const i = { data: { name: 'Save for later', target_id: 'msg-1' }, user: { id: 'u1' }, channel_id: 'c1' };
      await handleContextMenuCommand(i);

      expect(SavedMessages.create).toHaveBeenCalledWith(expect.objectContaining({ guildId: null }));
    });
  });
});
