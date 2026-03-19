import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/Reminder', () => ({
  Reminders: { getDue: vi.fn(), delete: vi.fn() },
}));
vi.mock('../models/User', () => ({
  Users: { findById: vi.fn() },
}));
vi.mock('../helpers/discord', () => ({
  messageLink: vi.fn(() => 'https://discord.com/channels/g1/c1/m1'),
  sendMessage: vi.fn(),
}));

import { checkReminders } from './checkReminders';
import { Reminders } from '../models/Reminder';
import { Users } from '../models/User';
import { sendMessage } from '../helpers/discord';

const user = (id: string) => ({
  id,
  discordUserId: `discord-${id}`,
  dmChannelId: `dm-${id}`,
  language: 'en',
  timezone: 'Europe/Paris',
  dailyReminderHour: 9,
  dailyReminderMinutes: 0,
  createdAt: new Date().toISOString(),
  updatedAt: null,
});

const reminder = (id: string) => ({
  id,
  userId: `user-${id}`,
  messageId: 'm1',
  channelId: 'c1',
  guildId: 'g1',
  remindAt: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: null,
});

beforeEach(() => {
  vi.mocked(Reminders.getDue).mockReset();
  vi.mocked(Reminders.delete).mockReset();
  vi.mocked(Users.findById).mockReset();
  vi.mocked(sendMessage).mockReset();
});

describe('checkReminders', () => {
  it('does nothing when there are no due reminders', async () => {
    vi.mocked(Reminders.getDue).mockResolvedValue([]);

    await checkReminders();

    expect(sendMessage).not.toHaveBeenCalled();
    expect(Reminders.delete).not.toHaveBeenCalled();
  });

  it('sends a DM and deletes each due reminder', async () => {
    const r1 = reminder('r1');
    const r2 = reminder('r2');
    vi.mocked(Reminders.getDue).mockResolvedValue([r1, r2]);
    vi.mocked(Users.findById).mockImplementation((id) => Promise.resolve(user(id) as any));
    vi.mocked(sendMessage).mockResolvedValue(undefined);
    vi.mocked(Reminders.delete).mockResolvedValue(undefined);

    await checkReminders();

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenCalledWith('dm-user-r1', expect.stringContaining('https://discord.com'));
    expect(sendMessage).toHaveBeenCalledWith('dm-user-r2', expect.stringContaining('https://discord.com'));
    expect(Reminders.delete).toHaveBeenCalledWith('r1');
    expect(Reminders.delete).toHaveBeenCalledWith('r2');
  });

  it('continues processing other reminders if one DM fails', async () => {
    vi.mocked(Reminders.getDue).mockResolvedValue([reminder('r1'), reminder('r2')]);
    vi.mocked(Users.findById).mockImplementation((id) => Promise.resolve(user(id) as any));
    vi.mocked(sendMessage)
      .mockRejectedValueOnce(new Error('DM failed'))
      .mockResolvedValueOnce(undefined);
    vi.mocked(Reminders.delete).mockResolvedValue(undefined);

    await checkReminders();

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(Reminders.delete).toHaveBeenCalledTimes(1);
    expect(Reminders.delete).toHaveBeenCalledWith('r2');
  });

  it('handles missing user gracefully', async () => {
    vi.mocked(Reminders.getDue).mockResolvedValue([reminder('r1')]);
    vi.mocked(Users.findById).mockResolvedValue(null);
    vi.mocked(Reminders.delete).mockResolvedValue(undefined);

    await checkReminders();

    expect(sendMessage).not.toHaveBeenCalled();
    expect(Reminders.delete).not.toHaveBeenCalled();
  });
});
