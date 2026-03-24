import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/User', () => ({
  Users: { findOrCreateByDiscordUserId: vi.fn() },
}));
vi.mock('../helpers/settings', () => ({
  buildSettingsMessage: vi.fn(() => ({ content: 'settings content', components: [] })),
}));
vi.mock('../helpers/discord', () => ({
  editOriginalResponse: vi.fn(),
}));

import { sendSettings } from './sendSettings';
import { Users } from '../models/User';
import { editOriginalResponse } from '../helpers/discord';

const mockUser = { id: 'user-1', discordUserId: 'discord-1', dmChannelId: 'dm-1', timezone: 'Europe/Paris', dailyReminderHour: 9, dailyReminderMinutes: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: null };

beforeEach(() => {
  vi.mocked(Users.findOrCreateByDiscordUserId).mockResolvedValue(mockUser as any);
  vi.mocked(editOriginalResponse).mockResolvedValue(undefined);
});

describe('sendSettings', () => {
  it('finds or creates the user, then edits the original response', async () => {
    await sendSettings({ interactionToken: 'tok-123', discordUserId: 'discord-1', locale: 'en' });

    expect(Users.findOrCreateByDiscordUserId).toHaveBeenCalledWith('discord-1');
    expect(editOriginalResponse).toHaveBeenCalledWith('tok-123', {
      content: 'settings content',
      components: [],
    });
  });
});
