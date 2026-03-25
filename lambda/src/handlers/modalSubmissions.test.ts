import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/Reminder', () => ({
  Reminders: { create: vi.fn() },
}));
vi.mock('../models/User', () => ({
  Users: { findOrCreateByDiscordUserId: vi.fn() },
}));
vi.mock('../helpers/discord', () => ({
  dateTag: vi.fn(() => '<t:9999:R>'),
}));
vi.mock('chrono-node', () => ({
  parse: vi.fn(),
}));

import * as chrono from 'chrono-node';
import { handleModalSubmission } from './modalSubmissions';
import { Reminders } from '../models/Reminder';
import { Users } from '../models/User';

const mockUser = { id: 'internal-user-1', discordUserId: 'user-1', dmChannelId: 'dm-1', timezone: 'Europe/Paris', dailyReminderHour: 9, dailyReminderMinutes: 0 };

const interaction = (customId: string, dateValue: string, overrides: Record<string, unknown> = {}) => ({
  data: {
    custom_id: customId,
    components: [{ component: { value: dateValue } }],
  },
  member: { user: { id: 'user-1' } },
  guild_id: 'guild-1',
  ...overrides,
});

const parsedDate = (date: Date, certainHour = true) => ({
  date: () => new Date(date),
  start: { isCertain: (field: string) => field !== 'hour' || certainHour },
});

beforeEach(() => {
  vi.mocked(Reminders.create).mockReset().mockResolvedValue('00000000-0000-0000-0000-000000000001');
  vi.mocked(Users.findOrCreateByDiscordUserId).mockReset().mockResolvedValue(mockUser as any);
  vi.mocked(chrono.parse).mockReset();
});

describe('handleModalSubmission', () => {
  describe('remind_date modal', () => {
    it('returns an error when the date cannot be parsed', async () => {
      vi.mocked(chrono.parse).mockReturnValue([]);

      const result = await handleModalSubmission(
        interaction('remind_date:chan-1:msg-1', 'not a date'),
      );

      const body = JSON.parse(result!.body);
      expect(body.data.content).toContain("couldn't understand");
      expect(Reminders.create).not.toHaveBeenCalled();
    });

    it('returns an error when the date is in the past', async () => {
      vi.mocked(chrono.parse).mockReturnValue([parsedDate(new Date('2020-01-01T00:00:00Z'))] as any);

      const result = await handleModalSubmission(
        interaction('remind_date:chan-1:msg-1', '2020-01-01'),
      );

      const body = JSON.parse(result!.body);
      expect(body.data.content).toBe('Please provide a future date.');
      expect(Reminders.create).not.toHaveBeenCalled();
    });

    it('creates a reminder and responds for a valid future date with explicit time', async () => {
      vi.mocked(chrono.parse).mockReturnValue([parsedDate(new Date('2030-06-15T15:00:00Z'), true)] as any);

      const result = await handleModalSubmission(
        interaction('remind_date:chan-1:msg-1', '2030-06-15 at 3pm'),
      );

      expect(Reminders.create).toHaveBeenCalledOnce();
      const { channelId, messageId, remindAt } = vi.mocked(Reminders.create).mock.calls[0][0];
      expect(channelId).toBe('chan-1');
      expect(messageId).toBe('msg-1');
      expect(remindAt).toBeInstanceOf(Date);

      const body = JSON.parse(result!.body);
      expect(body.data.content).toContain('<t:9999:R>');
    });

    it("defaults to the user's preferred time when no time is given, shifted by their timezone", async () => {
      // mockUser: dailyReminderHour=9, dailyReminderMinutes=0, timezone=Europe/Paris
      // naiveDate = 2030-12-01T00:00:00Z; isCertain('hour') = false → setUTCHours(9,0,0,0) applied
      vi.mocked(chrono.parse).mockReturnValue([parsedDate(new Date('2030-12-01T00:00:00Z'), false)] as any);

      await handleModalSubmission(
        interaction('remind_date:chan-1:msg-1', '2030-12-01'),
      );

      const { remindAt } = vi.mocked(Reminders.create).mock.calls[0][0];
      // naiveDate = 09:00 UTC; Paris winter = +60 min → remindAt = 08:00 UTC
      expect(remindAt.getUTCHours()).toBe(8);
      expect(remindAt.getUTCMinutes()).toBe(0);
    });

    it('resolves userId from user.id when member is absent', async () => {
      vi.mocked(chrono.parse).mockReturnValue([parsedDate(new Date('2030-06-15T15:00:00Z'))] as any);

      const i = {
        data: { custom_id: 'remind_date:chan-1:msg-1', components: [{ component: { value: '2030-06-15' } }] },
        user: { id: 'dm-user' },
      };
      await handleModalSubmission(i);

      expect(Users.findOrCreateByDiscordUserId).toHaveBeenCalledWith('dm-user');
      expect(Reminders.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'internal-user-1' }));
    });
  });
});
