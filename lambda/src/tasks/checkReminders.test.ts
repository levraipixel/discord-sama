import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/Reminder', () => ({
  Reminders: { getDue: vi.fn(), delete: vi.fn() },
}));
vi.mock('../helpers/discord', () => ({
  messageLink: vi.fn(() => 'https://discord.com/channels/g1/c1/m1'),
  sendDirectMessage: vi.fn(),
}));

import { checkReminders } from './checkReminders';
import { Reminders } from '../models/Reminder';
import { sendDirectMessage } from '../helpers/discord';

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
  vi.mocked(sendDirectMessage).mockReset();
});

describe('checkReminders', () => {
  it('does nothing when there are no due reminders', async () => {
    vi.mocked(Reminders.getDue).mockResolvedValue([]);

    await checkReminders();

    expect(sendDirectMessage).not.toHaveBeenCalled();
    expect(Reminders.delete).not.toHaveBeenCalled();
  });

  it('sends a DM and deletes each due reminder', async () => {
    vi.mocked(Reminders.getDue).mockResolvedValue([reminder('r1'), reminder('r2')]);
    vi.mocked(sendDirectMessage).mockResolvedValue(undefined);
    vi.mocked(Reminders.delete).mockResolvedValue(undefined);

    await checkReminders();

    expect(sendDirectMessage).toHaveBeenCalledTimes(2);
    expect(sendDirectMessage).toHaveBeenCalledWith('user-r1', expect.stringContaining('https://discord.com'));
    expect(Reminders.delete).toHaveBeenCalledWith('r1');
    expect(Reminders.delete).toHaveBeenCalledWith('r2');
  });

  it('continues processing other reminders if one DM fails', async () => {
    vi.mocked(Reminders.getDue).mockResolvedValue([reminder('r1'), reminder('r2')]);
    vi.mocked(sendDirectMessage)
      .mockRejectedValueOnce(new Error('DM failed'))
      .mockResolvedValueOnce(undefined);
    vi.mocked(Reminders.delete).mockResolvedValue(undefined);

    await checkReminders();

    expect(sendDirectMessage).toHaveBeenCalledTimes(2);
    expect(Reminders.delete).toHaveBeenCalledTimes(1);
    expect(Reminders.delete).toHaveBeenCalledWith('r2');
  });
});
