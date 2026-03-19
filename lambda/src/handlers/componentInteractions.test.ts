import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/User', () => ({
  Users: { findOrCreateByDiscordUserId: vi.fn(), update: vi.fn() },
}));
vi.mock('../helpers/settings', () => ({
  buildSettingsMessage: vi.fn(() => ({ content: 'settings content', components: [] })),
}));

import { handleComponentInteraction } from './componentInteractions';
import { Users } from '../models/User';
import { buildSettingsMessage } from '../helpers/settings';

const mockUser = { id: 'user-1', discordUserId: 'discord-1', dmChannelId: 'dm-1', language: 'en', timezone: 'Europe/Paris', dailyReminderHour: 9, dailyReminderMinutes: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: null };

const interaction = (customId: string, value: string) => ({
  data: { custom_id: customId, values: [value] },
  member: { user: { id: 'discord-1' } },
});

beforeEach(() => {
  vi.mocked(Users.findOrCreateByDiscordUserId).mockResolvedValue(mockUser as any);
  vi.mocked(Users.update).mockResolvedValue(undefined);
  vi.mocked(buildSettingsMessage).mockReturnValue({ content: 'settings content', components: [] });
});

describe('handleComponentInteraction', () => {
  it('updates language and re-renders settings', async () => {
    const result = await handleComponentInteraction(interaction('settings:language', 'fr'));

    expect(Users.update).toHaveBeenCalledWith('user-1', { language: 'fr' });
    expect(buildSettingsMessage).toHaveBeenCalledWith({ ...mockUser, language: 'fr' });
    expect(JSON.parse(result!.body).type).toBe(7);
  });

  it('updates timezone and re-renders settings', async () => {
    await handleComponentInteraction(interaction('settings:timezone', 'America/New_York'));

    expect(Users.update).toHaveBeenCalledWith('user-1', { timezone: 'America/New_York' });
    expect(buildSettingsMessage).toHaveBeenCalledWith({ ...mockUser, timezone: 'America/New_York' });
  });

  it('updates reminder hour and re-renders settings', async () => {
    await handleComponentInteraction(interaction('settings:reminderHour', '8'));

    expect(Users.update).toHaveBeenCalledWith('user-1', { dailyReminderHour: 8 });
    expect(buildSettingsMessage).toHaveBeenCalledWith({ ...mockUser, dailyReminderHour: 8 });
  });

  it('updates reminder minutes and re-renders settings', async () => {
    await handleComponentInteraction(interaction('settings:reminderMinutes', '30'));

    expect(Users.update).toHaveBeenCalledWith('user-1', { dailyReminderMinutes: 30 });
    expect(buildSettingsMessage).toHaveBeenCalledWith({ ...mockUser, dailyReminderMinutes: 30 });
  });
});
