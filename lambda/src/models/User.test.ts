import { beforeEach, describe, expect, it, vi } from 'vitest';
import { client } from './ApplicationRecord';
import { Users } from './User';

vi.mock('../helpers/discord', () => ({
  findDirectMessageChannelId: vi.fn(),
}));

import { findDirectMessageChannelId } from '../helpers/discord';

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockReturnValue({}),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: vi.fn().mockReturnValue({ send: vi.fn() }) },
  PutCommand: vi.fn((input) => ({ input })),
  DeleteCommand: vi.fn((input) => ({ input })),
  ScanCommand: vi.fn((input) => ({ input })),
  GetCommand: vi.fn((input) => ({ input })),
  UpdateCommand: vi.fn((input) => ({ input })),
}));

const dbUser = { id: '1', discordUserId: 'u1', dmChannelId: 'dm1', language: 'en', timezone: 'Europe/Paris', dailyReminderHour: 9, dailyReminderMinutes: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: null };

const sendMock = vi.spyOn(client, 'send');

const TABLE = 'users-table';

beforeEach(() => {
  sendMock.mockReset();
  (Users as any).TABLE = TABLE;
});

describe('Users.create', () => {
  it('stores all fields and returns an id', async () => {
    sendMock.mockResolvedValue({} as any);

    const id = await Users.create({
      discordUserId: 'u1',
      dmChannelId: 'dm1',
      language: 'fr',
      timezone: 'Europe/Paris',
      dailyReminderHour: 8,
      dailyReminderMinutes: 30,
    });

    expect(typeof id).toBe('string');
    expect(id).toHaveLength(36);

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input).toMatchObject({
      TableName: TABLE,
      Item: {
        discordUserId: 'u1',
        dmChannelId: 'dm1',
        language: 'fr',
        timezone: 'Europe/Paris',
        dailyReminderHour: 8,
        dailyReminderMinutes: 30,
      },
    });
  });

  it('uses default values for language, timezone, and dailyReminderHour', async () => {
    sendMock.mockResolvedValue({} as any);

    await Users.create({ discordUserId: 'u1', dmChannelId: 'dm1' });

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input.Item).toMatchObject({
      language: 'en',
      timezone: 'Europe/Paris',
      dailyReminderHour: 9,
      dailyReminderMinutes: 0,
    });
  });
});

describe('Users.findById', () => {
  it('returns the user when found', async () => {
    sendMock.mockResolvedValue({ Item: dbUser } as any);

    const user = await Users.findById('1');

    expect(user).toEqual(dbUser);
    const [command] = sendMock.mock.calls[0];
    expect((command as any).input).toMatchObject({ TableName: TABLE, Key: { id: '1' } });
  });

  it('returns null when the item does not exist', async () => {
    sendMock.mockResolvedValue({ Item: undefined } as any);

    const user = await Users.findById('unknown');

    expect(user).toBeNull();
  });
});

describe('Users.findByDiscordUserId', () => {
  const items = [
    dbUser,
    { id: '2', discordUserId: 'u2', dmChannelId: 'dm2', language: 'fr', timezone: 'America/New_York', dailyReminderHour: 7, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: null },
  ];

  it('returns the user matching the discord user id', async () => {
    sendMock.mockResolvedValue({ Items: items } as any);

    const user = await Users.findByDiscordUserId('u1');

    expect(user).not.toBeNull();
    expect(user!.id).toBe('1');
    expect(user!.discordUserId).toBe('u1');
  });

  it('returns null when no user matches', async () => {
    sendMock.mockResolvedValue({ Items: items } as any);

    const user = await Users.findByDiscordUserId('unknown');

    expect(user).toBeNull();
  });

  it('returns null when the table is empty', async () => {
    sendMock.mockResolvedValue({ Items: [] } as any);

    const user = await Users.findByDiscordUserId('u1');

    expect(user).toBeNull();
  });
});

describe('Users.update', () => {
  it('sends an UpdateCommand with the correct expression for a single field', async () => {
    sendMock.mockResolvedValue({} as any);

    await Users.update('1', { language: 'fr' });

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input).toMatchObject({
      TableName: TABLE,
      Key: { id: '1' },
      UpdateExpression: 'SET #language = :language, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#language': 'language' },
      ExpressionAttributeValues: { ':language': 'fr' },
    });
  });

  it('sends an UpdateCommand for multiple fields', async () => {
    sendMock.mockResolvedValue({} as any);

    await Users.update('1', { dailyReminderHour: 8, dailyReminderMinutes: 30 });

    const [command] = sendMock.mock.calls[0];
    const { ExpressionAttributeNames, ExpressionAttributeValues } = (command as any).input;
    expect(ExpressionAttributeNames).toMatchObject({ '#dailyReminderHour': 'dailyReminderHour', '#dailyReminderMinutes': 'dailyReminderMinutes' });
    expect(ExpressionAttributeValues).toMatchObject({ ':dailyReminderHour': 8, ':dailyReminderMinutes': 30 });
  });
});

describe('Users.findOrCreateByDiscordUserId', () => {
  it('returns the existing user without calling discord', async () => {
    sendMock.mockResolvedValue({ Items: [dbUser] } as any);

    const user = await Users.findOrCreateByDiscordUserId('u1');

    expect(user).toEqual(dbUser);
    expect(findDirectMessageChannelId).not.toHaveBeenCalled();
  });

  it('fetches the DM channel, creates and returns the user when not found', async () => {
    sendMock.mockResolvedValueOnce({ Items: [] } as any); // findByDiscordUserId
    vi.mocked(findDirectMessageChannelId).mockResolvedValue('new-dm-channel');
    sendMock.mockResolvedValueOnce({} as any); // create (PutCommand)

    const user = await Users.findOrCreateByDiscordUserId('new-user');

    expect(findDirectMessageChannelId).toHaveBeenCalledWith('new-user');
    expect(user.discordUserId).toBe('new-user');
    expect(user.dmChannelId).toBe('new-dm-channel');
    expect(user.language).toBe('en');
    expect(user.timezone).toBe('Europe/Paris');
    expect(user.dailyReminderHour).toBe(9);
    expect(user.dailyReminderMinutes).toBe(0);
    expect(user.id).toHaveLength(36);
  });
});

describe('Users.delete', () => {
  it('deletes the user by id', async () => {
    sendMock.mockResolvedValue({} as any);

    await Users.delete('abc-123');

    const [command] = sendMock.mock.calls[0];
    expect((command as any).input).toMatchObject({
      TableName: TABLE,
      Key: { id: 'abc-123' },
    });
  });
});
